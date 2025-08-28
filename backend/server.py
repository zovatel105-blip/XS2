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
import httpx
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
    UploadType, FileType, UploadedFile, UploadResponse,
    # User Audio Models
    UserAudio, UserAudioCreate, UserAudioUpdate, UserAudioResponse, UserAudioUse, AudioPrivacy,
    # Audio Favorites Models
    AudioFavorite, AudioFavoriteCreate, AudioFavoriteResponse
)
from auth import (
    verify_password, get_password_hash, create_access_token, 
    verify_token, ACCESS_TOKEN_EXPIRE_MINUTES
)

# Import configuration
from config import config

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# =============  AUDIO PROCESSING UTILITIES =============

import pydub
from pydub import AudioSegment
import librosa
import soundfile as sf
import numpy as np

def process_audio_file(file_path: str, max_duration: int = 60) -> dict:
    """
    Process uploaded audio file: validate, trim to max duration, extract metadata
    """
    try:
        import subprocess
        import tempfile
        
        # Load audio using pydub (supports MP3, M4A, WAV, AAC)
        audio = AudioSegment.from_file(file_path)
        
        # Get original metadata
        original_duration = len(audio) / 1000.0  # Convert to seconds
        sample_rate = audio.frame_rate
        channels = audio.channels
        
        # Trim to max duration if necessary
        if original_duration > max_duration:
            audio = audio[:max_duration * 1000]  # pydub uses milliseconds
            print(f"🎵 Audio trimmed from {original_duration:.1f}s to {max_duration}s")
        
        # Create temporary output file
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_out:
            processed_path = tmp_out.name
        
        # Export processed audio (convert to MP3 for consistency)
        audio.export(processed_path, format="mp3", bitrate="128k")
        
        # Generate waveform data for visualization
        waveform = generate_waveform(processed_path)
        
        return {
            'success': True,
            'processed_path': processed_path,
            'duration': min(original_duration, max_duration),
            'sample_rate': sample_rate,
            'channels': channels,
            'bitrate': 128,  # Fixed bitrate for processed files
            'waveform': waveform,
            'was_trimmed': original_duration > max_duration,
            'original_duration': original_duration
        }
        
    except Exception as e:
        print(f"❌ Audio processing error: {str(e)}")
        # Try with ffmpeg as fallback
        try:
            return process_audio_with_ffmpeg(file_path, max_duration)
        except Exception as fallback_error:
            print(f"❌ FFmpeg fallback also failed: {str(fallback_error)}")
            return {
                'success': False,
                'error': f"Error processing audio: {str(e)}"
            }

