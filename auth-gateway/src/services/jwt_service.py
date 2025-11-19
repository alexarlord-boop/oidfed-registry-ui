"""
JWT Service
JWT token generation and validation using RS256
"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from jose import jwt, JWTError
from jose.backends import RSAKey
import json
import base64
import hashlib

from src.config.settings import settings


class JWTService:
    """Service for JWT operations"""
    
    @staticmethod
    def create_access_token(
        user_id: str,
        email: str,
        username: str,
        roles: list[str],
        org_id: Optional[str] = None,
    ) -> str:
        """Create JWT access token"""
        now = datetime.utcnow()
        expires_at = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        
        payload = {
            "sub": user_id,
            "email": email,
            "preferred_username": username,
            "roles": roles,
            "iss": settings.JWT_ISSUER,
            "aud": settings.JWT_AUDIENCE,
            "exp": int(expires_at.timestamp()),
            "iat": int(now.timestamp()),
            "nbf": int(now.timestamp()),
        }
        
        if org_id:
            payload["org_id"] = org_id
        
        token = jwt.encode(
            payload,
            settings.private_key,
            algorithm=settings.JWT_ALGORITHM,
        )
        
        return token
    
    @staticmethod
    def create_id_token(
        user_id: str,
        email: str,
        username: str,
        full_name: Optional[str] = None,
        nonce: Optional[str] = None,
    ) -> str:
        """Create OIDC ID token"""
        now = datetime.utcnow()
        expires_at = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        
        payload = {
            "sub": user_id,
            "email": email,
            "email_verified": True,
            "preferred_username": username,
            "iss": settings.JWT_ISSUER,
            "aud": settings.FRONTEND_CLIENT_ID,
            "exp": int(expires_at.timestamp()),
            "iat": int(now.timestamp()),
        }
        
        if full_name:
            payload["name"] = full_name
        
        if nonce:
            payload["nonce"] = nonce
        
        token = jwt.encode(
            payload,
            settings.private_key,
            algorithm=settings.JWT_ALGORITHM,
        )
        
        return token
    
    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(
                token,
                settings.public_key,
                algorithms=[settings.JWT_ALGORITHM],
                audience=settings.JWT_AUDIENCE,
                issuer=settings.JWT_ISSUER,
            )
            return payload
        except JWTError as e:
            raise ValueError(f"Invalid token: {str(e)}")
    
    @staticmethod
    def get_jwks() -> Dict[str, Any]:
        """Get JWKS (JSON Web Key Set) for public key"""
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.backends import default_backend
        
        # Load public key
        public_key_pem = settings.public_key.encode()
        public_key = serialization.load_pem_public_key(
            public_key_pem,
            backend=default_backend()
        )
        
        # Get public numbers
        public_numbers = public_key.public_numbers()
        
        # Convert to base64url
        def int_to_base64url(n: int) -> str:
            """Convert integer to base64url"""
            byte_length = (n.bit_length() + 7) // 8
            n_bytes = n.to_bytes(byte_length, byteorder='big')
            return base64.urlsafe_b64encode(n_bytes).decode('utf-8').rstrip('=')
        
        # Generate key ID (thumbprint)
        key_data = {
            "e": int_to_base64url(public_numbers.e),
            "kty": "RSA",
            "n": int_to_base64url(public_numbers.n),
        }
        
        # Create thumbprint
        thumbprint_data = json.dumps(key_data, sort_keys=True, separators=(',', ':'))
        kid = base64.urlsafe_b64encode(
            hashlib.sha256(thumbprint_data.encode()).digest()
        ).decode('utf-8').rstrip('=')
        
        jwk = {
            "kty": "RSA",
            "use": "sig",
            "alg": settings.JWT_ALGORITHM,
            "kid": kid,
            "n": key_data["n"],
            "e": key_data["e"],
        }
        
        return {
            "keys": [jwk]
        }


# Global service instance
jwt_service = JWTService()
