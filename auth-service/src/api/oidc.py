"""
OIDC Discovery API Routes
OpenID Connect configuration and JWKS endpoints
"""

from fastapi import APIRouter
from src.config.settings import settings
from src.services.jwt_service import jwt_service

router = APIRouter()


@router.get("/openid-configuration")
async def openid_configuration():
    """
    OIDC Discovery Document
    Returns OpenID Connect configuration
    """
    base_url = settings.JWT_ISSUER
    
    return {
        "issuer": settings.JWT_ISSUER,
        "authorization_endpoint": f"{base_url}/auth/authorize",
        "token_endpoint": f"{base_url}/auth/token",
        "userinfo_endpoint": f"{base_url}/auth/userinfo",
        "jwks_uri": f"{base_url}/.well-known/jwks.json",
        "end_session_endpoint": f"{base_url}/auth/logout",
        "response_types_supported": ["code"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": [settings.JWT_ALGORITHM],
        "scopes_supported": ["openid", "profile", "email", "roles"],
        "token_endpoint_auth_methods_supported": ["client_secret_post", "none"],
        "claims_supported": [
            "sub",
            "iss",
            "aud",
            "exp",
            "iat",
            "email",
            "email_verified",
            "preferred_username",
            "name",
            "roles",
            "org_id",
        ],
        "code_challenge_methods_supported": ["S256"],
        "grant_types_supported": ["authorization_code", "refresh_token", "password"],
    }


@router.get("/jwks.json")
async def jwks_endpoint():
    """
    JWKS (JSON Web Key Set) Endpoint
    Returns public keys for JWT validation
    """
    return jwt_service.get_jwks()
