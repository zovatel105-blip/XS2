from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Optional, Any
from datetime import datetime, date, timedelta
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
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    occupation: Optional[str] = None  # Field for user's profession/job
    is_verified: bool = False
    total_votes: int = 0
    total_polls_created: int = 0
    followers_count: int = 0
    following_count: int = 0
    likes_count: int = 0  # Likes received on user's content
    votes_count: int = 0  # Votes made by this user
    likes_given: int = 0  # Likes given by this user
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
    occupation: Optional[str] = None  # Field for user's profession/job
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
    occupation: Optional[str] = None  # Field for user's profession/job
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
    occupation: Optional[str] = None
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

# =============  STORY MODELS =============

class StoryType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    TEXT = "text"

class StoryPrivacy(str, Enum):
    PUBLIC = "public"
    FOLLOWERS = "followers"
    CLOSE_FRIENDS = "close_friends"

class Story(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    content_url: Optional[str] = None  # URL to image/video
    text_content: Optional[str] = None  # For text-only stories
    story_type: StoryType
    privacy: StoryPrivacy = StoryPrivacy.PUBLIC
    background_color: Optional[str] = "#000000"  # For text stories
    text_color: Optional[str] = "#FFFFFF"  # For text stories
    font_style: Optional[str] = "default"
    duration: int = 15  # Duration in seconds (default 15)
    views_count: int = 0
    likes_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=24))
    is_active: bool = True

class StoryCreate(BaseModel):
    content_url: Optional[str] = None
    text_content: Optional[str] = None
    story_type: StoryType
    privacy: StoryPrivacy = StoryPrivacy.PUBLIC
    background_color: Optional[str] = "#000000"
    text_color: Optional[str] = "#FFFFFF"
    font_style: Optional[str] = "default"
    duration: Optional[int] = 15

class StoryResponse(BaseModel):
    id: str
    user_id: str
    username: str
    display_name: str
    avatar_url: Optional[str]
    content_url: Optional[str]
    text_content: Optional[str]
    story_type: StoryType
    privacy: StoryPrivacy
    background_color: Optional[str]
    text_color: Optional[str]
    font_style: Optional[str]
    duration: int
    views_count: int
    likes_count: int
    created_at: datetime
    expires_at: datetime
    is_viewed: bool = False  # Whether current user has viewed this story
    is_liked: bool = False   # Whether current user has liked this story

