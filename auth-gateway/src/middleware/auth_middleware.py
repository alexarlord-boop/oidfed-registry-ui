"""
Authentication Middleware
JWT validation and user context injection
"""

from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from src.services.jwt_service import jwt_service
from src.services.user_service import user_service
from src.db.database import get_db
from src.models.user import User

security = HTTPBearer(auto_error=False)


class AuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract and validate JWT tokens
    Adds user context to request state
    """
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth for public endpoints
        public_paths = [
            "/",
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/auth/token",
            "/auth/authorize",
            "/auth/callback",
            "/.well-known/openid-configuration",
            "/.well-known/jwks.json",
        ]
        
        if request.url.path in public_paths or request.url.path.startswith("/docs"):
            return await call_next(request)
        
        # Extract token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
            try:
                # Decode and validate token
                payload = jwt_service.decode_token(token)
                request.state.user_id = payload["sub"]
                request.state.user_email = payload["email"]
                request.state.user_roles = payload.get("roles", [])
            except Exception as e:
                # Token invalid but continue - specific endpoints will enforce auth
                pass
        
        response = await call_next(request)
        return response


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency to get current authenticated user
    Raises 401 if not authenticated
    """
    user_id = getattr(request.state, "user_id", None)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )
    
    return user


async def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency to require admin role
    Raises 403 if not admin
    """
    if not current_user.is_superuser and "fedops-admin" not in (current_user.roles or []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required",
        )
    
    return current_user
