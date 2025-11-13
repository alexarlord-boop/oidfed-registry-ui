import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ThemeProvider } from "@/components/theme-provider"

import { Dashboard } from "@/pages/dashboard";
import { Home } from "@/pages/home";
import { Language } from "@/pages/language";
import { Account } from "@/pages/account";
import { Empty } from "@/pages/default/empty";
import Layout from "./layout";
import "./index.css";

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Explore */}
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />}  />

            {/* Management */}
            <Route path="entities" element={<Empty title="Entities" description="Manage entities" />} />
            <Route path="trust-chains" element={<Empty title="Trust Chains" description="Manage trust chains" />} />
            <Route path="trust-marks" element={<Empty title="Trust Marks" description="Manage trust marks" />} />
            <Route path="policies" element={<Empty title="Policies" description="Manage policies" />} />
            <Route path="keys" element={<Empty title="Keys" description="Manage keys" />} />
            <Route path="audit" element={<Empty title="Audit" description="Trace logs, check requests" />} />
            
            {/* Settings */}
            <Route path="language" element={<Language />} />

            {/* User */}
            <Route path="account" element={<Account />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
