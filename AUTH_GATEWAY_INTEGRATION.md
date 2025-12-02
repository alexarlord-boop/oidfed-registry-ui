# Auth Gateway Integration - Phase 1 MVP

## ✅ Implementation Complete

Phase 1 MVP of the Auth Gateway integration has been successfully implemented. This provides:
- **Local password authentication** via Auth Gateway
- **OIDC/Keycloak SSO** support with PKCE
- **Secure token management** with automatic refresh
- **Session timeout warnings**
- **Clean AuthProvider interface** for easy extension

---

## 📁 Files Created

### Core Authentication (`src/lib/`)
- `pkce.ts` - PKCE challenge/verifier generation (RFC 7636)
- `tokenManager.ts` - Secure token storage with auto-refresh
- `oidcAuth.ts` - OIDC AuthProvider implementation
- `providers/keycloak.config.ts` - Keycloak OIDC configuration

### Types (`src/types/`)
- `auth.ts` - TypeScript types for OIDC, tokens, and user profiles

### Configuration (`src/config/`)
- `oidc.config.ts` - Multi-provider OIDC configuration

### UI Components (`src/components/auth/`)
- `LoginForm.tsx` - Local username/password form
- `SSOLoginButton.tsx` - OIDC login button component
- `LoginDivider.tsx` - Visual separator ("OR")
- `SessionTimeout.tsx` - Session expiry warning dialog

### Routing (`src/app/`)
- `AuthCallback.tsx` - OAuth callback handler for code exchange

### Hooks (`src/hooks/`)
- `useTokenRefresh.ts` - Automatic token refresh hook

---

## 📝 Files Modified

### API Integration
- `src/api/apiFetcher.ts` - Added automatic token injection and refresh
- `src/api/environment.ts` - Added Auth Gateway URL configuration

### Pages
- `src/pages/login/index.tsx` - Updated with dual login (local + SSO)

### Routing
- `src/app/App.tsx` - Added `/auth/callback` route
- `src/app/layout.tsx` - Imported Routes for callback

### Auth Guards
- `src/components/auth/RequireAuth.tsx` - Added session timeout monitoring

### Configuration
- `.env.example` - Environment variable template

---

## 🔐 Architecture

```
┌─────────────────────┐
│   Frontend (UI)     │
│   Port: 3000        │
│                     │
│  • Local Login      │──┐
│  • SSO Login        │──┤
│  • Token Refresh    │  │
└─────────────────────┘  │
         │               │
         │ 1. Login      │
         │ 2. OIDC Flow  │
         ▼               ▼
┌─────────────────────────────┐
│    Auth Gateway (FastAPI)   │
│    Port: 9000               │
│                             │
│  ┌────────────────────┐     │
│  │  Local Auth        │     │ ← Password verification
│  │  (bcrypt)          │     │
│  └────────────────────┘     │
│                             │
│  ┌────────────────────┐     │
│  │  OIDC Provider     │─────┼─→ Keycloak
│  │  (Keycloak)        │     │   Port: 8080
│  └────────────────────┘     │
│                             │
│  Issues JWT (RS256)         │
│  • sub: user-id             │
│  • email, roles, org_id     │
│  • iss: auth-gateway        │
│  • aud: admin-api           │
└──────────┬──────────────────┘
           │
           │ 3. Proxied API calls
           │    with JWT
           ▼
┌─────────────────────────────┐
│      Admin API              │
│      Port: 8765             │
│                             │
│  Validates JWT signature    │
│  using Auth Gateway's       │
│  public key (JWKS)          │
│                             │
│  [NO CHANGES NEEDED]        │
└─────────────────────────────┘
```

---

## 🚀 Usage

### 1. Configure Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Auth Gateway
VITE_AUTH_GATEWAY_URL=http://localhost:9000

# Admin API (proxied through gateway)
VITE_API_BASE_URL=http://localhost:9000/api

# Enable local password login
VITE_LOCAL_AUTH_ENABLED=true

# OIDC Configuration
VITE_OIDC_CLIENT_ID=oidfed-registry-ui
VITE_OIDC_SCOPE=openid profile email roles
VITE_OIDC_REDIRECT_URI=http://localhost:3000/auth/callback

# Enable Keycloak SSO
VITE_KEYCLOAK_ENABLED=true
```

### 2. Start Development Server

```bash
bun --hot src/index.ts
```

### 3. Login Options

**Local Password Login:**
- Username/email and password
- Calls `POST /auth/token` with `grant_type=password`

**SSO Login (Keycloak):**
- Click "Continue with SSO Login"
- Redirects to Auth Gateway `/auth/authorize`
- Gateway redirects to Keycloak
- After authentication, returns to `/auth/callback`
- Exchanges code for tokens

---

## 🔑 Token Flow

### Local Login
```
1. User submits username/password
2. POST /auth/token (grant_type=password)
3. Auth Gateway validates credentials
4. Returns: { access_token, refresh_token, expires_in }
5. Tokens stored in memory + sessionStorage
6. API requests use Bearer token
```

### OIDC Login
```
1. User clicks "Continue with SSO"
2. Generate PKCE code_verifier + code_challenge
3. Redirect to /auth/authorize?
   - code_challenge
   - state (CSRF protection)
   - redirect_uri
4. Auth Gateway → Keycloak login
5. Keycloak → callback with code
6. POST /auth/token (grant_type=authorization_code)
   - code
   - code_verifier (PKCE)
