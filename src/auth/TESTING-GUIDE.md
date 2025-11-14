# Testing Guide: Unified Authentication System

This guide shows how to test all authentication adapters without code changes - just environment variables and configuration.

## Prerequisites

Make sure your auth system is integrated (which it already is based on the changes we made):
- `AuthProvider` wraps your app
- Login page uses unified auth hooks
- API fetcher uses auth headers automatically

## 1. Testing Development Authentication

### Setup
```bash
# Terminal 1: Set development environment
export NODE_ENV=development
# or create .env.development file:
echo "NODE_ENV=development" > .env.development

# Start the development server
bun --hot src/index.ts
```

### Test Cases
```bash
# Open browser to http://localhost:3000

# Test Case 1: Default credentials
Username: admin
Password: admin
Expected: ✅ Login successful, redirects to dashboard

# Test Case 2: Any other credentials  
Username: test
Password: anything
Expected: ✅ Login successful (dev mode accepts anything)

# Test Case 3: Empty credentials
Username: 
Password: 
Expected: ❌ "Username and password required"

# Test Case 4: Check dev mode indicator
Expected: See "Development Mode: Any credentials accepted" message

# Test Case 5: Check token storage
# In browser console:
localStorage.getItem('API_BEARER')
# Expected: See generated JWT token
```

## 2. Testing Basic Authentication

### Setup
```bash
# Terminal 1: Mock API server (for testing)
# Create a simple mock auth server
cat > mock-auth-server.js << 'EOF'
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  
  if (req.method === 'POST' && parsedUrl.pathname === '/api/auth/login') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      const { username, password } = JSON.parse(body);
      
      // Mock auth logic
      if (username === 'fedadmin' && password === 'secure123') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          token: 'mock_jwt_token_' + Date.now(),
          user: {
            id: 'fedadmin',
            username: 'fedadmin',
            email: 'admin@federation.org',
            roles: ['admin']
          }
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid credentials'
        }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8080, () => {
  console.log('Mock auth server running on http://localhost:8080');
});
EOF

node mock-auth-server.js
```

```bash
# Terminal 2: Configure and start UI
export NODE_ENV=production
export VITE_AUTH_BASIC_ENDPOINT=http://localhost:8080/api/auth/login

bun --hot src/index.ts
```

### Test Cases
```bash
# Open browser to http://localhost:3000

# Test Case 1: Valid credentials
Username: fedadmin  
Password: secure123
Expected: ✅ Login successful, API call to mock server

# Test Case 2: Invalid credentials
Username: wrong
Password: wrong  
Expected: ❌ "Invalid credentials" error from server

# Test Case 3: Check UI adaptation
Expected: Clean username/password form, no dev mode messages
Expected: Title "OIDFED Registry" (not "Developer Login")

# Test Case 4: Check network requests
# In browser DevTools Network tab:
Expected: POST to http://localhost:8080/api/auth/login
Expected: Authorization header in subsequent API calls

# Test Case 5: Logout functionality
Click user dropdown → Sign out
Expected: Clears tokens, redirects to login
```

## 3. Testing OAuth Authentication

### Setup (Mock OAuth Provider)
```bash
# Terminal 1: Mock OAuth server
cat > mock-oauth-server.js << 'EOF'
const http = require('http');
const url = require('url');
const crypto = require('crypto');

let authCodes = new Map();
let tokens = new Map();

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Authorization endpoint
  if (parsedUrl.pathname === '/oauth/authorize') {
    const { client_id, redirect_uri, state, scope } = parsedUrl.query;
    
    // Generate auth code
    const code = crypto.randomBytes(16).toString('hex');
    authCodes.set(code, { client_id, redirect_uri, state });
    
    // Simulate user consent (auto-approve for testing)
    const redirectUrl = `${redirect_uri}?code=${code}&state=${state}`;
    
    res.writeHead(302, { 'Location': redirectUrl });
    res.end();
    return;
  }
  
  // Token endpoint
  if (req.method === 'POST' && parsedUrl.pathname === '/oauth/token') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const code = params.get('code');
      
      if (authCodes.has(code)) {
        const accessToken = crypto.randomBytes(32).toString('hex');
        tokens.set(accessToken, {
          user: {
            sub: 'oauth_user_123',
            name: 'OAuth Test User',
            email: 'oauth@federation.org'
          }
        });
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'openid profile'
        }));
      } else {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'invalid_grant' }));
      }
    });
    return;
  }
  
  // Userinfo endpoint
  if (parsedUrl.pathname === '/oauth/userinfo') {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const tokenData = tokens.get(token);
      
      if (tokenData) {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(tokenData.user));
        return;
      }
    }
    
    res.writeHead(401);
    res.end(JSON.stringify({ error: 'invalid_token' }));
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

server.listen(8081, () => {
  console.log('Mock OAuth server running on http://localhost:8081');
});
EOF

node mock-oauth-server.js
```

