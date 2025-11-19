# Auth Gateway Setup - Complete ✅

## Summary

Successfully implemented and tested a complete authentication system with:
- ✅ PostgreSQL database with user management
- ✅ Password authentication with bcrypt
- ✅ JWT-based session management (RS256)
- ✅ Authenticated proxy to Admin API
- ✅ CORS handling
- ✅ Database seeding with test users

---

## Architecture

```
Frontend (Bun:3000)
    │
    │ HTTP requests with JWT Bearer token
    │
    ▼
Auth Gateway (Docker:9000)
    │
    ├─ /auth/token       → Login, get JWT tokens
    ├─ /auth/userinfo    → Get user profile
    ├─ /api/*            → Proxy to Admin API (requires auth)
    └─ /subordinates*    → Proxy to Admin API (requires auth)
    │
    │ Validates JWT, proxies authenticated requests
    │
    ▼
Admin API / Prism Mock (host:8765)
    │
    └─ Returns mock data
```

---

## Test Users

| Username | Password | Roles |
|----------|----------|-------|
| `admin` | `admin123` | admin, technical_contact |
| `tc_alice` | `password123` | technical_contact |
| `tc_bob` | `password123` | technical_contact |

⚠️ **Change passwords in production!**

---

## Testing the Auth Flow

### 1. Login to get JWT token

```bash
curl -X POST http://localhost:9000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123&grant_type=password"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "01hQ2Ef4b6xIxWZaCNteHX...",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "scope": "openid profile email"
}
```

### 2. Test unauthenticated request (should fail)

```bash
curl -i http://localhost:9000/api/v1/admin/trust-marks/types
```

**Response:**
```
HTTP/1.1 401 Unauthorized
{"detail":"Not authenticated"}
```

### 3. Test authenticated request (should succeed)

```bash
TOKEN="<access_token from step 1>"

curl -i http://localhost:9000/api/v1/admin/trust-marks/types \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```
HTTP/1.1 200 OK
[{"id":"id","trust_mark_type":"https://example.org/trust_mark_type"}]
```

### 4. Test /subordinates endpoint

```bash
curl -i http://localhost:9000/subordinates \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```
HTTP/1.1 200 OK
[{"id":"id","entity_id":"https://subordinate.example.com","status":"active",...}]
```

---

## Key Implementation Details

### Database Schema
- **Table:** `users`
- **Fields:** id (UUID), username, email, password_hash, full_name, organization, roles (JSON), is_active, is_superuser, is_approved, oidc_sub, oidc_provider, timestamps
- **Password Hashing:** bcrypt with 72-byte truncation

### JWT Configuration
- **Algorithm:** RS256 (asymmetric keys)
- **Issuer:** `http://localhost:9000`
- **Audience:** `admin-api`
- **Expiry:** 900 seconds (15 minutes)
- **Claims:** sub (user ID), email, preferred_username, roles

### Proxy Endpoints
- **`/api/{path:path}`** - Proxies to `http://host.docker.internal:8765/api/{path}`
- **`/subordinates{path:path}`** - Proxies to `http://host.docker.internal:8765/subordinates{path}`
- Both require authentication via `Depends(get_current_user)`

### Docker Networking
- Auth Gateway runs in Docker, Admin API runs on host machine
- Uses `host.docker.internal:8765` to reach host from container
- PostgreSQL runs in Docker on internal network

---

## Files Modified

### Password Service
**`auth-gateway/src/services/password_service.py`**
- Changed from passlib to direct bcrypt usage
- Added 72-byte truncation for bcrypt compatibility
- Functions: `hash_password()`, `verify_password()`

### Proxy Configuration
**`auth-gateway/src/api/proxy.py`**
- Re-enabled authentication: `current_user: User = Depends(get_current_user)`
- Two proxy functions for `/api/*` and `/subordinates*`
- Both validate JWT tokens before forwarding requests

### Docker Compose
**`auth-gateway/docker-compose.yml`**
- ADMIN_API_URL set to `http://host.docker.internal:8765`
- Added scripts volume mount: `./scripts:/app/scripts`
- PostgreSQL with healthcheck

### Database Seeding
**`auth-gateway/scripts/seed.py`**
- Fixed to use `UserService` static methods
- Creates admin and two test users
- Idempotent (checks if users exist)

---

## Frontend Integration

The frontend is already configured to use the auth gateway:

### Environment Configuration
**`.env.local`**
```env
VITE_AUTH_GATEWAY_URL=http://localhost:9000
VITE_API_BASE_URL=http://localhost:9000
```

### API Client
**`generated/api/apiFetcher.ts`**
```typescript
const baseUrl = "http://localhost:9000"
```

