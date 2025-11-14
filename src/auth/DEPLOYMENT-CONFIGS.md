# Configuration Examples for Different Deployments

This document shows real-world configuration examples for different types of federation operators.

## 1. University Federation Deployment

### Scenario: Large University with Existing OIDC Infrastructure

```bash
# University of Example - Production Environment
# File: .env.production

NODE_ENV=production
VITE_APP_NAME="University of Example Federation Registry"

# OIDC Configuration pointing to university's SSO
VITE_AUTH_OIDC_CLIENT_ID=university_fed_client_2024
VITE_AUTH_OIDC_BASE_URL=https://sso.university.edu

# API Configuration
VITE_API_BASE_URL=https://federation-api.university.edu
```

**Expected User Experience:**
- Students/staff see "University of Example Federation Registry"
- Single "Continue with University SSO" button
- Redirects to familiar university login
- No technical configuration visible

**Testing Commands:**
```bash
# Test this configuration
export NODE_ENV=production
export VITE_AUTH_OIDC_CLIENT_ID=university_fed_client_2024
export VITE_AUTH_OIDC_BASE_URL=https://sso.university.edu
bun --hot src/index.ts
```

## 2. Government Agency Deployment

### Scenario: Secure Government Environment with Basic Auth

```bash
# Government Agency - High Security Environment
# File: .env.production

NODE_ENV=production
VITE_APP_NAME="Government Federation Authority"

# Basic Auth with secure government API
VITE_AUTH_BASIC_ENDPOINT=https://secure.gov.agency/federation/auth/login

# Internal API endpoints
VITE_API_BASE_URL=https://secure.gov.agency/federation/api
```

**Expected User Experience:**
- Officials see "Government Federation Authority" 
- Professional username/password form
- Government-grade security validation
- Clean, formal interface

**Testing Commands:**
```bash
# Create mock government API for testing
cat > mock-gov-api.js << 'EOF'
const http = require('http');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/federation/auth/login') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      const { username, password } = JSON.parse(body);
      
      // Government-style validation (employee ID + secure password)
      if (username.match(/^EMP\d{6}$/) && password.length >= 12) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          token: 'gov_secure_token_' + Date.now(),
          user: {
            id: username,
            username: username,
            email: `${username.toLowerCase()}@agency.gov`,
            roles: ['admin'],
            clearance_level: 'SECRET'
          }
        }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid credentials or insufficient security clearance'
        }));
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(8082, () => {
  console.log('Government mock API running on http://localhost:8082');
  console.log('Test credentials: EMP123456 / supersecurepass123');
});
EOF

node mock-gov-api.js &

# Test the configuration
export NODE_ENV=production
export VITE_AUTH_BASIC_ENDPOINT=http://localhost:8082/federation/auth/login
bun --hot src/index.ts

# Test with: EMP123456 / supersecurepass123
```

## 3. Corporate Federation Deployment

### Scenario: Tech Company with OAuth Identity Provider

```bash
# TechCorp - Internal Federation
# File: .env.production

NODE_ENV=production
VITE_APP_NAME="TechCorp Identity Federation"

# OAuth with corporate identity provider
VITE_AUTH_OAUTH_CLIENT_ID=techcorp_fed_app_v2
VITE_AUTH_OAUTH_BASE_URL=https://identity.techcorp.com

# Internal corporate API
VITE_API_BASE_URL=https://federation.internal.techcorp.com
```

**Expected User Experience:**
- Employees see "TechCorp Identity Federation"
- "Continue with TechCorp SSO" button
- Seamless integration with corporate identity
- Familiar company branding

## 4. Research Consortium Deployment

### Scenario: Multi-Organization Research Federation

```bash
# Research Consortium - Federated Environment
# File: .env.production

NODE_ENV=production
VITE_APP_NAME="Global Research Federation"

# OIDC with research identity federation
VITE_AUTH_OIDC_CLIENT_ID=research_fed_consortium_2024
VITE_AUTH_OIDC_BASE_URL=https://identity.research-federation.org

# Research data APIs
VITE_API_BASE_URL=https://api.research-federation.org
```

