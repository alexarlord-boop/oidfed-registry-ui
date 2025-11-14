#!/bin/bash

# OIDFED Registry UI - Authentication Testing Scripts
# Run these scripts to quickly test different auth configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Test 1: Development Authentication
test_dev_auth() {
    print_header "Testing Development Authentication"
    
    print_info "Setting up development environment..."
    export NODE_ENV=development
    unset VITE_AUTH_BASIC_ENDPOINT
    unset VITE_AUTH_OAUTH_CLIENT_ID
    unset VITE_AUTH_OIDC_CLIENT_ID
    
    print_info "Environment variables:"
    echo "NODE_ENV=$NODE_ENV"
    
    print_success "Development auth configured!"
    print_info "Expected behavior:"
    echo "  • Login page shows 'Developer Login' title"
    echo "  • Username/password fields with admin/admin defaults" 
    echo "  • 'Development Mode' help text visible"
    echo "  • Any credentials should work"
    
    print_warning "Manual test required: Start server with 'bun --hot src/index.ts'"
    print_warning "Then visit http://localhost:3000 and test login"
}

# Test 2: Basic Authentication  
test_basic_auth() {
    print_header "Testing Basic Authentication"
    
    print_info "Starting mock authentication server..."
    
    # Create mock auth server
    cat > /tmp/mock-auth-server.js << 'EOF'
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

  if (req.method === 'POST' && req.url === '/api/auth/login') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { username, password } = JSON.parse(body);
        
        if (username === 'fedadmin' && password === 'secure123') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            token: 'basic_auth_token_' + Date.now(),
            user: {
              id: 'fedadmin',
              username: 'fedadmin', 
              email: 'admin@federation.org',
              roles: ['admin']
            }
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid username or password' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(8080, () => {
  console.log('🔐 Mock auth server running on http://localhost:8080');
  console.log('📝 Valid credentials: fedadmin / secure123');
});
EOF

    # Start mock server in background
    node /tmp/mock-auth-server.js &
    MOCK_PID=$!
    
    sleep 2
    
    print_info "Configuring basic authentication..."
    export NODE_ENV=production
    export VITE_AUTH_BASIC_ENDPOINT=http://localhost:8080/api/auth/login
    unset VITE_AUTH_OAUTH_CLIENT_ID
    unset VITE_AUTH_OIDC_CLIENT_ID
    
    print_info "Environment variables:"
    echo "NODE_ENV=$NODE_ENV"
    echo "VITE_AUTH_BASIC_ENDPOINT=$VITE_AUTH_BASIC_ENDPOINT"
    
    print_success "Basic auth configured!"
    print_info "Mock server running on port 8080"
    print_info "Expected behavior:"
    echo "  • Login page shows 'OIDFED Registry' title (not Developer Login)"
    echo "  • Clean username/password form"
    echo "  • Valid credentials: fedadmin / secure123"
    echo "  • Invalid credentials show server error message"
    echo "  • No development mode indicators"
    
    print_warning "Manual test required: Start UI server with 'bun --hot src/index.ts'"
    print_warning "Test valid login: fedadmin/secure123"
    print_warning "Test invalid login: wrong/credentials"
    
    # Cleanup function
    cleanup_basic() {
        print_info "Cleaning up mock auth server..."
        kill $MOCK_PID 2>/dev/null || true
        rm -f /tmp/mock-auth-server.js
    }
    
    trap cleanup_basic EXIT
    
    read -p "Press Enter when done testing basic auth..."
    cleanup_basic
    trap - EXIT
}

