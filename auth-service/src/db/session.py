"""Database session management - now using core.database abstraction layer"""

from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db

# Re-export for backwards compatibility
__all__ = ["get_db"]


# Legacy support - redirect to new database manager
async def get_db_legacy() -> AsyncGenerator[AsyncSession, None]:
    """Legacy database session dependency - redirects to new implementation"""
    async for session in get_db():
        yield session