class StoryView(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    story_id: str
    user_id: str
    viewed_at: datetime = Field(default_factory=datetime.utcnow)

class StoryLike(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    story_id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class StoryViewCreate(BaseModel):
    story_id: str

class StoryLikeCreate(BaseModel):
    story_id: str

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
    text: Optional[str] = ""  # Texto opcional para la opción
    votes: int = 0
    media_type: Optional[str] = None  # "image", "video", None
    media_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    mentioned_users: List[str] = []  # List of user IDs mentioned in this option
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
    # New fields for enhanced functionality
    mentioned_users: List[str] = []  # List of user IDs mentioned in the poll
    video_playback_settings: Optional[dict] = None  # Video playback configuration
    layout: Optional[str] = None  # Layout configuration (e.g., 'grid-3x2', 'vertical', etc.)

class PollCreate(BaseModel):
    title: str
    description: Optional[str] = None
    options: List[dict]  # [{text: str, media_url?: str, media_type?: str}]
    music_id: Optional[str] = None
    tags: List[str] = []
    category: Optional[str] = None
    # New fields for enhanced functionality
    mentioned_users: List[str] = []  # List of user IDs mentioned in the poll
    video_playback_settings: Optional[dict] = None  # Video playback configuration
    layout: Optional[str] = None  # Layout configuration (e.g., 'grid-3x2', 'vertical', etc.)

class PollResponse(BaseModel):
    id: str
    title: str
    author: Optional[UserResponse] = None  # Hacer opcional para manejar casos sin autor
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
    mentioned_users: List[str] = []  # List of user IDs mentioned in the poll
    layout: Optional[str] = None  # Layout configuration
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
    AUDIO = "audio"  # Nuevo tipo para archivos de audio

class FileType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"  # Nuevo tipo para archivos de audio

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

# =============  USER AUDIO MODELS =============

class AudioPrivacy(str, Enum):
    PRIVATE = "private"  # Solo el usuario puede usar este audio
    PUBLIC = "public"    # Otros usuarios pueden descubrir y usar este audio

class UserAudio(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str  # Título del audio (editable por usuario)
    artist: str = ""  # Artista/Creador (defaults to username)
    original_filename: str  # Nombre del archivo original
    filename: str  # Nombre del archivo en el servidor
    file_format: str  # mp3, m4a, wav, aac
    file_size: int  # Tamaño en bytes
    duration: int  # Duración en segundos (máx 60)
    uploader_id: str  # ID del usuario que subió el audio
    file_path: str  # Ruta local del archivo
    public_url: str  # URL pública para acceder al audio
    waveform: List[float] = []  # Datos de visualización de onda
    cover_url: Optional[str] = None  # URL de la imagen de portada (opcional)
    privacy: AudioPrivacy = AudioPrivacy.PRIVATE  # Privacidad del audio
    uses_count: int = 0  # Número de veces que se ha usado en posts
    is_original: bool = True  # Siempre True para audio subido por usuarios
    category: str = "User Audio"  # Categoría fija
    # Metadatos del archivo
    bitrate: Optional[int] = None  # Bitrate del audio
    sample_rate: Optional[int] = None  # Frecuencia de muestreo
    # Control de estado
    is_active: bool = True  # Si el audio está activo
    is_processed: bool = False  # Si el audio ha sido procesado
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserAudioCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    artist: Optional[str] = Field(None, max_length=100)
    privacy: AudioPrivacy = AudioPrivacy.PRIVATE
    cover_url: Optional[str] = None

class UserAudioUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    artist: Optional[str] = Field(None, max_length=100)
    privacy: Optional[AudioPrivacy] = None
    cover_url: Optional[str] = None

class UserAudioResponse(BaseModel):
    id: str
    title: str
    artist: str
    duration: int
    public_url: str
    waveform: List[float]
    cover_url: Optional[str]
    privacy: AudioPrivacy
    uses_count: int
    is_original: bool
    category: str
    file_format: str
    file_size: int
    uploader: UserResponse  # Información del usuario que subió
    created_at: datetime
    # Para compatibilidad con sistema de música existente
    url: str = ""  # Será igual a public_url
    preview_url: str = ""  # Será igual a public_url
    isTrending: bool = False
    uses: int = 0  # Será igual a uses_count

class UserAudioUse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    audio_id: str  # ID del audio usado
    user_id: str  # ID del usuario que usó el audio
    poll_id: Optional[str] = None  # ID del poll donde se usó (si aplica)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# =============  AUDIO FAVORITES MODELS =============

class AudioFavorite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Usuario que marcó como favorito
    audio_id: str  # ID del audio favorito
    audio_type: str = "system"  # "system" para música del sistema, "user" para audio de usuario
    audio_title: Optional[str] = None  # Cached title for display
    audio_artist: Optional[str] = None  # Cached artist for display  
    audio_cover_url: Optional[str] = None  # Cached cover for display
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AudioFavoriteCreate(BaseModel):
    audio_id: str
    audio_type: str = "system"  # "system" o "user"

class AudioFavoriteResponse(BaseModel):
    id: str
    audio_id: str
    audio_type: str
    audio_title: Optional[str] = None
    audio_artist: Optional[str] = None
    audio_cover_url: Optional[str] = None
    created_at: datetime
    # Información completa del audio cuando esté disponible
    audio_details: Optional[Dict[str, Any]] = None

# Necesario para resolver referencia circular
CommentResponse.model_rebuild()