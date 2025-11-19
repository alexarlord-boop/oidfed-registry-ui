# OIDFED Auth Gateway - Deployment Guide

Complete guide for deploying the Auth Gateway in development and production.

## Quick Start (5 minutes)

### Option 1: Docker Compose (Recommended)

```bash
cd auth-gateway

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f auth-gateway

# Access:
# - Auth Gateway: http://localhost:9000
# - API Docs: http://localhost:9000/docs
# - PostgreSQL: localhost:5432
```

### Option 2: Local Development

```bash
cd auth-gateway

# Run setup script
./setup.sh

# Activate virtual environment
source venv/bin/activate

# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
alembic upgrade head

# Seed test data
python scripts/seed.py

# Start server
uvicorn src.main:app --reload --port 9000
```

## Authentication Flows

### Local Password Authentication

```bash
# Login with username/password
curl -X POST http://localhost:9000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=admin" \
  -d "password=admin123"
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "abc123...",
  "id_token": "eyJhbGc..."
}
```

### Federated OIDC Authentication

Frontend flow with PKCE:

```typescript
// 1. Generate PKCE challenge
const verifier = generateCodeVerifier();
const challenge = await generateCodeChallenge(verifier);

// 2. Redirect to authorization endpoint
const authUrl = `http://localhost:9000/auth/authorize?` +
  `response_type=code` +
  `&client_id=frontend` +
  `&redirect_uri=${encodeURIComponent(redirectUri)}` +
  `&scope=openid profile email` +
  `&code_challenge=${challenge}` +
  `&code_challenge_method=S256`;

window.location.href = authUrl;

// 3. Handle callback (after redirect back)
const code = new URLSearchParams(window.location.search).get('code');

// 4. Exchange code for tokens
const response = await fetch('http://localhost:9000/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    code_verifier: verifier  // From step 1
  })
});
```

### Token Refresh

```bash
curl -X POST http://localhost:9000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=YOUR_REFRESH_TOKEN"
```

## Keycloak Integration

### Start Keycloak

```bash
# Start with Keycloak profile
docker-compose --profile with-keycloak up -d

# Access Keycloak at http://localhost:8080
# Login: admin / admin
```

### Configure Keycloak Realm

1. **Create Realm**:
   - Click dropdown next to "master" → "Create Realm"
   - Name: `oidfed`
   - Enabled: ON
   - Click "Create"

2. **Create Client**:
   - Go to "Clients" → "Create client"
   - Client ID: `oidfed-registry`
   - Client Protocol: `openid-connect`
   - Click "Next"
   - Client authentication: ON
   - Authorization: OFF
   - Click "Next"
   - Valid redirect URIs:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:5173/auth/callback`
     - `http://localhost:9000/auth/callback`
   - Web origins: `http://localhost:3000`, `http://localhost:5173`
   - Click "Save"

3. **Get Client Secret**:
   - Go to "Clients" → `oidfed-registry` → "Credentials" tab
   - Copy the "Client secret"

4. **Create Test User**:
   - Go to "Users" → "Add user"
   - Username: `testuser`
   - Email: `testuser@example.com`
   - First name: `Test`
   - Last name: `User`
   - Click "Create"
   - Go to "Credentials" tab
   - Click "Set password"
   - Password: `password123`
   - Temporary: OFF
   - Click "Save"

### Configure Auth Gateway

Update `auth-gateway/.env`:

```bash
KEYCLOAK_ENABLED=true
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=oidfed
KEYCLOAK_CLIENT_ID=oidfed-registry
KEYCLOAK_CLIENT_SECRET=paste-your-client-secret-here
```

Restart Auth Gateway:
```bash
docker-compose restart auth-gateway
```

### Test Keycloak Login

1. Frontend redirects to: `http://localhost:9000/auth/authorize?...`
2. Auth Gateway redirects to Keycloak login
3. User logs in with `testuser` / `password123`
4. Keycloak redirects back to Auth Gateway
5. Auth Gateway creates/updates user and issues tokens
6. First login: User needs admin approval (`is_approved=false`)
7. Admin approves via: `PUT /admin/users/{id}` with `is_approved: true`
8. User can now access the system

