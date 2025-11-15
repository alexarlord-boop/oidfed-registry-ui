import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/lib/devAuth";

export const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const location = useLocation();
  if (isAuthenticated()) return children;
  // redirect to login with return path
  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default RequireAuth;
