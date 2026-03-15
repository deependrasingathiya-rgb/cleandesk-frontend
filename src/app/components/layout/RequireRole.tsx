// src/app/components/auth/RequireRole.tsx

import { Navigate, Outlet } from "react-router";
import { getToken, parseToken, isTokenExpired, clearToken } from "../../lib/auth";

export function RequireRole({ roleId }: { roleId: number }) {
  const token = getToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isTokenExpired(token)) {
    clearToken();
    return <Navigate to="/login" replace />;
  }

  const payload = parseToken(token);

  if (!payload) {
    clearToken();
    return <Navigate to="/login" replace />;
  }

  if (payload.role_id !== roleId) {
    const ROLE_ROUTES: Record<number, string> = {
      1: "/",
      2: "/management",
      3: "/teacher",
      4: "/student",
    };
    const correctRoute = ROLE_ROUTES[payload.role_id] ?? "/login";
    return <Navigate to={correctRoute} replace />;
  }

  return <Outlet />;
}