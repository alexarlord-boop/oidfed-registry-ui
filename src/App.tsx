import { Routes, Route } from "react-router-dom";
import { Dashboard } from "@/pages/dashboard";
import { Home } from "@/pages/home";
import { Api } from "@/pages/api";
import { Empty } from "@/pages/default/empty";
import Layout from "./layout";
import "./index.css";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="api" element={<Api />} />
        <Route path="entities" element={<Empty title="Entities" description="Manage entities" />} />
        <Route path="trust-chains" element={<Empty title="Trust Chains" description="Manage trust chains" />} />
        <Route path="trust-marks" element={<Empty title="Trust Marks" description="Manage trust marks" />} />
        <Route path="policies" element={<Empty title="Policies" description="Manage policies" />} />
        <Route path="keys" element={<Empty title="Keys" description="Manage keys" />} />
        <Route path="audit" element={<Empty title="Audit" description="Trace logs, check requests" />} />
      </Route>
    </Routes>
  );
}

export default App;
