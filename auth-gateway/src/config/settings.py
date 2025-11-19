"""
Application Settings
Pydantic settings with environment variable loading
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    # Application
    APP_NAME: str = "OIDFED Auth Gateway"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://oidfed:oidfed@localhost:5432/oidfed_auth"
    
    # JWT Configuration
    JWT_ALGORITHM: str = "RS256"
    JWT_PRIVATE_KEY_PATH: str = "./src/config/keys/private_key.pem"
    JWT_PUBLIC_KEY_PATH: str = "./src/config/keys/public_key.pem"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_ISSUER: str = "http://localhost:9000"
    JWT_AUDIENCE: str = "admin-api"
    
    # Admin API
    ADMIN_API_URL: str = "http://localhost:8765"
    
    # Keycloak OIDC
    KEYCLOAK_ENABLED: bool = False
    KEYCLOAK_ISSUER: str = ""
    KEYCLOAK_CLIENT_ID: str = ""
    KEYCLOAK_CLIENT_SECRET: str = ""
    KEYCLOAK_REDIRECT_URI: str = ""
    KEYCLOAK_AUTHORIZATION_ENDPOINT: str = ""
    KEYCLOAK_TOKEN_ENDPOINT: str = ""
    KEYCLOAK_USERINFO_ENDPOINT: str = ""
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Security
    SECRET_KEY: str = "change-this-secret-key-in-production"
    SESSION_SECRET: str = "change-this-session-secret"
    
    # Frontend Client
    FRONTEND_CLIENT_ID: str = "oidfed-registry-ui"
    FRONTEND_REDIRECT_URI: str = "http://localhost:3000/auth/callback"
    
    @property
    def private_key(self) -> str:
        """Load private key from file"""
        with open(self.JWT_PRIVATE_KEY_PATH, "r") as f:
            return f.read()
    
    @property
    def public_key(self) -> str:
        """Load public key from file"""
        with open(self.JWT_PUBLIC_KEY_PATH, "r") as f:
            return f.read()


# Global settings instance
settings = Settings()
