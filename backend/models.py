from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Optional, Any
from datetime import datetime, date
from enum import Enum
import uuid

class NotificationType(str, Enum):
    NEW_POLL = "new_poll"
    TRENDING = "trending"
    COMPETITION = "competition"

# User Profile - Simplified without levels/achievements
class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    total_votes: int = 0
    total_polls_created: int = 0
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# =============  AUTHENTICATION MODELS =============

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    username: str
    display_name: str
    hashed_password: Optional[str] = None  # Allow None for OAuth users
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_verified: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    # Privacy settings
    is_public: bool = True
    allow_messages: bool = True
    # OAuth fields
    oauth_provider: Optional[str] = None  # "google", "facebook", etc.
    oauth_id: Optional[str] = None
    
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    display_name: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    is_public: bool
    allow_messages: bool

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserSettings(BaseModel):
    is_public: Optional[bool] = None
    allow_messages: Optional[bool] = None

# =============  SECURITY MODELS =============

class LoginAttempt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    ip_address: str
    user_agent: str
    success: bool
    failure_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserDevice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    device_name: str
    device_type: str  # "desktop", "mobile", "tablet"
    browser: str
    os: str
    ip_address: str
    user_agent: str
    last_used: datetime = Field(default_factory=datetime.utcnow)
    is_trusted: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    device_id: Optional[str] = None
    ip_address: str
    user_agent: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class SecurityNotification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    notification_type: str  # "new_login", "password_change", "new_device"
    title: str
    message: str
    metadata: Dict[str, Any] = {}
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# =============  MESSAGING MODELS =============

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    sender_id: str
    recipient_id: str
    content: str
    message_type: str = "text"  # text, image, poll_share, etc.
    metadata: Dict[str, Any] = {}  # for attachments, poll links, etc.
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class MessageCreate(BaseModel):
    recipient_id: str
    content: str
    message_type: str = "text"
    metadata: Dict[str, Any] = {}

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participants: List[str]  # user_ids
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: Dict[str, int] = {}  # user_id -> unread count
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ConversationResponse(BaseModel):
    id: str
    participants: List[UserResponse]
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    created_at: datetime

# =============  FOLLOW MODELS =============

class Follow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    follower_id: str  # ID del usuario que sigue
    following_id: str  # ID del usuario seguido
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FollowCreate(BaseModel):
    user_id: str  # ID del usuario a seguir

class FollowResponse(BaseModel):
    id: str
    follower: UserResponse
    following: UserResponse
    created_at: datetime

class FollowStatus(BaseModel):
    is_following: bool
    follow_id: Optional[str] = None

class FollowingList(BaseModel):
    following: List[UserResponse]
    total: int

class FollowersList(BaseModel):
    followers: List[UserResponse]
    total: int

# =============  COMMENT MODELS =============

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    poll_id: str  # ID de la encuesta a la que pertenece el comentario
    user_id: str  # ID del usuario que creó el comentario
    content: str  # Contenido del comentario
    parent_comment_id: Optional[str] = None  # ID del comentario padre (para anidamiento)
    likes: int = 0  # Número de likes en el comentario
    is_edited: bool = False  # Si el comentario ha sido editado
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    # Metadata adicional
    metadata: Dict[str, Any] = {}  # Para menciones, hashtags, etc.

class CommentCreate(BaseModel):
    poll_id: str
    content: str
    parent_comment_id: Optional[str] = None

class CommentUpdate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: str
    poll_id: str
    user: UserResponse  # Información completa del usuario
    content: str
    parent_comment_id: Optional[str] = None
    likes: int = 0
    is_edited: bool = False
    created_at: datetime
    updated_at: datetime
    # Para anidamiento
    replies: List["CommentResponse"] = []  # Lista de comentarios hijos
    reply_count: int = 0  # Conteo total de respuestas anidadas
    user_liked: bool = False  # Si el usuario actual le dio like

class CommentLike(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    comment_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# =============  POLL MODELS =============

class PollOption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Usuario que creó esta opción
    text: str
    votes: int = 0
    media_type: Optional[str] = None  # "image", "video", None
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Poll(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    author_id: str  # Usuario que creó el poll
    description: Optional[str] = None
    options: List[PollOption] = []
    total_votes: int = 0
    likes: int = 0
    shares: int = 0
    comments_count: int = 0
    music_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    # Metadata
    tags: List[str] = []
    category: Optional[str] = None
    is_featured: bool = False

class PollCreate(BaseModel):
    title: str
    description: Optional[str] = None
    options: List[dict]  # [{text: str, media_url?: str, media_type?: str}]
    music_id: Optional[str] = None
    tags: List[str] = []
    category: Optional[str] = None

class PollResponse(BaseModel):
    id: str
    title: str
    author: UserResponse  # Información del autor
    description: Optional[str] = None
    options: List[dict]  # Incluirá información del usuario de cada opción
    total_votes: int
    likes: int
    shares: int
    comments_count: int
    music: Optional[dict] = None  # Información de la música
    user_vote: Optional[str] = None  # ID de la opción votada por el usuario actual
    user_liked: bool = False
    is_featured: bool
    tags: List[str]
    category: Optional[str]
    created_at: datetime
    time_ago: str  # Campo calculado como "hace 2 horas"

class Vote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    poll_id: str
    option_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VoteCreate(BaseModel):
    option_id: str

class PollLike(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    poll_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# =============  MUSIC MODELS =============

class Music(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    artist: str
    duration: int  # in seconds
    url: str
    cover_url: Optional[str] = None
    is_original: bool = False
    waveform: List[float] = []  # Visualization data
    created_at: datetime = Field(default_factory=datetime.utcnow)

# =============  FILE UPLOAD MODELS =============

class UploadType(str, Enum):
    AVATAR = "avatar"
    POLL_OPTION = "poll_option"
    POLL_BACKGROUND = "poll_background"
    GENERAL = "general"

class FileType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"

class UploadedFile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    original_filename: str
    file_type: FileType  # "image" or "video"
    file_format: str  # jpg, png, mp4, etc.
    file_size: int  # in bytes
    upload_type: UploadType
    uploader_id: str  # User who uploaded
    file_path: str  # Local file path
    public_url: str  # URL to access file
    thumbnail_url: Optional[str] = None  # Thumbnail URL for videos
    width: Optional[int] = None  # For images/videos
    height: Optional[int] = None  # For images/videos
    duration: Optional[float] = None  # For videos in seconds
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UploadResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_type: FileType
    file_format: str
    file_size: int
    public_url: str
    thumbnail_url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None
    created_at: datetime

# Necesario para resolver referencia circular
CommentResponse.model_rebuild()