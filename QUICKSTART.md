# 🚀 Quick Start - Auth Service Integration

## What Was Implemented

✅ **Phase 1 MVP Complete:**
- Local password authentication via Auth Service
- Keycloak SSO with OIDC/OAuth 2.0 + PKCE
- Secure token management with automatic refresh
- Session timeout warnings
- Clean, extensible architecture

---

## 🏃 Quick Start

### 1. Install Dependencies (Already Done)
```bash
bun install
```

Dependencies added:
- `oidc-client-ts@3.4.1` - OIDC client library
- `jose@6.1.2` - JWT utilities

### 2. Configure Environment

Create `.env.local`:
```bash
cp .env.example .env.local
```

**For development without Auth Gateway** (uses existing DevAuth):
```env
VITE_LOCAL_AUTH_ENABLED=true
VITE_KEYCLOAK_ENABLED=false
```

**For full Auth Service integration** (when backend is ready):
```env
VITE_AUTH_SERVICE_URL=http://localhost:9000
VITE_API_BASE_URL=http://localhost:9000/api
VITE_LOCAL_AUTH_ENABLED=true
VITE_KEYCLOAK_ENABLED=true
VITE_OIDC_CLIENT_ID=oidfed-registry-ui
VITE_OIDC_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 3. Run Development Server
```bash
bun --hot src/index.ts
```

Visit: http://localhost:3000/login

---

## 🔄 Switching Between Auth Modes

### Use DevAuth (Current Behavior)
The app will automatically use `DevAuth` if:
- No environment variables are set, OR
- Auth Service is not reachable

DevAuth accepts any credentials (no validation).

### Use OIDC Auth (Auth Service)
To switch to OIDC authentication, modify `src/lib/auth.ts`:

```typescript
export function getAuth(): AuthProvider {
  if (!authInstance) {
    // Check if OIDC should be used
    const useOIDC = import.meta.env.VITE_KEYCLOAK_ENABLED === 'true';
    
    if (useOIDC) {
      const { createOIDCAuth } = require('./oidcAuth');
      authInstance = createOIDCAuth('keycloak');
    } else {
      authInstance = new DevAuth();
    }
  }
  return authInstance;
}
```

Or dynamically switch based on user action (login page already supports both).

---

## 📋 Login Page Behavior

The login page now shows:

**When `VITE_LOCAL_AUTH_ENABLED=true`:**
- Username/password form
- Calls Auth Service `POST /auth/token` with `grant_type=password`

**When `VITE_KEYCLOAK_ENABLED=true`:**
- "Continue with SSO Login" button
- Redirects to Auth Service `/auth/authorize`
- OIDC flow with PKCE

**If both enabled:**
- Shows both options with "OR" divider

**If Auth Service unavailable:**
- Login attempts will fail with error message
- Fallback to DevAuth by disabling OIDC in `.env.local`

---

## 🧪 Testing Modes

### Mode 1: DevAuth (No Backend Required)
```env
VITE_KEYCLOAK_ENABLED=false
```
- Any username/password works
- No real authentication
- Good for UI development

### Mode 2: Local Auth via Auth Service
```env
VITE_AUTH_SERVICE_URL=http://localhost:9000
VITE_LOCAL_AUTH_ENABLED=true
VITE_KEYCLOAK_ENABLED=false
```
- Real password validation
- JWT tokens issued by Auth Service
- Requires Auth Service running

### Mode 3: Full OIDC (Auth Service + Keycloak)
```env
VITE_AUTH_SERVICE_URL=http://localhost:9000
VITE_LOCAL_AUTH_ENABLED=true
VITE_KEYCLOAK_ENABLED=true
```
- Both local and SSO login available
- Keycloak integration for federated login
- Requires both Auth Service and Keycloak running

---

## 🏗️ Architecture Overview

```
Frontend (this repo)
    ├── Login page with dual mode
    ├── PKCE implementation
    ├── Token manager (auto-refresh)
    ├── Session timeout warnings
    └── OAuth callback handler
         │
         ▼
