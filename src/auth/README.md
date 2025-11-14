# Unified Authentication System

The OIDFED Registry UI uses a flexible, adapter-based authentication system that supports multiple authentication methods. This design allows federation operators to configure their preferred authentication mechanism without changing the frontend code.

## Architecture Overview

### Core Components

1. **AuthAdapter Interface** - Unified interface that all authentication methods implement
2. **AuthManager** - Central manager that coordinates adapters and manages auth state
3. **Configuration System** - Environment-based configuration loading
4. **React Hooks & Components** - Easy-to-use React integration

### Supported Authentication Methods

- **Development Auth** - Simple credentials for development (admin/admin by default)
- **Basic Authentication** - Username/password with API endpoints
- **OAuth 2.0** - Full OAuth 2.0 authorization code flow
- **OpenID Connect (OIDC)** - OIDC with ID tokens and userinfo

## Quick Start

### 1. Basic Setup

```tsx
// App.tsx
import { AuthProvider } from '@/auth';
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider config="auto">
        <Routes>
          {/* Your routes */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### 2. Protect Routes

```tsx
// In your route components
import { RequireAuth } from '@/auth';

function ProtectedPage() {
  return (
    <RequireAuth>
      <div>This page requires authentication</div>
    </RequireAuth>
  );
}
```

### 3. Use Authentication in Components

```tsx
import { useAuth } from '@/auth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## Configuration

### Environment Variables

The system automatically detects configuration from environment variables:

```bash
# Development mode (automatic if NODE_ENV=development)
NODE_ENV=development

# Basic Authentication
VITE_AUTH_BASIC_ENDPOINT=https://your-api.com/api/auth/login

# OAuth 2.0
VITE_AUTH_OAUTH_CLIENT_ID=your_oauth_client_id
VITE_AUTH_OAUTH_BASE_URL=https://your-oauth-provider.com

# OpenID Connect
VITE_AUTH_OIDC_CLIENT_ID=your_oidc_client_id
VITE_AUTH_OIDC_BASE_URL=https://your-oidc-provider.com
```

### Programmatic Configuration

```tsx
import { setupAuth } from '@/auth';

// Development
const manager = await setupAuth.development({
  defaultUsername: 'admin',
  defaultPassword: 'secret'
});

// Basic Auth
const manager = await setupAuth.basicAuth('https://api.example.com', {
  loginPath: '/auth/login',
  logoutPath: '/auth/logout'
});

// OAuth
const manager = await setupAuth.oauth({
  clientId: 'your_client_id',
  authorizationEndpoint: 'https://oauth.example.com/auth',
  tokenEndpoint: 'https://oauth.example.com/token',
  redirectUri: 'https://your-app.com/auth/callback'
});

// OIDC
const manager = await setupAuth.oidc({
  clientId: 'your_client_id',
  issuer: 'https://oidc.example.com'
});
```

## Deployment Scenarios

### Development

For local development, the system defaults to development authentication:

```tsx
<AuthProvider config="development" />
```

Users can sign in with any username/password (defaults to admin/admin).

### Production with Basic Auth

```tsx
<AuthProvider 
  config="basic" 
  options={{ baseUrl: 'https://your-api.com' }} 
/>
```

### Production with OAuth/OIDC

```tsx
<AuthProvider 
  config="oauth" 
  options={{
    clientId: 'your_client_id',
    authorizationEndpoint: 'https://oauth.provider.com/auth',
    tokenEndpoint: 'https://oauth.provider.com/token',
    redirectUri: window.location.origin + '/auth/callback'
  }} 
/>
```

### Multiple Authentication Methods

```tsx
// Users can choose their preferred method
<AuthProvider config="auto" />
```

The system will enable all configured methods and let users choose.

## API Integration

### Automatic Authentication Headers

The system automatically adds authentication headers to API requests:

```tsx
import { authenticatedFetch } from '@/auth';

// Headers are automatically added
const response = await authenticatedFetch('/api/data');
```

### Manual Header Access

```tsx
import { useAuthHeader } from '@/auth';

function ApiComponent() {
  const authHeader = useAuthHeader();
  
  // Use with your existing fetch logic
  const headers = {
    'Authorization': authHeader,
    'Content-Type': 'application/json'
  };
}
```

