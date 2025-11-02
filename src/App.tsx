import { Routes, Route } from "react-router-dom";
import { Dashboard } from "@/pages/dashboard";
import { Home } from "@/pages/home";
import { Api } from "@/pages/api";
import Layout from "./layout";
import "./index.css";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="api" element={<Api />} />
      </Route>
    </Routes>
  );
}

export default App;
