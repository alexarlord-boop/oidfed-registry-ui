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
import { NotFound } from "@/pages/default/not-found";
import Layout from "./layout";
import Login from "@/pages/login";
import RegistrationPage from "@/pages/register/RegistrationPage";

// Admin pages
import { AdminUsers } from "@/pages/admin/users";
import { AdminUserDetail } from "@/pages/admin/users/[id]";
import { AdminUserNew } from "@/pages/admin/users/new";
import { AdminApprovals } from "@/pages/admin/approvals";
import { AdminTrustAnchors } from "@/pages/admin/trust-anchors";
import { ConfigureTrustAnchor } from "@/pages/admin/trust-anchors/configure";
import { EditMetadata } from "@/pages/admin/trust-anchors/configure/metadata/edit";
import { AddTrustMark } from "@/pages/admin/trust-anchors/configure/trust-marks/add";
import { AdminEntities } from "@/pages/admin/entities";
import { AdminEntityNew } from "@/pages/admin/entities/new";
import { AdminEntityApprovals } from "@/pages/admin/entity-approvals";

import "./index.css";
import { PlatformSections } from "@/types/constants";

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
              {/* Home */}
              <Route index element={<Home />} />
              <Route path={PlatformSections.HOME.dashboard.path} element={<RequireAuth><Dashboard /></RequireAuth>}  />
              <Route path={PlatformSections.HOME.audit.path} element={<RequireAuth><Empty title="Audit" description="Trace logs, check requests" /></RequireAuth>} />

              {/* Admin-only routes */}
              <Route path={PlatformSections.ADMIN.users.path} element={
                <RequireRole role={UserRole.ADMIN}>
                  <AdminUsers />
                </RequireRole>
              } />
              <Route path={PlatformSections.ADMIN.users_new.path} element={
                <RequireRole role={UserRole.ADMIN}>
                  <AdminUserNew />
                </RequireRole>
              } />
              <Route path={PlatformSections.ADMIN.users_detail.path} element={
                <RequireRole role={UserRole.ADMIN}>
                  <AdminUserDetail />
                </RequireRole>
              } />
              <Route path={PlatformSections.ADMIN.trustAnchors.path} element={
                <RequireRole role={UserRole.ADMIN}>
                  <AdminTrustAnchors />
                </RequireRole>
              } />
              <Route path="/admin/trust-anchors/configure" element={
                <RequireRole role={UserRole.ADMIN}>
                  <ConfigureTrustAnchor />
                </RequireRole>
              } />
              <Route path="/admin/trust-anchors/configure/metadata/edit" element={
                <RequireRole role={UserRole.ADMIN}>
                  <EditMetadata />
                </RequireRole>
              } />
              <Route path="/admin/trust-anchors/configure/trust-marks/add" element={
                <RequireRole role={UserRole.ADMIN}>
                  <AddTrustMark />
                </RequireRole>
              } />
              <Route path={PlatformSections.ADMIN.entities.path} element={
                <RequireRole roles={[UserRole.ADMIN, UserRole.TECHNICAL_CONTACT]}>
                  <AdminEntities />
                </RequireRole>
              } />
              <Route path={PlatformSections.ADMIN.entities_new.path} element={
                <RequireRole roles={[UserRole.ADMIN, UserRole.TECHNICAL_CONTACT]}>
                  <AdminEntityNew />
                </RequireRole>
              } />
              <Route path={PlatformSections.ADMIN.entity_approvals.path} element={
                <RequireRole role={UserRole.ADMIN}>
                  <AdminEntityApprovals />
                </RequireRole>
              } />

              {/* Management - Available to technical contacts and admins */}
              <Route path="entities" element={
                <RequireRole roles={[UserRole.ADMIN, UserRole.TECHNICAL_CONTACT]}>
                  <Empty title="Entities" description="Manage entities" />
                </RequireRole>
              } />
              
             
            
              {/* Settings */}
              <Route path={PlatformSections.SETTINGS.language.path} element={<RequireAuth><Language/></RequireAuth>} />
              <Route path={PlatformSections.SETTINGS.system.path} element={<RequireAuth><System /></RequireAuth>} />

              {/* User */}
              <Route path="account" element={<RequireAuth><Account /></RequireAuth>} />
              
              {/* 404 - Catch all unmatched routes */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
