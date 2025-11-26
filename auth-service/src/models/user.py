"""
User Model - Database agnostic
Compatible with SQLite and PostgreSQL
"""

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid
import enum

Base = declarative_base()


def generate_uuid():
    """Generate UUID as string for SQLite compatibility"""
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    """User role enumeration"""
    ADMIN = "admin"
    TECHNICAL_CONTACT = "technical_contact"


class User(Base):
    """User model compatible with both SQLite and PostgreSQL"""
    __tablename__ = "users"
    
    # Primary key - string UUID for SQLite, can be upgraded to native UUID for PostgreSQL
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # Authentication
    username = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Null for OAuth users
    
    # Profile
    full_name = Column(String(255), nullable=True)
    organization = Column(String(255), nullable=True)
    
    # Authorization - using string instead of enum for database portability
    role = Column(String(50), nullable=False, default="technical_contact")  # 'admin', 'technical_contact'
    is_approved = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    is_superuser = Column(Boolean, nullable=False, default=False)
    
    # Federated identity (OAuth/OIDC)
    oidc_sub = Column(String(255), nullable=True, index=True)
    oidc_provider = Column(String(50), nullable=True)  # 'github', 'keycloak', etc.
    
    # Timestamps
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin role"""
        return self.role == "admin"
    
    @property
    def is_technical_contact(self) -> bool:
        """Check if user is an approved technical contact"""
        return self.role == "technical_contact" and self.is_approved
    
    @property
    def is_pending(self) -> bool:
        """Check if user is pending approval"""
        return not self.is_approved
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "organization": self.organization,
            "role": self.role,
            "is_active": self.is_active,
            "is_superuser": self.is_superuser,
            "is_approved": self.is_approved,
            "oidc_provider": self.oidc_provider,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }


class Session(Base):
    """Session model for refresh tokens"""
    __tablename__ = "sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)  # Foreign key as string
    
    refresh_token = Column(String(512), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    
    # Session metadata
    user_agent = Column(String(512), nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Session(id={self.id}, user_id={self.user_id})>"
