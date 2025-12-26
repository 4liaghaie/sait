// src/lib/api.js

const stripTrailingSlash = (s = "") => String(s).replace(/\/+$/, "");
const ensureLeadingSlash = (s = "") => (s.startsWith("/") ? s : `/${s}`);

const isServer = typeof window === "undefined";

// Browser should use "/api" (same-origin via nginx).
// Server (SSR) MUST use an absolute URL, preferably INTERNAL_API_BASE.
export const API_BASE = (() => {
  if (isServer) {
    const internal =
      process.env.INTERNAL_API_BASE ||
      process.env.NEXT_PUBLIC_API_BASE_INTERNAL ||
      process.env.API_BASE_INTERNAL;

    // Inside docker-compose network, backend service name resolves.
    return stripTrailingSlash(internal || "http://backend:4000");
  }

  return stripTrailingSlash(process.env.NEXT_PUBLIC_API_BASE || "/api");
})();

const normalizePathForBase = (path) => {
  // Ensure path starts with "/"
  let p = ensureLeadingSlash(path);

  // Avoid "/api/api/..." if base already ends with "/api"
  if (API_BASE.endsWith("/api") && p.startsWith("/api/")) {
    p = p.replace(/^\/api/, "");
  }

  return p;
};

export const apiUrl = (path = "") => `${API_BASE}${normalizePathForBase(path)}`;

export const withBase = (maybePath) => {
  if (!maybePath) return maybePath;
  if (maybePath.startsWith("http")) return maybePath;
  return apiUrl(maybePath);
};

export const withLang = (url, lang) => {
  if (!url) return url;

  // Ensure URL is absolute before passing into URL()
  const absolute = url.startsWith("http") ? url : apiUrl(url);

  const u = new URL(absolute);
  if (lang) u.searchParams.set("lang", lang);
  return u.toString();
};
