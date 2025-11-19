"""
Authentication Schemas
Pydantic models for auth requests/responses
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# Token Request/Response
class TokenRequest(BaseModel):
    """OAuth 2.0 token request"""
    grant_type: str  # "password", "authorization_code", "refresh_token"
    username: Optional[str] = None
    password: Optional[str] = None
    code: Optional[str] = None
    redirect_uri: Optional[str] = None
    client_id: Optional[str] = None
    code_verifier: Optional[str] = None
    refresh_token: Optional[str] = None


class TokenResponse(BaseModel):
    """OAuth 2.0 token response"""
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    refresh_token: Optional[str] = None
    id_token: Optional[str] = None
    scope: Optional[str] = None


class ErrorResponse(BaseModel):
    """OAuth 2.0 error response"""
    error: str
    error_description: Optional[str] = None
    error_uri: Optional[str] = None


# Authorization Request
class AuthorizeRequest(BaseModel):
    """OIDC authorization request parameters"""
    response_type: str  # "code"
    client_id: str
    redirect_uri: str
    scope: str
    state: str
    code_challenge: str
    code_challenge_method: str = "S256"
    nonce: Optional[str] = None


# User Info
class UserInfoResponse(BaseModel):
    """OIDC UserInfo response"""
    sub: str
    email: str
    email_verified: bool = False
    preferred_username: Optional[str] = None
    name: Optional[str] = None
    given_name: Optional[str] = None
    family_name: Optional[str] = None
    picture: Optional[str] = None
    roles: List[str] = []
    org_id: Optional[str] = None