# Test 3: OAuth Authentication
test_oauth_auth() {
    print_header "Testing OAuth Authentication"
    
    print_info "Starting mock OAuth server..."
    
    # Create mock OAuth server  
    cat > /tmp/mock-oauth-server.js << 'EOF'
const http = require('http');
const url = require('url');
const crypto = require('crypto');

let authCodes = new Map();
let tokens = new Map();

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/oauth/authorize') {
    const { client_id, redirect_uri, state } = parsedUrl.query;
    
    console.log('📨 Authorization request:', { client_id, redirect_uri, state });
    
    const code = crypto.randomBytes(16).toString('hex');
    authCodes.set(code, { client_id, redirect_uri, state });
    
    const redirectUrl = `${redirect_uri}?code=${code}&state=${state}`;
    console.log('🔄 Redirecting to:', redirectUrl);
    
    res.writeHead(302, { 'Location': redirectUrl });
    res.end();
    return;
  }
  
  if (req.method === 'POST' && parsedUrl.pathname === '/oauth/token') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      const params = new URLSearchParams(body);
      const code = params.get('code');
      
      console.log('🎫 Token request for code:', code);
      
      if (authCodes.has(code)) {
        const accessToken = crypto.randomBytes(32).toString('hex');
        tokens.set(accessToken, {
          user: {
            sub: 'oauth_user_123',
            name: 'OAuth Test User',
            email: 'oauth.user@federation.org',
            preferred_username: 'oauthuser'
          }
        });
        
        console.log('✅ Token issued:', accessToken.substring(0, 8) + '...');
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'openid profile email'
        }));
      } else {
        console.log('❌ Invalid authorization code');
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'invalid_grant' }));
      }
    });
    return;
  }
  
  if (parsedUrl.pathname === '/oauth/userinfo') {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const tokenData = tokens.get(token);
      
      if (tokenData) {
        console.log('👤 Userinfo request successful');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(tokenData.user));
        return;
      }
    }
    
    console.log('❌ Invalid token for userinfo');
    res.writeHead(401);
    res.end(JSON.stringify({ error: 'invalid_token' }));
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(8081, () => {
  console.log('🔐 Mock OAuth server running on http://localhost:8081');
  console.log('🎯 OAuth endpoints:');
  console.log('   • Authorization: http://localhost:8081/oauth/authorize');
  console.log('   • Token: http://localhost:8081/oauth/token'); 
  console.log('   • Userinfo: http://localhost:8081/oauth/userinfo');
});
EOF

    # Start mock OAuth server in background
    node /tmp/mock-oauth-server.js &
    OAUTH_PID=$!
    
    sleep 2
    
    print_info "Configuring OAuth authentication..."
    export NODE_ENV=production
    export VITE_AUTH_OAUTH_CLIENT_ID=test_client_123
    export VITE_AUTH_OAUTH_BASE_URL=http://localhost:8081
    unset VITE_AUTH_BASIC_ENDPOINT
    unset VITE_AUTH_OIDC_CLIENT_ID
    
    print_info "Environment variables:"
    echo "NODE_ENV=$NODE_ENV"
    echo "VITE_AUTH_OAUTH_CLIENT_ID=$VITE_AUTH_OAUTH_CLIENT_ID"
    echo "VITE_AUTH_OAUTH_BASE_URL=$VITE_AUTH_OAUTH_BASE_URL"
    
    print_success "OAuth configured!"
    print_info "Mock OAuth server running on port 8081"
    print_info "Expected behavior:"
    echo "  • Login page shows 'OIDFED Registry' title"
    echo "  • No username/password fields visible"  
    echo "  • 'Continue with SSO' button shown"
    echo "  • Description mentions redirect"
    echo "  • Clicking button redirects to OAuth server"
    echo "  • Auto-redirect back with auth code"
    echo "  • Login completes successfully"
    
    print_warning "Manual test required: Start UI server with 'bun --hot src/index.ts'"
    print_warning "Click 'Continue with SSO' and follow the OAuth flow"
    
    # Cleanup function
    cleanup_oauth() {
        print_info "Cleaning up mock OAuth server..."
        kill $OAUTH_PID 2>/dev/null || true
        rm -f /tmp/mock-oauth-server.js
    }
    
    trap cleanup_oauth EXIT
    
    read -p "Press Enter when done testing OAuth..."
    cleanup_oauth
    trap - EXIT
}

