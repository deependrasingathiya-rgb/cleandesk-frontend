// src/app/auth.ts

const TOKEN_KEY = "auth_token";
const LOGIN_PATH = "/login";

let isHandlingUnauthorized = false;

// ─── Role IDs — must match backend ROLES constants ────────────────────────────
export const ROLES = {
  ADMIN: 1,
  MANAGEMENT: 2,
  TEACHER: 3,
  STUDENT: 4,
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

export const ROLE_ROUTES: Record<RoleId, string> = {
  [ROLES.ADMIN]: "/",
  [ROLES.MANAGEMENT]: "/management",
  [ROLES.TEACHER]: "/teacher",
  [ROLES.STUDENT]: "/student",
};

export const ROLE_LABELS: Record<RoleId, string> = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.MANAGEMENT]: "Management",
  [ROLES.TEACHER]: "Teacher",
  [ROLES.STUDENT]: "Student",
};

export function getRoleLabel(roleId: RoleId): string {
  return ROLE_LABELS[roleId] ?? "User";
}

// ─── Token storage ────────────────────────────────────────────────────────────

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function clearSession(): void {
  clearToken();
}

// ─── JWT payload parsing (client-side, no verification) ──────────────────────
// We only use this to read role_id for routing.
// The backend verifies the signature on every protected request.

type JwtPayload = {
  user_id: string;
  role_id: RoleId;
  institute_id: string;
  exp: number;
};

export function parseToken(token: string): JwtPayload | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: JwtPayload): boolean {
  return Date.now() / 1000 > payload.exp;
}

// ─── Get current session (token + parsed payload), or null if invalid ─────────

export type Session = {
  token: string;
  payload: JwtPayload;
};

export function getSession(): Session | null {
  const token = getToken();
  if (!token) return null;

  const payload = parseToken(token);
  if (!payload) return null;

  if (isTokenExpired(payload)) {
    clearToken();
    return null;
  }

  return { token, payload };
}

function redirectToLogin(): void {
  if (window.location.pathname !== LOGIN_PATH) {
    window.location.assign(LOGIN_PATH);
  }
}

/**
 * Attempts to get a new access token using the HttpOnly refresh token cookie.
 * Returns the new access token string, or null if refresh failed.
 * Called automatically by apiFetch on 401 responses.
 */
const API_BASE = import.meta.env.VITE_API_URL ?? "";

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.token) {
      saveToken(data.token);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function logout(options?: { redirectToLogin?: boolean }): Promise<void> {
  const shouldRedirect = options?.redirectToLogin ?? true;
  const token = getToken();

  try {
    if (token) {
      await fetch(`${API_BASE}/api/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch {
    // Local cleanup still needs to happen even if the network request fails.
  } finally {
    clearSession();

    if (shouldRedirect) {
      redirectToLogin();
    }
  }
}

export function handleUnauthorizedSession(): void {
  if (isHandlingUnauthorized) return;

  isHandlingUnauthorized = true;
  clearSession();
  redirectToLogin();

  window.setTimeout(() => {
    isHandlingUnauthorized = false;
  }, 0);
}
