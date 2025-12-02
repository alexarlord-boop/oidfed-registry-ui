"""Database abstraction layer - supports SQLite and PostgreSQL"""
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import AsyncSession, AsyncEngine, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool, StaticPool
from sqlalchemy import event, text
from pydantic_settings import BaseSettings
import logging

logger = logging.getLogger(__name__)


class DatabaseConfig(BaseSettings):
    """Database configuration with driver detection"""
    database_url: str = "sqlite+aiosqlite:///./data/auth.db"
    database_echo: bool = False
    
    @property
    def driver(self) -> str:
        """Detect database driver from URL"""
        if "sqlite" in self.database_url:
            return "sqlite"
        elif "postgresql" in self.database_url or "postgres" in self.database_url:
            return "postgresql"
        else:
            return "unknown"
    
    @property
    def is_sqlite(self) -> bool:
        return self.driver == "sqlite"
    
    @property
    def is_postgresql(self) -> bool:
        return self.driver == "postgresql"


class DatabaseManager:
    """Manages database connections with driver-specific optimizations"""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.engine: Optional[AsyncEngine] = None
        self.session_factory: Optional[async_sessionmaker] = None
        
    def create_engine(self) -> AsyncEngine:
        """Create engine with driver-specific settings"""
        engine_kwargs = {
            "echo": self.config.database_echo,
            "future": True,
        }
        
        if self.config.is_sqlite:
            # SQLite-specific optimizations
            engine_kwargs.update({
                "connect_args": {
                    "check_same_thread": False,
                    "timeout": 30,
                },
                "poolclass": StaticPool,  # Single connection pool for SQLite
            })
        elif self.config.is_postgresql:
            # PostgreSQL-specific optimizations
            engine_kwargs.update({
                "pool_size": 5,
                "max_overflow": 10,
                "pool_pre_ping": True,
                "pool_recycle": 3600,
            })
        
        engine = create_async_engine(self.config.database_url, **engine_kwargs)
        
        # SQLite-specific: Enable foreign keys
        if self.config.is_sqlite:
            @event.listens_for(engine.sync_engine, "connect")
            def set_sqlite_pragma(dbapi_conn, connection_record):
                cursor = dbapi_conn.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.execute("PRAGMA journal_mode=WAL")  # Write-Ahead Logging for better concurrency
                cursor.close()
        
        return engine
    
    async def initialize(self):
        """Initialize database connection"""
        self.engine = self.create_engine()
        self.session_factory = async_sessionmaker(
            self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        logger.info(f"Database initialized: {self.config.driver} ({self.config.database_url})")
    
    async def create_tables(self):
        """Create all tables - works for both SQLite and PostgreSQL"""
        from src.models.user import Base
        
        async with self.engine.begin() as conn:
            # For PostgreSQL, create enum types first if needed
            if self.config.is_postgresql:
                await conn.execute(text("""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
                            CREATE TYPE userrole AS ENUM ('admin', 'technical_contact');
                        END IF;
                    END
                    $$;
                """))
            
            # Create all tables
            await conn.run_sync(Base.metadata.create_all)
        
        logger.info("Database tables created successfully")
    
    async def drop_tables(self):
        """Drop all tables - useful for testing"""
        from src.models.user import Base
        
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        
        logger.info("Database tables dropped")
    
    async def close(self):
        """Close database connections"""
        if self.engine:
            await self.engine.dispose()
            logger.info("Database connections closed")
    
    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session"""
        if not self.session_factory:
            raise RuntimeError("Database not initialized. Call initialize() first.")
        
        async with self.session_factory() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()


# Global database manager instance
db_config = DatabaseConfig()
db_manager = DatabaseManager(db_config)


# Dependency for FastAPI
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for database sessions"""
    async with db_manager.get_session() as session:
        yield session