# Test 4: OIDC Authentication (similar to OAuth)
test_oidc_auth() {
    print_header "Testing OIDC Authentication"
    
    print_info "OIDC uses the same mock server as OAuth..."
    
    # Reuse OAuth server
    node /tmp/mock-oauth-server.js &
    OIDC_PID=$!
    
    sleep 2
    
    print_info "Configuring OIDC authentication..."
    export NODE_ENV=production
    export VITE_AUTH_OIDC_CLIENT_ID=oidc_client_456
    export VITE_AUTH_OIDC_BASE_URL=http://localhost:8081
    unset VITE_AUTH_BASIC_ENDPOINT
    unset VITE_AUTH_OAUTH_CLIENT_ID
    
    print_info "Environment variables:"
    echo "NODE_ENV=$NODE_ENV"
    echo "VITE_AUTH_OIDC_CLIENT_ID=$VITE_AUTH_OIDC_CLIENT_ID"
    echo "VITE_AUTH_OIDC_BASE_URL=$VITE_AUTH_OIDC_BASE_URL"
    
    print_success "OIDC configured!"
    print_info "Expected behavior: Same as OAuth test"
    
    # Cleanup
    cleanup_oidc() {
        kill $OIDC_PID 2>/dev/null || true
    }
    
    trap cleanup_oidc EXIT
    
    read -p "Press Enter when done testing OIDC..."
    cleanup_oidc
    trap - EXIT
}

# Test 5: Auto-detection
test_auto_detection() {
    print_header "Testing Auto-Detection"
    
    print_info "Testing environment auto-detection..."
    
    # Test 1: No config (should default to dev)
    print_info "Test 1: No configuration (should default to development)"
    unset NODE_ENV
    unset VITE_AUTH_BASIC_ENDPOINT
    unset VITE_AUTH_OAUTH_CLIENT_ID
    unset VITE_AUTH_OIDC_CLIENT_ID
    
    print_info "Current environment: Clean slate"
    print_warning "Expected: Should default to development auth"
    
    # Test 2: Multiple configs
    print_info "Test 2: Multiple configurations (priority testing)"
    export NODE_ENV=production
    export VITE_AUTH_BASIC_ENDPOINT=http://example.com/auth
    export VITE_AUTH_OAUTH_CLIENT_ID=test_client
    export VITE_AUTH_OAUTH_BASE_URL=http://oauth.example.com
    
    print_info "Environment variables set:"
    echo "NODE_ENV=$NODE_ENV"
    echo "VITE_AUTH_BASIC_ENDPOINT=$VITE_AUTH_BASIC_ENDPOINT" 
    echo "VITE_AUTH_OAUTH_CLIENT_ID=$VITE_AUTH_OAUTH_CLIENT_ID"
    echo "VITE_AUTH_OAUTH_BASE_URL=$VITE_AUTH_OAUTH_BASE_URL"
    
    print_warning "Expected: Should pick one adapter (check console logs for which)"
    print_warning "Manual test: Start server and check which auth method is active"
}

# Main menu
main_menu() {
    while true; do
        print_header "OIDFED Registry Authentication Testing"
        echo "Choose a test to run:"
        echo ""
        echo "1) Development Authentication"
        echo "2) Basic Authentication (with mock server)"  
        echo "3) OAuth Authentication (with mock server)"
        echo "4) OIDC Authentication (with mock server)"
        echo "5) Auto-Detection Testing"
        echo "6) Run All Tests"
        echo "7) Clean Environment"
        echo "8) Exit"
        echo ""
        
        read -p "Enter your choice (1-8): " choice
        
        case $choice in
            1) test_dev_auth ;;
            2) test_basic_auth ;;
            3) test_oauth_auth ;;
            4) test_oidc_auth ;;
            5) test_auto_detection ;;
            6) 
                test_dev_auth
                test_basic_auth  
                test_oauth_auth
                test_oidc_auth
                test_auto_detection
                ;;
            7)
                print_info "Cleaning environment variables..."
                unset NODE_ENV
                unset VITE_AUTH_BASIC_ENDPOINT
                unset VITE_AUTH_OAUTH_CLIENT_ID
                unset VITE_AUTH_OAUTH_BASE_URL
                unset VITE_AUTH_OIDC_CLIENT_ID
                unset VITE_AUTH_OIDC_BASE_URL
                print_success "Environment cleaned!"
                ;;
            8) 
                print_info "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please try again."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Check if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # Check if bun is available
    if ! command -v bun &> /dev/null; then
        print_error "Bun is required but not installed. Please install bun first."
        exit 1
    fi
    
    # Check if node is available  
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed. Please install Node.js first."
        exit 1
    fi
    
    main_menu
fi