Auth Service (user management)
    ├── Local auth (password verification)
    ├── Keycloak OIDC proxy
    ├── JWT issuance (RS256)
    ├── Token refresh endpoint
    └── User management API
         │
         ▼
Admin API (federation entities)
    └── Validates JWT from Auth Service
```

---

## 📂 Key Files Created

### Core Authentication
- `src/lib/oidcAuth.ts` - OIDC AuthProvider
- `src/lib/tokenManager.ts` - Token storage & refresh
- `src/lib/pkce.ts` - PKCE utilities
- `src/types/auth.ts` - Type definitions

### UI Components
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/SSOLoginButton.tsx`
- `src/components/auth/SessionTimeout.tsx`
- `src/components/auth/LoginDivider.tsx`

### Configuration
- `src/config/oidc.config.ts`
- `src/lib/providers/keycloak.config.ts`
- `.env.example`

### Routing
- `src/app/AuthCallback.tsx` - OAuth callback handler
- Updated `src/app/App.tsx` with `/auth/callback` route

---

## 🔧 Customization

### Add Another OIDC Provider (e.g., Google)

1. Create provider config:
```typescript
// src/lib/providers/google.config.ts
export const googleConfig: OIDCProviderConfig = {
  id: 'google',
  name: 'Google',
  authority: 'https://accounts.google.com',
  client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  // ... rest of config
};
```

2. Register in `src/config/oidc.config.ts`:
```typescript
export const oidcProviders = {
  local: null,
  keycloak: keycloakConfig,
  google: googleConfig, // Add here
};
```

3. Add environment variable:
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_ENABLED=true
```

4. Login page automatically shows the button!

### Customize Token Refresh Timing

In `src/lib/tokenManager.ts`:
```typescript
// Change refresh buffer (default: 60 seconds before expiry)
const expiryBuffer = 60 * 1000; // Change this value
```

In `src/hooks/useTokenRefresh.ts`:
```typescript
// Change auto-refresh schedule
useTokenRefresh({ 
  refreshBeforeSeconds: 120 // Refresh 2 min before expiry
});
```

---

## 🐛 Common Issues

### Issue: "Cannot find module '@/lib/oidcAuth'"
**Solution**: Build cache issue, restart dev server:
```bash
bun --hot src/index.ts
```

### Issue: Login redirects to Auth Service but fails
**Cause**: Auth Service not running or CORS not configured

**Solution**: 
1. Verify Auth Service is running on port 9000
2. Check Auth Service CORS allows `http://localhost:3000`
3. Check browser console for CORS errors

### Issue: Token refresh fails repeatedly
**Cause**: Refresh token expired or Auth Service key mismatch

**Solution**:
1. Clear sessionStorage: `sessionStorage.clear()`
2. Re-login
3. Check Auth Service JWT signing key

### Issue: Session timeout warning shows immediately
**Cause**: Token expiry time is very short

**Solution**: Increase token lifetime in Auth Service config

---

## 📊 Project Status

✅ **Completed:**
- OIDC/OAuth 2.0 client implementation
- PKCE for secure authorization
- Token management with auto-refresh
- Session timeout monitoring
- Login UI with dual mode
- OAuth callback handler
- API integration with token injection

⏳ **Pending (requires Auth Service):**
- Real authentication endpoints
- User management UI
- Account registration page
- Password reset flow
- Admin user CRUD

---

## 🔜 Next: Implement Auth Service Backend

See `AUTH_GATEWAY_INTEGRATION.md` for:
- Required Auth Service endpoints
- JWT claims structure
- OIDC discovery configuration
- Keycloak integration guide
- User database schema

---

## ✅ Build Status

```bash
$ bun run build
✅ Build completed in 501.85ms
```

All TypeScript errors resolved, production build working!

---

## 📞 Questions?

Refer to:
- `AUTH_GATEWAY_INTEGRATION.md` - Full implementation guide
- `.env.example` - All environment variables
- `src/lib/oidcAuth.ts` - OIDC flow implementation
- `src/lib/tokenManager.ts` - Token management logic
