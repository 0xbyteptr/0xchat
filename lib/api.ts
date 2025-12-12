export function normalizeBaseUrl(url: string): string {
  if (!url) return url;
  return url.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // If an explicit NEXT_PUBLIC_API_URL is set (client or env), prefer it.
    const envBase = (window as any).NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (envBase) {
      return normalizeBaseUrl(envBase);
    }

    // Fallback: use same-origin host the app is served from (helps mobile/dev when using tunnel).
    return normalizeBaseUrl(window.location.origin);
  }

  // Server-side build-time fallback
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL || "");
}

export function getApiUrl(path: string): string {
  const base = getApiBaseUrl();
  if (!base) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
