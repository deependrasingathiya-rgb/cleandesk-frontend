//src/app/api-url.ts
const RAW_API_BASE = (import.meta.env.VITE_API_URL ?? "").trim();

function normalizeApiBaseUrl(value: string): string {
  return value.replace(/\/+$/, "").replace(/\/api$/, "");
}

export const API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE);

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/api/")
    ? path
    : `/api/${path.replace(/^\/+/, "")}`;

  return API_BASE_URL
    ? `${API_BASE_URL}${normalizedPath}`
    : normalizedPath;
}