### Updating Existing API Client

Replace manual token management in your existing `apiFetcher.ts`:

```tsx
// Before
const runtimeToken = window.localStorage.getItem("API_BEARER");
if (runtimeToken) {
  requestHeaders["Authorization"] = `Bearer ${runtimeToken}`;
}

// After  
import { getAuthenticatedHeaders } from '@/auth';
const authHeaders = await getAuthenticatedHeaders();
const requestHeaders = { ...authHeaders, ...otherHeaders };
```

## Migration Guide

### From Existing Dev Auth

If you're currently using the `devAuth.ts` system:

1. **Install the new system:**
```tsx
// App.tsx
import { AuthProvider } from '@/auth';

<AuthProvider config="development">
  <App />
</AuthProvider>
```

2. **Update components:**
```tsx
// Before
import { isAuthenticated } from '@/lib/devAuth';

// After
import { useIsAuthenticated } from '@/auth';
const isAuthenticated = useIsAuthenticated();
```

3. **Update RequireAuth:**
```tsx
// Before
import RequireAuth from '@/components/auth/RequireAuth';

// After
import { RequireAuth } from '@/auth';
```

The new system maintains backward compatibility with existing localStorage keys.

## Advanced Usage

### Custom Adapters

Create your own authentication adapter:

```tsx
import { AuthAdapter, AuthConfig } from '@/auth/types';

class CustomAuthAdapter implements AuthAdapter {
  // Implementation
}
```

### Role-Based Access Control

```tsx
import { RequireAuth } from '@/auth';

<RequireAuth requiredRoles={['admin']}>
  <AdminPanel />
</RequireAuth>
```

### Auth Events

```tsx
import { auth } from '@/auth';

// Listen for auth events
auth.on('auth:login', ({ user, token }) => {
  console.log('User logged in:', user);
});

auth.on('auth:logout', ({ user }) => {
  console.log('User logged out');
});
```

### Conditional Rendering

```tsx
import { useAuthGuard } from '@/auth';

function AdminButton() {
  const { isAdmin } = useAuthGuard();
  
  if (!isAdmin) return null;
  
  return <button>Admin Action</button>;
}
```

## Configuration Examples

### Enterprise OIDC Setup

```bash
# .env
VITE_AUTH_OIDC_CLIENT_ID=enterprise_client_123
VITE_AUTH_OIDC_BASE_URL=https://sso.enterprise.com
```

### Multiple Federation Setup

```tsx
// Different configs per deployment
const getAuthConfig = () => {
  const fedId = process.env.VITE_FEDERATION_ID;
  
  switch (fedId) {
    case 'fed_a':
      return setupAuth.oidc({
        clientId: 'fed_a_client',
        issuer: 'https://fed-a-sso.com'
      });
    case 'fed_b':
      return setupAuth.basicAuth('https://fed-b-api.com');
    default:
      return setupAuth.development();
  }
};
```

## Security Considerations

1. **Development Mode:** Never use development auth in production
2. **Token Storage:** Tokens are stored in localStorage - consider security implications
3. **HTTPS Required:** OAuth/OIDC flows require HTTPS in production
4. **Token Expiration:** The system handles token expiration and refresh automatically
5. **State Validation:** OAuth state parameters are validated to prevent CSRF

## Troubleshooting

### Common Issues

**Authentication not working:**
- Check environment variables are correctly set
- Verify API endpoints are accessible
- Check browser console for errors

**OAuth redirect issues:**
- Ensure redirect URI matches exactly (including protocol)
- Check OAuth provider configuration
- Verify no CORS issues

**Token expiration:**
- Check if refresh tokens are supported
- Verify token expiration times
- Implement proper error handling

### Debug Mode

Enable detailed logging:

```tsx
// Set in development
localStorage.setItem('auth_debug', 'true');
```

This will log authentication flows, token validation, and adapter switching.

## Performance Notes

- Authentication state is cached and persisted
- Token validation is performed lazily
- Multiple adapters can be registered but only one is active
- Event listeners are automatically cleaned up

## Future Enhancements

The system is designed to support:
- Multi-factor authentication adapters
- Certificate-based authentication
- SAML authentication
- Custom token refresh strategies
- Granular permission systems