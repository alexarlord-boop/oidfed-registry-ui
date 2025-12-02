# Auth Gateway - Integration Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            OIDFED Auth Gateway                               │
│                         Complete Implementation                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────┐                                      ┌─────────────────┐
│  Browser (User)    │                                      │  Admin User     │
│                    │                                      │  (via browser)  │
└─────────┬──────────┘                                      └────────┬────────┘
          │                                                          │
          │ 1. Visit login page                                     │
          │                                                          │
          ▼                                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Frontend (React + TypeScript)                           │
│                      Port: 3000 / 5173                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Phase 1 MVP (✅ Completed):                                                 │
│  • OIDC Client (oidc-client-ts)                                             │
│  • Token Manager (auto-refresh)                                             │
│  • PKCE Implementation (RFC 7636)                                           │
│  • Login UI (local + SSO modes)                                             │
│  • Session Timeout Warnings                                                 │
│  • OAuth Callback Handler                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
          │                                      ▲
          │ 2a. Local Auth:                     │ 6. Tokens returned
          │    POST /auth/token                  │    {access, refresh, id}
          │    grant_type=password               │
          │                                      │
          │ 2b. Federated Auth:                 │
          │    GET /auth/authorize               │
          │    (with PKCE challenge)             │
          │                                      │
          ▼                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Auth Gateway (FastAPI)                                  │
