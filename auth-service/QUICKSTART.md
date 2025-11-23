# 🚀 Quick Reference - OIDFED Auth Gateway

## Start Development (30 seconds)

```bash
cd auth-gateway
docker-compose up -d
# ✅ Auth Gateway: http://localhost:9000/docs
```

## Common Commands

### Docker
```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f auth-gateway

# Restart after code changes
docker-compose restart auth-gateway

# Stop everything
docker-compose down

# Reset database (⚠️ destroys data)
docker-compose down -v && docker-compose up -d
```

### Local Development
```bash
# Setup (first time only)
./setup.sh
source venv/bin/activate

# Start database
docker-compose up -d postgres

# Run migrations
alembic upgrade head

# Seed test users
python scripts/seed.py

# Start server (auto-reload)
uvicorn src.main:app --reload --port 9000
```

### Database Migrations
```bash
# Apply migrations
alembic upgrade head

# Create new migration (after model changes)
alembic revision --autogenerate -m "Description"

# Rollback last migration
alembic downgrade -1

# View history
alembic history
```

## API Quick Tests

### Login (Local)
```bash
curl -X POST http://localhost:9000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=admin" \
  -d "password=admin123"
```

### Get User Info
```bash
TOKEN="your_access_token_here"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9000/auth/userinfo
```

### List Users (Admin Only)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:9000/admin/users
```

### Refresh Token
```bash
curl -X POST http://localhost:9000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=your_refresh_token"
```

## Test Credentials

| Username  | Password    | Roles                     |
|-----------|-------------|---------------------------|
| admin     | admin123    | admin, technical_contact  |
| tc_alice  | password123 | technical_contact         |
| tc_bob    | password123 | technical_contact         |

## Key URLs

- **API Docs (Swagger)**: http://localhost:9000/docs
- **API Docs (ReDoc)**: http://localhost:9000/redoc
- **OIDC Discovery**: http://localhost:9000/.well-known/openid-configuration
- **JWKS**: http://localhost:9000/.well-known/jwks.json
- **Keycloak** (if running): http://localhost:8080 (admin/admin)

## Environment Variables (Quick Reference)

```bash
DATABASE_URL=postgresql+asyncpg://oidfed:oidfed@localhost:5432/oidfed_auth
JWT_ISSUER=http://localhost:9000
ADMIN_API_URL=http://localhost:8765
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
DEBUG=true
```

## Troubleshooting

### "Database connection failed"
```bash
# Check PostgreSQL is running
docker-compose ps postgres
# Restart it
docker-compose restart postgres
```

### "JWT key not found"
```bash
# Generate keys
python src/config/keys/generate_keys.py
```

### "Import errors"
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

### "Port 9000 already in use"
```bash
# Find process
lsof -ti:9000
# Kill it
kill -9 $(lsof -ti:9000)
```

### "Alembic can't find migrations"
```bash
# Reset migration state
docker-compose down -v
docker-compose up -d postgres
alembic upgrade head
python scripts/seed.py
```

## Project Structure (Key Files)

```
auth-gateway/
├── src/
│   ├── main.py                    # ⭐ FastAPI app
│   ├── api/
│   │   ├── auth.py               # 🔑 Login endpoints
│   │   ├── oidc.py               # 🌐 OIDC discovery
│   │   ├── admin.py              # 👤 User management
│   │   └── proxy.py              # 🚪 Admin API proxy
│   ├── config/
│   │   └── settings.py           # ⚙️ Configuration
│   ├── models/
│   │   ├── user.py               # 📊 User table
│   │   └── session.py            # 📊 Session table
│   └── services/
│       ├── jwt_service.py        # 🎫 JWT operations
│       └── oidc_service.py       # 🔗 Keycloak client
├── alembic/                       # 🗄️ Migrations
├── scripts/seed.py                # 🌱 Test data
└── docker-compose.yml             # 🐳 Docker setup
```

## OAuth 2.0 Grant Types Supported

1. **Password Grant** (local auth):
   ```
   grant_type=password
   username=...
   password=...
   ```

2. **Authorization Code** (OIDC):
   ```
   grant_type=authorization_code
   code=...
   redirect_uri=...
   code_verifier=...  # PKCE
   ```

3. **Refresh Token**:
   ```
   grant_type=refresh_token
   refresh_token=...
   ```

## JWT Claims

### Access Token
```json
{
  "sub": "user-uuid",
  "username": "admin",
  "email": "admin@example.com",
  "roles": ["admin"],
  "iss": "http://localhost:9000",
  "aud": "admin-api",
  "exp": 1234567890,
  "iat": 1234567000
}
```

### ID Token (OIDC)
```json
{
  "sub": "user-uuid",
  "email": "admin@example.com",
  "preferred_username": "admin",
  "iss": "http://localhost:9000",
  "aud": "frontend",
  "exp": 1234567890,
  "iat": 1234567000
}
```

## Frontend Integration

**Environment** (oidfed-registry-ui/.env):
```bash
VITE_AUTH_GATEWAY_URL=http://localhost:9000
VITE_OAUTH_CLIENT_ID=frontend
VITE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_OAUTH_AUTHORIZATION_ENDPOINT=http://localhost:9000/auth/authorize
VITE_OAUTH_TOKEN_ENDPOINT=http://localhost:9000/auth/token
VITE_ADMIN_API_URL=http://localhost:9000/api
```

**Login Flow**:
1. User clicks "Login"
2. Frontend redirects to `/auth/authorize` (with PKCE)
3. Auth Gateway redirects to Keycloak (or shows local login)
4. User authenticates
5. Redirect back to frontend `/auth/callback?code=...`
6. Frontend exchanges code for tokens
7. Frontend stores tokens in memory/sessionStorage
8. Frontend uses access token for API calls

## Status Codes

| Code | Meaning                        |
|------|--------------------------------|
| 200  | OK                             |
| 201  | Created                        |
| 400  | Bad request (validation error) |
| 401  | Unauthorized (no/invalid token)|
| 403  | Forbidden (insufficient role)  |
| 404  | Not found                      |
| 409  | Conflict (duplicate user)      |
| 500  | Internal server error          |

## Error Responses

```json
{
  "error": "invalid_grant",
  "error_description": "Invalid username or password"
}
```

Common error codes:
- `invalid_grant` - Bad credentials
- `invalid_token` - Token expired/invalid
- `insufficient_permissions` - Need admin role
- `account_pending_approval` - OIDC user not approved
- `account_inactive` - User account disabled

## Production Checklist

- [ ] Change default passwords (admin, test users)
- [ ] Generate production JWT keys
- [ ] Set `DEBUG=false`
- [ ] Configure production database
- [ ] Set specific CORS origins
- [ ] Set up HTTPS/TLS
- [ ] Configure log aggregation
- [ ] Set up monitoring
- [ ] Enable rate limiting
- [ ] Review security settings

## Need Help?

- 📚 Full docs: `README.md`, `DEPLOYMENT.md`, `IMPLEMENTATION.md`
- 🔍 API docs: http://localhost:9000/docs
- 🐛 Issues: GitHub Issues
- 💬 Questions: Project maintainers

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-16
