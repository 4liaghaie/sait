export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export const apiUrl = (path = "") =>
  `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

export const withBase = (maybePath) => {
  if (!maybePath) return maybePath;
  if (maybePath.startsWith("http")) return maybePath;
  return `${API_BASE}${maybePath.startsWith("/") ? maybePath : `/${maybePath}`}`;
};

export const withLang = (url, lang) => {
  if (!url) return url;
  const u = new URL(url.startsWith("http") ? url : apiUrl(url));
  if (lang) u.searchParams.set("lang", lang);
  return u.toString();
};