```bash
# Terminal 2: Configure OAuth and start UI
export NODE_ENV=production
export VITE_AUTH_OAUTH_CLIENT_ID=test_client_123
export VITE_AUTH_OAUTH_BASE_URL=http://localhost:8081

bun --hot src/index.ts
```

### Test Cases
```bash
# Open browser to http://localhost:3000

# Test Case 1: OAuth flow initiation
Expected: No username/password fields shown
Expected: "Continue with SSO" button
Expected: Description mentions redirect

# Test Case 2: OAuth authorization flow  
Click "Continue with SSO"
Expected: ↗️ Redirect to http://localhost:8081/oauth/authorize
Expected: ↩️ Auto-redirect back with auth code
Expected: ✅ Login successful

# Test Case 3: Check OAuth callback handling
Check URL during flow: /auth/callback?code=...&state=...
Expected: Processing screen, then redirect to dashboard

# Test Case 4: User info from OAuth
Check sidebar after login
Expected: "OAuth Test User" displayed
Expected: Avatar generated for OAuth user

# Test Case 5: Token in API calls
Check DevTools Network tab
Expected: Bearer token in API Authorization headers
```

## 4. Testing OIDC Authentication

### Setup
```bash
# Terminal 1: Use same mock server but configure as OIDC
node mock-oauth-server.js  # Same server works for OIDC

# Terminal 2: Configure OIDC
export NODE_ENV=production
export VITE_AUTH_OIDC_CLIENT_ID=oidc_client_456
export VITE_AUTH_OIDC_BASE_URL=http://localhost:8081

bun --hot src/index.ts
```

### Test Cases
```bash
# Similar to OAuth tests but with OIDC-specific behavior
# The UI will be identical to OAuth testing since they use the same adapter
```

## 5. Testing Auto-Detection

### Test Environment Detection
```bash
# Test 1: No environment variables (should default to dev)
unset VITE_AUTH_BASIC_ENDPOINT
unset VITE_AUTH_OAUTH_CLIENT_ID  
unset VITE_AUTH_OIDC_CLIENT_ID
export NODE_ENV=development

bun --hot src/index.ts
# Expected: Development auth mode

# Test 2: Multiple configs (priority testing)
export VITE_AUTH_BASIC_ENDPOINT=http://localhost:8080/api/auth/login
export VITE_AUTH_OAUTH_CLIENT_ID=test_client_123
export VITE_AUTH_OAUTH_BASE_URL=http://localhost:8081

bun --hot src/index.ts
# Expected: Should pick one adapter (check which has priority)
```

## 6. Testing API Integration

### Verify Auth Headers
```bash
# Start any configuration and login
# Then check API calls:

# In browser console:
fetch('/api/some-endpoint')
  .then(r => r.json())  
  .then(console.log)

# Check Network tab:
# Expected: Authorization header automatically included
# Expected: Bearer token from current auth adapter
```

### Test Token Refresh (OAuth/OIDC)
```bash
# Simulate token expiration:
# In browser console (after OAuth login):
localStorage.setItem('oauth_auth_token', JSON.stringify({
  value: 'expired_token',
  type: 'Bearer', 
  expiresAt: Math.floor(Date.now() / 1000) - 1000, // Expired
  metadata: { refresh_token: 'test_refresh' }
}));

# Make an API call
fetch('/api/dashboard/stats')
# Expected: Automatic token refresh attempt
```

## 7. Testing Error Scenarios

