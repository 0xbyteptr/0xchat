export function normalizeBaseUrl(url: string): string {
  if (!url) return url;
  return url.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // If an explicit NEXT_PUBLIC_API_URL is set (client or env), prefer it.
    const envBase = (window as any).NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (envBase) {
      const normalized = normalizeBaseUrl(envBase);
      console.debug("getApiBaseUrl: using NEXT_PUBLIC_API_URL", normalized);
      return normalized;
    }

    // Fallback: use same-origin host the app is served from (helps mobile/dev when using tunnel).
    const origin = normalizeBaseUrl(window.location.origin);
    console.debug("getApiBaseUrl: using window.location.origin", origin);
    return origin;
  }

  // Server-side build-time fallback
  const serverBase = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL || "");
  console.debug("getApiBaseUrl (server):", serverBase);
  return serverBase;
}

export function getApiUrl(path: string): string {
  const base = getApiBaseUrl();
  if (!base) return path;
  
  // If path already contains /api/, just use it as-is (it's a full path)
  if (path.includes("/api/")) {
    return path;
  }
  
  // Otherwise, append to base
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