│                      Port: 9000                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ API Routes (src/api/)                                         │          │
│  │ • auth.py     → /auth/token, /auth/authorize, /auth/userinfo │          │
│  │ • oidc.py     → /.well-known/openid-configuration, /jwks.json│          │
│  │ • users.py    → /users/me, /users/{id}                       │          │
│  │ • admin.py    → /admin/users (CRUD)                          │          │
│  │ • proxy.py    → /api/* (proxy to Admin API)                  │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ Services (src/services/)                                      │          │
│  │ • jwt_service.py      → RS256 signing, JWKS, validation      │          │
│  │ • password_service.py → Bcrypt hashing                       │          │
│  │ • user_service.py     → User CRUD operations                 │          │
│  │ • oidc_service.py     → Keycloak integration                 │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ Middleware (src/middleware/)                                  │          │
│  │ • auth_middleware.py  → JWT validation, user injection       │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │ Models (src/models/)                                          │          │
│  │ • user.py    → User (local + OIDC)                           │          │
│  │ • session.py → Refresh Token Sessions                        │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
          │                │                     ▲                  │
          │ 3a. Local:     │ 3b. Federated:      │                  │
          │ Check DB       │ Redirect to         │ 5. Get user      │
          │                │ Keycloak            │ info             │
          │                │                     │                  │
          ▼                ▼                     │                  ▼
┌─────────────────┐  ┌──────────────────────────┴───────┐  ┌────────────────┐
│  PostgreSQL     │  │  Keycloak                          │  │  Admin API     │
│  Port: 5432     │  │  Port: 8080 (optional)             │  │  Port: 8765    │
│                 │  │                                    │  │  (unchanged)   │
│  Tables:        │  │  • Manages federated users        │  │                │
│  • users        │  │  • OIDC Provider                  │  │  Validates JWT │
│  • sessions     │  │  • Returns user info              │  │  with public   │
│                 │  │  • Realm: oidfed                  │  │  key from      │
│  27 Python files│  │  • Client: oidfed-registry        │  │  /jwks.json    │
│  10+ config     │  │                                    │  │                │
└─────────────────┘  └────────────────────────────────────┘  └────────────────┘


Authentication Flows:
─────────────────────

1️⃣ Local Password Flow:
   Frontend → POST /auth/token (password grant)
   → Auth Gateway validates credentials against PostgreSQL
   → Returns JWT tokens
   → Frontend stores tokens
   → Frontend makes API calls with Authorization: Bearer <token>

2️⃣ Federated OIDC Flow (with PKCE):
   Frontend generates code_verifier & code_challenge
   → Redirects to /auth/authorize?code_challenge=...
   → Auth Gateway redirects to Keycloak
   → User logs in to Keycloak
   → Keycloak redirects back with authorization code
   → Frontend exchanges code for tokens (POST /auth/token with code_verifier)
   → Auth Gateway validates with Keycloak
   → Creates/updates user in PostgreSQL
   → Returns JWT tokens

3️⃣ Token Refresh Flow:
   Frontend detects token expiring soon (60s before)
   → POST /auth/token (refresh_token grant)
   → Auth Gateway validates refresh token
   → Issues new access token + new refresh token
   → Old refresh token is invalidated (one-time use)

4️⃣ Admin API Access:
   Frontend → ANY /api/* with Authorization: Bearer <token>
   → Auth Gateway validates JWT
   → Injects validated user context
   → Proxies to Admin API with X-User-ID, X-User-Roles headers
   → Admin API validates JWT signature with public key
   → Returns response


Token Types:
────────────

📄 Access Token (JWT, RS256, 15 min):
   {
     "sub": "user-uuid",
     "username": "admin",
     "email": "admin@example.com",
     "roles": ["admin"],
     "iss": "http://localhost:9000",
     "aud": "admin-api",
     "exp": 1234567890
   }

🆔 ID Token (OIDC, JWT, RS256, 15 min):
   {
     "sub": "user-uuid",
     "email": "admin@example.com",
     "preferred_username": "admin",
     "iss": "http://localhost:9000",
     "aud": "frontend",
     "exp": 1234567890
   }

🔄 Refresh Token (opaque, 30 days):
   Random UUID stored in sessions table with:
   • user_id reference
   • expires_at timestamp
   • user_agent, ip_address (tracking)


Security Features:
──────────────────

✅ RS256 JWT signing (asymmetric keys)
✅ PKCE for authorization code flow (SHA-256)
✅ Bcrypt password hashing (12 rounds)
✅ Refresh token rotation (one-time use)
✅ Session tracking (IP, user agent)
✅ CORS protection (configurable origins)
✅ Role-based authorization (admin, technical_contact)
✅ User approval flow for OIDC accounts
✅ Token expiration (access: 15min, refresh: 30d)
✅ Secure password storage (no plaintext)


Deployment Options:
───────────────────

Option 1: Docker Compose (Recommended)
   docker-compose up -d
   → Starts PostgreSQL + Auth Gateway
   → Ready in ~30 seconds

Option 2: Local Development
   ./setup.sh
   source venv/bin/activate
   docker-compose up -d postgres
   alembic upgrade head
   python scripts/seed.py
   uvicorn src.main:app --reload --port 9000

Option 3: Production (Systemd + Nginx)
   See DEPLOYMENT.md for:
   • Gunicorn with 4 workers
   • Nginx reverse proxy with HTTPS
   • Systemd service configuration
   • Production environment variables


File Counts:
────────────

Backend (auth-gateway/):
  27 Python files (src/)
  10+ configuration files
  3 documentation files
  2 Docker files
  1 setup script
  
Frontend (oidfed-registry-ui/):
  18 TypeScript/React files (Phase 1 MVP)
  Multiple updated files
  1 callback handler


API Endpoints Summary:
──────────────────────

Authentication:
  POST   /auth/token         OAuth 2.0 token endpoint
  GET    /auth/authorize     OAuth 2.0 authorization
  GET    /auth/userinfo      OIDC UserInfo endpoint
  POST   /auth/logout        Logout and revoke tokens

OIDC Discovery:
  GET    /.well-known/openid-configuration
  GET    /.well-known/jwks.json

User Management:
  GET    /users/me           Current user profile
  GET    /users/{id}         User by ID

Admin Operations (admin role required):
  GET    /admin/users        List all users
  POST   /admin/users        Create user
  PUT    /admin/users/{id}   Update user
  DELETE /admin/users/{id}   Delete user

Proxy:
  ANY    /api/*              Proxy to Admin API


Configuration Summary:
──────────────────────

Auth Gateway (.env):
  DATABASE_URL=postgresql+asyncpg://oidfed:oidfed@localhost:5432/oidfed_auth
  JWT_ISSUER=http://localhost:9000
  ADMIN_API_URL=http://localhost:8765
  ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
  KEYCLOAK_ENABLED=false (or true with full config)

Frontend (.env):
  VITE_AUTH_GATEWAY_URL=http://localhost:9000
  VITE_OAUTH_CLIENT_ID=frontend
  VITE_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
  VITE_ADMIN_API_URL=http://localhost:9000/api


Status: ✅ COMPLETE & READY FOR TESTING
───────────────────────────────────────

✅ Backend implementation (27 Python files)
✅ Frontend integration (18 TS/React files)
✅ Database migrations (Alembic)
✅ Docker setup (Compose + Dockerfile)
✅ Documentation (README, DEPLOYMENT, QUICKSTART)
✅ Test data seeding
✅ JWT key generation
✅ OIDC discovery endpoints
✅ Admin API proxy
✅ User management

⏳ Next: Testing & Production deployment
```
