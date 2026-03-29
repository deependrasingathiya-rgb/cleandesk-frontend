import {
  getToken,
  saveToken,
  refreshAccessToken,
  handleUnauthorizedSession,
} from "./auth";

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function drainQueue(token: string | null) {
  refreshQueue.forEach((resolve) => resolve(token));
  refreshQueue = [];
}

export async function apiFetch(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  const token = getToken();

  const headers = new Headers(init.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response = await fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status !== 401) return response;

  // ── 401 received — attempt token refresh ──────────────────────────────────

  if (isRefreshing) {
    // Another refresh is in flight — queue this request
    const newToken = await new Promise<string | null>((resolve) => {
      refreshQueue.push(resolve);
    });

    if (!newToken) {
      handleUnauthorizedSession();
      return response;
    }

    const retryHeaders = new Headers(headers);
    retryHeaders.set("Authorization", `Bearer ${newToken}`);
    return fetch(input, { ...init, headers: retryHeaders, credentials: "include" });
  }

  isRefreshing = true;

  const newToken = await refreshAccessToken();

  isRefreshing = false;

  if (!newToken) {
    drainQueue(null);
    handleUnauthorizedSession();
    return response;
  }

  saveToken(newToken);
  drainQueue(newToken);

  // Retry the original request with the new token
  const retryHeaders = new Headers(headers);
  retryHeaders.set("Authorization", `Bearer ${newToken}`);
  return fetch(input, { ...init, headers: retryHeaders, credentials: "include" });
}