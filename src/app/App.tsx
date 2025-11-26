import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ThemeProvider } from "@/components/theme-provider"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { RequireRole } from "@/components/auth/RequireRole"
import { UserRole } from "@/types/auth"
import { AuthCallback } from "./AuthCallback"

import { Dashboard } from "@/pages/dashboard";
import System from "@/pages/system";
import { Home } from "@/pages/home";
import { Language } from "@/pages/language";
import { Account } from "@/pages/account";
import { Empty } from "@/pages/default/empty";
import Layout from "./layout";
import Login from "@/pages/login";
import RegistrationPage from "@/pages/register/RegistrationPage";

// Admin pages
import { AdminUsers } from "@/pages/admin/users";
import { AdminUserDetail } from "@/pages/admin/users/[id]";
import { AdminUserNew } from "@/pages/admin/users/new";
import { AdminApprovals } from "@/pages/admin/approvals";
import { AdminTrustAnchors } from "@/pages/admin/trust-anchors";

import "./index.css";

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/" element={<Layout />}>
              {/* Explore */}
              <Route index element={<Home />} />
              <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>}  />
              <Route path="audit" element={<RequireAuth><Empty title="Audit" description="Trace logs, check requests" /></RequireAuth>} />

              {/* Admin-only routes */}
              <Route path="admin/users" element={
                <RequireRole role={UserRole.ADMIN}>
                  <AdminUsers />
                </RequireRole>
              } />
              <Route path="admin/users/new" element={
                <RequireRole role={UserRole.ADMIN}>
                  <AdminUserNew />
                </RequireRole>
              } />
              <Route path="admin/users/:id" element={
                <RequireRole role={UserRole.ADMIN}>
                  <AdminUserDetail />
                </RequireRole>
              } />
              <Route path="admin/approvals" element={
                <RequireRole role={UserRole.ADMIN}>
                  <AdminApprovals />
                </RequireRole>
              } />
              <Route path="admin/trust-anchors" element={
                <RequireRole role={UserRole.ADMIN}>
                  <AdminTrustAnchors />
                </RequireRole>
              } />

              {/* Management - Available to technical contacts and admins */}
              <Route path="entities" element={
                <RequireRole roles={[UserRole.ADMIN, UserRole.TECHNICAL_CONTACT]}>
                  <Empty title="Entities" description="Manage entities" />
                </RequireRole>
              } />
              <Route path="trust-chains" element={
                <RequireRole roles={[UserRole.ADMIN, UserRole.TECHNICAL_CONTACT]}>
                  <Empty title="Trust Chains" description="Manage trust chains" />
                </RequireRole>
              } />
              <Route path="trust-marks" element={
                <RequireRole roles={[UserRole.ADMIN, UserRole.TECHNICAL_CONTACT]}>
                  <Empty title="Trust Marks" description="Manage trust marks" />
                </RequireRole>
              } />
              <Route path="policies" element={
                <RequireRole roles={[UserRole.ADMIN, UserRole.TECHNICAL_CONTACT]}>
                  <Empty title="Policies" description="Manage policies" />
                </RequireRole>
              } />
              <Route path="keys" element={
                <RequireRole roles={[UserRole.ADMIN, UserRole.TECHNICAL_CONTACT]}>
                  <Empty title="Keys" description="Manage keys" />
                </RequireRole>
              } />
            
              {/* Settings */}
              <Route path="language" element={<RequireAuth><Language/></RequireAuth>} />
              <Route path="system" element={<RequireAuth><System /></RequireAuth>} />

              {/* User */}
              <Route path="account" element={<RequireAuth><Account /></RequireAuth>} />
            </Route>
          </Routes>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
