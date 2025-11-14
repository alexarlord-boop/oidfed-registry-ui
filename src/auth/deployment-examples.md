# Example Environment Configurations for Different Deployments

## 1. Development (.env.development)
```bash
# Development mode - automatic
NODE_ENV=development
VITE_APP_NAME=OIDFED Registry (Dev)
```

## 2. University Federation (.env.university)
```bash
# OIDC with university SSO
NODE_ENV=production
VITE_APP_NAME=University Federation Registry
VITE_AUTH_OIDC_CLIENT_ID=university_oidfed_client_123
VITE_AUTH_OIDC_BASE_URL=https://sso.university.edu
```

## 3. Government Agency (.env.government)
```bash
# Basic auth with secure API
NODE_ENV=production
VITE_APP_NAME=Government Federation Registry
VITE_AUTH_BASIC_ENDPOINT=https://secure-api.agency.gov/api/auth/login
```

## 4. Corporate Federation (.env.corporate)
```bash
# OAuth with corporate identity provider
NODE_ENV=production
VITE_APP_NAME=Corporate Federation Registry
VITE_AUTH_OAUTH_CLIENT_ID=corp_federation_client_456
VITE_AUTH_OAUTH_BASE_URL=https://identity.corporation.com
```

## 5. Multi-Tenant SaaS (.env.saas)
```bash
# Multiple auth methods available
NODE_ENV=production
VITE_APP_NAME=OIDFED Registry
VITE_AUTH_BASIC_ENDPOINT=https://api.oidfed-saas.com/api/auth/login
VITE_AUTH_OAUTH_CLIENT_ID=saas_client_789
VITE_AUTH_OAUTH_BASE_URL=https://oauth.oidfed-saas.com
```

## Docker Compose Example

```yaml
version: '3.8'
services:
  oidfed-ui:
    image: oidfed/registry-ui:latest
    environment:
      # University deployment
      - NODE_ENV=production
      - VITE_AUTH_OIDC_CLIENT_ID=university_client
      - VITE_AUTH_OIDC_BASE_URL=https://sso.university.edu
      - VITE_API_BASE_URL=https://api.university-fed.edu
    ports:
      - "3000:3000"
```

## Kubernetes ConfigMap Example

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: oidfed-ui-config
data:
  NODE_ENV: "production"
  VITE_AUTH_OIDC_CLIENT_ID: "k8s_federation_client"
  VITE_AUTH_OIDC_BASE_URL: "https://sso.federation.org"
  VITE_API_BASE_URL: "https://api.federation.org"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: oidfed-ui
spec:
  template:
    spec:
      containers:
      - name: ui
        image: oidfed/registry-ui:latest
        envFrom:
        - configMapRef:
            name: oidfed-ui-config
```

## Runtime Configuration Override

For advanced scenarios, you can also override at runtime:

```javascript
// In browser console or init script
localStorage.setItem('auth_config_override', JSON.stringify({
  type: 'oidc',
  clientId: 'runtime_override_client',
  issuer: 'https://runtime.sso.com'
}));
```