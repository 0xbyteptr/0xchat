/**
 * HTTP Caching utilities and middleware
 * Handles client-side and server-side cache headers
 */

/**
 * Generate cache control headers for responses
 */
export function getCacheControl(options: {
  maxAge?: number; // seconds
  sMaxAge?: number; // shared cache max age (CDN/proxy)
  public?: boolean; // allow public caching
  private?: boolean; // only allow private caching
  immutable?: boolean; // content will never change
  revalidate?: boolean; // allow revalidation
  staleWhileRevalidate?: number; // seconds to serve stale while revalidating
}): string {
  const parts: string[] = [];

  if (options.public) {
    parts.push("public");
  } else if (options.private) {
    parts.push("private");
  }

  if (options.maxAge !== undefined) {
    parts.push(`max-age=${options.maxAge}`);
  }

  if (options.sMaxAge !== undefined) {
    parts.push(`s-maxage=${options.sMaxAge}`);
  }

  if (options.immutable) {
    parts.push("immutable");
  }

  if (options.revalidate) {
    parts.push("must-revalidate");
  }

  if (options.staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }

  return parts.join(", ");
}

/**
 * Cache control presets
 */
export const CACHE_PRESETS = {
  /**
   * Immutable asset (hashed filename)
   * Cache for 1 year, never changes
   */
  IMMUTABLE: getCacheControl({
    public: true,
    maxAge: 31536000, // 1 year
    immutable: true,
  }),

  /**
   * Static content (CSS, JS, fonts)
   * Cache for 30 days, revalidate if needed
   */
  STATIC: getCacheControl({
    public: true,
    maxAge: 2592000, // 30 days
    revalidate: true,
    staleWhileRevalidate: 86400, // 24 hours
  }),

  /**
   * Content (images, videos, files)
   * Cache for 1 day
   */
  CONTENT: getCacheControl({
    public: true,
    maxAge: 86400, // 1 day
    staleWhileRevalidate: 604800, // 7 days
  }),

  /**
   * API responses
   * Cache for 5 minutes, revalidate with 1 day stale
   */
  API: getCacheControl({
    private: true,
    maxAge: 300, // 5 minutes
    revalidate: true,
    staleWhileRevalidate: 86400, // 1 day
  }),

  /**
   * User content (avatars, profiles)
   * Cache for 1 hour, revalidate if needed
   */
  USER_CONTENT: getCacheControl({
    public: true,
    maxAge: 3600, // 1 hour
    revalidate: true,
  }),

  /**
   * No cache - always revalidate
   */
  NO_CACHE: getCacheControl({
    private: true,
    maxAge: 0,
    revalidate: true,
  }),

  /**
   * Browser cache only (no proxy)
   * Cache for 1 hour
   */
  BROWSER_ONLY: getCacheControl({
    private: true,
    maxAge: 3600,
  }),
} as const;

/**
 * Generate ETag for content
 * Simple hash of the content
 */
export function generateETag(content: string | Buffer): string {
  const crypto = require("crypto");
  const hash = crypto.createHash("md5");

  if (typeof content === "string") {
    hash.update(content);
  } else {
    hash.update(content);
  }

  return `"${hash.digest("hex").slice(0, 8)}"`;
}

/**
 * Check if ETag matches (for 304 Not Modified)
 */
export function etagMatches(eTag: string, ifNoneMatch?: string): boolean {
  if (!ifNoneMatch) return false;
  // Handle multiple ETags separated by comma
  return ifNoneMatch.split(",").some((tag) => tag.trim() === eTag);
}

/**
 * Parse If-Modified-Since header
 */
export function parseIfModifiedSince(ifModifiedSince?: string): number | null {
  if (!ifModifiedSince) return null;

  try {
    const date = new Date(ifModifiedSince);
    return date.getTime();
  } catch {
    return null;
  }
}

/**
 * Format date for Last-Modified header (HTTP date format)
 */
export function formatHttpDate(date: Date): string {
  return date.toUTCString();
}

/**
 * Check if content is modified since given timestamp
 */
export function isModifiedSince(
  lastModified: number,
  ifModifiedSince: number
): boolean {
  // Round to seconds (HTTP date format doesn't include milliseconds)
  return Math.floor(lastModified / 1000) > Math.floor(ifModifiedSince / 1000);
}
