from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request, Response, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import uuid
from datetime import datetime, date, timedelta
import random
import asyncio
import re
import hashlib
import json
import aiohttp
from user_agents import parse
import aiofiles
from PIL import Image
import mimetypes
import cv2
import numpy as np

# Import models
from models import (
    UserProfile, User, UserCreate, UserLogin, UserResponse, Token,
    Message, MessageCreate, Conversation, ConversationResponse,
    UserUpdate, PasswordChange, UserSettings,
    Comment, CommentCreate, CommentUpdate, CommentResponse, CommentLike,
    Follow, FollowCreate, FollowResponse, FollowStatus, FollowingList, FollowersList,
    LoginAttempt, UserDevice, UserSession, SecurityNotification,
    Poll, PollCreate, PollResponse, PollOption, Vote, VoteCreate, PollLike, Music,
    UploadType, FileType, UploadedFile, UploadResponse
)
from auth import (
    verify_password, get_password_hash, create_access_token, 
    verify_token, ACCESS_TOKEN_EXPIRE_MINUTES
)

# Import configuration
from config import config

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection using config
mongo_url = config.MONGO_URL
client = AsyncIOMotorClient(mongo_url)
db = client[config.DB_NAME]

# Create the main app without a prefix
app = FastAPI(
    title="Social Media Network", 
    description="Advanced social network with polls, messaging and media",
    version=config.API_VERSION
)

# File upload configuration using config
config.create_upload_directories()
UPLOAD_DIR = config.UPLOAD_BASE_DIR

# Mount static files to serve uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Create a router with configurable prefix
api_router = APIRouter(prefix=config.API_PREFIX)

# Security
security = HTTPBearer()

# Authentication dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserResponse:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=config.StatusCodes.UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user_data = await db.users.find_one({"id": payload["sub"]})
    if not user_data:
        raise HTTPException(
            status_code=config.StatusCodes.UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return UserResponse(**user_data)

# =============  SECURITY UTILITIES =============

async def track_login_attempt(email: str, ip_address: str, user_agent: str, success: bool, failure_reason: Optional[str] = None):
    """Track login attempts for security monitoring"""
    attempt = LoginAttempt(
        email=email,
        ip_address=ip_address,
        user_agent=user_agent,
        success=success,
        failure_reason=failure_reason
    )
    await db.login_attempts.insert_one(attempt.dict())

async def check_rate_limit(email: str, ip_address: str) -> bool:
    """Check if user has exceeded login attempt limits"""
    # Check failed attempts in last 15 minutes
    time_threshold = datetime.utcnow() - timedelta(minutes=15)
    
    # Count failed attempts by email
    email_failures = await db.login_attempts.count_documents({
        "email": email,
        "success": False,
        "created_at": {"$gte": time_threshold}
    })
    
    # Count failed attempts by IP
    ip_failures = await db.login_attempts.count_documents({
        "ip_address": ip_address,
        "success": False,
        "created_at": {"$gte": time_threshold}
    })
    
    # Rate limits: 5 attempts per email, 10 per IP in 15 minutes
    return email_failures < 5 and ip_failures < 10

def parse_user_agent(user_agent_string: str) -> Dict[str, str]:
    """Parse user agent string to extract device information"""
    user_agent = parse(user_agent_string)
    return {
        "browser": f"{user_agent.browser.family} {user_agent.browser.version_string}",
        "os": f"{user_agent.os.family} {user_agent.os.version_string}",
        "device_type": "mobile" if user_agent.is_mobile else "tablet" if user_agent.is_tablet else "desktop",
        "device_name": user_agent.device.family
    }

async def get_or_create_device(user_id: str, ip_address: str, user_agent: str) -> UserDevice:
    """Get existing device or create new one"""
    device_info = parse_user_agent(user_agent)
    
    # Create device fingerprint
    device_fingerprint = hashlib.md5(
        f"{device_info['browser']}{device_info['os']}{user_agent}".encode()
    ).hexdigest()
    
    # Try to find existing device
    existing_device = await db.user_devices.find_one({
        "user_id": user_id,
        "id": device_fingerprint  # Use fingerprint as device ID
    })
    
    if existing_device:
        # Update last used
        await db.user_devices.update_one(
            {"id": device_fingerprint},
            {"$set": {"last_used": datetime.utcnow(), "ip_address": ip_address}}
        )
        return UserDevice(**existing_device)
    else:
        # Create new device
        device = UserDevice(
            id=device_fingerprint,
            user_id=user_id,
            device_name=device_info["device_name"],
            device_type=device_info["device_type"],
            browser=device_info["browser"],
            os=device_info["os"],
            ip_address=ip_address,
            user_agent=user_agent,
            is_trusted=False  # New devices are not trusted by default
        )
        
        await db.user_devices.insert_one(device.dict())
        return device

async def create_security_notification(user_id: str, notification_type: str, title: str, message: str, metadata: Dict = None):
    """Create a security notification for the user"""
    notification = SecurityNotification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        metadata=metadata or {}
    )
    await db.security_notifications.insert_one(notification.dict())

async def create_session(user_id: str, device_id: str, ip_address: str, user_agent: str) -> str:
    """Create a new user session"""
    session_token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(days=7)  # 7 days expiry
    
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        device_id=device_id,
        ip_address=ip_address,
        user_agent=user_agent,
        expires_at=expires_at
    )
    
    await db.user_sessions.insert_one(session.dict())
    return session_token

def get_client_ip(request: Request) -> str:
    """Get client IP address from request"""
    x_forwarded_for = request.headers.get('x-forwarded-for')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.client.host

# =============  GOOGLE OAUTH UTILITIES =============

async def get_oauth_user_data(session_id: str) -> Dict:
    """Get user data from Emergent Auth API"""
    url = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
    headers = {"X-Session-ID": session_id}
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if response.status == 200:
                return await response.json()
            else:
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid session ID or OAuth authentication failed"
                )

async def create_or_get_oauth_user(oauth_data: Dict, ip_address: str, user_agent: str) -> User:
    """Create new user or get existing user from OAuth data"""
    email = oauth_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by OAuth provider")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email})
    
    if existing_user:
        # Update OAuth info if needed
        update_data = {}
        if not existing_user.get("oauth_provider"):
            update_data["oauth_provider"] = "google"
            update_data["oauth_id"] = oauth_data.get("id")
            update_data["avatar_url"] = oauth_data.get("picture")
        
        update_data["last_login"] = datetime.utcnow()
        
        if update_data:
            await db.users.update_one({"id": existing_user["id"]}, {"$set": update_data})
            
        # Get updated user data
        user_data = await db.users.find_one({"id": existing_user["id"]})
        return User(**user_data)
    else:
        # Create new user from OAuth data
        username = email.split("@")[0]  # Use email prefix as username
        
        # Ensure username is unique
        counter = 1
        original_username = username
        while await db.users.find_one({"username": username}):
            username = f"{original_username}{counter}"
            counter += 1
        
        user = User(
            email=email,
            username=username,
            display_name=oauth_data.get("name", email),
            avatar_url=oauth_data.get("picture"),
            oauth_provider="google",
            oauth_id=oauth_data.get("id"),
            is_verified=True  # OAuth users are considered verified
        )
        
        await db.users.insert_one(user.dict())
        
        # Create user profile
        profile = UserProfile(id=user.id, username=user.username)
        await db.user_profiles.insert_one(profile.dict())
        
        return user

# =============  MUSIC UTILITIES =============

