"""
GitHub OIDC Service
GitHub OAuth 2.0 integration
"""

import httpx
from typing import Dict, Any, Optional
from urllib.parse import urlencode
from src.config.settings import settings


class GitHubOIDCService:
    """Service for GitHub OAuth 2.0 operations"""
    
    def __init__(self):
        self.enabled = settings.GITHUB_ENABLED
        self.client_id = settings.GITHUB_CLIENT_ID
        self.client_secret = settings.GITHUB_CLIENT_SECRET
        self.authorization_endpoint = settings.GITHUB_AUTHORIZATION_ENDPOINT
        self.token_endpoint = settings.GITHUB_TOKEN_ENDPOINT
        self.userinfo_endpoint = settings.GITHUB_USERINFO_ENDPOINT
        self.user_email_endpoint = settings.GITHUB_USER_EMAIL_ENDPOINT
        self.redirect_uri = settings.GITHUB_REDIRECT_URI
    
    def get_authorization_url(
        self,
        state: str,
        scope: str = "read:user user:email"
    ) -> str:
        """
        Generate GitHub authorization URL
        
        GitHub OAuth uses standard OAuth 2.0 flow.
        Note: GitHub doesn't support PKCE for public clients by default,
        but we can still use it if needed.
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": scope,
            "state": state,
        }
        
        query_string = urlencode(params)
        return f"{self.authorization_endpoint}?{query_string}"
    
    async def exchange_code(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token
        
        GitHub returns tokens in JSON format when Accept header is set.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_endpoint,
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                },
                headers={
                    "Accept": "application/json",
                }
            )
            
            if not response.is_success:
                error_text = response.text
                print(f"GitHub token exchange failed: {response.status_code} - {error_text}")
                raise Exception(f"Token exchange failed: {error_text}")
            
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """
        Get user info from GitHub API
        
        Returns basic user profile information.
        Note: Email may not be included if not public, need to fetch separately.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.userinfo_endpoint,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                }
            )
            
            if not response.is_success:
                print(f"GitHub userinfo request failed: {response.status_code}")
                print(f"  URL: {self.userinfo_endpoint}")
                print(f"  Response: {response.text}")
                raise Exception(f"Failed to fetch user info: {response.text}")
            
            return response.json()
    
    async def get_user_emails(self, access_token: str) -> list[Dict[str, Any]]:
        """
        Get user email addresses from GitHub API
        
        Returns list of email addresses with primary and verified flags.
        Requires 'user:email' scope.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.user_email_endpoint,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                }
            )
            
            if not response.is_success:
                print(f"GitHub user emails request failed: {response.status_code}")
                print(f"  URL: {self.user_email_endpoint}")
                print(f"  Response: {response.text}")
                # Return empty list if we can't fetch emails
                return []
            
            return response.json()
    
    async def get_primary_email(self, access_token: str) -> Optional[str]:
        """
        Get user's primary verified email address
        
        Returns the primary verified email or first verified email found.
        """
        emails = await self.get_user_emails(access_token)
        
        # Find primary verified email
        for email_obj in emails:
            if email_obj.get("primary") and email_obj.get("verified"):
                return email_obj.get("email")
        
        # Fallback: find any verified email
        for email_obj in emails:
            if email_obj.get("verified"):
                return email_obj.get("email")
        
        return None


# Global service instance
github_oidc_service = GitHubOIDCService()
