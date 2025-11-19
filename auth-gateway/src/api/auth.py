"""
Authentication API Routes
OAuth 2.0 and OIDC endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Form, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime, timedelta
import secrets

from src.db.database import get_db
from src.schemas.auth import TokenResponse, ErrorResponse, UserInfoResponse
from src.services.jwt_service import jwt_service
from src.services.user_service import user_service
from src.services.oidc_service import oidc_service
from src.models.session import Session
from src.models.user import User

router = APIRouter()

# In-memory storage for authorization states (replace with Redis in production)
authorization_states = {}


@router.post("/token", response_model=TokenResponse)
async def token_endpoint(
    grant_type: str = Form(...),
    username: Optional[str] = Form(None),
    password: Optional[str] = Form(None),
    code: Optional[str] = Form(None),
    redirect_uri: Optional[str] = Form(None),
    client_id: Optional[str] = Form(None),
    code_verifier: Optional[str] = Form(None),
    refresh_token: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    OAuth 2.0 Token Endpoint
    Supports grant types: password, authorization_code, refresh_token
    """
    
    # Grant Type: password (local authentication)
    if grant_type == "password":
        if not username or not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "invalid_request", "error_description": "Missing username or password"}
            )
        
        # Find user
        user = await user_service.get_user_by_username(db, username)
        if not user:
            user = await user_service.get_user_by_email(db, username)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "invalid_grant", "error_description": "Invalid username or password"}
            )
        
        # Check if active and approved
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "invalid_grant", "error_description": "Account is disabled"}
            )
        
        if not user.is_approved:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "invalid_grant", "error_description": "Account pending approval"}
            )
        
        # Verify password
        if not await user_service.verify_password(user, password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"error": "invalid_grant", "error_description": "Invalid username or password"}
            )
        
        # Update last login
        await user_service.update_last_login(db, user)
        
        # Create tokens
        access_token = jwt_service.create_access_token(
            user_id=user.id,
            email=user.email,
            username=user.username,
            roles=user.roles or [],
            org_id=user.organization,
        )
        
        id_token = jwt_service.create_id_token(
            user_id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
        )
        
        # Generate refresh token
        refresh_token_value = secrets.token_urlsafe(32)
        refresh_session = Session(
            user_id=user.id,
            refresh_token=refresh_token_value,
            expires_at=datetime.utcnow() + timedelta(days=7),
        )
        db.add(refresh_session)
        await db.commit()
        
        return TokenResponse(
            access_token=access_token,
            token_type="Bearer",
            expires_in=15 * 60,  # 15 minutes
            refresh_token=refresh_token_value,
            id_token=id_token,
            scope="openid profile email",
        )
    
    # Grant Type: authorization_code (OIDC callback)
    elif grant_type == "authorization_code":
        if not code or not code_verifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "invalid_request", "error_description": "Missing code or code_verifier"}
            )
        
        # Retrieve authorization state
        auth_state = authorization_states.get(code)
        if not auth_state:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "invalid_grant", "error_description": "Invalid authorization code"}
            )
        
        # Verify PKCE
        import hashlib
        import base64
        
        challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode()).digest()
        ).decode().rstrip('=')
        
        if challenge != auth_state["code_challenge"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "invalid_grant", "error_description": "PKCE verification failed"}
            )
        
        user_id = auth_state["user_id"]
        user = await user_service.get_user_by_id(db, user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "invalid_grant", "error_description": "User not found"}
            )
        
        # Create tokens
        access_token = jwt_service.create_access_token(
            user_id=user.id,
            email=user.email,
            username=user.username,
            roles=user.roles or [],
            org_id=user.organization,
        )
        
        id_token = jwt_service.create_id_token(
            user_id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            nonce=auth_state.get("nonce"),
        )
        
        # Generate refresh token
        refresh_token_value = secrets.token_urlsafe(32)
        refresh_session = Session(
            user_id=user.id,
            refresh_token=refresh_token_value,
            expires_at=datetime.utcnow() + timedelta(days=7),
        )
        db.add(refresh_session)
        await db.commit()
        
        # Clean up authorization state
        del authorization_states[code]
        
        return TokenResponse(
            access_token=access_token,
            token_type="Bearer",
            expires_in=15 * 60,
            refresh_token=refresh_token_value,
            id_token=id_token,
            scope="openid profile email",
        )
    
    # Grant Type: refresh_token
    elif grant_type == "refresh_token":
        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "invalid_request", "error_description": "Missing refresh_token"}
            )
        
        # Find session
        from sqlalchemy import select
        result = await db.execute(
            select(Session).where(Session.refresh_token == refresh_token)
        )
        session = result.scalar_one_or_none()
        
        if not session or session.is_expired():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "invalid_grant", "error_description": "Invalid or expired refresh token"}
            )
        
        # Get user
        user = await user_service.get_user_by_id(db, session.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "invalid_grant", "error_description": "User not found or inactive"}
            )
        
        # Create new access token
        access_token = jwt_service.create_access_token(
            user_id=user.id,
            email=user.email,
            username=user.username,
            roles=user.roles or [],
            org_id=user.organization,
        )
        
        # Update session last used
        session.last_used_at = datetime.utcnow()
        await db.commit()
        
        return TokenResponse(
            access_token=access_token,
            token_type="Bearer",
            expires_in=15 * 60,
            refresh_token=refresh_token,
            scope="openid profile email",
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "unsupported_grant_type", "error_description": f"Grant type '{grant_type}' not supported"}
        )


@router.get("/authorize")
async def authorize_endpoint(
    response_type: str,
    client_id: str,
    redirect_uri: str,
    scope: str,
    state: str,
    code_challenge: str,
    code_challenge_method: str = "S256",
    nonce: Optional[str] = None,
):
    """
    OIDC Authorization Endpoint
    Redirects to Keycloak for authentication
    """
    # For MVP, redirect to Keycloak
    if oidc_service.enabled:
        auth_url = oidc_service.get_authorization_url(state, code_challenge, nonce)
        return RedirectResponse(url=auth_url)
    else:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="OIDC provider not configured"
        )


@router.get("/callback")
async def oidc_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """
    OIDC Callback Handler
    Receives authorization code from Keycloak
    """
    # TODO: Implement full OIDC callback logic
    # For now, return error
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="OIDC callback not yet implemented"
    )


@router.get("/userinfo", response_model=UserInfoResponse)
async def userinfo_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    OIDC UserInfo Endpoint
    Returns user profile information
    """
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header"
        )
    
    token = auth_header.split(" ")[1]
    
    # Decode token
    try:
        payload = jwt_service.decode_token(token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    
    user_id = payload["sub"]
    user = await user_service.get_user_by_id(db, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserInfoResponse(
        sub=user.id,
        email=user.email,
        email_verified=True,
        preferred_username=user.username,
        name=user.full_name,
        roles=user.roles or [],
        org_id=user.organization,
    )


@router.post("/logout")
async def logout_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Logout Endpoint
    Revokes refresh tokens
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return {"message": "Logged out"}
    
    try:
        token = auth_header.split(" ")[1]
        payload = jwt_service.decode_token(token)
        user_id = payload["sub"]
        
        # Revoke all user sessions
        from sqlalchemy import delete
        await db.execute(
            delete(Session).where(Session.user_id == user_id)
        )
        await db.commit()
    except Exception:
        pass
    
    return {"message": "Logged out"}
