# Database Migration Guide

## Overview

The auth-service now uses a **database abstraction layer** that supports both SQLite and PostgreSQL without requiring Alembic migrations. Tables are automatically created on startup using SQLAlchemy's `create_all()`.

## Database Options

### SQLite (Default - Recommended for Development)

**Pros:**
- Zero configuration, no external database needed
- File-based, easy backup and reset
- Perfect for development and small deployments

**Configuration:**
```bash
DATABASE_URL=sqlite+aiosqlite:///./data/auth.db
```

**Location:**
- Docker: `/app/data/auth.db` (persisted in `./data` volume)
- Local: `./data/auth.db`

### PostgreSQL (Recommended for Production)

**Pros:**
- Better concurrency and performance at scale
- Advanced features (native UUID, full-text search)
- Battle-tested in production environments

**Configuration:**
```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/authdb
```

## Switching Between Databases

### Option 1: Environment Variable

Update the `DATABASE_URL` in your `.env` file or docker-compose.yml:

```bash
# For SQLite
DATABASE_URL=sqlite+aiosqlite:///./data/auth.db

# For PostgreSQL
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname
```

### Option 2: Docker Compose

**For SQLite (current default):**
```yaml
services:
  auth-service:
    environment:
      - DATABASE_URL=sqlite+aiosqlite:///./data/auth.db
    volumes:
      - ./data:/app/data  # Persist database file
```

**For PostgreSQL:**

1. Uncomment the postgres service in `docker-compose.yml`
2. Update auth-service environment:
```yaml
services:
  auth-service:
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/authdb
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=authdb
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Migration from Old Setup

If you were using PostgreSQL with Alembic before:

### Step 1: Remove Alembic

```bash
rm -rf alembic/
rm alembic.ini
```

### Step 2: Update Dependencies

The new `requirements.txt` uses:
- `aiosqlite` for SQLite (default)
- `asyncpg` for PostgreSQL (optional)
- No `alembic` dependency

### Step 3: Choose Your Database

**Option A: Switch to SQLite (simplest)**

```bash
# Stop services
docker-compose down -v

# Update docker-compose.yml to use SQLite (already done)

# Rebuild and start
docker-compose up --build -d
```

**Option B: Keep PostgreSQL**

```bash
# Stop services
docker-compose down -v

# Uncomment postgres service in docker-compose.yml
# Update DATABASE_URL to PostgreSQL

# Rebuild and start
docker-compose up --build -d
```

### Step 4: Verify

```bash
# Check logs
docker-compose logs auth-service

# You should see:
# "Database initialized: sqlite (sqlite+aiosqlite:///./data/auth.db)"
# or
# "Database initialized: postgresql (postgresql+asyncpg://...)"
# "Database tables created successfully"

# Test health endpoint
curl http://localhost:8001/health
```

## Database Operations

### Reset Database (SQLite)

```bash
# Stop service
docker-compose down

# Delete database file
rm -f data/auth.db

# Restart - tables will be recreated automatically
docker-compose up -d
```

### Reset Database (PostgreSQL)

```bash
# Stop services
docker-compose down -v  # -v removes volumes

# Start fresh
docker-compose up -d
```

### Backup Database (SQLite)

```bash
# Simple file copy
cp data/auth.db data/auth.db.backup

# Or use SQLite's backup command
sqlite3 data/auth.db ".backup 'data/auth.db.backup'"
```

### Backup Database (PostgreSQL)

```bash
docker-compose exec postgres pg_dump -U postgres authdb > backup.sql
```

## Troubleshooting

### Tables Not Created

**Check logs:**
```bash
docker-compose logs auth-service | grep -i database
```

**Manually trigger table creation:**
```python
from src.core.database import db_manager
from src.models.user import Base

async def create_tables():
    await db_manager.initialize()
    await db_manager.create_tables()
```

### Permission Issues (SQLite)

Ensure the data directory is writable:
```bash
mkdir -p data
chmod 755 data
```

### Connection Issues (PostgreSQL)

Check that postgres is healthy:
```bash
docker-compose ps
docker-compose logs postgres
```

## Schema Changes

Since we're not using migrations, schema changes are applied automatically:

1. Update model in `src/models/user.py`
2. Restart the service
3. New columns will be added automatically

**⚠️ Warning:** This approach works for adding columns but not for:
- Removing columns (requires manual DROP COLUMN)
- Renaming columns (requires manual ALTER)
- Complex schema changes (consider adding Alembic back)

For production with complex schema evolution, consider re-adding Alembic or using a schema versioning strategy.

## Production Recommendations

- **Use PostgreSQL** for production deployments
- **Enable connection pooling** (already configured in DatabaseManager)
- **Set up regular backups** (pg_dump for PostgreSQL, file backups for SQLite)
- **Monitor database size** (especially for SQLite, consider rotating old sessions)
- **Use environment-specific DATABASE_URLs** (dev, staging, prod)

## Architecture

- **Database Manager:** `src/core/database.py` - Handles connections with driver-specific optimizations
- **Models:** `src/models/user.py` - Database-agnostic schema definitions
- **Session Dependency:** `src/db/session.py` - FastAPI dependency injection
- **Configuration:** `src/config/settings.py` - Reads DATABASE_URL from environment

No migrations needed - just set DATABASE_URL and start the service!
