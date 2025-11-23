"""
User Service
Business logic for user management
"""

from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from src.models.user import User
from src.schemas.user import UserCreate, UserUpdate
from src.services.password_service import password_service


class UserService:
    """Service for user operations"""
    
    @staticmethod
    async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
        """Create a new user"""
        # Hash password only if provided (OIDC users don't have passwords)
        password_hash = None
        if user_data.password:
            password_hash = password_service.hash_password(user_data.password)
        
        # Create user
        user = User(
            username=user_data.username,
            email=user_data.email,
            password_hash=password_hash,
            full_name=user_data.full_name,
            organization=user_data.organization,
            is_active=user_data.is_active,
            is_approved=user_data.is_approved,
            role=user_data.role,  # Single role field (not plural)
            oidc_provider=user_data.oidc_provider if hasattr(user_data, 'oidc_provider') else None,
        )
        
        db.add(user)
        await db.flush()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
        """Get user by ID"""
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
        """Get user by username"""
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email"""
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_by_oidc(
        db: AsyncSession,
        oidc_provider: str,
        oidc_sub: str
    ) -> Optional[User]:
        """Get user by OIDC provider and subject"""
        result = await db.execute(
            select(User).where(
                User.oidc_provider == oidc_provider,
                User.oidc_sub == oidc_sub
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_users(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """Get all users"""
        result = await db.execute(
            select(User).offset(skip).limit(limit)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def update_user(
        db: AsyncSession,
        user: User,
        user_data: UserUpdate
    ) -> User:
        """Update user"""
        update_data = user_data.model_dump(exclude_unset=True)
        
        # Hash password if provided
        if "password" in update_data:
            update_data["password_hash"] = password_service.hash_password(
                update_data.pop("password")
            )
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        await db.flush()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    async def delete_user(db: AsyncSession, user: User) -> None:
        """Delete user"""
        await db.delete(user)
        await db.flush()
    
    @staticmethod
    async def verify_password(user: User, password: str) -> bool:
        """Verify user password"""
        if not user.password_hash:
            return False
        return password_service.verify_password(password, user.password_hash)
    
    @staticmethod
    async def update_last_login(db: AsyncSession, user: User) -> None:
        """Update user's last login timestamp"""
        user.last_login = datetime.utcnow()
        await db.flush()
    
    @staticmethod
    async def link_oidc_identity(
        db: AsyncSession,
        user: User,
        oidc_provider: str,
        oidc_sub: str
    ) -> User:
        """Link OIDC identity to user"""
        user.oidc_provider = oidc_provider
        user.oidc_sub = oidc_sub
        await db.flush()
        await db.refresh(user)
        return user


# Global service instance
user_service = UserService()