**Expected User Experience:**
- Researchers see "Global Research Federation"
- Single sign-on across participating institutions
- Academic-friendly interface
- Cross-institutional collaboration support

## 5. Development/Testing Environment

### Scenario: Local Development and Testing

```bash
# Development Environment
# File: .env.development

NODE_ENV=development
VITE_APP_NAME="OIDFED Registry (Development)"

# No auth configuration needed - auto-defaults to dev mode
# Optional: can still override for testing
# VITE_AUTH_DEV_USERNAME=testuser
# VITE_AUTH_DEV_PASSWORD=testpass
```

**Expected User Experience:**
- Developers see "OIDFED Registry (Development)"
- Clear development indicators
- Any credentials work (defaults: admin/admin)
- Helpful testing messages

**Testing Commands:**
```bash
# Simple development test
export NODE_ENV=development
bun --hot src/index.ts
# Login with admin/admin or any credentials
```

## 6. Multi-Tenant SaaS Deployment

### Scenario: Hosted Federation Service

```bash
# SaaS Provider - Multi-Tenant Setup
# File: .env.production

NODE_ENV=production
VITE_APP_NAME="Hosted Federation Service"

# Multiple auth methods available
VITE_AUTH_BASIC_ENDPOINT=https://api.federation-saas.com/auth/login
VITE_AUTH_OAUTH_CLIENT_ID=saas_oauth_client
VITE_AUTH_OAUTH_BASE_URL=https://oauth.federation-saas.com

# SaaS API endpoints
VITE_API_BASE_URL=https://api.federation-saas.com
```

**Expected User Experience:**
- Customers can choose authentication method
- Professional SaaS interface
- Multiple options available
- Tenant-specific branding possible

## 7. Docker Compose Deployments

### Complete Docker Setup for University

```yaml
# docker-compose.university.yml
version: '3.8'

services:
  oidfed-ui:
    image: oidfed/registry-ui:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - VITE_APP_NAME=University Federation Registry
      - VITE_AUTH_OIDC_CLIENT_ID=university_client_123
      - VITE_AUTH_OIDC_BASE_URL=https://sso.university.edu
      - VITE_API_BASE_URL=https://api.university-fed.edu
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.fed-ui.rule=Host(`federation.university.edu`)"

  oidfed-api:
    image: oidfed/registry-api:latest  
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://feduser:password@db:5432/federation
      - OIDC_CLIENT_ID=university_client_123
      - OIDC_ISSUER=https://sso.university.edu
    
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=federation
      - POSTGRES_USER=feduser
      - POSTGRES_PASSWORD=password
    volumes:
      - federation_data:/var/lib/postgresql/data

volumes:
  federation_data:
```

**Deploy Commands:**
```bash
# Deploy university federation
docker-compose -f docker-compose.university.yml up -d

# Check logs
docker-compose -f docker-compose.university.yml logs oidfed-ui

# Access at: http://localhost:3000
```

### Corporate Docker Setup

```yaml
# docker-compose.corporate.yml
version: '3.8'

services:
  oidfed-ui:
    image: oidfed/registry-ui:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - VITE_APP_NAME=TechCorp Federation
      - VITE_AUTH_OAUTH_CLIENT_ID=techcorp_fed_client
      - VITE_AUTH_OAUTH_BASE_URL=https://identity.techcorp.com
      - VITE_API_BASE_URL=http://oidfed-api:8080
    networks:
      - corporate-network

  oidfed-api:
    image: oidfed/registry-api:latest
    ports:
      - "8080:8080"
    environment:
      - OAUTH_CLIENT_ID=techcorp_fed_client
      - OAUTH_ISSUER=https://identity.techcorp.com
    networks:
      - corporate-network

networks:
  corporate-network:
    driver: bridge
```

## 8. Kubernetes Deployments

### University Kubernetes Deployment

