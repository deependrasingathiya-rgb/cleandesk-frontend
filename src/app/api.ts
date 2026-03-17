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

async function withUnauthorizedHandling(
  request: Promise<Response>,
  options?: RequestInit
): Promise<Response> {
  const response = await request;

  if (response.status === 401 && hasAuthorizationHeader(options?.headers)) {
    handleUnauthorizedSession();
  }

  return response;
}

export async function apiFetch(path: string, options?: RequestInit) {
  const url = `${BASE_URL}${path.replace(/^\/api/, "")}`;
  return withUnauthorizedHandling(fetch(url, options), options);
}

// ── Intercept ALL fetch("/api/...") calls globally ──────────────────────────
const _fetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === "string" && input.startsWith("/api/")) {
    const url = BASE_URL
      ? `${BASE_URL}${input.replace(/^\/api/, "")}`
      : input;

    return withUnauthorizedHandling(_fetch(url, init), init);
  }

  return _fetch(input, init);
};