## Database Management

### Run Migrations

```bash
# Apply all migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history

# Create new migration (after model changes)
alembic revision --autogenerate -m "Add new field"
```

### Seed Test Data

```bash
python scripts/seed.py
```

Creates:
- Admin user: `admin` / `admin123`
- Test technical contact: `tc_alice` / `password123`
- Test technical contact: `tc_bob` / `password123`

### Reset Database

```bash
# Stop and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
sleep 5

# Run migrations
alembic upgrade head

# Seed data
python scripts/seed.py
```

## API Documentation

### Interactive Docs

- Swagger UI: http://localhost:9000/docs
- ReDoc: http://localhost:9000/redoc

### Key Endpoints

**Authentication**:
- `POST /auth/token` - OAuth 2.0 token endpoint
- `GET /auth/authorize` - OAuth 2.0 authorization
- `GET /auth/userinfo` - OIDC UserInfo
- `POST /auth/logout` - Logout and revoke tokens

**OIDC Discovery**:
- `GET /.well-known/openid-configuration` - OIDC metadata
- `GET /.well-known/jwks.json` - Public keys (JWKS)

**User Management**:
- `GET /users/me` - Current user profile
- `GET /users/{id}` - User by ID

**Admin Operations** (Admin only):
- `GET /admin/users` - List all users
- `POST /admin/users` - Create user
- `PUT /admin/users/{id}` - Update user
- `DELETE /admin/users/{id}` - Delete user

**Admin API Proxy**:
- `ANY /api/*` - Proxy to Admin API with JWT injection

## Frontend Configuration

Update `oidfed-registry-ui/.env`:

```bash
# Auth Gateway URL
VITE_AUTH_GATEWAY_URL=http://localhost:9000

# OAuth/OIDC Configuration
VITE_OAUTH_CLIENT_ID=frontend
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_OAUTH_AUTHORIZATION_ENDPOINT=http://localhost:9000/auth/authorize
VITE_OAUTH_TOKEN_ENDPOINT=http://localhost:9000/auth/token
VITE_OAUTH_USERINFO_ENDPOINT=http://localhost:9000/auth/userinfo
VITE_OAUTH_LOGOUT_ENDPOINT=http://localhost:9000/auth/logout

# Token Configuration
VITE_TOKEN_REFRESH_BUFFER_SECONDS=60
VITE_SESSION_TIMEOUT_WARNING_MINUTES=2

# Admin API (proxied through Auth Gateway)
VITE_ADMIN_API_URL=http://localhost:9000/api
```

## Production Deployment

### Environment Variables

Create `auth-gateway/.env.production`:

```bash
# Database (use production credentials)
DATABASE_URL=postgresql+asyncpg://prod_user:secure_password@db-host:5432/oidfed_auth

# JWT Configuration
JWT_ISSUER=https://auth.yourdomain.com
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# Admin API
ADMIN_API_URL=https://api.yourdomain.com

# CORS (restrict to your domains)
ALLOWED_ORIGINS=https://app.yourdomain.com

# Security
DEBUG=false

# Keycloak (use production instance)
KEYCLOAK_ENABLED=true
KEYCLOAK_SERVER_URL=https://keycloak.yourdomain.com
KEYCLOAK_REALM=oidfed-prod
KEYCLOAK_CLIENT_ID=oidfed-registry
KEYCLOAK_CLIENT_SECRET=production-client-secret
```

### Production Checklist

- [ ] Change all default passwords
- [ ] Generate production JWT keys
- [ ] Use production database with backups
- [ ] Set `DEBUG=false`
- [ ] Configure CORS with specific origins
- [ ] Set up HTTPS/TLS
- [ ] Use production OIDC provider
- [ ] Configure logging and monitoring
- [ ] Set up rate limiting
- [ ] Configure firewall rules
- [ ] Set up health checks
- [ ] Configure session security

