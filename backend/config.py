"""
Centralized configuration management for the social media application
✅ Configuración automática de entorno para proyectos Emergent.sh
"""
import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv
from env_detector import get_config_value, get_environment_detector

# Load environment variables
load_dotenv()

class Config:
    """Application configuration with automatic environment detection"""
    
    # Database Configuration - Detección automática
    @property
    def MONGO_URL(self) -> str:
        return get_config_value("MONGO_URL", "mongodb://localhost:27017")
    
    @property 
    def DB_NAME(self) -> str:
        return get_config_value("DB_NAME", "social_media_app")
    
    # Security Configuration - Con detección automática para SECRET_KEY
    @property
    def SECRET_KEY(self) -> str:
        return get_config_value("SECRET_KEY", "fallback-secret-key-for-development-only")
    
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    # Server Configuration
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8001"))
    
    # File Upload Configuration
    UPLOAD_BASE_DIR: Path = Path(os.getenv("UPLOAD_BASE_DIR", "/app/backend/uploads"))
    UPLOAD_MAX_SIZE: int = int(os.getenv("UPLOAD_MAX_SIZE", "10485760"))  # 10MB
    AVATAR_MAX_SIZE: int = int(os.getenv("AVATAR_MAX_SIZE", "5242880"))   # 5MB
    VIDEO_MAX_SIZE: int = int(os.getenv("VIDEO_MAX_SIZE", "52428800"))    # 50MB
    IMAGE_MAX_SIZE: int = int(os.getenv("IMAGE_MAX_SIZE", "10485760"))    # 10MB
    
    UPLOAD_ALLOWED_EXTENSIONS: List[str] = os.getenv(
        "UPLOAD_ALLOWED_EXTENSIONS", 
        "jpg,jpeg,png,gif,mp4,mov,avi"
    ).split(",")
    
    # Upload subdirectories
    UPLOAD_SUBDIRS: List[str] = ["avatars", "poll_options", "poll_backgrounds", "general"]
    
    # Frontend Configuration - Detección automática
    @property
    def FRONTEND_URL(self) -> str:
        return get_config_value("FRONTEND_URL", "http://localhost:3000")
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        origins_str = get_config_value("CORS_ORIGINS", "http://localhost:3000")
        return origins_str.split(",")
    
    # Session Configuration
    REFRESH_INTERVAL_MINUTES: int = int(os.getenv("REFRESH_INTERVAL_MINUTES", "60"))
    BEHAVIOR_TRACKING_INTERVAL_SECONDS: int = int(os.getenv("BEHAVIOR_TRACKING_INTERVAL_SECONDS", "30"))
    UI_TIMEOUT_SECONDS: int = int(os.getenv("UI_TIMEOUT_SECONDS", "5"))
    
    # Social Media Defaults
    DEFAULT_AVATAR_URL: str = os.getenv(
        "DEFAULT_AVATAR_URL", 
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face"
    )
    PLACEHOLDER_VIDEO_URL: str = os.getenv(
        "PLACEHOLDER_VIDEO_URL",
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    )
    
    # HTTP Status Codes
    class StatusCodes:
        SUCCESS = 200
        CREATED = 201
        BAD_REQUEST = 400
        UNAUTHORIZED = 401
        FORBIDDEN = 403
        NOT_FOUND = 404
        CONFLICT = 409
        UNPROCESSABLE_ENTITY = 422
        INTERNAL_SERVER_ERROR = 500
    
    # API Configuration
    API_PREFIX = "/api"
    API_VERSION = "v1"
    
    # Pagination defaults
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    # Social features defaults
    MAX_COMMENT_LENGTH = 500
    MAX_POLL_OPTIONS = 4
    MAX_POLL_TITLE_LENGTH = 200
    MIN_POLL_TITLE_LENGTH = 10
    
    # Media configuration
    SUPPORTED_IMAGE_FORMATS = ["jpg", "jpeg", "png", "gif", "webp"]
    SUPPORTED_VIDEO_FORMATS = ["mp4", "mov", "avi", "webm"]
    
    # Validation rules
    MIN_USERNAME_LENGTH = 3
    MAX_USERNAME_LENGTH = 30
    MIN_PASSWORD_LENGTH = 8
    MAX_BIO_LENGTH = 160
    
    # Search Configuration
    SEARCH_CONFIG = {
        # Search limits and pagination
        'DEFAULT_SEARCH_LIMIT': int(os.getenv("SEARCH_DEFAULT_LIMIT", "20")),
        'MAX_SEARCH_LIMIT': int(os.getenv("SEARCH_MAX_LIMIT", "100")),
        'DEFAULT_AUTOCOMPLETE_LIMIT': int(os.getenv("AUTOCOMPLETE_DEFAULT_LIMIT", "10")),
        'MAX_AUTOCOMPLETE_LIMIT': int(os.getenv("AUTOCOMPLETE_MAX_LIMIT", "25")),
        
        # Search validation
        'MIN_QUERY_LENGTH': int(os.getenv("SEARCH_MIN_QUERY_LENGTH", "1")),
        'MAX_QUERY_LENGTH': int(os.getenv("SEARCH_MAX_QUERY_LENGTH", "100")),
        'MIN_AUTOCOMPLETE_LENGTH': int(os.getenv("SEARCH_MIN_AUTOCOMPLETE_LENGTH", "2")),
        
        # Relevance scoring thresholds
        'MIN_RELEVANCE_SCORE': float(os.getenv("SEARCH_MIN_RELEVANCE_SCORE", "0.2")),
        'HIGH_RELEVANCE_THRESHOLD': float(os.getenv("SEARCH_HIGH_RELEVANCE_THRESHOLD", "0.8")),
        'MEDIUM_RELEVANCE_THRESHOLD': float(os.getenv("SEARCH_MEDIUM_RELEVANCE_THRESHOLD", "0.5")),
        
        # Search multipliers for different types
        'MULTIPLIERS': {
            'EXACT_MATCH': float(os.getenv("SEARCH_EXACT_MATCH_MULTIPLIER", "2.0")),
            'USERNAME_MATCH': float(os.getenv("SEARCH_USERNAME_MULTIPLIER", "1.5")),
            'DISPLAY_NAME_MATCH': float(os.getenv("SEARCH_DISPLAY_NAME_MULTIPLIER", "1.2")),
            'BIO_MATCH': float(os.getenv("SEARCH_BIO_MULTIPLIER", "0.5")),
            'CONTENT_MATCH': float(os.getenv("SEARCH_CONTENT_MULTIPLIER", "1.0")),
            'TITLE_MATCH': float(os.getenv("SEARCH_TITLE_MULTIPLIER", "1.3")),
            'HASHTAG_MATCH': float(os.getenv("SEARCH_HASHTAG_MULTIPLIER", "1.1")),
        },
        
        # Time-based search configuration
        'TRENDING_DAYS': int(os.getenv("SEARCH_TRENDING_DAYS", "7")),
        'RECENT_DAYS': int(os.getenv("SEARCH_RECENT_DAYS", "30")),
        
        # Cache configuration
        'ENABLE_SEARCH_CACHE': os.getenv("SEARCH_ENABLE_CACHE", "true").lower() == "true",
        'CACHE_TTL_SECONDS': int(os.getenv("SEARCH_CACHE_TTL", "300")),  # 5 minutes
        
        # Performance limits
        'MAX_FUZZY_RESULTS': int(os.getenv("SEARCH_MAX_FUZZY_RESULTS", "50")),
        'FUZZY_SEARCH_MULTIPLIER': int(os.getenv("SEARCH_FUZZY_MULTIPLIER", "2")),
        
        # Sort options
        'DEFAULT_SORT': os.getenv("SEARCH_DEFAULT_SORT", "relevance"),
        'AVAILABLE_SORTS': ["relevance", "popularity", "recent"],
        
        # Filter options
        'DEFAULT_FILTER': os.getenv("SEARCH_DEFAULT_FILTER", "all"),
        'AVAILABLE_FILTERS': ["all", "users", "posts", "hashtags", "sounds"],
    }
    
    @classmethod
    def create_upload_directories(cls):
        """Create upload directories if they don't exist"""
        cls.UPLOAD_BASE_DIR.mkdir(exist_ok=True)
        for subdir in cls.UPLOAD_SUBDIRS:
            (cls.UPLOAD_BASE_DIR / subdir).mkdir(exist_ok=True)

    @classmethod
    def initialize_environment(cls):
        """Inicializa el sistema de detección automática de entorno"""
        print("🚀 Inicializando configuración automática de entorno (Backend)...")
        detector = get_environment_detector()
        print("✅ Backend: Configuración de entorno inicializada")
        return detector

# Global config instance
config = Config()