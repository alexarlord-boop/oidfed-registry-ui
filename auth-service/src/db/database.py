"""
Database Setup - Legacy file, now redirects to core.database
For backwards compatibility with existing imports
"""

from src.core.database import db_manager, get_db
from src.models.user import Base

# Legacy exports for backwards compatibility
engine = None  # Will be set after initialization
AsyncSessionLocal = None  # Will be set after initialization

# Re-export Base from models
__all__ = ["Base", "get_db", "engine", "AsyncSessionLocal"]


# Initialize legacy references after db_manager is initialized
def _update_legacy_refs():
    """Update legacy references to new database manager"""
    global engine, AsyncSessionLocal
    engine = db_manager.engine
    AsyncSessionLocal = db_manager.session_factory
