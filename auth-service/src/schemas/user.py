"""
User Schemas
Pydantic models for user management
"""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from src.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema"""
    username: str = Field(..., min_length=3, max_length=255)
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=255)
    organization: Optional[str] = Field(None, max_length=255)


class UserCreate(UserBase):
    """Schema for creating a user"""
    password: Optional[str] = Field(None, min_length=8, max_length=255)
    role: UserRole = Field(default=UserRole.TECHNICAL_CONTACT)
    is_active: bool = True
    is_approved: bool = False  # Requires admin approval
    oidc_provider: Optional[str] = None  # For OIDC users
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Validate password strength (if provided)"""
        # Allow empty/None password for OIDC users
        if v is None or v == '':
            return v
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class UserUpdate(BaseModel):
    """Schema for updating a user"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    organization: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_approved: Optional[bool] = None
    is_superuser: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response"""
    id: str
    role: UserRole
    is_active: bool
    is_superuser: bool
    is_approved: bool
    oidc_provider: Optional[str] = None
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserProfile(BaseModel):
    """Public user profile"""
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    organization: Optional[str] = None
    role: UserRole
    
    class Config:
        from_attributes = True
