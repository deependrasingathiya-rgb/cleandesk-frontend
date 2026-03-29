import { handleUnauthorizedSession } from "./auth";

const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function hasAuthorizationHeader(headers?: HeadersInit): boolean {
  if (!headers) return false;

  if (headers instanceof Headers) {
    return headers.has("Authorization");
  }

  if (Array.isArray(headers)) {
    return headers.some(([key]) => key.toLowerCase() === "authorization");
  }

  return Object.keys(headers).some((key) => key.toLowerCase() === "authorization");
}

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function onRefreshComplete(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function withUnauthorizedHandling(
  request: Promise<Response>,
  options?: RequestInit
): Promise<Response> {
  const response = await request;

  if (response.status === 401 && hasAuthorizationHeader(options?.headers)) {
    // Attempt a single silent token refresh before giving up
    if (!isRefreshing) {
      isRefreshing = true;
      const { refreshAccessToken } = await import("./auth");
      const newToken = await refreshAccessToken();
      isRefreshing = false;
      onRefreshComplete(newToken);

      if (!newToken) {
        // Refresh failed — session is truly dead
        const { handleUnauthorizedSession } = await import("./auth");
        handleUnauthorizedSession();
        return response;
      }

      // Retry the original request with the new token
      const retryHeaders = new Headers(options?.headers);
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      return _fetch(
        typeof response.url === "string" ? response.url : "",
        { ...options, headers: retryHeaders }
      );
    } else {
      // Another request is already refreshing — queue this one
      return new Promise((resolve) => {
        refreshSubscribers.push(async (token) => {
          if (!token) {
            resolve(response);
            return;
          }
          const retryHeaders = new Headers(options?.headers);
          retryHeaders.set("Authorization", `Bearer ${token}`);
          resolve(
            _fetch(
              typeof response.url === "string" ? response.url : "",
              { ...options, headers: retryHeaders }
            )
          );
        });
      });
    }
  }

  return response;
}

export async function apiFetch(path: string, options?: RequestInit) {
  const url = `${BASE_URL}${path.replace(/^\/api/, "")}`;
  const optionsWithCredentials: RequestInit = { credentials: "include", ...options };
  return withUnauthorizedHandling(fetch(url, optionsWithCredentials), optionsWithCredentials);
}

// ── Intercept ALL fetch("/api/...") calls globally ──────────────────────────
const _fetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === "string" && input.startsWith("/api/")) {
    const url = BASE_URL
      ? `${BASE_URL}${input.replace(/^\/api/, "")}`
      : input;

    // Always include credentials so the HttpOnly refresh token cookie is sent
    const initWithCredentials: RequestInit = { credentials: "include", ...init };

    return withUnauthorizedHandling(_fetch(url, initWithCredentials), initWithCredentials);
  }

  return _fetch(input, init);
};
