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
import httpx

from src.db.database import get_db
from src.schemas.auth import TokenResponse, ErrorResponse, UserInfoResponse
from src.schemas.user import UserCreate, UserResponse
from src.services.jwt_service import jwt_service
from src.services.user_service import user_service
from src.services.oidc_service import oidc_service
from src.services.github_oidc_service import github_oidc_service
from src.models.user import User, UserRole, Session
from src.config.settings import settings

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
            role=user.role if user.role else "pending",
            roles=[user.role] if user.role else [],
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
            role=user.role if user.role else "pending",
            roles=[user.role] if user.role else [],
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
            role=user.role if user.role else "pending",
            roles=[user.role] if user.role else [],
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


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Public user registration endpoint
    Creates a new user account with PENDING status awaiting admin approval
    """
    # Validate that password is provided for local registration
    if not user_data.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required for registration"
        )
    
    # Check if username exists
    existing_user = await user_service.get_user_by_username(db, user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email exists
    existing_email = await user_service.get_user_by_email(db, user_data.email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Force PENDING role and not approved for self-registration
    user_data.role = UserRole.PENDING
    user_data.is_approved = False
    user_data.is_active = True
    
    # Create user
    user = await user_service.create_user(db, user_data)
    await db.commit()
    
    # TODO: Send email notification to admins about new registration
    # TODO: Send confirmation email to user about pending approval
    
    return user


@router.get("/authorize")
async def authorize_endpoint(
    response_type: str,
    client_id: str,
    redirect_uri: str,
    scope: str,
    state: str,
    code_challenge: Optional[str] = None,
    code_challenge_method: str = "S256",
    nonce: Optional[str] = None,
):
    """
    OIDC Authorization Endpoint (legacy)
    Redirects to Keycloak for authentication (without PKCE for now)
    """
    # For MVP, redirect to Keycloak without PKCE
    if oidc_service.enabled:
        auth_url = oidc_service.get_authorization_url(state, nonce=nonce)
        return RedirectResponse(url=auth_url)
    else:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="OIDC provider not configured"
        )


@router.get("/oidc/keycloak/authorize")
async def oidc_keycloak_authorize(
    response_type: str,
    client_id: str,
    redirect_uri: str,
    scope: str,
    state: str,
    code_challenge: Optional[str] = None,
    code_challenge_method: str = "S256",
    nonce: Optional[str] = None,
):
    """
    Keycloak OIDC Authorization Endpoint
    Redirects to Keycloak for authentication
    """
    if oidc_service.enabled:
        auth_url = oidc_service.get_authorization_url(state, nonce=nonce)
        return RedirectResponse(url=auth_url)
    else:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Keycloak OIDC provider not configured"
        )


@router.get("/oidc/github/authorize")
async def oidc_github_authorize(
    response_type: str,
    client_id: str,
    redirect_uri: str,
    scope: str,
    state: str,
    code_challenge: Optional[str] = None,
    code_challenge_method: str = "S256",
    nonce: Optional[str] = None,
):
    """
    GitHub OAuth Authorization Endpoint
    Redirects to GitHub for authentication
    """
    if not github_oidc_service.enabled:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="GitHub OAuth provider not configured. Please enable it in settings."
        )
    
    # Store PKCE challenge and state for verification during callback
    if code_challenge:
        authorization_states[state] = {
            "code_challenge": code_challenge,
            "code_challenge_method": code_challenge_method,
            "nonce": nonce,
            "provider": "github",
        }
    
    # Redirect to GitHub OAuth
    auth_url = github_oidc_service.get_authorization_url(state)
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def oidc_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """
    OIDC Callback Handler (deprecated - use /oidc/{provider}/callback)
    """
    return await oidc_keycloak_callback(code=code, state=state, db=db)


@router.get("/oidc/keycloak/callback")
async def oidc_keycloak_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Keycloak OIDC Callback Handler
    Exchanges authorization code for tokens and creates/updates user
    """
    if not oidc_service.enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OIDC provider not configured"
        )
    
    try:
        # Exchange code for tokens
        # Note: For public clients without PKCE enforcement, we don't send code_verifier
        token_request_data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": oidc_service.redirect_uri,
            "client_id": oidc_service.client_id,
        }
        
        # Add client_secret if configured (for confidential clients)
        if oidc_service.client_secret:
            token_request_data["client_secret"] = oidc_service.client_secret
        
        print(f"Token exchange request:")
        print(f"  URL: {oidc_service.token_endpoint}")
        print(f"  Data: {token_request_data}")
        
        async with httpx.AsyncClient() as client:
            token_response_raw = await client.post(
                oidc_service.token_endpoint,
                data=token_request_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            # Log detailed error for debugging
            if not token_response_raw.is_success:
                error_text = token_response_raw.text
                print(f"Token exchange failed: {token_response_raw.status_code} - {error_text}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Token exchange failed: {error_text}"
                )
            
            print(f"Token exchange successful!")
            token_response = token_response_raw.json()
            print(f"  Access token (first 50 chars): {token_response.get('access_token', '')[:50]}...")
            print(f"  Token type: {token_response.get('token_type')}")
            print(f"  ID token present: {bool(token_response.get('id_token'))}")
        
        # Try to get user info from ID token first (more reliable than userinfo endpoint)
        id_token = token_response.get("id_token")
        if id_token:
            # Decode ID token without verification (we trust Keycloak)
            import base64
            import json
            
            # Split JWT and decode payload
            try:
                payload_part = id_token.split('.')[1]
                # Add padding if needed
                payload_part += '=' * (4 - len(payload_part) % 4)
                payload_bytes = base64.urlsafe_b64decode(payload_part)
                userinfo = json.loads(payload_bytes)
                print(f"User info from ID token: {userinfo.get('email')}")
            except Exception as e:
                print(f"Failed to decode ID token: {e}")
                # Fall back to userinfo endpoint
                print(f"Fetching user info from: {oidc_service.userinfo_endpoint}")
                userinfo = await oidc_service.get_user_info(token_response["access_token"])
                print(f"User info retrieved: {userinfo.get('email')}")
        else:
            # No ID token, use userinfo endpoint
            print(f"Fetching user info from: {oidc_service.userinfo_endpoint}")
            userinfo = await oidc_service.get_user_info(token_response["access_token"])
            print(f"User info retrieved: {userinfo.get('email')}")
        
        # Find or create user
        email = userinfo.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not provided by OIDC provider"
            )
        
        # Check if user exists by email
        user = await user_service.get_user_by_email(db, email)
        
        if not user:
            # Create new user from OIDC
            username = userinfo.get("preferred_username") or email.split("@")[0]
            
            # Ensure username is unique
            existing = await user_service.get_user_by_username(db, username)
            if existing:
                username = f"{username}_{secrets.token_hex(4)}"
            
            from src.schemas.user import UserCreate
            user_create = UserCreate(
                username=username,
                email=email,
                password=None,  # No password for OIDC users
                full_name=userinfo.get("name"),
                organization=userinfo.get("org_id"),
                role=UserRole.PENDING,  # New users start as pending
                is_approved=False,
                is_active=True,
                oidc_provider="keycloak",
            )
            
            user = await user_service.create_user(db, user_create)
            
            # Link OIDC identity
            user.oidc_sub = userinfo.get("sub")
            user.oidc_provider = "keycloak"
            await db.commit()
        else:
            # Update OIDC link if not set
            if not user.oidc_sub:
                user.oidc_sub = userinfo.get("sub")
                user.oidc_provider = "keycloak"
                await db.commit()
        
        # Check if user is active and approved
        if not user.is_active:
            # Redirect to frontend with error
            frontend_url = settings.FRONTEND_REDIRECT_URI.split("/auth/callback")[0]
            redirect_url = f"{frontend_url}/login?error=account_disabled&error_description=Your account has been deactivated. Please contact an administrator."
            return RedirectResponse(url=redirect_url)
        
        if not user.is_approved:
            # Redirect to frontend with error
            frontend_url = settings.FRONTEND_REDIRECT_URI.split("/auth/callback")[0]
            redirect_url = f"{frontend_url}/login?error=account_pending&error_description=Your account is pending approval. Please contact an administrator."
            return RedirectResponse(url=redirect_url)
        
        # Update last login
        await user_service.update_last_login(db, user)
        
        # Create our own access token
        access_token = jwt_service.create_access_token(
            user_id=user.id,
            email=user.email,
            username=user.username,
            role=user.role if user.role else "pending",
            roles=[user.role] if user.role else [],
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
        
        # Redirect to frontend with tokens in URL fragment
        frontend_url = settings.FRONTEND_REDIRECT_URI.split("/auth/callback")[0]
        redirect_url = (
            f"{frontend_url}/auth/callback"
            f"#access_token={access_token}"
            f"&id_token={id_token}"
            f"&refresh_token={refresh_token_value}"
            f"&expires_in=900"
            f"&token_type=Bearer"
            f"&state={state}"
        )
        
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OIDC callback failed: {str(e)}"
        )


