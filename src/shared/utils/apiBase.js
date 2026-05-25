/**
 * Returns the API server base URL.
 * In split deployment: UI on Vercel, Server on DigitalOcean/Coolify.
 * Set NEXT_PUBLIC_API_URL env var to your server URL (e.g. https://api.example.com).
 * Falls back to same-origin for monolith deployment.
 */
export function getApiBase() {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  return "";
}

/**
 * Wrapper around fetch that prepends the API base URL for /api/* paths
 * and includes credentials for cross-origin cookie auth.
 */
export function apiFetch(path, options = {}) {
  const base = getApiBase();
  const url = base && path.startsWith("/") ? `${base}${path}` : path;
  const fetchOptions = base ? { credentials: "include", ...options } : options;
  return fetch(url, fetchOptions);
}
