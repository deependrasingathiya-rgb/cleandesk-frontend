const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export async function apiFetch(path: string, options?: RequestInit) {
  const url = `${BASE_URL}${path.replace(/^\/api/, "")}`;
  return fetch(url, options);
}

// ── Intercept ALL fetch("/api/...") calls globally ──────────────────────────
if (BASE_URL) {
  const _fetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/api/")) {
      const url = `${BASE_URL}${input.replace(/^\/api/, "")}`;
      return _fetch(url, init);
    }
    return _fetch(input, init);
  };
}