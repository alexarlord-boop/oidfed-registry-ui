import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ThemeProvider } from "@/components/theme-provider"

import { Dashboard } from "@/pages/dashboard";
import { Home } from "@/pages/home";
import { Language } from "@/pages/language";
import { Account } from "@/pages/account";
import { Empty } from "@/pages/default/empty";
import Layout from "./layout";
import Login from "@/pages/login";
import RequireAuth from "@/components/auth/RequireAuth";
import "./index.css";

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            {/* Explore */}
            <Route index element={<Home />} />
            <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>}  />

            {/* Management */}
            <Route path="entities" element={<RequireAuth><Empty title="Entities" description="Manage entities" /></RequireAuth>} />
            <Route path="trust-chains" element={<RequireAuth><Empty title="Trust Chains" description="Manage trust chains" /></RequireAuth>} />
            <Route path="trust-marks" element={<RequireAuth><Empty title="Trust Marks" description="Manage trust marks" /></RequireAuth>} />
            <Route path="policies" element={<RequireAuth><Empty title="Policies" description="Manage policies" /></RequireAuth>} />
            <Route path="keys" element={<RequireAuth><Empty title="Keys" description="Manage keys" /></RequireAuth>} />
            <Route path="audit" element={<RequireAuth><Empty title="Audit" description="Trace logs, check requests" /></RequireAuth>} />
            
            {/* Settings */}
            <Route path="language" element={<Language />} />

            {/* User */}
            <Route path="account" element={<RequireAuth><Account /></RequireAuth>} />
          </Route>
        </Routes>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
