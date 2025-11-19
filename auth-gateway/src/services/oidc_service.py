"""
OIDC Service
Keycloak integration and OIDC provider operations
"""

import httpx
from typing import Dict, Any, Optional
from src.config.settings import settings


class OIDCService:
    """Service for OIDC operations with Keycloak"""
    
    def __init__(self):
        self.enabled = settings.KEYCLOAK_ENABLED
        self.client_id = settings.KEYCLOAK_CLIENT_ID
        self.client_secret = settings.KEYCLOAK_CLIENT_SECRET
        self.authorization_endpoint = settings.KEYCLOAK_AUTHORIZATION_ENDPOINT
        self.token_endpoint = settings.KEYCLOAK_TOKEN_ENDPOINT
        self.userinfo_endpoint = settings.KEYCLOAK_USERINFO_ENDPOINT
        self.redirect_uri = settings.KEYCLOAK_REDIRECT_URI
    
    def get_authorization_url(
        self,
        state: str,
        code_challenge: str,
        nonce: Optional[str] = None
    ) -> str:
        """Generate Keycloak authorization URL"""
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "openid profile email",
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
        }
        
        if nonce:
            params["nonce"] = nonce
        
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.authorization_endpoint}?{query_string}"
    
    async def exchange_code(
        self,
        code: str,
        code_verifier: str
    ) -> Dict[str, Any]:
        """Exchange authorization code for tokens"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_endpoint,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code_verifier": code_verifier,
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user info from Keycloak"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.userinfo_endpoint,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            return response.json()
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_endpoint,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                }
            )
            response.raise_for_status()
            return response.json()


# Global service instance
oidc_service = OIDCService()