async def get_music_info(music_id: str):
    """Get music information from music library"""
    if not music_id:
        return None
    
    # Music library - Enhanced like TikTok
    music_library = {
        # TRENDING
        'music_trending_1': {
            'id': 'music_trending_1',
            'title': 'Aesthetic Vibes',
            'artist': 'TrendyBeats',
            'duration': 30,
            'url': '/music/aesthetic-vibes.mp3',
            'cover': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
            'category': 'Trending',
            'isOriginal': False,
            'isTrending': True,
            'uses': 2500000
        },
        'music_trending_2': {
            'id': 'music_trending_2',
            'title': 'Viral Dance Beat',
            'artist': 'ViralHits',
            'duration': 45,
            'url': '/music/viral-dance.mp3',
            'cover': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center',
            'category': 'Trending',
            'isOriginal': False,
            'isTrending': True,
            'uses': 1800000
        },
        'music_trending_3': {
            'id': 'music_trending_3',
            'title': 'Chill Aesthetic',
            'artist': 'ChillVibesOnly',
            'duration': 40,
            'url': '/music/chill-aesthetic.mp3',
            'cover': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
            'category': 'Trending',
            'isOriginal': True,
            'isTrending': True,
            'uses': 950000
        },
        
        # POP
        'music_pop_1': {
            'id': 'music_pop_1',
            'title': 'Pop Sensation',
            'artist': 'Chart Toppers',
            'duration': 35,
            'url': '/music/pop-sensation.mp3',
            'cover': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
            'category': 'Pop',
            'isOriginal': False,
            'uses': 750000
        },
        'music_pop_2': {
            'id': 'music_pop_2',
            'title': 'Bubblegum Dreams',
            'artist': 'Sweet Melody',
            'duration': 32,
            'url': '/music/bubblegum-dreams.mp3',
            'cover': 'https://images.unsplash.com/photo-1520262494112-9fe481d36ec3?w=400&h=400&fit=crop&crop=center',
            'category': 'Pop',
            'isOriginal': False,
            'uses': 420000
        },
        
        # HIP-HOP
        'music_hiphop_1': {
            'id': 'music_hiphop_1',
            'title': 'Urban Beat',
            'artist': 'City Sounds',
            'duration': 52,
            'url': '/music/urban-beat.mp3',
            'cover': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop&crop=center',
            'category': 'Hip-Hop',
            'isOriginal': False,
            'uses': 680000
        },
        'music_hiphop_2': {
            'id': 'music_hiphop_2',
            'title': 'Street Rhythm',
            'artist': 'Underground Kings',
            'duration': 48,
            'url': '/music/street-rhythm.mp3',
            'cover': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center',
            'category': 'Hip-Hop',
            'isOriginal': True,
            'uses': 330000
        },
        
        # ELECTRONIC
        'music_electronic_1': {
            'id': 'music_electronic_1',
            'title': 'Electronic Pulse',
            'artist': 'Synth Wave',
            'duration': 48,
            'url': '/music/electronic-pulse.mp3',
            'cover': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center',
            'category': 'Electronic',
            'isOriginal': False,
            'uses': 520000
        },
        'music_electronic_2': {
            'id': 'music_electronic_2',
            'title': 'Neon Nights',
            'artist': 'CyberBeats',
            'duration': 55,
            'url': '/music/neon-nights.mp3',
            'cover': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop&crop=center',
            'category': 'Electronic',
            'isOriginal': True,
            'uses': 290000
        },
        
        # LATIN
        'music_latin_1': {
            'id': 'music_latin_1',
            'title': 'Reggaeton Flow',
            'artist': 'Latino Beats',
            'duration': 42,
            'url': '/music/reggaeton-flow.mp3',
            'cover': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop&crop=center',
            'category': 'Latin',
            'isOriginal': False,
            'uses': 850000
        },
        
        # CHILL
        'music_chill_1': {
            'id': 'music_chill_1',
            'title': 'Summer Vibes',
            'artist': 'Chill Master',
            'duration': 38,
            'url': '/music/summer-vibes.mp3',
            'cover': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
            'category': 'Chill',
            'isOriginal': False,
            'uses': 640000
        },
        
        # DANCE
        'music_dance_1': {
            'id': 'music_dance_1',
            'title': 'Dance Revolution 2025',
            'artist': 'DJ TikTok',
            'duration': 60,
            'url': '/music/dance-revolution.mp3',
            'cover': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center',
            'category': 'Dance',
            'isOriginal': False,
            'uses': 1200000
        },
        
        # ORIGINAL SOUND
        'original_sound': {
            'id': 'original_sound',
            'title': 'Sonido Original',
            'artist': 'Sin música de fondo',
            'duration': 0,
            'url': '',
            'cover': '/images/original-sound.png',
            'category': 'Original',
            'isOriginal': True,
            'uses': 0
        }
    }
    
    return music_library.get(music_id)

# =============  NOTIFICATION UTILITIES =============

async def send_mention_notifications(mentioned_users: List[str], poll_id: str, current_user: UserResponse):
    """Send notifications to mentioned users"""
    # TODO: Implement notification system for mentioned users
    # This is a placeholder function that will be implemented later
    # For now, we'll just log the mentions
    print(f"Sending mention notifications to {mentioned_users} for poll {poll_id} by user {current_user.username}")
    pass

# Basic API endpoint
@api_router.get("/")
async def get_api_info():
    """Get API information"""
    return {
        "name": "Social Network API",
        "version": "1.0",
        "description": "Social network with messaging functionality",
        "features": ["messaging", "user_profiles"]
    }

