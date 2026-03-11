import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getUserSession } from "../utils/auth";

export default function ProtectedRoute({ children }) {
  const session = getUserSession();
  const location = useLocation();

  if (!session) {
    // Redirect to login but save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
