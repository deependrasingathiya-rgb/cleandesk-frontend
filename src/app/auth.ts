// src/app/auth.ts

const TOKEN_KEY = "auth_token";

// ─── Role IDs — must match backend ROLES constants ────────────────────────────
export const ROLES = {
  ADMIN: 1,
  MANAGEMENT: 2,
  TEACHER: 3,
  STUDENT: 4,
} as const;

export type RoleId = typeof ROLES[keyof typeof ROLES];

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