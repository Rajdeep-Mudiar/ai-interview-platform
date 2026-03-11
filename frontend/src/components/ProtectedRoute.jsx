import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getUserSession } from "../utils/auth";

export default function ProtectedRoute({ children, role }) {
  const session = getUserSession();
  const location = useLocation();

  if (!session) {
    // Redirect to login but save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && session.role !== role) {
    // If user doesn't have the required role, redirect to their default dashboard
    const redirectPath = session.role === "recruiter" ? "/recruiter-dashboard" : "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}