### Network Errors
```bash
# Test 1: Auth server down
# Stop mock servers, try to login
# Expected: Proper error message "Network error"

# Test 2: Invalid OAuth redirect  
# Manually visit: /auth/callback?error=access_denied
# Expected: Error page with helpful message

# Test 3: Malformed tokens
# In console: localStorage.setItem('API_BEARER', 'invalid_token')
# Refresh page
# Expected: Redirect to login, token cleared
```

## 8. Testing Production-Like Scenarios

### University Federation Simulation
```bash
# Create production-like config
cat > .env.university << 'EOF'
NODE_ENV=production
VITE_APP_NAME=University Federation Registry
VITE_AUTH_OIDC_CLIENT_ID=university_client_789
VITE_AUTH_OIDC_BASE_URL=https://sso.university.edu
EOF

# Load and test
source .env.university
bun --hot src/index.ts

# Expected behavior:
# - Title shows "University Federation Registry"  
# - OAuth flow for university SSO
# - No dev mode indicators
# - Professional appearance
```

### Corporate Basic Auth Simulation  
```bash
cat > .env.corporate << 'EOF'
NODE_ENV=production
VITE_APP_NAME=Corporate Federation Registry  
VITE_AUTH_BASIC_ENDPOINT=https://corporate-api.company.com/auth/login
EOF

source .env.corporate
bun --hot src/index.ts

# Expected behavior:
# - Corporate branding in title
# - Clean username/password form
# - No OAuth redirect behavior
```

## 9. Browser Testing

### Different Browsers
```bash
# Test in multiple browsers:
# Chrome: http://localhost:3000
# Firefox: http://localhost:3000  
# Safari: http://localhost:3000

# Check for:
# - Consistent login behavior
# - Token storage working
# - OAuth redirects functioning
# - Error handling consistent
```

### Mobile Testing
```bash
# Test responsive behavior:
# Chrome DevTools → Device simulation
# iOS Safari
# Android Chrome

# Verify:
# - Login form is mobile-friendly
# - OAuth flows work on mobile
# - Touch interactions work
```

## 10. Integration Testing

### Full User Journey
```bash
# Scenario: New federation deployment

# Step 1: Fresh deployment (dev mode)
rm -rf node_modules/.cache
export NODE_ENV=development
bun --hot src/index.ts

# Step 2: Admin logs in for first time
# Login with admin/admin
# Access dashboard
# Check all protected routes work

# Step 3: Switch to production auth
export NODE_ENV=production
export VITE_AUTH_BASIC_ENDPOINT=http://localhost:8080/api/auth/login
# Restart server
# Login with fedadmin/secure123
# Verify seamless transition

# Step 4: Add OAuth
export VITE_AUTH_OAUTH_CLIENT_ID=test_client
export VITE_AUTH_OAUTH_BASE_URL=http://localhost:8081
# Restart server  
# Verify OAuth flow works
```

## Quick Test Commands

```bash
# Quick dev test
export NODE_ENV=development && bun --hot src/index.ts

# Quick basic auth test  
export NODE_ENV=production VITE_AUTH_BASIC_ENDPOINT=http://localhost:8080/api/auth/login && bun --hot src/index.ts

# Quick OAuth test
export NODE_ENV=production VITE_AUTH_OAUTH_CLIENT_ID=test VITE_AUTH_OAUTH_BASE_URL=http://localhost:8081 && bun --hot src/index.ts

# Reset to clean state
unset NODE_ENV VITE_AUTH_BASIC_ENDPOINT VITE_AUTH_OAUTH_CLIENT_ID VITE_AUTH_OAUTH_BASE_URL VITE_AUTH_OIDC_CLIENT_ID VITE_AUTH_OIDC_BASE_URL
```

## Expected Results Summary

| Configuration | Login UI | Auth Flow | User Display |
|---------------|----------|-----------|--------------|
| Development | Username/Password + dev hints | Any credentials work | "admin" or entered username |
| Basic Auth | Clean username/password | API validation | Username from API response |
| OAuth/OIDC | "Continue with SSO" button | Redirect → callback | Name from userinfo endpoint |

All configurations should:
- ✅ Protect routes with RequireAuth  
- ✅ Show user info in sidebar
- ✅ Include auth headers in API calls
- ✅ Handle logout properly
- ✅ Redirect after login
- ✅ Show appropriate error messages