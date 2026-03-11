import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getUserSession } from "../utils/auth";

export default function ProtectedRoute({ children, role }) {
  const session = getUserSession();
  const location = useLocation();

  console.log(`[AUTH CHECK] ${location.pathname}`, { session, requiredRole: role });

  if (!session) {
    console.warn(`[AUTH FAILED] No session for ${location.pathname}, redirecting to /login`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && session.role !== role) {
    const redirectPath = session.role === "recruiter" ? "/recruiter-dashboard" : "/dashboard";
    console.warn(`[ROLE MISMATCH] Expected ${role}, got ${session.role}. Redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} replace />;
  }

  console.log(`[AUTH SUCCESS] Access granted to ${location.pathname}`);
  return children;
}