```yaml
# university-federation.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: oidfed-ui-config
  namespace: federation
data:
  NODE_ENV: "production"
  VITE_APP_NAME: "University Federation Registry"
  VITE_AUTH_OIDC_CLIENT_ID: "university_k8s_client"
  VITE_AUTH_OIDC_BASE_URL: "https://sso.university.edu"
  VITE_API_BASE_URL: "https://api.federation.university.edu"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: oidfed-ui
  namespace: federation
spec:
  replicas: 3
  selector:
    matchLabels:
      app: oidfed-ui
  template:
    metadata:
      labels:
        app: oidfed-ui
    spec:
      containers:
      - name: ui
        image: oidfed/registry-ui:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: oidfed-ui-config
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"

---
apiVersion: v1
kind: Service
metadata:
  name: oidfed-ui-service
  namespace: federation
spec:
  selector:
    app: oidfed-ui
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

**Deploy Commands:**
```bash
# Create namespace
kubectl create namespace federation

# Deploy application
kubectl apply -f university-federation.yaml

# Check status
kubectl get pods -n federation
kubectl get services -n federation

# Get external IP
kubectl get service oidfed-ui-service -n federation
```

## 9. Testing Different Configurations

### Quick Configuration Switcher Script

```bash
#!/bin/bash

# config-switcher.sh
case $1 in
  "university")
    export NODE_ENV=production
    export VITE_APP_NAME="University Federation"
    export VITE_AUTH_OIDC_CLIENT_ID=university_client
    export VITE_AUTH_OIDC_BASE_URL=https://sso.university.edu
    ;;
  "government") 
    export NODE_ENV=production
    export VITE_APP_NAME="Government Federation"
    export VITE_AUTH_BASIC_ENDPOINT=https://secure.gov/auth
    ;;
  "corporate")
    export NODE_ENV=production
    export VITE_APP_NAME="Corporate Federation"
    export VITE_AUTH_OAUTH_CLIENT_ID=corp_client
    export VITE_AUTH_OAUTH_BASE_URL=https://identity.corp.com
    ;;
  "dev")
    export NODE_ENV=development
    unset VITE_AUTH_OIDC_CLIENT_ID
    unset VITE_AUTH_BASIC_ENDPOINT
    unset VITE_AUTH_OAUTH_CLIENT_ID
    ;;
  *)
    echo "Usage: $0 [university|government|corporate|dev]"
    exit 1
    ;;
esac

echo "Configuration set for: $1"
echo "Ready to run: bun --hot src/index.ts"
```

**Usage:**
```bash
chmod +x config-switcher.sh

# Test university config
./config-switcher.sh university
bun --hot src/index.ts

# Test government config  
./config-switcher.sh government
bun --hot src/index.ts

# Test development config
./config-switcher.sh dev
bun --hot src/index.ts
```

## 10. Production Deployment Checklist

### Pre-Deployment Validation

```bash
# 1. Validate configuration
echo "Checking auth configuration..."
if [[ -n "$VITE_AUTH_OIDC_CLIENT_ID" ]]; then
  echo "✅ OIDC configured"
elif [[ -n "$VITE_AUTH_OAUTH_CLIENT_ID" ]]; then
  echo "✅ OAuth configured"  
elif [[ -n "$VITE_AUTH_BASIC_ENDPOINT" ]]; then
  echo "✅ Basic auth configured"
else
  echo "⚠️  No auth configured - will use development mode"
fi

# 2. Test auth endpoints
if [[ -n "$VITE_AUTH_BASIC_ENDPOINT" ]]; then
  echo "Testing basic auth endpoint..."
  curl -s -o /dev/null -w "%{http_code}" "$VITE_AUTH_BASIC_ENDPOINT" || echo "❌ Auth endpoint unreachable"
fi

# 3. Validate environment
if [[ "$NODE_ENV" != "production" ]]; then
  echo "⚠️  NODE_ENV is not set to production"
fi

# 4. Build and test
bun run build
echo "✅ Build successful"
```

### Post-Deployment Testing

```bash
# Test login flows
curl -I http://your-federation.com/login
curl -I http://your-federation.com/auth/callback

# Test auth integration
curl -H "Authorization: Bearer test_token" \
     http://your-federation.com/api/dashboard/stats
```

Each configuration provides a completely different user experience while using the same codebase - this is the power of the unified authentication system for federation operators!