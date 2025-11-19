"""
User Model
Database model for users
"""

from sqlalchemy import Column, String, Boolean, DateTime, JSON, Index
from sqlalchemy.sql import func
from datetime import datetime
import uuid

from src.db.database import Base


def generate_uuid():
    """Generate UUID as string"""
    return str(uuid.uuid4())


class User(Base):
    """User model for authentication"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # Null for OIDC-only users
    
    # Profile
    full_name = Column(String(255), nullable=True)
    organization = Column(String(255), nullable=True)
    
    # Roles and permissions
    roles = Column(JSON, default=list)  # ["technical-contact", "fedops-admin"]
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=False)  # Requires FedOps approval
    
    # Federated identity
    oidc_sub = Column(String(255), nullable=True, index=True)  # OIDC subject identifier
    oidc_provider = Column(String(50), nullable=True)  # "keycloak", "google", etc.
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime, nullable=True)
    
    # Indexes
    __table_args__ = (
        Index('ix_users_oidc', 'oidc_provider', 'oidc_sub'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "organization": self.organization,
            "roles": self.roles or [],
            "is_active": self.is_active,
            "is_superuser": self.is_superuser,
            "is_approved": self.is_approved,
            "oidc_provider": self.oidc_provider,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