@router.get("/oidc/github/callback")
async def oidc_github_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """
    GitHub OAuth Callback Handler
    Exchanges authorization code for tokens and creates/updates user
    """
    if not github_oidc_service.enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub OAuth provider not configured"
        )
    
    try:
        # Exchange code for access token
        print(f"GitHub OAuth: Exchanging code for token")
        token_response = await github_oidc_service.exchange_code(code)
        access_token = token_response.get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to obtain access token from GitHub"
            )
        
        print(f"GitHub OAuth: Token obtained, fetching user info")
        
        # Get user info from GitHub
        github_user = await github_oidc_service.get_user_info(access_token)
        print(f"GitHub user info: {github_user.get('login')}")
        
        # Get primary email (GitHub might not include email in user info if not public)
        email = github_user.get("email")
        if not email:
            print(f"GitHub OAuth: Email not public, fetching from emails endpoint")
            email = await github_oidc_service.get_primary_email(access_token)
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to retrieve email from GitHub. Please make sure your email is verified."
            )
        
        print(f"GitHub OAuth: Using email {email}")
        
        # Find or create user
        user = await user_service.get_user_by_email(db, email)
        
        if not user:
            # Create new user from GitHub
            username = github_user.get("login")  # GitHub username
            
            # Ensure username is unique
            existing = await user_service.get_user_by_username(db, username)
            if existing:
                username = f"{username}_{secrets.token_hex(4)}"
            
            from src.schemas.user import UserCreate
            user_create = UserCreate(
                username=username,
                email=email,
                password=None,  # No password for OAuth users
                full_name=github_user.get("name") or github_user.get("login"),
                organization=github_user.get("company"),
                role=UserRole.PENDING,  # New users start as pending
                is_approved=False,
                is_active=True,
                oidc_provider="github",
            )
            
            user = await user_service.create_user(db, user_create)
            print(f"GitHub OAuth: Created new user {user.username}")
            
            # Link GitHub identity
            user.oidc_sub = str(github_user.get("id"))  # GitHub user ID
            user.oidc_provider = "github"
            await db.commit()
        else:
            # Update GitHub link if not set
            if not user.oidc_sub or user.oidc_provider != "github":
                user.oidc_sub = str(github_user.get("id"))
                user.oidc_provider = "github"
                await db.commit()
            print(f"GitHub OAuth: Existing user {user.username}")
        
        # Check if user is active and approved
        if not user.is_active:
            # Redirect to frontend with error
            frontend_url = settings.FRONTEND_REDIRECT_URI.split("/auth/callback")[0]
            redirect_url = f"{frontend_url}/login?error=account_disabled&error_description=Your account has been deactivated. Please contact an administrator."
            return RedirectResponse(url=redirect_url)
        
        if not user.is_approved:
            # Redirect to frontend with error
            frontend_url = settings.FRONTEND_REDIRECT_URI.split("/auth/callback")[0]
            redirect_url = f"{frontend_url}/login?error=account_pending&error_description=Your account is pending approval. Please contact an administrator."
            return RedirectResponse(url=redirect_url)
        
        # Update last login
        await user_service.update_last_login(db, user)
        
        # Get stored state for nonce
        auth_state = authorization_states.get(state, {})
        nonce = auth_state.get("nonce")
        
        # Create our own access token
        access_token_jwt = jwt_service.create_access_token(
            user_id=user.id,
            email=user.email,
            username=user.username,
            role=user.role if user.role else "pending",
            roles=[user.role] if user.role else [],
            org_id=user.organization,
        )
        
        id_token = jwt_service.create_id_token(
            user_id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            nonce=nonce,
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
        if state in authorization_states:
            del authorization_states[state]
        
        # Redirect to frontend with tokens in URL fragment
        frontend_url = settings.FRONTEND_REDIRECT_URI.split("/auth/callback")[0]
        redirect_url = (
            f"{frontend_url}/auth/callback"
            f"#access_token={access_token_jwt}"
            f"&id_token={id_token}"
            f"&refresh_token={refresh_token_value}"
            f"&expires_in=900"
            f"&token_type=Bearer"
            f"&state={state}"
        )
        
        print(f"GitHub OAuth: Success! Redirecting to frontend")
        return RedirectResponse(url=redirect_url)
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"GitHub OAuth callback failed: {str(e)}"
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
        role=user.role if user.role else "pending",
        org_id=user.organization,
        oidc_provider=user.oidc_provider,
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