### Docker Production Build

```bash
cd auth-gateway

# Build production image
docker build -t oidfed-auth-gateway:1.0.0 .

# Run with production env
docker run -d \
  --name auth-gateway \
  -p 9000:9000 \
  --env-file .env.production \
  --restart unless-stopped \
  oidfed-auth-gateway:1.0.0
```

### Gunicorn Production Server

```bash
# Install gunicorn
pip install gunicorn

# Run with 4 workers
gunicorn src.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:9000 \
  --access-logfile /var/log/auth-gateway/access.log \
  --error-logfile /var/log/auth-gateway/error.log \
  --log-level info \
  --timeout 60 \
  --keepalive 5
```

### Systemd Service

Create `/etc/systemd/system/auth-gateway.service`:

```ini
[Unit]
Description=OIDFED Auth Gateway
After=network.target postgresql.service

[Service]
Type=notify
User=oidfed
Group=oidfed
WorkingDirectory=/opt/auth-gateway
Environment="PATH=/opt/auth-gateway/venv/bin"
EnvironmentFile=/opt/auth-gateway/.env.production
ExecStart=/opt/auth-gateway/venv/bin/gunicorn src.main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:9000 \
  --access-logfile /var/log/auth-gateway/access.log \
  --error-logfile /var/log/auth-gateway/error.log
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable auth-gateway
sudo systemctl start auth-gateway
sudo systemctl status auth-gateway
```

### Nginx Reverse Proxy

```nginx
upstream auth_gateway {
    server 127.0.0.1:9000;
}

server {
    listen 443 ssl http2;
    server_name auth.yourdomain.com;

    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://auth_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:9000/health
```

Response:
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0"
}
```

### Prometheus Metrics

Add to `requirements.txt`:
```
prometheus-fastapi-instrumentator==6.1.0
```

Add to `src/main.py`:
```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app)
```

Access metrics at: `http://localhost:9000/metrics`

### Logging

Configure structured logging in production:

```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
        })

# Configure in main.py
logging.basicConfig(
    level=logging.INFO,
    handlers=[logging.StreamHandler()],
)
for handler in logging.root.handlers:
    handler.setFormatter(JSONFormatter())
```

## Troubleshooting

### JWT Key Errors

```bash
# Regenerate keys
cd auth-gateway
python src/config/keys/generate_keys.py

# Verify keys exist
ls -la src/config/keys/
# Should see: private_key.pem, public_key.pem
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
psql postgresql://oidfed:oidfed@localhost:5432/oidfed_auth

# View logs
docker-compose logs postgres
```

### Keycloak Integration Issues

```bash
# Verify Keycloak is accessible
curl http://localhost:8080/realms/oidfed/.well-known/openid-configuration

# Check client configuration
# 1. Verify client secret in .env matches Keycloak
# 2. Verify redirect URIs are configured
# 3. Check realm name is correct
```

### CORS Errors

Add frontend origin to `.env`:
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://app.yourdomain.com
```

### Token Validation Errors

```bash
# Check token with userinfo endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:9000/auth/userinfo

# Decode JWT (use jwt.io)
# Check:
# - Token not expired (exp claim)
# - Correct issuer (iss claim)
# - Valid signature
```

## Testing

### Test Local Authentication

```bash
# Login
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:9000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=admin" \
  -d "password=admin123")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r .access_token)

# Get user info
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:9000/auth/userinfo
```

### Test Admin API Proxy

```bash
# List users (requires admin role)
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:9000/admin/users

# Proxy to Admin API
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:9000/api/some-endpoint
```

### Test Token Refresh

```bash
REFRESH_TOKEN=$(echo $TOKEN_RESPONSE | jq -r .refresh_token)

curl -X POST http://localhost:9000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=$REFRESH_TOKEN"
```

## Support

- Issues: GitHub Issues
- Documentation: README.md
- API Docs: http://localhost:9000/docs