7. Returns: { access_token, refresh_token, id_token }
8. Decode id_token for user info
9. Store tokens securely
```

### Token Refresh
```
1. API request triggered
2. apiFetcher checks token expiry
3. If < 60s remaining, refresh automatically
4. POST /auth/token (grant_type=refresh_token)
5. Get new access_token
6. Retry original API request
```

---

## 🔐 Security Features

### PKCE (Proof Key for Code Exchange)
- Generates random `code_verifier` (256 bits)
- Computes `code_challenge` = SHA256(code_verifier)
- Prevents authorization code interception attacks
- Required for public clients (SPAs)

### Token Storage
- **Access tokens**: Memory only (cleared on page refresh)
- **Refresh tokens**: sessionStorage (survives refresh, cleared on tab close)
- **Better than localStorage**: Less XSS risk
- **Future**: HttpOnly cookies from Auth Gateway

### CSRF Protection
- Random `state` parameter in OAuth flow
- Validated on callback
- Prevents cross-site request forgery

### Session Management
- Automatic token refresh before expiry
- Session timeout warnings (2 min before expiry)
- User can extend session or logout
- Activity tracking

---

## 🎯 Auth Gateway Requirements

The Auth Gateway backend must implement these endpoints:

### OAuth/OIDC Endpoints
```
GET  /auth/authorize           - Start OIDC flow
POST /auth/token               - Token endpoint (code exchange, refresh, password grant)
GET  /auth/userinfo            - User profile endpoint
POST /auth/logout              - Logout endpoint
GET  /.well-known/openid-configuration  - OIDC discovery
GET  /.well-known/jwks.json    - Public keys for JWT validation
```

### Token Endpoint Grant Types
```
1. password (local login)
   - username, password, client_id
   
2. authorization_code (OIDC callback)
   - code, redirect_uri, client_id, code_verifier
   
3. refresh_token (token refresh)
   - refresh_token, client_id
```

### JWT Claims (Required)
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "preferred_username": "username",
  "roles": ["technical-contact"],
  "org_id": "org-123",
  "iss": "http://localhost:9000",
  "aud": "admin-api",
  "exp": 1700000000,
  "iat": 1699999400
}
```

---

## 📋 Testing Checklist

### Local Login
- [ ] Submit empty form → validation error
- [ ] Submit wrong credentials → error message
- [ ] Submit correct credentials → redirect to dashboard
- [ ] Refresh page → session restored
- [ ] Close tab → session lost
- [ ] Token expires → automatic refresh
- [ ] Logout → tokens cleared

### SSO Login (Keycloak)
- [ ] Click SSO button → redirect to Keycloak
- [ ] Cancel at Keycloak → return to login with error
- [ ] Complete Keycloak login → redirect back to app
- [ ] Exchange code for tokens → success
- [ ] User info fetched → profile displayed
- [ ] Tokens stored → API calls work
- [ ] PKCE validation → code_verifier matches challenge

### Session Management
- [ ] Token < 2 min expiry → warning dialog shows
- [ ] Click "Extend session" → token refreshed, dialog closes
- [ ] Click "Sign out" → logout, redirect to login
- [ ] Token refresh fails → logout, redirect to login
- [ ] API call with expired token → automatic refresh → retry

### Security
- [ ] Access tokens not in localStorage
- [ ] Refresh tokens in sessionStorage only
- [ ] PKCE code_verifier not exposed
- [ ] State parameter validated on callback
- [ ] Invalid state → error
- [ ] Tampered JWT → API rejects

---

## 🐛 Troubleshooting

### "No authorization state found"
- User landed on `/auth/callback` without going through login
- Solution: Start login flow from `/login`

### "State mismatch"
- CSRF attack or expired auth state
- Solution: Restart login flow

### "Token refresh failed"
- Refresh token expired or invalid
- Solution: User must re-authenticate

### "Failed to fetch user info"
- Access token invalid or Auth Gateway down
- Solution: Check Auth Gateway logs, verify JWT signature

### CORS errors
- Auth Gateway not allowing frontend origin
- Solution: Add `http://localhost:3000` to Auth Gateway CORS config

---

## 🔜 Next Steps

### Phase 2: User Management UI
- [ ] Admin page for FedOP operators
- [ ] User CRUD (create, read, update, delete)
- [ ] Role assignment
- [ ] Account approval workflow
- [ ] User registration page

### Phase 3: Additional Providers
- [ ] Google OAuth
- [ ] Microsoft/Azure AD
- [ ] Apple Sign In
- [ ] Account linking (multiple providers → one user)

### Phase 4: Security Hardening
- [ ] HttpOnly cookies for refresh tokens
- [ ] Content Security Policy headers
- [ ] Rate limiting on login attempts
- [ ] MFA (TOTP, WebAuthn)
- [ ] Session management UI

---

## 📚 References

- [RFC 6749 - OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7636 - PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [oidc-client-ts Documentation](https://github.com/authts/oidc-client-ts)

---

## 📞 Support

If Auth Gateway is not implemented yet, the UI will:
- Show login form but API calls will fail (no backend)
- OIDC flow will fail at redirect (no /auth/authorize endpoint)

**Temporary workaround**: Keep using `PasswordAuth` by not switching to `OIDCAuth` in production.

The implementation is **ready for Auth Gateway** when it's available!
