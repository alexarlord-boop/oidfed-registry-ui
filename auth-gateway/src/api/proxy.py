"""
Admin API Proxy
Forwards authenticated requests to Admin API with JWT injection
"""

from fastapi import APIRouter, Request, Response, HTTPException, Depends
from fastapi.responses import StreamingResponse
import httpx

from src.config.settings import settings
from src.middleware.auth_middleware import get_current_user
from src.models.user import User

router = APIRouter()


@router.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_to_admin_api(
    path: str, 
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Proxy all /api/* requests to Admin API
    Injects JWT from Auth Gateway
    """
    # Build target URL - path already includes /api prefix from route
    target_url = f"{settings.ADMIN_API_URL}/api/{path}"
    
    # Forward headers (Authorization already set by AuthMiddleware)
    headers = dict(request.headers)
    headers.pop("host", None)  # Remove host header
    
    # Forward query params
    query_params = dict(request.query_params)
    
    # Forward request
    async with httpx.AsyncClient() as client:
        try:
            # Get request body
            body = await request.body()
            
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                params=query_params,
                content=body,
                timeout=30.0,
            )
            
            # Return response
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
            )
        
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Error connecting to Admin API: {str(e)}"
            )


@router.api_route("/subordinates", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
@router.api_route("/subordinates/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_subordinates(
    request: Request,
    path: str = "",
    current_user: User = Depends(get_current_user)
):
    """
    Proxy /subordinates/* requests to Admin API (legacy paths without /api prefix)
    """
    # Build target URL
    target_url = f"{settings.ADMIN_API_URL}/subordinates"
    if path:
        target_url = f"{target_url}/{path}"
    
    # Forward headers (Authorization already set by AuthMiddleware)
    headers = dict(request.headers)
    headers.pop("host", None)  # Remove host header
    
    # Forward query params
    query_params = dict(request.query_params)
    
    # Forward request
    async with httpx.AsyncClient() as client:
        try:
            # Get request body
            body = await request.body()
            
            response = await client.request(
                method=request.method,
                url=target_url,
                headers=headers,
                params=query_params,
                content=body,
                timeout=30.0,
            )
            
            # Return response
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
            )
        
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=502,
                detail=f"Error connecting to Admin API: {str(e)}"
            )
