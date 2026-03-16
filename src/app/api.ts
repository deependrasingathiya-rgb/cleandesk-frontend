const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export async function apiFetch(path: string, options?: RequestInit) {
  const url = `${BASE_URL}${path.replace(/^\/api/, "")}`;
  return fetch(url, options);
}