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

    // For local development, default to localhost
    // In Docker, use backend service name
    if (internal) {
      return stripTrailingSlash(internal);
    }

    // Default to localhost for local development
    // Only use backend:4000 if explicitly in Docker (check for DOCKER env var)
    // Note: NODE_ENV can be "production" even in local builds, so we check for DOCKER specifically
    // Also check if we're running in a container by checking for common Docker env vars
    const isDocker =
      process.env.DOCKER === "true" ||
      process.env.IN_DOCKER === "true" ||
      (process.env.HOSTNAME && process.env.HOSTNAME.includes("backend"));

    const defaultBase = isDocker
      ? "http://backend:4000"
      : "https://api.muhsinzade.com";

    // Log in development to help debug
    if (process.env.NODE_ENV === "development") {
      console.log(`[API] Using API_BASE: ${defaultBase} (Docker: ${isDocker})`);
    }

    return stripTrailingSlash(defaultBase);
  }

  // In browser: use NEXT_PUBLIC_API_BASE if set, otherwise default to localhost for local dev
  // In production with nginx, NEXT_PUBLIC_API_BASE would be "/api" for proxying
  const browserBase = process.env.NEXT_PUBLIC_API_BASE;
  if (browserBase) {
    return stripTrailingSlash(browserBase);
  }

  // For local development, default to localhost backend
  // In production, this would be handled by nginx proxy
  if (process.env.NODE_ENV === "development") {
    return "https://api.muhsinzade.com";
  }

  // Fallback to relative path (for production with nginx)
  return "/api";
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
  if (!lang) return url;

  // Ensure URL is absolute before passing into URL()
  let absolute = url;
  if (!url.startsWith("http")) {
    // For relative URLs, make them absolute
    if (typeof window !== "undefined") {
      // Browser: use current origin
      absolute = `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
    } else {
      // Server: use apiUrl to get absolute URL
      absolute = apiUrl(url);
    }
  }

  try {
    const u = new URL(absolute);
    u.searchParams.set("lang", lang);
    return u.toString();
  } catch (error) {
    // Fallback: manually append lang parameter
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}lang=${lang}`;
  }
};

// Helper function to safely parse JSON from fetch response
export const parseJsonResponse = async (res) => {
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`,
    );
  }
  return res.json();
};