def process_audio_with_ffmpeg(file_path: str, max_duration: int = 60) -> dict:
    """
    Fallback audio processing using FFmpeg directly
    """
    import subprocess
    import tempfile
    
    try:
        # Create temporary output file
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_out:
            output_path = tmp_out.name
        
        # Use FFmpeg to process audio
        cmd = [
            'ffmpeg', '-i', file_path,
            '-t', str(max_duration),  # Trim to max duration
            '-acodec', 'mp3',
            '-ab', '128k',
            '-ar', '44100',
            '-y',  # Overwrite output file
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            raise Exception(f"FFmpeg failed: {result.stderr}")
        
        # Get audio info using FFprobe
        probe_cmd = [
            'ffprobe', '-v', 'quiet', '-print_format', 'json',
            '-show_format', '-show_streams', output_path
        ]
        
        probe_result = subprocess.run(probe_cmd, capture_output=True, text=True)
        
        if probe_result.returncode == 0:
            import json
            probe_data = json.loads(probe_result.stdout)
            format_info = probe_data.get('format', {})
            duration = float(format_info.get('duration', max_duration))
            
            # Generate basic waveform
            waveform = generate_basic_waveform()
            
            return {
                'success': True,
                'processed_path': output_path,
                'duration': duration,
                'sample_rate': 44100,
                'channels': 2,
                'bitrate': 128,
                'waveform': waveform,
                'was_trimmed': duration >= max_duration,
                'original_duration': duration
            }
        else:
            raise Exception(f"FFprobe failed: {probe_result.stderr}")
            
    except Exception as e:
        return {
            'success': False,
            'error': f"FFmpeg processing failed: {str(e)}"
        }

def generate_basic_waveform(points: int = 20) -> List[float]:
    """Generate a basic waveform for visualization when librosa fails"""
    import random
    return [random.uniform(0.3, 0.9) for _ in range(points)]

def generate_waveform(audio_path: str, points: int = 20) -> List[float]:
    """
    Generate waveform visualization data from audio file
    """
    try:
        # Try to load audio with librosa for analysis
        y, sr = librosa.load(audio_path)
        
        # Calculate RMS energy for each segment
        hop_length = max(1, len(y) // points)
        waveform = []
        
        for i in range(points):
            start = i * hop_length
            end = min((i + 1) * hop_length, len(y))
            if start < len(y):
                segment = y[start:end]
                rms = np.sqrt(np.mean(segment**2)) if len(segment) > 0 else 0
                # Normalize to 0-1 range
                waveform.append(min(1.0, rms * 3))  # Amplify for better visualization
            else:
                waveform.append(0.0)
        
        return waveform
    except Exception as e:
        print(f"❌ Librosa waveform generation failed: {str(e)}")
        print("🔄 Using basic waveform generation")
        # Return default waveform if generation fails
        return generate_basic_waveform(points)

def validate_audio_file(file: UploadFile) -> dict:
    """
    Validate uploaded audio file (format, size, etc.)
    """
    # Supported audio formats
    SUPPORTED_FORMATS = ['mp3', 'm4a', 'wav', 'aac', 'flac', 'ogg']
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    # Get file extension
    file_extension = file.filename.lower().split('.')[-1] if '.' in file.filename else ''
    
    # Validate format
    if file_extension not in SUPPORTED_FORMATS:
        return {
            'valid': False,
            'error': f"Formato no soportado. Use: {', '.join(SUPPORTED_FORMATS.upper())}"
        }
    
    # Validate size
    if hasattr(file, 'size') and file.size > MAX_FILE_SIZE:
        return {
            'valid': False,
            'error': f"Archivo muy grande. Máximo 10MB permitido."
        }
    
    return {
        'valid': True,
        'format': file_extension
    }

# =============  MUSIC UTILITIES =============

async def search_itunes_track(artist: str, track: str):
    """Search iTunes API for real song preview"""
    try:
        # Construct search query
        query = f"{artist} {track}".strip()
        url = "https://itunes.apple.com/search"
        params = {
            'term': query,
            'media': 'music',
            'entity': 'song',
            'limit': 1,
            'country': 'US',  # Can be changed to ES for Spanish market
            'callback': ''  # Disable JSONP to get pure JSON
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    # Get text and parse as JSON (iTunes returns JSONP by default)
                    text = await response.text()
                    
                    # If it starts with a function call, extract JSON
                    if text.strip().startswith('(') or 'callback' in text:
                        # Find JSON part
                        start = text.find('{')
                        end = text.rfind('}') + 1
                        if start >= 0 and end > start:
                            text = text[start:end]
                    
                    import json
                    data = json.loads(text)
                    
                    if data.get('results') and len(data['results']) > 0:
                        result = data['results'][0]
                        return {
                            'preview_url': result.get('previewUrl'),
                            'artwork_url': result.get('artworkUrl100', '').replace('100x100', '400x400'),
                            'artist_name': result.get('artistName'),
                            'track_name': result.get('trackName'),
                            'duration_ms': result.get('trackTimeMillis', 30000),
                            'genre': result.get('primaryGenreName'),
                            'iTunes_id': result.get('trackId')
                        }
        return None
    except Exception as e:
        print(f"Error searching iTunes: {e}")
        return None

async def get_music_info(music_id: str):
    """
    Get music information by ID with automatic iTunes preview fetching
    Supports both static library IDs and dynamic iTunes IDs (format: itunes_XXXXX)
    """
    if not music_id:
        return None
    
    # Check if this is an iTunes ID (format: itunes_XXXXX)
    if music_id.startswith('itunes_'):
        try:
            # Extract iTunes track ID
            itunes_track_id = music_id.replace('itunes_', '')
            print(f"🎵 Fetching iTunes track info for ID: {itunes_track_id}")
            
            # Fetch track info directly from iTunes API using track ID
            url = f"https://itunes.apple.com/lookup?id={itunes_track_id}"
            
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    results = data.get('results', [])
                    if results:
                        result = results[0]
                        music_info = {
                            'id': music_id,
                            'title': result.get('trackName'),
                            'artist': result.get('artistName'),
                            'duration': 30,  # iTunes previews are 30 seconds
                            'url': '',  # No local URL for iTunes tracks
                            'preview_url': result.get('previewUrl'),
                            'cover': result.get('artworkUrl100', '').replace('100x100bb.jpg', '400x400bb.jpg'),
                            'category': result.get('primaryGenreName', 'Music'),
                            'isOriginal': False,
                            'isTrending': False,
                            'uses': 0,  # Default for iTunes tracks
                            'source': 'iTunes'
                        }
                        print(f"✅ Successfully fetched iTunes track: {music_info['title']} - {music_info['artist']}")
                        return music_info
                    else:
                        print(f"❌ No results found for iTunes track ID: {itunes_track_id}")
                        return None
                else:
                    print(f"❌ iTunes API error: {response.status_code}")
                    return None
        except Exception as e:
            print(f"❌ Error fetching iTunes track {music_id}: {str(e)}")
            return None
    
    # If not an iTunes ID, check static music library
    music_library = {
        # TRENDING
        'music_trending_1': {
            'id': 'music_trending_1',
            'title': 'LA BOTELLA',
            'artist': 'Morad',
            'duration': 195,
            'url': '/music/morad-la-botella.mp3',
            'preview_url': None,  # Will be fetched from iTunes
            'cover': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
            'category': 'Trending',
            'isOriginal': False,
            'isTrending': True,
            'uses': 8500000
        },
        'music_trending_2': {
            'id': 'music_trending_2',
            'title': 'Un Verano Sin Ti',
            'artist': 'Bad Bunny',
            'duration': 208,
            'url': '/music/bad-bunny-verano.mp3',
            'preview_url': None,  # Will be fetched from iTunes
            'cover': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center',
            'category': 'Trending',
            'isOriginal': False,
            'isTrending': True,
            'uses': 12500000
        },
        'music_trending_3': {
            'id': 'music_trending_3',
            'title': 'TQG',
            'artist': 'Karol G ft. Shakira',
            'duration': 192,
            'url': '/music/karol-g-tqg.mp3',
            'preview_url': None,  # Will be fetched from iTunes
            'cover': 'https://images.unsplash.com/photo-1520262494112-9fe481d36ec3?w=400&h=400&fit=crop&crop=center',
            'category': 'Trending',
            'isOriginal': False,
            'isTrending': True,
            'uses': 9800000
        },
        
        # REGGAETON
        'music_reggaeton_1': {
            'id': 'music_reggaeton_1',
            'title': 'Me Porto Bonito',
            'artist': 'Bad Bunny x Chencho Corleone',
            'duration': 178,
            'url': '/music/bad-bunny-me-porto-bonito.mp3',
            'preview_url': 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/2c/7a/80/2c7a8014-6ff1-88a5-d3df-39125a23546a/mzaf_4090450781883707192.plus.aac.p.m4a',  # REAL PREVIEW!
            'cover': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop&crop=center',
            'category': 'Reggaeton',
            'isOriginal': False,
            'uses': 7200000
        },
        'music_reggaeton_2': {
            'id': 'music_reggaeton_2',
            'title': 'Provenza',
            'artist': 'Karol G',
            'duration': 213,
            'url': '/music/karol-g-provenza.mp3',
            'cover': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center',
            'category': 'Reggaeton',
            'isOriginal': False,
            'uses': 6800000
        },
        'music_reggaeton_3': {
            'id': 'music_reggaeton_3',
            'title': 'FERXXO 100',
            'artist': 'Feid',
            'duration': 185,
            'url': '/music/feid-ferxxo-100.mp3',
            'cover': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
            'category': 'Reggaeton',
            'isOriginal': False,
            'uses': 4500000
        },
        'music_collab_1': {
            'id': 'music_collab_1',
            'title': 'Tití Me Preguntó',
            'artist': 'Bad Bunny',
            'duration': 224,
            'url': '/music/bad-bunny-titi-me-pregunto.mp3',
            'cover': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center',
            'category': 'Reggaeton',
            'isOriginal': False,
            'uses': 11200000
        },
        
        # TRAP
        'music_trap_1': {
            'id': 'music_trap_1',
            'title': 'BZRP Music Sessions #52',
            'artist': 'Quevedo x Bizarrap',
            'duration': 201,
            'url': '/music/quevedo-bzrp-52.mp3',
            'cover': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center',
            'category': 'Trap',
            'isOriginal': False,
            'uses': 15200000
        },
        'music_trap_3': {
            'id': 'music_trap_3',
            'title': 'MOTOROLA',
            'artist': 'Morad',
            'duration': 189,
            'url': '/music/morad-motorola.mp3',
            'cover': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
            'category': 'Trap',
            'isOriginal': False,
            'uses': 6100000
        },
        
        # URBANO ESPAÑOL
        'music_urbano_esp_1': {
            'id': 'music_urbano_esp_1',
            'title': 'DURMIENDO EN EL SUELO',
            'artist': 'Morad',
            'duration': 176,
            'url': '/music/morad-durmiendo-suelo.mp3',
            'cover': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
            'category': 'Urbano Español',
            'isOriginal': False,
            'uses': 4200000
        },
        'music_urbano_esp_2': {
            'id': 'music_urbano_esp_2',
            'title': 'NO TE PIENSO',
            'artist': 'Morad',
            'duration': 198,
            'url': '/music/morad-no-te-pienso.mp3',
            'cover': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
            'category': 'Urbano Español',
            'isOriginal': False,
            'uses': 3700000
        },
        
        # POP LATINO
        'music_pop_latino_1': {
            'id': 'music_pop_latino_1',
            'title': 'Flowers',
            'artist': 'Miley Cyrus (Remix Latino)',
            'duration': 201,
            'url': '/music/miley-flowers-remix.mp3',
            'cover': 'https://images.unsplash.com/photo-1520262494112-9fe481d36ec3?w=400&h=400&fit=crop&crop=center',
            'category': 'Pop Latino',
            'isOriginal': False,
            'uses': 8900000
        },
        'music_pop_latino_2': {
            'id': 'music_pop_latino_2',
            'title': 'MAMIII',
            'artist': 'Becky G x Karol G',
            'duration': 187,
            'url': '/music/becky-g-mamiii.mp3',
            'cover': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center',
            'category': 'Pop Latino',
            'isOriginal': False,
            'uses': 6300000
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
    
    music_info = music_library.get(music_id)
    if not music_info:
        return None
    
    # If preview_url is None, try to fetch from iTunes API
    if music_info.get('preview_url') is None:
        try:
            itunes_result = await search_itunes_track(music_info['artist'], music_info['title'])
            if itunes_result and itunes_result.get('preview_url'):
                # Update the music info with real preview URL
                music_info = music_info.copy()  # Create a copy to avoid modifying the original
                music_info['preview_url'] = itunes_result['preview_url']
                print(f"✅ Fetched real preview URL for {music_info['title']} - {music_info['artist']}")
            else:
                print(f"⚠️ Could not fetch preview URL for {music_info['title']} - {music_info['artist']}")
        except Exception as e:
            print(f"❌ Error fetching iTunes preview for {music_info['title']}: {str(e)}")
    
    return music_info

# =============  REAL MUSIC PREVIEW ENDPOINTS =============

@api_router.get("/music/search")
async def search_music_preview(
    artist: str,
    track: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Search for real music preview using iTunes API"""
    try:
        # If no track specified, use first word of artist as track
        search_track = track or artist.split()[0] if artist else ""
        
        itunes_result = await search_itunes_track(artist, search_track)
        
        if itunes_result and itunes_result['preview_url']:
            return {
                'success': True,
                'music': {
                    'id': f"itunes_{itunes_result['iTunes_id']}",
                    'title': itunes_result['track_name'],
                    'artist': itunes_result['artist_name'],
                    'preview_url': itunes_result['preview_url'],
                    'cover': itunes_result['artwork_url'],
                    'duration': 30,  # iTunes previews are 30 seconds
                    'category': itunes_result['genre'],
                    'isOriginal': False,
                    'source': 'iTunes'
                }
            }
        else:
            return {
                'success': False,
                'message': 'No preview found',
                'music': None
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching music: {str(e)}")

@api_router.get("/music/search-realtime")
async def search_music_realtime(
    query: str,
    limit: int = 20,
    current_user: UserResponse = Depends(get_current_user)
):
    """Search for music in real time using iTunes API - supports any artist/song"""
    try:
        # Clean and prepare the search query
        query = query.strip()
        if not query:
            return {
                'success': False,
                'message': 'Query is required',
                'results': []
            }
        
        # Use iTunes Search API with more flexible search
        url = "https://itunes.apple.com/search"
        params = {
            'term': query,
            'media': 'music',
            'entity': 'song',
            'limit': limit,
            'country': 'US'  # Can be changed to support different countries
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
        
        results = []
        if 'results' in data:
            for result in data['results']:
                # Only include results with preview URLs
                preview_url = result.get('previewUrl')
                if preview_url:
                    music_item = {
                        'id': f"itunes_{result.get('trackId')}",
                        'title': result.get('trackName', 'Unknown Title'),
                        'artist': result.get('artistName', 'Unknown Artist'),
                        'preview_url': preview_url,
                        'cover': result.get('artworkUrl100', '').replace('100x100', '400x400'),  # Higher resolution
                        'duration': 30,  # iTunes previews are typically 30 seconds
                        'category': result.get('primaryGenreName', 'Music'),
                        'isOriginal': False,
                        'isTrending': False,
                        'uses': 0,  # Real-time results don't have use counts
                        'waveform': [0.7, 0.8, 0.6, 0.9, 0.5, 0.8, 0.7, 0.9, 0.6, 0.8] * 2,  # Default waveform
                        'source': 'iTunes',
                        'album': result.get('collectionName', ''),
                        'release_date': result.get('releaseDate', ''),
                        'itunes_url': result.get('trackViewUrl', '')
                    }
                    results.append(music_item)
        
        return {
            'success': True,
            'message': f'Found {len(results)} songs for "{query}"',
            'results': results,
            'total': len(results),
            'query': query
        }
        
    except httpx.TimeoutException:
        return {
            'success': False,
            'message': 'Search timeout - please try again',
            'results': []
        }
    except Exception as e:
        print(f"Error in real-time music search: {e}")
        return {
            'success': False,
            'message': f'Search error: {str(e)}',
            'results': []
        }

@api_router.get("/music/library-with-previews")
async def get_music_library_with_real_previews(
    limit: int = 20,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get music library with real iTunes preview URLs"""
    
    # Define popular songs to fetch real previews for
    popular_songs = [
        {'artist': 'Morad', 'track': 'LA BOTELLA'},
        {'artist': 'Bad Bunny', 'track': 'Un Verano Sin Ti'},
        {'artist': 'Karol G', 'track': 'TQG'},
        {'artist': 'Bad Bunny', 'track': 'Me Porto Bonito'},
        {'artist': 'Karol G', 'track': 'Provenza'},
        {'artist': 'Feid', 'track': 'FERXXO 100'},
        {'artist': 'Quevedo', 'track': 'BZRP Music Sessions 52'},
        {'artist': 'Morad', 'track': 'MOTOROLA'},
        {'artist': 'Morad', 'track': 'DURMIENDO EN EL SUELO'},
        {'artist': 'Becky G', 'track': 'MAMIII'},
        {'artist': 'Rosalía', 'track': 'Despechá'},
        {'artist': 'Bad Bunny', 'track': 'Tití Me Preguntó'}
    ]
    
    music_with_previews = []
    
    # Fetch real previews from iTunes
    for song_info in popular_songs[:limit]:
        itunes_result = await search_itunes_track(song_info['artist'], song_info['track'])
        
        if itunes_result and itunes_result['preview_url']:
            music_with_previews.append({
                'id': f"real_{itunes_result['iTunes_id']}",
                'title': itunes_result['track_name'],
                'artist': itunes_result['artist_name'],
                'preview_url': itunes_result['preview_url'],  # REAL 30-second preview
                'cover': itunes_result['artwork_url'],
                'duration': 30,
                'category': itunes_result['genre'] or 'Urban',
                'isOriginal': False,
                'isTrending': True,
                'uses': 8500000,  # Mock usage count
                'source': 'iTunes',
                'waveform': [0.8, 0.9, 0.7, 0.9, 0.8, 1.0, 0.6, 0.9, 0.8, 0.7, 0.9, 0.8, 1.0, 0.7, 0.9, 0.8, 0.6, 0.9, 0.8, 0.7]
            })
        
        # Limit concurrent requests to avoid rate limiting
        if len(music_with_previews) >= 5:
            await asyncio.sleep(0.1)
    
    return {
        'music': music_with_previews,
        'total': len(music_with_previews),
        'has_real_previews': True,
        'source': 'iTunes Search API'
    }

# =============  MUSIC ENDPOINTS =============

@api_router.get("/music/library", response_model=List[dict])
async def get_music_library(
    category: Optional[str] = None,
    search: Optional[str] = None,
    trending: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get music library with filtering options"""
    
    # All music from library - Expanded with real artists
    all_music = [
        # TRENDING - Top Artists
        {
            'id': 'music_trending_1',
            'title': 'LA BOTELLA',
            'artist': 'Morad',
            'duration': 195,
            'url': '/music/morad-la-botella.mp3',
            'cover': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
            'category': 'Trending',
            'isOriginal': False,
            'isTrending': True,
            'uses': 8500000,
            'waveform': [0.8, 0.9, 0.7, 0.9, 0.8, 1.0, 0.6, 0.9, 0.8, 0.7, 0.9, 0.8, 1.0, 0.7, 0.9, 0.8, 0.6, 0.9, 0.8, 0.7]
        },
        {
            'id': 'music_trending_2',
            'title': 'Un Verano Sin Ti',
            'artist': 'Bad Bunny',
            'duration': 208,
            'url': '/music/bad-bunny-verano.mp3',
            'cover': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center',
            'category': 'Trending',
            'isOriginal': False,
            'isTrending': True,
            'uses': 12500000,
            'waveform': [0.9, 0.8, 0.9, 0.7, 0.8, 0.9, 0.6, 0.8, 0.9, 0.7, 0.8, 0.9, 0.5, 0.8, 0.9, 0.7, 0.8, 0.9, 0.6, 0.8]
        },
        {
            'id': 'music_trending_3',
            'title': 'TQG',
            'artist': 'Karol G ft. Shakira',
            'duration': 192,
            'url': '/music/karol-g-tqg.mp3',
            'cover': 'https://images.unsplash.com/photo-1520262494112-9fe481d36ec3?w=400&h=400&fit=crop&crop=center',
            'category': 'Trending',
            'isOriginal': False,
            'isTrending': True,
            'uses': 9800000,
            'waveform': [0.7, 0.9, 0.8, 0.9, 0.6, 0.8, 0.9, 0.7, 0.8, 0.9, 0.6, 0.8, 0.9, 0.7, 0.8, 0.9, 0.6, 0.8, 0.9, 0.7]
        },
        
        # REGGAETON - Urban Music
        {
            'id': 'music_reggaeton_1',
            'title': 'Me Porto Bonito',
            'artist': 'Bad Bunny x Chencho Corleone',
            'duration': 178,
            'url': '/music/bad-bunny-me-porto-bonito.mp3',
            'cover': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop&crop=center',
            'category': 'Reggaeton',
            'isOriginal': False,
            'uses': 7200000,
            'waveform': [0.8, 0.6, 0.9, 0.7, 0.8, 0.9, 0.5, 0.8, 0.6, 0.9, 0.7, 0.8, 0.5, 0.9, 0.6, 0.8, 0.7, 0.9, 0.5, 0.8]
        },
        {
            'id': 'music_reggaeton_2',
            'title': 'Provenza',
            'artist': 'Karol G',
            'duration': 213,
            'url': '/music/karol-g-provenza.mp3',
            'cover': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center',
            'category': 'Reggaeton',
            'isOriginal': False,
            'uses': 6800000,
            'waveform': [0.7, 0.8, 0.6, 0.9, 0.5, 0.8, 0.7, 0.9, 0.4, 0.8, 0.6, 0.9, 0.7, 0.8, 0.5, 0.9, 0.6, 0.8, 0.7, 0.9]
        },
        {
            'id': 'music_reggaeton_3',
            'title': 'FERXXO 100',
            'artist': 'Feid',
            'duration': 185,
            'url': '/music/feid-ferxxo-100.mp3',
            'cover': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
            'category': 'Reggaeton',
            'isOriginal': False,
            'uses': 4500000,
            'waveform': [0.6, 0.9, 0.7, 0.8, 0.9, 0.5, 0.8, 0.7, 0.9, 0.6, 0.8, 0.5, 0.9, 0.7, 0.8, 0.6, 0.9, 0.7, 0.8, 0.5]
        },
        {
            'id': 'music_collab_1',
            'title': 'Tití Me Preguntó',
            'artist': 'Bad Bunny',
            'duration': 224,
            'url': '/music/bad-bunny-titi-me-pregunto.mp3',
            'cover': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center',
            'category': 'Reggaeton',
            'isOriginal': False,
            'uses': 11200000,
            'waveform': [0.8, 0.9, 0.6, 0.8, 0.9, 0.7, 0.8, 0.5, 0.9, 0.8, 0.6, 0.9, 0.7, 0.8, 0.4, 0.9, 0.8, 0.6, 0.9, 0.7]
        },
        
        # TRAP
        {
            'id': 'music_trap_1',
            'title': 'BZRP Music Sessions #52',
            'artist': 'Quevedo x Bizarrap',
            'duration': 201,
            'url': '/music/quevedo-bzrp-52.mp3',
            'cover': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center',
            'category': 'Trap',
            'isOriginal': False,
            'uses': 15200000,
            'waveform': [0.9, 0.4, 0.8, 0.6, 0.9, 0.2, 0.7, 0.8, 0.5, 0.9, 0.3, 0.8, 0.6, 0.9, 0.4, 0.7, 0.8, 0.5, 0.9, 0.6]
        },
        {
            'id': 'music_trap_3',
            'title': 'MOTOROLA',
            'artist': 'Morad',
            'duration': 189,
            'url': '/music/morad-motorola.mp3',
            'cover': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
            'category': 'Trap',
            'isOriginal': False,
            'uses': 6100000,
            'waveform': [0.8, 0.6, 0.9, 0.7, 0.8, 0.9, 0.5, 0.8, 0.6, 0.9, 0.7, 0.8, 0.5, 0.9, 0.6, 0.8, 0.7, 0.9, 0.5, 0.8]
        },
        
        # URBANO ESPAÑOL
        {
            'id': 'music_urbano_esp_1',
            'title': 'DURMIENDO EN EL SUELO',
            'artist': 'Morad',
            'duration': 176,
            'url': '/music/morad-durmiendo-suelo.mp3',
            'cover': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
            'category': 'Urbano Español',
            'isOriginal': False,
            'uses': 4200000,
            'waveform': [0.6, 0.8, 0.7, 0.9, 0.5, 0.8, 0.6, 0.9, 0.7, 0.8, 0.4, 0.9, 0.6, 0.8, 0.7, 0.9, 0.5, 0.8, 0.6, 0.9]
        },
        {
            'id': 'music_urbano_esp_2',
            'title': 'NO TE PIENSO',
            'artist': 'Morad',
            'duration': 198,
            'url': '/music/morad-no-te-pienso.mp3',
            'cover': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
            'category': 'Urbano Español',
            'isOriginal': False,
            'uses': 3700000,
            'waveform': [0.7, 0.5, 0.8, 0.9, 0.6, 0.8, 0.4, 0.9, 0.7, 0.8, 0.5, 0.9, 0.6, 0.8, 0.7, 0.9, 0.4, 0.8, 0.6, 0.9]
        },
        
        # POP LATINO  
        {
            'id': 'music_pop_latino_1',
            'title': 'Flowers',
            'artist': 'Miley Cyrus (Remix Latino)',
            'duration': 201,
            'url': '/music/miley-flowers-remix.mp3',
            'cover': 'https://images.unsplash.com/photo-1520262494112-9fe481d36ec3?w=400&h=400&fit=crop&crop=center',
            'category': 'Pop Latino',
            'isOriginal': False,
            'uses': 8900000,
            'waveform': [0.5, 0.7, 0.4, 0.8, 0.3, 0.6, 0.9, 0.2, 0.7, 0.5, 0.8, 0.4, 0.6, 0.9, 0.3, 0.7, 0.5, 0.8, 0.2, 0.6]
        },
        {
            'id': 'music_pop_latino_2',
            'title': 'MAMIII',
            'artist': 'Becky G x Karol G',
            'duration': 187,
            'url': '/music/becky-g-mamiii.mp3',
            'cover': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&crop=center',
            'category': 'Pop Latino',
            'isOriginal': False,
            'uses': 6300000,
            'waveform': [0.6, 0.8, 0.5, 0.9, 0.4, 0.7, 0.8, 0.3, 0.6, 0.9, 0.5, 0.8, 0.4, 0.7, 0.9, 0.6, 0.8, 0.3, 0.7, 0.9]
        }
    ]
    
    filtered_music = all_music.copy()
    
    # Apply filters
    if category and category != 'Todas':
        filtered_music = [m for m in filtered_music if m['category'] == category]
    
    if search:
        search_lower = search.lower()
        filtered_music = [m for m in filtered_music if 
            search_lower in m['title'].lower() or 
            search_lower in m['artist'].lower() or
            search_lower in m['category'].lower()
        ]
    
    if trending is True:
        filtered_music = [m for m in filtered_music if m.get('isTrending', False)]
    
    # Sort by uses (popularity)
    filtered_music.sort(key=lambda x: x.get('uses', 0), reverse=True)
    
    # Apply pagination
    total = len(filtered_music)
    filtered_music = filtered_music[offset:offset + limit]
    
    return {
        'music': filtered_music,
        'total': total,
        'limit': limit,
        'offset': offset,
        'has_more': offset + limit < total
    }

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
    allowed_categories = ["avatars", "poll_options", "poll_backgrounds", "general", "audio"]
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
    allowed_categories = ["avatars", "poll_options", "poll_backgrounds", "general", "audio"]
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

# =============  USER AUDIO ENDPOINTS =============

# Create audio upload directory
AUDIO_UPLOAD_DIR = UPLOAD_DIR / "audio"
AUDIO_UPLOAD_DIR.mkdir(exist_ok=True)

def get_unique_filename(user_id: str, original_filename: str) -> str:
    """Generate unique filename for uploaded audio"""
    timestamp = int(datetime.utcnow().timestamp())
    file_ext = original_filename.split('.')[-1].lower()
    return f"audio_{user_id}_{timestamp}.{file_ext}"

def cleanup_temp_files(*file_paths):
    """Clean up temporary files"""
    for file_path in file_paths:
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.warning(f"Could not delete temp file {file_path}: {e}")

class AudioProcessingError(Exception):
    """Custom exception for audio processing errors"""
    pass

@api_router.post("/audio/upload")
async def upload_audio(
    file: UploadFile = File(...),
    title: str = "",
    artist: str = "",
    privacy: AudioPrivacy = AudioPrivacy.PRIVATE,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Subir archivo de audio personal
    
    Formatos soportados: MP3, M4A, WAV, AAC
    Duración máxima: 60 segundos (se recorta automáticamente)
    Tamaño máximo: 10MB
    """
    import tempfile
    
    try:
        # Validar tipo de archivo
        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename is required")
        
        # Guardar archivo temporal
        temp_file = None
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as tmp:
            temp_file = tmp.name
            content = await file.read()
            tmp.write(content)
        
        try:
            # Validar archivo de audio
            validation = validate_audio_file(file)
            if not validation['valid']:
                raise HTTPException(status_code=400, detail=validation['error'])
            
            logger.info(f"Audio validation passed: {file.filename}")
            
            # Generar nombre único para el archivo
            unique_filename = get_unique_filename(current_user.id, file.filename)
            final_path = AUDIO_UPLOAD_DIR / unique_filename.replace(unique_filename.split('.')[-1], 'mp3')
            
            # Procesar audio (recortar, optimizar, generar waveform)
            processing_result = process_audio_file(temp_file, max_duration=60)
            
            if not processing_result['success']:
                raise AudioProcessingError(processing_result['error'])
            
            # Mover archivo procesado a ubicación final
            import shutil
            shutil.move(processing_result['processed_path'], str(final_path))
            
            # Obtener tamaño del archivo final
            file_size = os.path.getsize(final_path)
            
            logger.info(f"Audio processing completed: {processing_result}")
            
            # Crear URL pública
            public_url = f"/api/uploads/audio/{final_path.name}"
            
            # Preparar datos para la base de datos
            audio_data = UserAudio(
                title=title.strip() or file.filename.split('.')[0],
                artist=artist.strip() or current_user.display_name or current_user.username,
                original_filename=file.filename,
                filename=final_path.name,
                file_format='mp3',  # Siempre convertimos a MP3
                file_size=file_size,
                duration=int(processing_result['duration']),
                uploader_id=current_user.id,
                file_path=str(final_path),
                public_url=public_url,
                waveform=processing_result['waveform'],
                privacy=privacy,
                bitrate=processing_result.get('bitrate', 128),
                sample_rate=processing_result.get('sample_rate', 44100),
                is_processed=True
            )
            
            # Guardar en base de datos
            result = await db.user_audio.insert_one(audio_data.dict())
            if not result.inserted_id:
                raise HTTPException(status_code=500, detail="Failed to save audio to database")
            
            # Obtener información del usuario
            uploader_response = UserResponse(
                id=current_user.id,
                username=current_user.username,
                display_name=current_user.display_name,
                avatar_url=current_user.avatar_url,
                email=current_user.email,
                bio=current_user.bio,
                is_verified=current_user.is_verified,
                created_at=current_user.created_at,
                last_login=current_user.last_login,
                is_public=current_user.is_public,
                allow_messages=current_user.allow_messages
            )
            
            # Preparar respuesta
            audio_response = UserAudioResponse(
                **audio_data.dict(),
                uploader=uploader_response,
                url=public_url,
                preview_url=public_url,
                uses=0
            )
            
            logger.info(f"✅ Audio uploaded successfully: {audio_data.title} by {current_user.username}")
            
            return {
                "success": True,
                "message": "Audio uploaded and processed successfully",
                "audio": audio_response.dict()
            }
            
        finally:
            # Limpiar archivo temporal
            cleanup_temp_files(temp_file)
            
    except AudioProcessingError as e:
        logger.error(f"Audio processing error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading audio: {str(e)}")

@api_router.get("/audio/my-library")
async def get_my_audio_library(
    limit: int = 20,
    offset: int = 0,
    search: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Obtener biblioteca de audio personal del usuario"""
    try:
        # Construir filtro de búsqueda
        filter_query = {
            "uploader_id": current_user.id,
            "is_active": True
        }
        
        if search:
            search_regex = {"$regex": search.strip(), "$options": "i"}
            filter_query["$or"] = [
                {"title": search_regex},
                {"artist": search_regex}
            ]
        
        # Obtener total de audios
        total = await db.user_audio.count_documents(filter_query)
        
        # Obtener audios con paginación
        user_audios = await db.user_audio.find(filter_query) \
            .sort("created_at", -1) \
            .skip(offset) \
            .limit(limit) \
            .to_list(limit)
        
        # Preparar respuesta con información del usuario
        audio_responses = []
        for audio_data in user_audios:
            uploader_response = UserResponse(
                id=current_user.id,
                username=current_user.username,
                display_name=current_user.display_name,
                avatar_url=current_user.avatar_url,
                email=current_user.email,
                bio=current_user.bio,
                is_verified=current_user.is_verified,
                created_at=current_user.created_at,
                last_login=current_user.last_login,
                is_public=current_user.is_public,
                allow_messages=current_user.allow_messages
            )
            
            audio_response = UserAudioResponse(
                **audio_data,
                uploader=uploader_response,
                url=audio_data["public_url"],
                preview_url=audio_data["public_url"],
                uses=audio_data["uses_count"]
            )
            audio_responses.append(audio_response.dict())
        
        return {
            "success": True,
            "audios": audio_responses,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total
        }
        
    except Exception as e:
        logger.error(f"Error getting user audio library: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting audio library: {str(e)}")

@api_router.get("/audio/public-library")
async def get_public_audio_library(
    limit: int = 20,
    offset: int = 0,
    search: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Obtener biblioteca de audio público (audios que otros usuarios han marcado como públicos)"""
    try:
        # Construir filtro de búsqueda para audios públicos
        filter_query = {
            "privacy": AudioPrivacy.PUBLIC,
            "is_active": True,
            "is_processed": True
        }
        
        if search:
            search_regex = {"$regex": search.strip(), "$options": "i"}
            filter_query["$or"] = [
                {"title": search_regex},
                {"artist": search_regex}
            ]
        
        # Obtener total de audios públicos
        total = await db.user_audio.count_documents(filter_query)
        
        # Obtener audios con paginación, ordenados por uses_count (más populares primero)
        user_audios = await db.user_audio.find(filter_query) \
            .sort("uses_count", -1) \
            .skip(offset) \
            .limit(limit) \
            .to_list(limit)
        
        # Preparar respuesta con información de los usuarios
        audio_responses = []
        for audio_data in user_audios:
            # Obtener información del usuario que subió el audio
            uploader = await db.users.find_one({"id": audio_data["uploader_id"]})
            if uploader:
                uploader_response = UserResponse(**uploader)
                
                audio_response = UserAudioResponse(
                    **audio_data,
                    uploader=uploader_response,
                    url=audio_data["public_url"],
                    preview_url=audio_data["public_url"],
                    uses=audio_data["uses_count"]
                )
                audio_responses.append(audio_response.dict())
        
        return {
            "success": True,
            "audios": audio_responses,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total,
            "message": f"Found {len(audio_responses)} public audio tracks"
        }
        
    except Exception as e:
        logger.error(f"Error getting public audio library: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting public audio library: {str(e)}")

@api_router.put("/audio/{audio_id}")
async def update_audio(
    audio_id: str,
    update_data: UserAudioUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Actualizar información de un audio (solo el propietario)"""
    try:
        # Verificar que el audio existe y pertenece al usuario
        audio_data = await db.user_audio.find_one({
            "id": audio_id,
            "uploader_id": current_user.id,
            "is_active": True
        })
        
        if not audio_data:
            raise HTTPException(status_code=404, detail="Audio not found or access denied")
        
        # Preparar campos de actualización
        update_fields = {"updated_at": datetime.utcnow()}
        
        if update_data.title is not None:
            update_fields["title"] = update_data.title.strip()
        if update_data.artist is not None:
            update_fields["artist"] = update_data.artist.strip()
        if update_data.privacy is not None:
            update_fields["privacy"] = update_data.privacy
        if update_data.cover_url is not None:
            update_fields["cover_url"] = update_data.cover_url.strip()
        
        # Actualizar en base de datos
        result = await db.user_audio.update_one(
            {"id": audio_id},
            {"$set": update_fields}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update audio")
        
        # Obtener audio actualizado
        updated_audio = await db.user_audio.find_one({"id": audio_id})
        uploader_response = UserResponse(
            id=current_user.id,
            username=current_user.username,
            display_name=current_user.display_name,
            avatar_url=current_user.avatar_url,
            email=current_user.email
        )
        
        audio_response = UserAudioResponse(
            **updated_audio,
            uploader=uploader_response,
            url=updated_audio["public_url"],
            preview_url=updated_audio["public_url"],
            uses=updated_audio["uses_count"]
        )
        
        return {
            "success": True,
            "message": "Audio updated successfully",
            "audio": audio_response.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating audio: {str(e)}")

@api_router.delete("/audio/{audio_id}")
async def delete_audio(
    audio_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Eliminar un audio (solo el propietario)"""
    try:
        # Verificar que el audio existe y pertenece al usuario
        audio_data = await db.user_audio.find_one({
            "id": audio_id,
            "uploader_id": current_user.id,
            "is_active": True
        })
        
        if not audio_data:
            raise HTTPException(status_code=404, detail="Audio not found or access denied")
        
        # Marcar como inactivo (soft delete)
        result = await db.user_audio.update_one(
            {"id": audio_id},
            {
                "$set": {
                    "is_active": False,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to delete audio")
        
        # Opcional: Eliminar archivo físico
        try:
            if os.path.exists(audio_data["file_path"]):
                os.remove(audio_data["file_path"])
        except Exception as e:
            logger.warning(f"Could not delete audio file {audio_data['file_path']}: {e}")
        
        return {
            "success": True,
            "message": "Audio deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting audio: {str(e)}")

@api_router.post("/audio/{audio_id}/use")
async def use_audio_in_post(
    audio_id: str,
    poll_id: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """Marcar que un usuario ha usado un audio en un post"""
    try:
        # Verificar que el audio existe y está disponible
        audio_data = await db.user_audio.find_one({
            "id": audio_id,
            "is_active": True,
            "is_processed": True
        })
        
        if not audio_data:
            raise HTTPException(status_code=404, detail="Audio not found")
        
        # Verificar permisos: el audio debe ser público o del usuario actual
        if audio_data["privacy"] == AudioPrivacy.PRIVATE and audio_data["uploader_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied to private audio")
        
        # Registrar el uso
        audio_use = UserAudioUse(
            audio_id=audio_id,
            user_id=current_user.id,
            poll_id=poll_id
        )
        
        await db.user_audio_uses.insert_one(audio_use.dict())
        
        # Incrementar contador de usos
        await db.user_audio.update_one(
            {"id": audio_id},
            {"$inc": {"uses_count": 1}}
        )
        
        return {
            "success": True,
            "message": "Audio use recorded successfully",
            "audio_id": audio_id,
            "use_id": audio_use.id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording audio use: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error recording audio use: {str(e)}")

@api_router.get("/audio/{audio_id}")
async def get_audio_details(
    audio_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Obtener detalles de un audio específico (usuario o sistema iTunes)"""
    try:
        print(f"🎵 Getting audio details for ID: {audio_id}")
        
        # First try to find in user audio
        audio_data = await db.user_audio.find_one({
            "id": audio_id,
            "is_active": True
        })
        
        if audio_data:
            print(f"✅ Found user audio: {audio_data.get('title')}")
            # Verificar permisos de acceso para audio de usuario
            if audio_data["privacy"] == AudioPrivacy.PRIVATE and audio_data["uploader_id"] != current_user.id:
                raise HTTPException(status_code=403, detail="Access denied to private audio")
            
            # Obtener información del uploader
            uploader = await db.users.find_one({"id": audio_data["uploader_id"]})
            if not uploader:
                raise HTTPException(status_code=404, detail="Audio uploader not found")
            
            uploader_response = UserResponse(**uploader)
            
            # Preparar respuesta para audio de usuario
            audio_response = UserAudioResponse(
                **audio_data,
                uploader=uploader_response,
                url=audio_data["public_url"],
                preview_url=audio_data["public_url"],
                uses=audio_data["uses_count"]
            )
            
            return {
                "success": True,
                "audio": audio_response.dict()
            }
        
        # If not found in user audio, try system music
        print(f"🔍 User audio not found, checking system music for ID: {audio_id}")
        
        # Get music info using existing function (supports iTunes IDs)
        music_info = await get_music_info(audio_id)
        
        if music_info:
            print(f"✅ Found system music: {music_info.get('title')} by {music_info.get('artist')}")
            
            # Convert to compatible format with frontend
            audio_response = {
                "id": music_info["id"],
                "title": music_info["title"],
                "artist": music_info["artist"],
                "duration": music_info.get("duration", 30),
                "public_url": music_info.get("preview_url"),
                "cover_url": music_info.get("cover"),
                "uses_count": music_info.get("uses", 0),
                "privacy": "public",
                "is_system_music": True,
                "source": music_info.get("source", "iTunes API"),
                "created_at": music_info.get("created_at", datetime.utcnow().isoformat()),
                "category": music_info.get("category"),
                "genre": music_info.get("genre"),
                "uploader": None  # System music has no uploader
            }
            
            return {
                "success": True,
                "audio": audio_response
            }
        
        # If neither user audio nor system music found
        print(f"❌ Audio not found in user audio or system music: {audio_id}")
        raise HTTPException(status_code=404, detail="Audio not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting audio details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting audio details: {str(e)}")

@api_router.get("/audio/search")
async def search_user_audio(
    query: str,
    limit: int = 20,
    include_private: bool = False,
    current_user: UserResponse = Depends(get_current_user)
):
    """Buscar en audios de usuarios"""
    try:
        if not query.strip():
            return {
                "success": False,
                "message": "Search query is required",
                "audios": []
            }
        
        # Construir filtro de búsqueda
        search_regex = {"$regex": query.strip(), "$options": "i"}
        filter_query = {
            "is_active": True,
            "is_processed": True,
            "$or": [
                {"title": search_regex},
                {"artist": search_regex}
            ]
        }
        
        # Si no se incluyen privados, solo buscar públicos o del usuario actual
        if not include_private:
            filter_query["$and"] = [
                {
                    "$or": [
                        {"privacy": AudioPrivacy.PUBLIC},
                        {"uploader_id": current_user.id}
                    ]
                }
            ]
        else:
            # Si se incluyen privados, solo los del usuario actual
            filter_query["uploader_id"] = current_user.id
        
        # Buscar audios
        user_audios = await db.user_audio.find(filter_query) \
            .sort("uses_count", -1) \
            .limit(limit) \
            .to_list(limit)
        
        # Preparar respuesta
        audio_responses = []
        for audio_data in user_audios:
            # Obtener información del uploader
            uploader = await db.users.find_one({"id": audio_data["uploader_id"]})
            if uploader:
                uploader_response = UserResponse(**uploader)
                
                audio_response = UserAudioResponse(
                    **audio_data,
                    uploader=uploader_response,
                    url=audio_data["public_url"],
                    preview_url=audio_data["public_url"],
                    uses=audio_data["uses_count"]
                )
                audio_responses.append(audio_response.dict())
        
        return {
            "success": True,
            "message": f"Found {len(audio_responses)} audio tracks for '{query}'",
            "audios": audio_responses,
            "query": query,
            "total": len(audio_responses)
        }
        
    except Exception as e:
        logger.error(f"Error searching user audio: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching audio: {str(e)}")

@api_router.get("/audio/{audio_id}/posts")
async def get_posts_using_audio(
    audio_id: str,
    limit: int = 20,
    offset: int = 0,
    current_user: UserResponse = Depends(get_current_user)
):
    """Obtener todos los posts que usan un audio específico"""
    try:
        logger.info(f"🎵 Buscando posts para audio ID: {audio_id}")
        
        # Verificar que el audio existe
        audio_exists = False
        audio_source = None
        
        # Primero verificar si es audio de usuario
        user_audio = await db.user_audio.find_one({"id": audio_id})
        if user_audio:
            audio_exists = True
            audio_source = "user_audio"
            logger.info(f"✅ Audio encontrado en user_audio: {audio_id}")
        else:
            # Verificar si es música del sistema
            try:
                music_info = await get_music_info(audio_id)
                if music_info:
                    audio_exists = True
                    audio_source = "system_music"
                    logger.info(f"✅ Audio encontrado en sistema de música: {audio_id}")
            except:
                pass
        
        if not audio_exists:
            logger.error(f"❌ Audio no encontrado: {audio_id}")
            raise HTTPException(status_code=404, detail="Audio not found")
        
        # Buscar posts que usan este audio con múltiples estrategias
        all_polls = []
        
        # Estrategia 1: Buscar por music_id directo
        logger.info(f"🔍 Buscando posts con music_id = {audio_id}")
        polls_filter = {"music_id": audio_id}
        direct_polls = await db.polls.find(polls_filter).to_list(1000)
        logger.info(f"📊 Posts encontrados por music_id directo: {len(direct_polls)}")
        all_polls.extend(direct_polls)
        
        # Estrategia 2: Buscar por music.id en el objeto music embebido
        logger.info(f"🔍 Buscando posts con music.id = {audio_id}")
        music_nested_filter = {"music.id": audio_id}
        nested_polls = await db.polls.find(music_nested_filter).to_list(1000)
        logger.info(f"📊 Posts encontrados por music.id embebido: {len(nested_polls)}")
        
        # Evitar duplicados
        existing_ids = {poll["id"] for poll in all_polls}
        for poll in nested_polls:
            if poll["id"] not in existing_ids:
                all_polls.append(poll)
        
        # Estrategia 3: Para audio de usuario, buscar en user_audio_use
        if audio_source == "user_audio":
            logger.info(f"🔍 Buscando en user_audio_use para audio de usuario: {audio_id}")
            audio_uses_filter = {"audio_id": audio_id}
            audio_uses = await db.user_audio_use.find(audio_uses_filter).to_list(1000)
            logger.info(f"📊 Usos de audio encontrados: {len(audio_uses)}")
            
            # Obtener poll IDs de los uses
            poll_ids_from_uses = [use["poll_id"] for use in audio_uses if use.get("poll_id")]
            logger.info(f"📊 Poll IDs de usos de audio: {len(poll_ids_from_uses)}")
            
            if poll_ids_from_uses:
                use_polls = await db.polls.find({"id": {"$in": poll_ids_from_uses}}).to_list(1000)
                logger.info(f"📊 Posts encontrados por usos de audio: {len(use_polls)}")
                
                # Evitar duplicados
                for poll in use_polls:
                    if poll["id"] not in existing_ids:
                        all_polls.append(poll)
                        existing_ids.add(poll["id"])
        
        # Ordenar por fecha de creación (más reciente primero) y aplicar paginación
        all_polls.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        total = len(all_polls)
        polls = all_polls[offset:offset + limit]
        
        logger.info(f"📊 Total posts encontrados: {total}, mostrando: {len(polls)}")
        
        if not polls:
            logger.info(f"⚠️ No se encontraron posts usando el audio: {audio_id}")
            return {
                "success": True,
                "audio_id": audio_id,
                "posts": [],
                "total": 0,
                "limit": limit,
                "offset": offset,
                "has_more": False,
                "message": "No posts found using this audio"
            }
        
        # Obtener información de autores
        author_ids = list(set(poll["author_id"] for poll in polls))
        authors = await db.users.find({"id": {"$in": author_ids}}).to_list(len(author_ids))
        authors_dict = {author["id"]: UserResponse(**author) for author in authors}
        
        # Construir respuesta de polls
        poll_responses = []
        for poll_data in polls:
            # Procesar opciones
            options = []
            if poll_data.get("options"):
                for option in poll_data["options"]:
                    # Obtener información del usuario de la opción
                    option_user = authors_dict.get(option.get("user_id"))
                    
                    # Obtener thumbnail si es necesario
                    media_url = option.get("media_url")
                    thumbnail_url = option.get("thumbnail_url")
                    
                    if media_url and not thumbnail_url and option.get("media_type") == "video":
                        thumbnail_url = get_thumbnail_for_media_url(media_url)
                    
                    option_dict = {
                        "id": option.get("id", str(uuid.uuid4())),
                        "text": option.get("text", ""),
                        "votes": option.get("votes", 0),
                        "user": option_user.dict() if option_user else None,
                        "mentioned_users": option.get("mentioned_users", []),
                        "media": {
                            "type": option.get("media_type"),
                            "url": media_url,
                            "thumbnail": thumbnail_url or media_url
                        } if media_url else None
                    }
                    options.append(option_dict)
            
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
                music=music_info,
                user_vote=None,  # Se puede mejorar para incluir el voto del usuario actual
                user_liked=False,  # Se puede mejorar para incluir si le dio like
                created_at=poll_data["created_at"],
                mentioned_users=poll_data.get("mentioned_users", []),
                tags=poll_data.get("tags", []),
                category=poll_data.get("category"),
                is_featured=poll_data.get("is_featured", False)
            )
            poll_responses.append(poll_response.dict())
        
        # Contar total de posts que usan este audio
        total_polls = await db.polls.count_documents(polls_filter)
        total_uses = len(audio_uses)
        total = max(total_polls, total_uses)
        
        return {
            "success": True,
            "audio_id": audio_id,
            "posts": poll_responses,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total,
            "message": f"Found {len(poll_responses)} posts using this audio"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting posts using audio {audio_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting posts: {str(e)}")

# =============  ENHANCED MUSIC LIBRARY WITH USER AUDIO =============

@api_router.get("/music/combined-library")
async def get_combined_music_library(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Obtener biblioteca de música combinada:
    - Música estática del sistema
    - Audios públicos de usuarios  
    - Audios privados del usuario actual
    """
    try:
        all_music = []
        
        # 1. Obtener música estática del sistema (usando endpoint existente)
        system_music_response = await get_music_library(
            category=category,
            search=search,
            limit=25,  # Limitar para hacer espacio a user audio
            offset=0
        )
        system_music = system_music_response.get("music", [])
        
        # 2. Obtener audios de usuarios (públicos + privados del usuario)
        user_audio_filter = {
            "is_active": True,
            "is_processed": True,
            "$or": [
                {"privacy": AudioPrivacy.PUBLIC},
                {"uploader_id": current_user.id}
            ]
        }
        
        if search:
            search_regex = {"$regex": search.strip(), "$options": "i"}
            user_audio_filter["$and"] = [
                user_audio_filter.get("$and", [{}])[0] if user_audio_filter.get("$and") else {},
                {
                    "$or": [
                        {"title": search_regex},
                        {"artist": search_regex}
                    ]
                }
            ]
        
        user_audios = await db.user_audio.find(user_audio_filter) \
            .sort("uses_count", -1) \
            .limit(25) \
            .to_list(25)
        
        # Convertir user audios al formato de música del sistema
        for audio_data in user_audios:
            uploader = await db.users.find_one({"id": audio_data["uploader_id"]})
            if uploader:
                # Formato compatible con el sistema de música existente
                music_item = {
                    'id': f"user_audio_{audio_data['id']}",  # Prefijo para identificar que es user audio
                    'title': audio_data['title'],
                    'artist': audio_data['artist'],
                    'duration': audio_data['duration'],
                    'url': audio_data['public_url'],
                    'preview_url': audio_data['public_url'],
                    'cover': audio_data.get('cover_url', '/images/default-audio-cover.png'),
                    'category': 'User Audio',
                    'isOriginal': True,  # Marca que es audio subido por usuarios
                    'isTrending': audio_data['uses_count'] > 100,
                    'uses': audio_data['uses_count'],
                    'waveform': audio_data['waveform'],
                    'source': 'User Upload',
                    'uploader': {
                        'id': uploader['id'],
                        'username': uploader['username'],
                        'display_name': uploader['display_name']
                    },
                    'privacy': audio_data['privacy'],
                    'created_at': audio_data['created_at'].isoformat() if audio_data.get('created_at') else None
                }
                all_music.append(music_item)
        
        # 3. Combinar y ordenar toda la música
        all_music.extend(system_music)
        
        # 4. Aplicar filtros adicionales si es necesario
        if category and category != 'Todas':
            if category == 'User Audio':
                all_music = [m for m in all_music if m.get('source') == 'User Upload']
            elif category == 'System':
                all_music = [m for m in all_music if m.get('source') != 'User Upload']
            else:
                all_music = [m for m in all_music if m['category'] == category]
        
        # 5. Ordenar por popularidad (uses) y aplicar paginación
        all_music.sort(key=lambda x: x.get('uses', 0), reverse=True)
        
        total = len(all_music)
        paginated_music = all_music[offset:offset + limit]
        
        return {
            'success': True,
            'music': paginated_music,
            'total': total,
            'limit': limit,
            'offset': offset,
            'has_more': offset + limit < total,
            'categories': {
                'system_music': len([m for m in all_music if m.get('source') != 'User Upload']),
                'user_audio': len([m for m in all_music if m.get('source') == 'User Upload']),
                'total': total
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting combined music library: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting music library: {str(e)}")

# =============  AUDIO FAVORITES ENDPOINTS =============

@api_router.post("/audio/favorites", response_model=AudioFavoriteResponse)
async def add_audio_to_favorites(
    favorite_data: AudioFavoriteCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Add audio to user's favorites"""
    try:
        # Check if already favorited
        existing_favorite = await db.audio_favorites.find_one({
            "user_id": current_user.id,
            "audio_id": favorite_data.audio_id,
            "audio_type": favorite_data.audio_type
        })
        
        if existing_favorite:
            raise HTTPException(status_code=400, detail="Audio already in favorites")
        
        # Get audio details for caching
        audio_title = None
        audio_artist = None
        audio_cover_url = None
        
        if favorite_data.audio_type == "system":
            # Get system music info
            music_info = await get_music_info(favorite_data.audio_id)
            if music_info:
                audio_title = music_info.get('title')
                audio_artist = music_info.get('artist')
                audio_cover_url = music_info.get('cover')
        elif favorite_data.audio_type == "user":
            # Get user audio info
            user_audio = await db.user_audio.find_one({"id": favorite_data.audio_id})
            if user_audio:
                audio_title = user_audio.get('title')
                audio_artist = user_audio.get('artist')
                audio_cover_url = user_audio.get('cover_url')
        
        # Create favorite
        favorite = AudioFavorite(
            user_id=current_user.id,
            audio_id=favorite_data.audio_id,
            audio_type=favorite_data.audio_type,
            audio_title=audio_title,
            audio_artist=audio_artist,
            audio_cover_url=audio_cover_url
        )
        
        await db.audio_favorites.insert_one(favorite.dict())
        
        return AudioFavoriteResponse(
            id=favorite.id,
            audio_id=favorite.audio_id,
            audio_type=favorite.audio_type,
            audio_title=audio_title,
            audio_artist=audio_artist,
            audio_cover_url=audio_cover_url,
            created_at=favorite.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding audio to favorites: {str(e)}")
        raise HTTPException(status_code=500, detail="Error adding to favorites")

@api_router.delete("/audio/favorites/{audio_id}")
async def remove_audio_from_favorites(
    audio_id: str,
    audio_type: str = "system",
    current_user: UserResponse = Depends(get_current_user)
):
    """Remove audio from user's favorites"""
    try:
        result = await db.audio_favorites.delete_one({
            "user_id": current_user.id,
            "audio_id": audio_id,
            "audio_type": audio_type
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Audio not found in favorites")
        
        return {"message": "Audio removed from favorites successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing audio from favorites: {str(e)}")
        raise HTTPException(status_code=500, detail="Error removing from favorites")

@api_router.get("/audio/favorites")
async def get_user_favorites(
    limit: int = 20,
    offset: int = 0,
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's favorite audio"""
    try:
        # Get favorites from database
        favorites = await db.audio_favorites.find({
            "user_id": current_user.id
        }).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
        
        # Get total count
        total = await db.audio_favorites.count_documents({"user_id": current_user.id})
        
        # Enrich favorites with current audio details
        enriched_favorites = []
        for fav in favorites:
            favorite_response = AudioFavoriteResponse(
                id=fav["id"],
                audio_id=fav["audio_id"],
                audio_type=fav["audio_type"],
                audio_title=fav.get("audio_title"),
                audio_artist=fav.get("audio_artist"),
                audio_cover_url=fav.get("audio_cover_url"),
                created_at=fav["created_at"]
            )
            
            # Try to get current audio details
            if fav["audio_type"] == "system":
                music_info = await get_music_info(fav["audio_id"])
                if music_info:
                    favorite_response.audio_details = music_info
            elif fav["audio_type"] == "user":
                user_audio = await db.user_audio.find_one({"id": fav["audio_id"]})
                if user_audio:
                    favorite_response.audio_details = {
                        "id": user_audio["id"],
                        "title": user_audio["title"],
                        "artist": user_audio["artist"],
                        "duration": user_audio["duration"],
                        "public_url": user_audio["public_url"],
                        "cover": user_audio.get("cover_url"),
                        "source": "User Upload"
                    }
            
            enriched_favorites.append(favorite_response)
        
        return {
            "success": True,
            "favorites": enriched_favorites,
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total
        }
        
    except Exception as e:
        logger.error(f"Error getting user favorites: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting favorites")

@api_router.get("/audio/favorites/{audio_id}/check")
async def check_audio_in_favorites(
    audio_id: str,
    audio_type: str = "system",
    current_user: UserResponse = Depends(get_current_user)
):
    """Check if audio is in user's favorites"""
    try:
        favorite = await db.audio_favorites.find_one({
            "user_id": current_user.id,
            "audio_id": audio_id,
            "audio_type": audio_type
        })
        
        return {
            "is_favorite": favorite is not None,
            "favorite_id": favorite["id"] if favorite else None
        }
        
    except Exception as e:
        logger.error(f"Error checking audio in favorites: {str(e)}")
        raise HTTPException(status_code=500, detail="Error checking favorites")

# Incluir el router en la aplicación
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica los dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)