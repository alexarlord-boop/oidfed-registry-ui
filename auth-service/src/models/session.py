"""
Session Model
Refresh tokens and session management
"""

from sqlalchemy import Column, String, DateTime, Index
from sqlalchemy.orm import declarative_base
from datetime import datetime, timedelta
import uuid

# Import Base from user model to avoid circular imports
from src.models.user import Base, generate_uuid


class Session(Base):
    """Session model for refresh tokens"""
    __tablename__ = "sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)  # Foreign key as string
    refresh_token = Column(String(512), unique=True, nullable=False, index=True)
    
    # Session info
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Client info
    user_agent = Column(String(512), nullable=True)
    ip_address = Column(String(45), nullable=True)
    
    def is_expired(self) -> bool:
        """Check if session is expired"""
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "expires_at": self.expires_at.isoformat(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "user_agent": self.user_agent,
            "ip_address": self.ip_address,
        }