### What's Working
- ✅ Frontend connects to auth gateway
- ✅ Generated API client uses correct base URL
- ✅ CORS handled by auth gateway
- ✅ Both `/api/*` and `/subordinates` paths work

### What Needs Frontend Work
- ⏸️ Login page needs to call `/auth/token` endpoint
- ⏸️ Token storage in memory/sessionStorage
- ⏸️ Automatic token refresh before expiry
- ⏸️ Inject Bearer token in API requests
- ⏸️ Handle 401 errors (redirect to login)

See `AUTH_GATEWAY_INTEGRATION.md` for detailed frontend implementation guide.

---

## Running the Full Stack

### 1. Start Auth Gateway (with database)
```bash
cd auth-gateway
docker compose up -d
```

### 2. Seed Database (if not already done)
```bash
docker compose exec auth-gateway python scripts/seed.py
```

### 3. Start Prism Mock Server
```bash
# In a separate terminal
prism mock -p 8765 federation_admin_openapi.yaml
```

### 4. Start Frontend
```bash
# In project root
bun --hot src/index.ts
```

### 5. Test the Flow
Open browser to `http://localhost:3000` and:
1. Navigate to login page
2. Enter credentials: `admin` / `admin123`
3. On successful login, JWT should be stored
4. API requests should include `Authorization: Bearer <token>`
5. Auth gateway validates token and proxies to Admin API

---

## Common Commands

### View Auth Gateway Logs
```bash
cd auth-gateway
docker compose logs -f auth-gateway
```

### View Database
```bash
docker compose exec postgres psql -U postgres -d auth_gateway
\dt          # List tables
SELECT * FROM users;
```

### Reset Database
```bash
docker compose down -v    # Remove volumes
docker compose up -d      # Recreate
docker compose exec auth-gateway python scripts/seed.py
```

### Restart Auth Gateway
```bash
docker compose restart auth-gateway
```

---

## Security Considerations

### Production Checklist
- [ ] Change all default passwords
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS (TLS certificates)
- [ ] Restrict CORS origins
- [ ] Set secure JWT expiry times
- [ ] Rotate signing keys periodically
- [ ] Enable rate limiting on auth endpoints
- [ ] Implement MFA (optional)
- [ ] Use HttpOnly cookies for refresh tokens
- [ ] Enable database backups
- [ ] Monitor failed login attempts
- [ ] Implement account lockout after X failures

### JWT Security
- ✅ RS256 asymmetric keys (private key for signing, public key for validation)
- ✅ Short-lived access tokens (15 min)
- ✅ Longer-lived refresh tokens (can be revoked)
- ✅ Audience validation (admin-api)
- ✅ Issuer validation (auth gateway)

---

## Troubleshooting

### "Connection refused" on port 8765
- Ensure Prism mock server is running: `prism mock -p 8765 federation_admin_openapi.yaml`
- Check that auth gateway uses `host.docker.internal:8765`

### "401 Unauthorized"
- Check if you're sending `Authorization: Bearer <token>` header
- Verify token hasn't expired (check `exp` claim)
- Try getting a new token with `/auth/token`

### "502 Bad Gateway"
- Auth gateway can't reach Admin API
- Check Docker networking and `ADMIN_API_URL` setting
- Verify Prism is running and accessible

### Database Connection Errors
- Check PostgreSQL container is healthy: `docker compose ps`
- View logs: `docker compose logs postgres`
- Verify connection string in `docker-compose.yml`

### Password Hash Errors
- Ensure password service uses bcrypt directly (not passlib)
- Verify 72-byte truncation is in place
- Check `bcrypt` package is installed in container

---

## Next Steps

### Phase 2: Frontend Integration
1. Implement login form calling `/auth/token`
2. Store JWT tokens securely (memory + sessionStorage)
3. Add token refresh logic (before expiry)
4. Inject tokens in API requests
5. Handle 401 responses (redirect to login)
6. Add logout functionality

### Phase 3: User Management
1. Admin UI for user CRUD operations
2. User registration endpoint
3. Email verification
4. Password reset flow
5. Account approval workflow

### Phase 4: OIDC Integration
1. Keycloak setup and configuration
2. OIDC authorization flow
3. PKCE implementation
4. Social login providers (Google, Microsoft)
5. Account linking

---

## References

- Docker Compose config: `auth-gateway/docker-compose.yml`
- Database models: `auth-gateway/src/models/user.py`
- Auth API: `auth-gateway/src/api/auth.py`
- Proxy API: `auth-gateway/src/api/proxy.py`
- Password service: `auth-gateway/src/services/password_service.py`
- JWT service: `auth-gateway/src/services/jwt_service.py`
- Seed script: `auth-gateway/scripts/seed.py`

---

**Status:** ✅ Auth Gateway is fully functional with database-backed authentication and authenticated proxy to Admin API.

**Date:** 2025-11-19
