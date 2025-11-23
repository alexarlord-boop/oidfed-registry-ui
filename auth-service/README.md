# OIDFED Auth Service

FastAPI-based authentication and user management service for OIDFED Registry.

## Features

- **Local Authentication**: Username/password with bcrypt hashing
- **OIDC Integration**: Keycloak SSO proxy
- **JWT Issuance**: RS256 signed tokens
- **Token Management**: Access token refresh
- **User Management**: CRUD API for FedOP operators
- **Admin API Proxy**: Forward authenticated requests

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Generate JWT keys
python src/config/keys/generate_keys.py

# Run migrations
alembic upgrade head

# Start server
uvicorn src.main:app --reload --port 9000
```

## Environment Variables

See `.env.example` for all configuration options.

## API Endpoints

### Authentication
- `GET /auth/authorize` - Start OIDC flow
- `POST /auth/token` - Token endpoint (password, code, refresh)
- `GET /auth/userinfo` - Get user profile
- `POST /auth/logout` - Logout and revoke tokens
- `GET /.well-known/openid-configuration` - OIDC discovery
- `GET /.well-known/jwks.json` - Public keys (JWKS)

### User Management (Admin only)
- `GET /admin/users` - List users
- `POST /admin/users` - Create user
- `GET /admin/users/{id}` - Get user
- `PUT /admin/users/{id}` - Update user
- `DELETE /admin/users/{id}` - Delete user

### Admin API Proxy
- `*` `/api/*` - Proxy to Admin API with JWT injection

## Architecture

```
Frontend → Auth Service → Admin API
              ↓
         Keycloak (optional)
```

The service:
1. Authenticates users (local or OIDC)
2. Manages user accounts and approvals
3. Issues JWTs signed with its private key
4. Proxies API requests with JWT injection
5. Admin API validates JWT with service's public key

## Development

```bash
# Run with auto-reload
uvicorn src.main:app --reload --port 9000

# Run tests
pytest

# Format code
black src/
isort src/

# Type check
mypy src/
```

## Production

```bash
# Run with gunicorn
gunicorn src.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:9000
```

## Docker

```bash
# Build image
docker build -t oidfed-auth-service .

# Run container
docker run -p 9000:9000 --env-file .env oidfed-auth-service
```
