"""
OIDFED Auth Service - Main Application
FastAPI application with database abstraction layer
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from src.config.settings import settings
from src.core.database import db_manager
from src.api import auth, users, admin, oidc, proxy
from src.middleware.auth_middleware import AuthMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Initialize database
    await db_manager.initialize()
    
    # Create tables if they don't exist
    await db_manager.create_tables()
    
    logger.info(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} started")
    logger.info(f"📝 Documentation: http://localhost:9000/docs")
    logger.info(f"🔐 Issuer: {settings.JWT_ISSUER}")
    logger.info(f"💾 Database: {db_manager.config.driver}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application")
    await db_manager.close()
    logger.info("👋 Auth Service shutdown")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Authentication service for OIDFED Registry with OIDC support",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom auth middleware
app.add_middleware(AuthMiddleware)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(oidc.router, prefix="/.well-known", tags=["OIDC Discovery"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
# Proxy mounted at root to match Admin API paths directly
app.include_router(proxy.router, prefix="", tags=["Admin API Proxy"])


@app.get("/")
async def root():
    """Health check and info endpoint"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy",
        "database": db_manager.config.driver,
        "issuer": settings.JWT_ISSUER,
        "oidc_discovery": f"{settings.JWT_ISSUER}/.well-known/openid-configuration",
        "jwks_uri": f"{settings.JWT_ISSUER}/.well-known/jwks.json",
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok", "database": db_manager.config.driver}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    import traceback
    
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "error": "internal_server_error",
                "error_description": str(exc),
                "traceback": traceback.format_exc(),
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "error": "internal_server_error",
                "error_description": "An unexpected error occurred",
            }
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=9000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