# =============  AUTHENTICATION ENDPOINTS =============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate, request: Request):
    """Register a new user with enhanced security"""
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")
    
    # Check if email exists
    if await db.users.find_one({"email": user_data.email}):
        await track_login_attempt(
            user_data.email, ip_address, user_agent,
            False, "Email already registered"
        )
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Check if username exists
    if await db.users.find_one({"username": user_data.username}):
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        username=user_data.username,
        display_name=user_data.display_name,
        hashed_password=hashed_password
    )
    
    # Insert user
    await db.users.insert_one(user.dict())
    
    # Create user profile
    profile = UserProfile(
        id=user.id,
        username=user.username
    )
    await db.user_profiles.insert_one(profile.dict())
    
    # Get or create device for registration
    device = await get_or_create_device(user.id, ip_address, user_agent)
    
    # Track successful registration
    await track_login_attempt(user_data.email, ip_address, user_agent, True)
    
    # Generate token
    access_token = create_access_token(data={"sub": user.id})
    
    # Create session
    session_token = await create_session(user.id, device.id, ip_address, user_agent)
    
    # Create welcome notification
    await create_security_notification(
        user.id,
        "account_created",
        "Welcome!",
        f"Your account has been created successfully from {device.device_name}",
        {
            "device_id": device.id,
            "ip_address": ip_address
        }
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(**user.dict())
    )

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin, request: Request):
    """Login user with enhanced security"""
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")
    
    # Check rate limiting
    if not await check_rate_limit(login_data.email, ip_address):
        await track_login_attempt(
            login_data.email, ip_address, user_agent, 
            False, "Rate limit exceeded"
        )
        raise HTTPException(
            status_code=429,
            detail="Too many failed login attempts. Please try again later."
        )
    
    # Find user
    user_data = await db.users.find_one({"email": login_data.email})
    if not user_data:
        await track_login_attempt(
            login_data.email, ip_address, user_agent,
            False, "Email not found"
        )
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password"
        )
    
    # Verify password (skip for OAuth users)
    if user_data.get("hashed_password") and not verify_password(login_data.password, user_data["hashed_password"]):
        await track_login_attempt(
            login_data.email, ip_address, user_agent,
            False, "Invalid password"
        )
        raise HTTPException(
            status_code=400,
            detail="Incorrect email or password"
        )
    elif not user_data.get("hashed_password"):
        await track_login_attempt(
            login_data.email, ip_address, user_agent,
            False, "OAuth user attempted regular login"
        )
        raise HTTPException(
            status_code=400,
            detail="This account uses social login. Please use Google sign-in."
        )
    
    # Get or create device
    device = await get_or_create_device(user_data["id"], ip_address, user_agent)
    
    # Check if this is a new device
    if not device.is_trusted:
        await create_security_notification(
            user_data["id"],
            "new_device",
            "New Device Login",
            f"Login detected from new device: {device.device_name} ({device.browser})",
            {
                "device_id": device.id,
                "ip_address": ip_address,
                "location": "Unknown"  # You could add IP geolocation here
            }
        )
    
    # Update last login
    await db.users.update_one(
        {"id": user_data["id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Track successful login
    await track_login_attempt(login_data.email, ip_address, user_agent, True)
    
    # Generate token
    access_token = create_access_token(data={"sub": user_data["id"]})
    
    # Create session
    session_token = await create_session(user_data["id"], device.id, ip_address, user_agent)
    
    # Create login notification
    await create_security_notification(
        user_data["id"],
        "new_login",
        "New Login",
        f"Successful login from {device.device_name} ({device.browser})",
        {
            "device_id": device.id,
            "ip_address": ip_address,
            "session_token": session_token
        }
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer", 
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(**user_data)
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Get current user information"""
    return current_user

# =============  GOOGLE OAUTH ENDPOINTS =============

@api_router.post("/auth/oauth/google", response_model=Token)
async def oauth_google_callback(session_id: str, request: Request):
    """Handle Google OAuth callback with session ID"""
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")
    
    try:
        # Get user data from Emergent Auth API
        oauth_data = await get_oauth_user_data(session_id)
        
        # Create or get existing user
        user = await create_or_get_oauth_user(oauth_data, ip_address, user_agent)
        
        # Get or create device
        device = await get_or_create_device(user.id, ip_address, user_agent)
        
        # Check if this is a new device
        if not device.is_trusted:
            await create_security_notification(
                user.id,
                "new_device",
                "New Device Login",
                f"Google login from new device: {device.device_name} ({device.browser})",
                {
                    "device_id": device.id,
                    "ip_address": ip_address,
                    "oauth_provider": "google"
                }
            )
        
        # Track successful login
        await track_login_attempt(user.email, ip_address, user_agent, True)
        
        # Generate JWT token
        access_token = create_access_token(data={"sub": user.id})
        
        # Create session
        session_token = await create_session(user.id, device.id, ip_address, user_agent)
        
        # Create login notification
        await create_security_notification(
            user.id,
            "new_login", 
            "Google Login",
            f"Successful Google login from {device.device_name} ({device.browser})",
            {
                "device_id": device.id,
                "ip_address": ip_address,
                "oauth_provider": "google",
                "session_token": session_token
            }
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse(**user.dict())
        )
        
    except Exception as e:
        await track_login_attempt(
            "unknown", ip_address, user_agent,
            False, f"OAuth error: {str(e)}"
        )
        raise HTTPException(
            status_code=400,
            detail=f"OAuth authentication failed: {str(e)}"
        )

# =============  SECURITY ENDPOINTS =============

@api_router.get("/auth/security/notifications")
async def get_security_notifications(
    current_user: UserResponse = Depends(get_current_user),
    limit: int = 20,
    offset: int = 0
):
    """Get user's security notifications"""
    notifications = await db.security_notifications.find({
        "user_id": current_user.id
    }).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    return notifications

@api_router.put("/auth/security/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Mark a security notification as read"""
    result = await db.security_notifications.update_one(
        {
            "id": notification_id,
            "user_id": current_user.id
        },
        {"$set": {"is_read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

@api_router.get("/auth/security/devices")
async def get_user_devices(current_user: UserResponse = Depends(get_current_user)):
    """Get user's trusted devices"""
    devices = await db.user_devices.find({
        "user_id": current_user.id
    }).sort("last_used", -1).to_list(50)
    
    return devices

@api_router.put("/auth/security/devices/{device_id}/trust")
async def trust_device(
    device_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Mark a device as trusted"""
    result = await db.user_devices.update_one(
        {
            "id": device_id,
            "user_id": current_user.id
        },
        {"$set": {"is_trusted": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {"message": "Device marked as trusted"}

@api_router.delete("/auth/security/devices/{device_id}")
async def remove_device(
    device_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Remove a device and invalidate its sessions"""
    # Remove device
    device_result = await db.user_devices.delete_one({
        "id": device_id,
        "user_id": current_user.id
    })
    
    if device_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # Invalidate sessions for this device
    await db.user_sessions.update_many(
        {
            "device_id": device_id,
            "user_id": current_user.id
        },
        {"$set": {"is_active": False}}
    )
    
    return {"message": "Device removed and sessions invalidated"}

@api_router.get("/auth/security/login-history")
async def get_login_history(
    current_user: UserResponse = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0
):
    """Get user's recent login history"""
    attempts = await db.login_attempts.find({
        "email": current_user.email,
        "success": True
    }).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    return attempts

# =============  USER UPDATE ENDPOINTS =============

@api_router.put("/auth/profile", response_model=UserResponse)
async def update_profile(
    user_data: UserUpdate, 
    current_user: UserResponse = Depends(get_current_user)
):
    """Update user profile information"""
    update_fields = {}
    
    if user_data.display_name is not None:
        update_fields["display_name"] = user_data.display_name.strip()
    if user_data.bio is not None:
        update_fields["bio"] = user_data.bio.strip()
    if user_data.avatar_url is not None:
        update_fields["avatar_url"] = user_data.avatar_url.strip()
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Update user in database
    result = await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return updated user
    updated_user = await db.users.find_one({"id": current_user.id})
    return UserResponse(**updated_user)

@api_router.put("/auth/password")
async def change_password(
    password_data: PasswordChange,
    current_user: UserResponse = Depends(get_current_user),
    request: Request = None
):
    """Change user password with security tracking"""
    ip_address = get_client_ip(request)
    user_agent = request.headers.get("user-agent", "")
    
    # Get current user with password
    user_data = await db.users.find_one({"id": current_user.id})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has a password (not OAuth-only user)
    if not user_data.get("hashed_password"):
        raise HTTPException(
            status_code=400, 
            detail="Cannot change password for OAuth-only accounts"
        )
    
    # Verify current password
    if not verify_password(password_data.current_password, user_data["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Hash new password
    new_hashed_password = get_password_hash(password_data.new_password)
    
    # Update password in database
    result = await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"hashed_password": new_hashed_password}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update password")
    
    # Get device info
    device = await get_or_create_device(current_user.id, ip_address, user_agent)
    
    # Create security notification
    await create_security_notification(
        current_user.id,
        "password_change",
        "Password Changed",
        f"Your password was changed from {device.device_name} ({device.browser})",
        {
            "device_id": device.id,
            "ip_address": ip_address
        }
    )
    
    # Invalidate all other sessions for security
    await db.user_sessions.update_many(
        {"user_id": current_user.id},
        {"$set": {"is_active": False}}
    )
    
    return {"message": "Password updated successfully. Please log in again on other devices."}

@api_router.put("/auth/settings", response_model=UserResponse)
async def update_settings(
    settings_data: UserSettings,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update user privacy settings"""
    update_fields = {}
    
    if settings_data.is_public is not None:
        update_fields["is_public"] = settings_data.is_public
    if settings_data.allow_messages is not None:
        update_fields["allow_messages"] = settings_data.allow_messages
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No settings to update")
    
    # Update user settings in database
    result = await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Return updated user
    updated_user = await db.users.find_one({"id": current_user.id})
    return UserResponse(**updated_user)

# =============  USER PROFILE ENDPOINTS =============

@api_router.get("/user/profile")
async def get_my_profile(current_user: UserResponse = Depends(get_current_user)):
    """Get current user profile"""
    profile_data = await db.user_profiles.find_one({"id": current_user.id})
    if not profile_data:
        # Create profile if it doesn't exist
        profile = UserProfile(id=current_user.id, username=current_user.username)
        await db.user_profiles.insert_one(profile.dict())
        return profile
    
    profile = UserProfile(**profile_data)
    return profile

@api_router.get("/user/profile/{user_id}")
async def get_user_profile(user_id: str):
    """Get user profile (public endpoint)"""
    profile_data = await db.user_profiles.find_one({"id": user_id})
    if not profile_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = UserProfile(**profile_data)
    return profile

# =============  USER SEARCH ENDPOINTS =============

@api_router.get("/users/search")
async def search_users(q: str = "", current_user: UserResponse = Depends(get_current_user)):
    """Search users by username or display name"""
    if not q.strip():
        return []
    
    # Search by username or display_name (case-insensitive)
    search_regex = {"$regex": q, "$options": "i"}
    users = await db.users.find({
        "$and": [
            {"id": {"$ne": current_user.id}},  # Exclude current user
            {
                "$or": [
                    {"username": search_regex},
                    {"display_name": search_regex}
                ]
            }
        ]
    }).limit(10).to_list(10)
    
    return [UserResponse(**user) for user in users]

# =============  FOLLOW ENDPOINTS =============

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, current_user: UserResponse = Depends(get_current_user)):
    """Follow a user"""
    # Check if user to follow exists
    user_to_follow = await db.users.find_one({"id": user_id})
    if not user_to_follow:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is trying to follow themselves
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    # Check if already following
    existing_follow = await db.follows.find_one({
        "follower_id": current_user.id,
        "following_id": user_id
    })
    if existing_follow:
        raise HTTPException(status_code=400, detail="Already following this user")
    
    # Create follow relationship
    follow_data = Follow(
        follower_id=current_user.id,
        following_id=user_id
    )
    
    result = await db.follows.insert_one(follow_data.model_dump())
    if not result.inserted_id:
        raise HTTPException(status_code=500, detail="Failed to follow user")
    
    return {"message": "Successfully followed user", "follow_id": follow_data.id}

@api_router.delete("/users/{user_id}/follow")
async def unfollow_user(user_id: str, current_user: UserResponse = Depends(get_current_user)):
    """Unfollow a user"""
    # Find and delete follow relationship
    result = await db.follows.delete_one({
        "follower_id": current_user.id,
        "following_id": user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Follow relationship not found")
    
    return {"message": "Successfully unfollowed user"}

@api_router.get("/users/{user_id}/follow-status")
async def get_follow_status(user_id: str, current_user: UserResponse = Depends(get_current_user)):
    """Get follow status for a specific user"""
    follow_relationship = await db.follows.find_one({
        "follower_id": current_user.id,
        "following_id": user_id
    })
    
    return FollowStatus(
        is_following=follow_relationship is not None,
        follow_id=follow_relationship["id"] if follow_relationship else None
    )

@api_router.get("/users/following")
async def get_following_users(current_user: UserResponse = Depends(get_current_user)):
    """Get list of users that current user is following"""
    follows = await db.follows.find({"follower_id": current_user.id}).to_list(1000)
    
    following_ids = [follow["following_id"] for follow in follows]
    users = await db.users.find({"id": {"$in": following_ids}}).to_list(1000)
    
    return FollowingList(
        following=[UserResponse(**user) for user in users],
        total=len(users)
    )

@api_router.get("/users/{user_id}/followers")
async def get_user_followers(user_id: str):
    """Get list of users following the specified user"""
    follows = await db.follows.find({"following_id": user_id}).to_list(1000)
    
    follower_ids = [follow["follower_id"] for follow in follows]
    users = await db.users.find({"id": {"$in": follower_ids}}).to_list(1000)
    
    return FollowersList(
        followers=[UserResponse(**user) for user in users],
        total=len(users)
    )

@api_router.get("/users/{user_id}/following")
async def get_user_following(user_id: str):
    """Get list of users that specified user is following"""
    follows = await db.follows.find({"follower_id": user_id}).to_list(1000)
    
    following_ids = [follow["following_id"] for follow in follows]
    users = await db.users.find({"id": {"$in": following_ids}}).to_list(1000)
    
    return FollowingList(
        following=[UserResponse(**user) for user in users],
        total=len(users)
    )

# =============  MESSAGING ENDPOINTS =============

@api_router.post("/messages")
async def send_message(message: MessageCreate, current_user: UserResponse = Depends(get_current_user)):
    """Send a message to another user"""
    # Verify recipient exists
    recipient = await db.users.find_one({"id": message.recipient_id})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Find or create conversation
    conversation_data = await db.conversations.find_one({
        "participants": {"$all": [current_user.id, message.recipient_id]}
    })
    
    if not conversation_data:
        # Create new conversation
        conversation = Conversation(
            participants=[current_user.id, message.recipient_id],
            unread_count={
                current_user.id: 0,
                message.recipient_id: 1
            }
        )
        await db.conversations.insert_one(conversation.dict())
        conversation_id = conversation.id
    else:
        conversation_id = conversation_data["id"]
        # Update unread count for recipient
        await db.conversations.update_one(
            {"id": conversation_id},
            {
                "$inc": {f"unread_count.{message.recipient_id}": 1},
                "$set": {
                    "last_message": message.content,
                    "last_message_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    # Create message
    new_message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        recipient_id=message.recipient_id,
        content=message.content,
        message_type=message.message_type,
        metadata=message.metadata
    )
    
    await db.messages.insert_one(new_message.dict())
    
    return {
        "success": True,
        "message_id": new_message.id,
        "conversation_id": conversation_id
    }

@api_router.get("/conversations")
async def get_conversations(current_user: UserResponse = Depends(get_current_user)):
    """Get user's conversations"""
    conversations = await db.conversations.find({
        "participants": current_user.id,
        "is_active": True
    }).sort("last_message_at", -1).to_list(50)
    
    result = []
    for conv_data in conversations:
        # Get participant info
        participant_ids = [p for p in conv_data["participants"] if p != current_user.id]
        participants = []
        
        for participant_id in participant_ids:
            user_data = await db.users.find_one({"id": participant_id})
            if user_data:
                participants.append(UserResponse(**user_data))
        
        # Get unread count for current user
        unread_count = conv_data.get("unread_count", {}).get(current_user.id, 0)
        
        conversation_response = ConversationResponse(
            id=conv_data["id"],
            participants=participants,
            last_message=conv_data.get("last_message"),
            last_message_at=conv_data.get("last_message_at"),
            unread_count=unread_count,
            created_at=conv_data["created_at"]
        )
        result.append(conversation_response)
    
    return result

@api_router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: str,
    limit: int = 50,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get messages from a conversation"""
    # Verify user is participant in conversation
    conversation = await db.conversations.find_one({
        "id": conversation_id,
        "participants": current_user.id
    })
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get messages
    messages = await db.messages.find({
        "conversation_id": conversation_id
    }).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Mark messages as read
    await db.messages.update_many(
        {
            "conversation_id": conversation_id,
            "recipient_id": current_user.id,
            "is_read": False
        },
        {"$set": {"is_read": True}}
    )
    
    # Reset unread count for current user
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {f"unread_count.{current_user.id}": 0}}
    )
    
    # Reverse to get chronological order (oldest first)
    messages.reverse()
    
    return [Message(**msg) for msg in messages]

@api_router.get("/messages/unread")
async def get_unread_count(current_user: UserResponse = Depends(get_current_user)):
    """Get total unread message count"""
    conversations = await db.conversations.find({
        "participants": current_user.id,
        "is_active": True
    }).to_list(100)
    
    total_unread = sum(
        conv.get("unread_count", {}).get(current_user.id, 0) 
        for conv in conversations
    )
    
    return {"unread_count": total_unread}

# =============  COMMENT ENDPOINTS =============

@api_router.post("/polls/{poll_id}/comments", response_model=CommentResponse)
async def create_comment(
    poll_id: str,
    comment_data: CommentCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new comment on a poll"""
    # Verificar que el poll_id coincida con el de los datos
    if comment_data.poll_id != poll_id:
        raise HTTPException(status_code=400, detail="Poll ID mismatch")
    
    # Si es una respuesta, verificar que el comentario padre existe
    if comment_data.parent_comment_id:
        parent_comment = await db.comments.find_one({
            "id": comment_data.parent_comment_id,
            "poll_id": poll_id
        })
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")
    
    # Crear el comentario
    comment = Comment(
        poll_id=poll_id,
        user_id=current_user.id,
        content=comment_data.content.strip(),
        parent_comment_id=comment_data.parent_comment_id
    )
    
    # Insertar en la base de datos
    await db.comments.insert_one(comment.dict())
    
    # Retornar el comentario creado con información del usuario
    return CommentResponse(
        **comment.dict(),
        user=current_user,
        replies=[],
        reply_count=0,
        user_liked=False
    )

@api_router.get("/polls/{poll_id}/comments")
async def get_poll_comments(
    poll_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get comments for a specific poll with nested structure"""
    
    # Obtener todos los comentarios del poll
    comments_cursor = db.comments.find({
        "poll_id": poll_id
    }).sort("created_at", 1)  # Orden cronológico
    
    all_comments = await comments_cursor.to_list(1000)  # Límite alto para obtener todos
    
    if not all_comments:
        return []
    
    # Obtener información de usuarios únicos
    user_ids = list(set(comment["user_id"] for comment in all_comments))
    users_cursor = db.users.find({"id": {"$in": user_ids}})
    users_list = await users_cursor.to_list(len(user_ids))
    users_dict = {user["id"]: UserResponse(**user) for user in users_list}
    
    # Obtener likes del usuario actual para cada comentario
    comment_ids = [comment["id"] for comment in all_comments]
    user_likes = await db.comment_likes.find({
        "comment_id": {"$in": comment_ids},
        "user_id": current_user.id
    }).to_list(len(comment_ids))
    
    liked_comments = set(like["comment_id"] for like in user_likes)
    
    # Crear diccionario de comentarios
    comments_dict = {}
    root_comments = []
    
    # Construir estructura anidada
    for comment_data in all_comments:
        comment_resp = CommentResponse(
            **comment_data,
            user=users_dict.get(comment_data["user_id"]),
            replies=[],
            reply_count=0,
            user_liked=comment_data["id"] in liked_comments
        )
        
        comments_dict[comment_data["id"]] = comment_resp
        
        if comment_data["parent_comment_id"] is None:
            root_comments.append(comment_resp)
    
    # Construir jerarquía de respuestas
    for comment_data in all_comments:
        if comment_data["parent_comment_id"]:
            parent = comments_dict.get(comment_data["parent_comment_id"])
            child = comments_dict.get(comment_data["id"])
            if parent and child:
                parent.replies.append(child)
    
    # Calcular conteos de respuestas anidadas recursivamente
    def calculate_reply_count(comment):
        count = len(comment.replies)
        for reply in comment.replies:
            count += calculate_reply_count(reply)
        comment.reply_count = count
        return count
    
    for comment in root_comments:
        calculate_reply_count(comment)
    
    # Aplicar paginación solo a comentarios raíz
    paginated_comments = root_comments[offset:offset + limit]
    
    return paginated_comments

@api_router.put("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    comment_data: CommentUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update a comment (only by the comment author)"""
    
    # Verificar que el comentario existe y pertenece al usuario
    comment = await db.comments.find_one({
        "id": comment_id,
        "user_id": current_user.id
    })
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found or not authorized")
    
    # Actualizar el comentario
    update_data = {
        "content": comment_data.content.strip(),
        "is_edited": True,
        "updated_at": datetime.utcnow()
    }
    
    result = await db.comments.update_one(
        {"id": comment_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update comment")
    
    # Obtener el comentario actualizado
    updated_comment = await db.comments.find_one({"id": comment_id})
    
    return CommentResponse(
        **updated_comment,
        user=current_user,
        replies=[],
        reply_count=0,
        user_liked=False
    )

@api_router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a comment (only by the comment author)"""
    
    # Verificar que el comentario existe y pertenece al usuario
    comment = await db.comments.find_one({
        "id": comment_id,
        "user_id": current_user.id
    })
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found or not authorized")
    
    # Eliminar el comentario y todas sus respuestas recursivamente
    await delete_comment_recursive(comment_id)
    
    return {"message": "Comment deleted successfully"}

async def delete_comment_recursive(comment_id: str):
    """Función auxiliar para eliminar comentarios de forma recursiva"""
    
    # Encontrar todos los comentarios hijos
    child_comments = await db.comments.find({"parent_comment_id": comment_id}).to_list(1000)
    
    # Eliminar recursivamente los comentarios hijos
    for child in child_comments:
        await delete_comment_recursive(child["id"])
    
    # Eliminar likes del comentario
    await db.comment_likes.delete_many({"comment_id": comment_id})
    
    # Eliminar el comentario principal
    await db.comments.delete_one({"id": comment_id})

@api_router.post("/comments/{comment_id}/like")
async def toggle_comment_like(
    comment_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Toggle like on a comment"""
    
    # Verificar que el comentario existe
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Verificar si ya existe el like
    existing_like = await db.comment_likes.find_one({
        "comment_id": comment_id,
        "user_id": current_user.id
    })
    
    if existing_like:
        # Quitar like
        await db.comment_likes.delete_one({
            "comment_id": comment_id,
            "user_id": current_user.id
        })
        
        # Decrementar contador de likes
        await db.comments.update_one(
            {"id": comment_id},
            {"$inc": {"likes": -1}}
        )
        
        # Obtener nuevo conteo
        updated_comment = await db.comments.find_one({"id": comment_id})
        
        return {
            "liked": False,
            "likes": updated_comment["likes"]
        }
    else:
        # Agregar like
        like = CommentLike(
            comment_id=comment_id,
            user_id=current_user.id
        )
        
        await db.comment_likes.insert_one(like.dict())
        
        # Incrementar contador de likes
        await db.comments.update_one(
            {"id": comment_id},
            {"$inc": {"likes": 1}}
        )
        
        # Obtener nuevo conteo
        updated_comment = await db.comments.find_one({"id": comment_id})
        
        return {
            "liked": True,
            "likes": updated_comment["likes"]
        }

@api_router.get("/comments/{comment_id}")
async def get_comment(
    comment_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific comment with its replies"""
    
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Obtener información del usuario
    user_data = await db.users.find_one({"id": comment["user_id"]})
    if not user_data:
        raise HTTPException(status_code=404, detail="Comment author not found")
    
    user = UserResponse(**user_data)
    
    # Verificar si el usuario actual le dio like
    user_like = await db.comment_likes.find_one({
        "comment_id": comment_id,
        "user_id": current_user.id
    })
    
    # Obtener respuestas directas
    replies_cursor = db.comments.find({
        "parent_comment_id": comment_id
    }).sort("created_at", 1)
    
    replies_data = await replies_cursor.to_list(100)
    
    # Procesar respuestas
    replies = []
    for reply_data in replies_data:
        reply_user_data = await db.users.find_one({"id": reply_data["user_id"]})
        if reply_user_data:
            reply_user_like = await db.comment_likes.find_one({
                "comment_id": reply_data["id"],
                "user_id": current_user.id
            })
            
            reply = CommentResponse(
                **reply_data,
                user=UserResponse(**reply_user_data),
                replies=[],  # Por ahora solo 2 niveles
                reply_count=0,
                user_liked=bool(reply_user_like)
            )
            replies.append(reply)
    
    return CommentResponse(
        **comment,
        user=user,
        replies=replies,
        reply_count=len(replies),
        user_liked=bool(user_like)
    )

# =============  FILE UPLOAD UTILITIES =============

def get_file_format(filename: str) -> str:
    """Extract file format from filename"""
    return Path(filename).suffix.lower().lstrip('.')

def is_image_file(file_format: str) -> bool:
    """Check if file format is a supported image"""
    return file_format.lower() in config.SUPPORTED_IMAGE_FORMATS

def is_video_file(file_format: str) -> bool:
    """Check if file format is a supported video"""
    return file_format.lower() in config.SUPPORTED_VIDEO_FORMATS

def validate_file(file: UploadFile, upload_type: UploadType) -> tuple[bool, str, FileType]:
    """Validate uploaded file using configuration"""
    if not file.filename:
        return False, "No filename provided", FileType.IMAGE
    
    file_format = get_file_format(file.filename)
    
    # Check if supported format
    if not (is_image_file(file_format) or is_video_file(file_format)):
        supported_formats = config.SUPPORTED_IMAGE_FORMATS + config.SUPPORTED_VIDEO_FORMATS
        return False, f"Unsupported file format. Supported: {', '.join(supported_formats)}", FileType.IMAGE
    
    # Determine file type
    file_type = FileType.IMAGE if is_image_file(file_format) else FileType.VIDEO
    
    # Check file size using config
    max_size = config.IMAGE_MAX_SIZE if file_type == FileType.IMAGE else config.VIDEO_MAX_SIZE
    if hasattr(file, 'size') and file.size > max_size:
        max_mb = max_size // (1024 * 1024)
        return False, f"File too large. Maximum size: {max_mb}MB", file_type
    
    return True, "", file_type

def get_upload_path(upload_type: UploadType, file_format: str, filename: str) -> tuple[Path, str]:
    """Get the upload path and public URL for a file using configuration"""
    # Create unique filename to avoid conflicts
    unique_filename = f"{uuid.uuid4()}.{file_format}"
    
    # Determine subdirectory based on upload type
    subdir_map = {
        UploadType.AVATAR: config.UPLOAD_SUBDIRS[0],           # "avatars"
        UploadType.POLL_OPTION: config.UPLOAD_SUBDIRS[1],      # "poll_options"
        UploadType.POLL_BACKGROUND: config.UPLOAD_SUBDIRS[2],  # "poll_backgrounds"
        UploadType.GENERAL: config.UPLOAD_SUBDIRS[3]           # "general"
    }
    subdir = subdir_map[upload_type]
    
    file_path = config.UPLOAD_BASE_DIR / subdir / unique_filename
    # Use API endpoint URL instead of direct static file URL
    public_url = f"{config.API_PREFIX}/uploads/{subdir}/{unique_filename}"
    
    return file_path, public_url

async def get_image_dimensions(file_path: Path) -> tuple[Optional[int], Optional[int]]:
    """Get image dimensions using PIL"""
    try:
        with Image.open(file_path) as img:
            return img.width, img.height
    except Exception as e:
        print(f"Error getting image dimensions: {e}")
        return None, None

async def get_thumbnail_for_media_url(media_url: str) -> Optional[str]:
    """Get thumbnail URL from uploaded_files collection based on media URL"""
    try:
        if not media_url:
            return None
            
        # Extract filename from media URL
        # URLs are like: /api/uploads/general/filename.mp4
        if "/api/uploads/" in media_url:
            filename = media_url.split("/")[-1]
            
            # Query uploaded_files collection
            uploaded_file = await db.uploaded_files.find_one({"filename": filename})
            
            if uploaded_file and uploaded_file.get("thumbnail_url"):
                return uploaded_file["thumbnail_url"]
                
        return None
        
    except Exception as e:
        print(f"Error getting thumbnail for media URL {media_url}: {e}")
        return None

async def get_video_info(file_path: Path) -> tuple[Optional[int], Optional[int], Optional[float]]:
    """Get video info and generate thumbnail"""
    try:
        # Use OpenCV to get video information and generate thumbnail
        cap = cv2.VideoCapture(str(file_path))
        
        if not cap.isOpened():
            print(f"Could not open video: {file_path}")
            return 1280, 720, 30.0  # Return defaults if can't open
        
        # Get video properties
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        duration = frame_count / fps if fps > 0 else 30.0
        
        # Generate thumbnail from middle frame
        middle_frame = frame_count // 2 if frame_count > 0 else 0
        cap.set(cv2.CAP_PROP_POS_FRAMES, middle_frame)
        
        ret, frame = cap.read()
        if ret:
            # Create thumbnail directory if it doesn't exist
            thumbnail_dir = file_path.parent / "thumbnails"
            thumbnail_dir.mkdir(exist_ok=True)
            
            # Generate thumbnail filename
            thumbnail_filename = f"{file_path.stem}_thumbnail.jpg"
            thumbnail_path = thumbnail_dir / thumbnail_filename
            
            # Resize frame to thumbnail size (maintain aspect ratio)
            max_size = 800
            if width > height:
                new_width = max_size
                new_height = int(height * (max_size / width))
            else:
                new_height = max_size
                new_width = int(width * (max_size / height))
            
            resized_frame = cv2.resize(frame, (new_width, new_height), interpolation=cv2.INTER_AREA)
            
            # Save thumbnail
            cv2.imwrite(str(thumbnail_path), resized_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            print(f"Generated thumbnail: {thumbnail_path}")
            
        cap.release()
        
        return width, height, duration
        
    except Exception as e:
        print(f"Error getting video info: {e}")
        # Return reasonable defaults on error
        return 1280, 720, 30.0

def get_video_thumbnail_url(file_path: str, upload_type: UploadType = UploadType.GENERAL) -> Optional[str]:
    """Generate thumbnail URL for video files"""
    try:
        file_path_obj = Path(file_path)
        thumbnail_filename = f"{file_path_obj.stem}_thumbnail.jpg"
        
        # Map upload type to category for URL generation
        category_map = {
            UploadType.AVATAR: "avatars",
            UploadType.POLL_OPTION: "poll_options", 
            UploadType.POLL_BACKGROUND: "poll_backgrounds",
            UploadType.GENERAL: "general"
        }
        
        category = category_map.get(upload_type, "general")
        
        # Check if thumbnail file exists
        thumbnail_path = file_path_obj.parent / "thumbnails" / thumbnail_filename
        if thumbnail_path.exists():
            return f"/api/uploads/{category}/thumbnails/{thumbnail_filename}"
        
        return None
        
    except Exception as e:
        print(f"Error generating thumbnail URL: {e}")
        return None

async def save_upload_file(file: UploadFile, file_path: Path) -> int:
    """Save uploaded file to disk and return file size"""
    file_size = 0
    
    async with aiofiles.open(file_path, 'wb') as f:
        while chunk := await file.read(1024 * 1024):  # Read in 1MB chunks
            file_size += len(chunk)
            await f.write(chunk)
    
    return file_size

# =============  FILE SERVING ENDPOINTS =============

@api_router.get("/uploads/{category}/{filename}")
async def get_upload_file(category: str, filename: str):
    """Serve uploaded files through API endpoint"""
    
    # Validate category
    allowed_categories = ["avatars", "poll_options", "poll_backgrounds", "general"]
    if category not in allowed_categories:
        raise HTTPException(status_code=404, detail="Invalid category")
    
    # Construct file path
    file_path = UPLOAD_DIR / category / filename
    
    # Check if file exists
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get MIME type
    mime_type, _ = mimetypes.guess_type(str(file_path))
    if not mime_type:
        mime_type = "application/octet-stream"
    
    # Return the file
    return FileResponse(
        path=file_path,
        media_type=mime_type,
        filename=filename
    )

@api_router.get("/uploads/{category}/thumbnails/{filename}")
async def get_thumbnail_file(category: str, filename: str):
    """Serve thumbnail files through API endpoint"""
    
    # Validate category
    allowed_categories = ["avatars", "poll_options", "poll_backgrounds", "general"]
    if category not in allowed_categories:
        raise HTTPException(status_code=404, detail="Invalid category")
    
    # Construct thumbnail file path
    file_path = UPLOAD_DIR / category / "thumbnails" / filename
    
    # Check if file exists
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Thumbnail not found")
    
    # Get MIME type (thumbnails are always JPEG)
    mime_type = "image/jpeg"
    
    # Return the thumbnail
    return FileResponse(
        path=file_path,
        media_type=mime_type,
        filename=filename
    )

# =============  FILE UPLOAD ENDPOINTS =============

@api_router.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    upload_type: UploadType = UploadType.GENERAL,
    current_user: UserResponse = Depends(get_current_user)
):
    """Upload a file (image or video)"""
    
    # Validate file
    is_valid, error_message, file_type = validate_file(file, upload_type)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_message)
    
    try:
        # Get file info
        file_format = get_file_format(file.filename)
        file_path, public_url = get_upload_path(upload_type, file_format, file.filename)
        
        # Save file
        file_size = await save_upload_file(file, file_path)
        
        # Get dimensions/duration based on file type
        width = height = duration = thumbnail_url = None
        if file_type == FileType.IMAGE:
            width, height = await get_image_dimensions(file_path)
        elif file_type == FileType.VIDEO:
            width, height, duration = await get_video_info(file_path)
            # Generate thumbnail URL for videos
            thumbnail_url = get_video_thumbnail_url(str(file_path), upload_type)
        
        # Create database record
        uploaded_file = UploadedFile(
            filename=file_path.name,
            original_filename=file.filename,
            file_type=file_type,
            file_format=file_format,
            file_size=file_size,
            upload_type=upload_type,
            uploader_id=current_user.id,
            file_path=str(file_path),
            public_url=public_url,
            thumbnail_url=thumbnail_url,
            width=width,
            height=height,
            duration=duration
        )
        
        # Save to database
        await db.uploaded_files.insert_one(uploaded_file.dict())
        
        return UploadResponse(
            id=uploaded_file.id,
            filename=uploaded_file.filename,
            original_filename=uploaded_file.original_filename,
            file_type=uploaded_file.file_type,
            file_format=uploaded_file.file_format,
            file_size=uploaded_file.file_size,
            public_url=uploaded_file.public_url,
            thumbnail_url=uploaded_file.thumbnail_url,
            width=uploaded_file.width,
            height=uploaded_file.height,
            duration=uploaded_file.duration,
            created_at=uploaded_file.created_at
        )
        
    except Exception as e:
        # Clean up file if database save fails
        if file_path.exists():
            file_path.unlink()
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {str(e)}"
        )

@api_router.get("/upload/{file_id}", response_model=UploadResponse)
async def get_upload_info(
    file_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get information about an uploaded file"""
    
    file_data = await db.uploaded_files.find_one({"id": file_id})
    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")
    
    return UploadResponse(**file_data)

@api_router.delete("/upload/{file_id}")
async def delete_upload(
    file_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete an uploaded file"""
    
    # Get file info
    file_data = await db.uploaded_files.find_one({"id": file_id})
    if not file_data:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if user owns the file
    if file_data["uploader_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")
    
    try:
        # Delete physical file
        file_path = Path(file_data["file_path"])
        if file_path.exists():
            file_path.unlink()
        
        # Delete database record
        await db.uploaded_files.delete_one({"id": file_id})
        
        return {"message": "File deleted successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete file: {str(e)}"
        )

@api_router.get("/uploads/user", response_model=List[UploadResponse])
async def get_user_uploads(
    upload_type: Optional[UploadType] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's uploaded files"""
    
    filter_query = {"uploader_id": current_user.id}
    if upload_type:
        filter_query["upload_type"] = upload_type
    
    files_cursor = db.uploaded_files.find(filter_query).sort("created_at", -1).skip(offset).limit(limit)
    files = await files_cursor.to_list(limit)
    
    return [UploadResponse(**file_data) for file_data in files]

# =============  POLL ENDPOINTS =============

def calculate_time_ago(created_at: datetime) -> str:
    """Calculate time ago string from datetime"""
    now = datetime.utcnow()
    diff = now - created_at
    
    if diff.days > 0:
        if diff.days == 1:
            return "hace 1 día"
        elif diff.days < 30:
            return f"hace {diff.days} días"
        elif diff.days < 365:
            months = diff.days // 30
            return f"hace {months} {'mes' if months == 1 else 'meses'}"
        else:
            years = diff.days // 365
            return f"hace {years} {'año' if years == 1 else 'años'}"
    
    hours = diff.seconds // 3600
    if hours > 0:
        return f"hace {hours} {'hora' if hours == 1 else 'horas'}"
    
    minutes = diff.seconds // 60
    if minutes > 0:
        return f"hace {minutes} {'minuto' if minutes == 1 else 'minutos'}"
    
    return "hace unos momentos"

@api_router.get("/polls", response_model=List[PollResponse])
async def get_polls(
    limit: int = 20,
    offset: int = 0,
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get polls with pagination and filters"""
    
    # Build filter query
    filter_query = {"is_active": True}
    if category:
        filter_query["category"] = category
    if featured is not None:
        filter_query["is_featured"] = featured
    
    # Get polls
    polls_cursor = db.polls.find(filter_query).sort("created_at", -1).skip(offset).limit(limit)
    polls = await polls_cursor.to_list(limit)
    
    if not polls:
        return []
    
    # Get all author IDs
    author_ids = list(set(poll["author_id"] for poll in polls))
    authors_cursor = db.users.find({"id": {"$in": author_ids}})
    authors_list = await authors_cursor.to_list(len(author_ids))
    authors_dict = {user["id"]: UserResponse(**user) for user in authors_list}
    
    # Get user votes and likes
    poll_ids = [poll["id"] for poll in polls]
    
    user_votes_cursor = db.votes.find({
        "poll_id": {"$in": poll_ids},
        "user_id": current_user.id
    })
    user_votes = await user_votes_cursor.to_list(len(poll_ids))
    user_votes_dict = {vote["poll_id"]: vote["option_id"] for vote in user_votes}
    
    user_likes_cursor = db.poll_likes.find({
        "poll_id": {"$in": poll_ids},
        "user_id": current_user.id
    })
    user_likes = await user_likes_cursor.to_list(len(poll_ids))
    liked_poll_ids = set(like["poll_id"] for like in user_likes)
    
    # Build response
    result = []
    for poll_data in polls:
        # Get option users
        option_user_ids = [option["user_id"] for option in poll_data.get("options", [])]
        if option_user_ids:
            option_users_cursor = db.users.find({"id": {"$in": option_user_ids}})
            option_users_list = await option_users_cursor.to_list(len(option_user_ids))
            option_users_dict = {user["id"]: user for user in option_users_list}
        else:
            option_users_dict = {}
        
        # Process options
        options = []
        for option in poll_data.get("options", []):
            option_user = option_users_dict.get(option["user_id"])
            if option_user:
                # Keep media_url as relative path for frontend to handle
                media_url = option.get("media_url")
                
                # Get thumbnail URL for videos
                thumbnail_url = option.get("thumbnail_url")
                if not thumbnail_url and media_url and option.get("media_type") == "video":
                    thumbnail_url = await get_thumbnail_for_media_url(media_url)
                
                option_dict = {
                    "id": option["id"],
                    "text": option["text"],
                    "votes": option["votes"],
                    "user": {
                        "username": option_user["username"],
                        "displayName": option_user["display_name"],
                        "avatar": option_user.get("avatar_url"),
                        "verified": option_user.get("is_verified", False),
                        "followers": "1K"  # Placeholder
                    },
                    "mentioned_users": option.get("mentioned_users", []),  # Include mentioned users
                    "media": {
                        "type": option.get("media_type"),
                        "url": media_url,
                        "thumbnail": thumbnail_url or media_url
                    } if media_url else None
                }
                options.append(option_dict)
        
        # Skip polls without valid options or without title
        if not options or not poll_data.get("title"):
            continue
        
        # Get music info if available
        music_info = await get_music_info(poll_data.get("music_id")) if poll_data.get("music_id") else None
        
        poll_response = PollResponse(
            id=poll_data["id"],
            title=poll_data["title"],
            author=authors_dict.get(poll_data["author_id"]),
            description=poll_data.get("description"),
            options=options,
            total_votes=poll_data["total_votes"],
            likes=poll_data["likes"],
            shares=poll_data["shares"],
            comments_count=poll_data["comments_count"],
            music=music_info,  # Include music information
            user_vote=user_votes_dict.get(poll_data["id"]),
            user_liked=poll_data["id"] in liked_poll_ids,
            is_featured=poll_data["is_featured"],
            tags=poll_data.get("tags", []),
            category=poll_data.get("category"),
            mentioned_users=poll_data.get("mentioned_users", []),  # Include mentioned users
            created_at=poll_data["created_at"],
            time_ago=calculate_time_ago(poll_data["created_at"])
        )
        result.append(poll_response)
    
    return result
    
    return result

@api_router.post("/polls", response_model=PollResponse)
async def create_poll(
    poll_data: PollCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new poll"""
    
    # Create poll options
    options = []
    for i, option_data in enumerate(poll_data.options):
        option = PollOption(
            user_id=current_user.id,  # For now, creator adds all options
            text=option_data["text"],
            media_type=option_data.get("media_type"),
            media_url=option_data.get("media_url"),
            thumbnail_url=option_data.get("thumbnail_url"),
            mentioned_users=option_data.get("mentioned_users", [])
        )
        options.append(option)
    
    # Create poll
    poll = Poll(
        title=poll_data.title,
        author_id=current_user.id,
        description=poll_data.description,
        options=[opt.dict() for opt in options],  # Store as dict in MongoDB
        music_id=poll_data.music_id,
        tags=poll_data.tags,
        category=poll_data.category,
        mentioned_users=poll_data.mentioned_users,
        video_playback_settings=poll_data.video_playback_settings
    )
    
    # Insert into database
    await db.polls.insert_one(poll.dict())
    
    # Send notifications to mentioned users (both general and option-specific)
    all_mentioned_users = set(poll_data.mentioned_users)
    
    # Collect mentioned users from all options
    for option in options:
        all_mentioned_users.update(option.mentioned_users)
    
    if all_mentioned_users:
        await send_mention_notifications(list(all_mentioned_users), poll.id, current_user)
    
    # Return poll response
    options_response = []
    for option in options:
        option_dict = {
            "id": option.id,
            "text": option.text,
            "votes": option.votes,
            "user": {
                "username": current_user.username,
                "displayName": current_user.display_name,
                "avatar": current_user.avatar_url,
                "verified": current_user.is_verified,
                "followers": "1K"  # Placeholder
            },
            "mentioned_users": option.mentioned_users,  # Include mentioned users in option
            "media": {
                "type": option.media_type,
                "url": option.media_url,
                "thumbnail": option.thumbnail_url
            } if option.media_url else None
        }
        options_response.append(option_dict)
    
    # Get music info if available
    music_info = await get_music_info(poll.music_id) if poll.music_id else None
    
    return PollResponse(
        id=poll.id,
        title=poll.title,
        author=current_user,
        description=poll.description,
        options=options_response,
        total_votes=poll.total_votes,
        likes=poll.likes,
        shares=poll.shares,
        comments_count=poll.comments_count,
        music=music_info,  # Include music information
        user_vote=None,
        user_liked=False,
        is_featured=poll.is_featured,
        tags=poll.tags,
        category=poll.category,
        mentioned_users=poll.mentioned_users,  # Include mentioned users in poll
        created_at=poll.created_at,
        time_ago=calculate_time_ago(poll.created_at)
    )

@api_router.post("/polls/{poll_id}/vote")
async def vote_on_poll(
    poll_id: str,
    vote_data: VoteCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Vote on a poll"""
    
    # Check if poll exists
    poll = await db.polls.find_one({"id": poll_id, "is_active": True})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    # Check if user already voted
    existing_vote = await db.votes.find_one({
        "poll_id": poll_id,
        "user_id": current_user.id
    })
    
    if existing_vote:
        # Update existing vote
        # First, decrease vote count from previous option
        await db.polls.update_one(
            {"id": poll_id, "options.id": existing_vote["option_id"]},
            {"$inc": {"options.$.votes": -1, "total_votes": -1}}
        )
        
        # Update vote record
        await db.votes.update_one(
            {"id": existing_vote["id"]},
            {"$set": {"option_id": vote_data.option_id}}
        )
    else:
        # Create new vote
        vote = Vote(
            poll_id=poll_id,
            option_id=vote_data.option_id,
            user_id=current_user.id
        )
        await db.votes.insert_one(vote.dict())
    
    # Increment vote count for new option
    result = await db.polls.update_one(
        {"id": poll_id, "options.id": vote_data.option_id},
        {"$inc": {"options.$.votes": 1, "total_votes": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Invalid option ID")
    
    return {"message": "Vote recorded successfully"}

@api_router.post("/polls/{poll_id}/like")
async def toggle_poll_like(
    poll_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Toggle like on a poll"""
    
    # Check if poll exists
    poll = await db.polls.find_one({"id": poll_id, "is_active": True})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    # Check if user already liked
    existing_like = await db.poll_likes.find_one({
        "poll_id": poll_id,
        "user_id": current_user.id
    })
    
    if existing_like:
        # Remove like
        await db.poll_likes.delete_one({
            "poll_id": poll_id,
            "user_id": current_user.id
        })
        
        # Decrement like count
        await db.polls.update_one(
            {"id": poll_id},
            {"$inc": {"likes": -1}}
        )
        
        # Get updated count
        updated_poll = await db.polls.find_one({"id": poll_id})
        
        return {
            "liked": False,
            "likes": updated_poll["likes"]
        }
    else:
        # Add like
        like = PollLike(
            poll_id=poll_id,
            user_id=current_user.id
        )
        
        await db.poll_likes.insert_one(like.dict())
        
        # Increment like count
        await db.polls.update_one(
            {"id": poll_id},
            {"$inc": {"likes": 1}}
        )
        
        # Get updated count
        updated_poll = await db.polls.find_one({"id": poll_id})
        
        return {
            "liked": True,
            "likes": updated_poll["likes"]
        }

@api_router.post("/polls/{poll_id}/share")
async def share_poll(
    poll_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Increment share count for a poll"""
    
    # Check if poll exists
    poll = await db.polls.find_one({"id": poll_id, "is_active": True})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    # Increment share count
    result = await db.polls.update_one(
        {"id": poll_id},
        {"$inc": {"shares": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update share count")
    
    # Get updated count
    updated_poll = await db.polls.find_one({"id": poll_id})
    
    return {
        "shares": updated_poll["shares"]
    }

@api_router.get("/polls/{poll_id}", response_model=PollResponse)
async def get_poll_by_id(
    poll_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific poll by ID"""
    
    # Get poll
    poll = await db.polls.find_one({"id": poll_id, "is_active": True})
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    # Get author info
    author_data = await db.users.find_one({"id": poll["author_id"]})
    if not author_data:
        raise HTTPException(status_code=404, detail="Author not found")
    author = UserResponse(**author_data)
    
    # Get option users
    option_user_ids = [option["user_id"] for option in poll.get("options", [])]
    option_users_dict = {}
    if option_user_ids:
        option_users_cursor = db.users.find({"id": {"$in": option_user_ids}})
        option_users_list = await option_users_cursor.to_list(len(option_user_ids))
        option_users_dict = {user["id"]: user for user in option_users_list}
    
    # Get user vote and like
    user_vote = await db.votes.find_one({
        "poll_id": poll_id,
        "user_id": current_user.id
    })
    
    user_like = await db.poll_likes.find_one({
        "poll_id": poll_id,
        "user_id": current_user.id
    })
    
    # Process options
    options = []
    for option in poll.get("options", []):
        option_user = option_users_dict.get(option["user_id"])
        if option_user:
            media_url = option.get("media_url")
            
            # Get thumbnail URL for videos
            thumbnail_url = option.get("thumbnail_url")
            if not thumbnail_url and media_url and option.get("media_type") == "video":
                thumbnail_url = await get_thumbnail_for_media_url(media_url)
            
            option_dict = {
                "id": option["id"],
                "text": option["text"],
                "votes": option["votes"],
                "user": {
                    "username": option_user["username"],
                    "displayName": option_user["display_name"],
                    "avatar": option_user.get("avatar_url"),
                    "verified": option_user.get("is_verified", False),
                    "followers": "1K"  # Placeholder
                },
                "mentioned_users": option.get("mentioned_users", []),  # Include mentioned users
                "media": {
                    "type": option.get("media_type"),
                    "url": media_url,
                    "thumbnail": thumbnail_url
                } if media_url else None
            }
            options.append(option_dict)
    
    # Get music info if available
    music_info = await get_music_info(poll.get("music_id")) if poll.get("music_id") else None
    
    return PollResponse(
        id=poll["id"],
        title=poll["title"],
        author=author,
        description=poll.get("description"),
        options=options,
        total_votes=poll["total_votes"],
        likes=poll["likes"],
        shares=poll["shares"],
        comments_count=poll["comments_count"],
        music=music_info,  # Include music information
        user_vote=user_vote["option_id"] if user_vote else None,
        user_liked=bool(user_like),
        is_featured=poll["is_featured"],
        tags=poll.get("tags", []),
        category=poll.get("category"),
        mentioned_users=poll.get("mentioned_users", []),  # Include mentioned users
        created_at=poll["created_at"],
        time_ago=calculate_time_ago(poll["created_at"])
    )

# Add the API router to the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)