/**
 * Example integration of the unified auth system into the existing app
 * This shows how to update the main App.tsx and related files
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { 
  AuthProvider, 
  RequireAuth, 
  UnifiedLogin, 
  OAuthCallback,
  useAuth,
  authUtils 
} from '@/auth';

// Existing components
import { Dashboard } from '@/pages/dashboard';
import { Home } from '@/pages/home';
import Layout from '@/layout';
import '@/index.css';

/**
 * Updated App component with unified authentication
 */
export function App() {
  return (
    <AuthProvider config="auto">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

/**
 * Updated Login page using the unified login component
 */
function LoginPage() {
  const { isAuthenticated } = useAuth();
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <UnifiedLogin 
          redirectTo="/"
          showAdapterSelection={!authUtils.isDevelopment()}
          onSuccess={() => {
            console.log('Login successful');
          }}
          onError={(error) => {
            console.error('Login failed:', error);
          }}
        />
      </div>
    </div>
  );
}

/**
 * Updated Layout component with auth-aware sidebar
 */
function AuthAwareLayout() {
  const { user, logout } = useAuth();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          
          {/* Add user info and logout */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.username}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

/**
 * Enhanced API fetcher that uses the auth system
 */
import { authenticatedFetch, getAuthenticatedHeaders } from '@/auth';

export async function enhancedApiFetch<TData>(
  url: string,
  options: RequestInit = {}
): Promise<TData> {
  const baseUrl = "http://127.0.0.1:4010"; // or from config
  
  // Get auth headers automatically
  const authHeaders = await getAuthenticatedHeaders();
  
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Environment-specific configuration examples
 */

// .env.development
/*
NODE_ENV=development
VITE_AUTH_TYPE=dev
*/

// .env.staging  
/*
VITE_AUTH_TYPE=basic
VITE_AUTH_BASIC_ENDPOINT=https://staging-api.oidfed.com/api/auth/login
*/

// .env.production
/*
VITE_AUTH_TYPE=oidc
VITE_AUTH_OIDC_CLIENT_ID=prod_client_123
VITE_AUTH_OIDC_BASE_URL=https://sso.federation.org
*/

/**
 * Advanced configuration for multi-tenant deployments
 */
function getDeploymentAuthConfig() {
  const deploymentId = import.meta.env.VITE_DEPLOYMENT_ID;
  
  // Each federation deployment can have its own auth config
  switch (deploymentId) {
    case 'fed_university':
      return {
        config: 'oidc' as const,
        options: {
          clientId: 'university_fed_client',
          issuer: 'https://sso.university.edu'
        }
      };
      
    case 'fed_government':
      return {
        config: 'basic' as const,
        options: {
          baseUrl: 'https://secure.gov.agency.com'
        }
      };
      
    default:
      return {
        config: 'development' as const,
        options: {}
      };
  }
}

// Usage in main app
function DeploymentSpecificApp() {
  const authConfig = getDeploymentAuthConfig();
  
  return (
    <AuthProvider {...authConfig}>
      <App />
    </AuthProvider>
  );
}

export default App;