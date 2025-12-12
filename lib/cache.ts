/**
 * In-memory caching utilities for server-side data
 * Handles caching of expensive operations with TTL support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds
   */
  set(key: string, data: T, ttl: number): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Cached data or undefined if expired/not found
   */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    // Check if expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.store.delete(key);
      return undefined;
    }

    return entry.data;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache size (number of entries)
   */
  size(): number {
    return this.store.size;
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Clean up expired entries
   */
  prune(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.store.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Cache instances for different types of data
export const linkPreviewCache = new Cache<{
  title?: string;
  description?: string;
  image?: string;
  url: string;
  domain?: string;
  favicon?: string;
}>();

export const inviteInfoCache = new Cache<{
  serverId: string;
  serverName: string;
  serverIcon?: string;
  memberCount: number;
  description?: string;
}>();

export const userProfileCache = new Cache<{
  id: string;
  username: string;
  avatar?: string;
  status: string;
  bio?: string;
}>();

export const messageCache = new Cache<{
  id: string;
  content: string;
  author: string;
  timestamp: string;
  edited?: boolean;
}>();

export const serverCache = new Cache<{
  id: string;
  name: string;
  icon?: string;
  channels: Array<{ id: string; name: string }>;
  members: number;
}>();

/**
 * TTL constants (in milliseconds)
 */
export const CACHE_TTL = {
  LINK_PREVIEW: 1000 * 60 * 60, // 1 hour
  INVITE_INFO: 1000 * 60 * 30, // 30 minutes
  USER_PROFILE: 1000 * 60 * 15, // 15 minutes
  MESSAGE: 1000 * 60 * 60 * 24, // 24 hours
  SERVER: 1000 * 60 * 60, // 1 hour
  SHORT: 1000 * 60 * 5, // 5 minutes
  LONG: 1000 * 60 * 60 * 24 * 7, // 7 days
} as const;

/**
 * Get or set a value in cache with async function
 * @param cache Cache instance
 * @param key Cache key
 * @param ttl Time to live in milliseconds
 * @param fn Async function to call if cache miss
 */
export async function getOrSet<T>(
  cache: Cache<T>,
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  // Try to get from cache
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  // Cache miss - call the function
  const data = await fn();

  // Store in cache
  cache.set(key, data, ttl);

  return data;
}

/**
 * Create a cache key from multiple parts
 * Useful for creating consistent, readable cache keys
 */
export function createCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter((part) => part !== undefined).join(":");
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  linkPreviewCache.clear();
  inviteInfoCache.clear();
  userProfileCache.clear();
  messageCache.clear();
  serverCache.clear();
}

/**
 * Prune all expired entries from all caches
 */
export function pruneAllCaches(): { [key: string]: number } {
  return {
    linkPreview: linkPreviewCache.prune(),
    inviteInfo: inviteInfoCache.prune(),
    userProfile: userProfileCache.prune(),
    message: messageCache.prune(),
    server: serverCache.prune(),
  };
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  [key: string]: { size: number; keys: string[] };
} {
  return {
    linkPreview: {
      size: linkPreviewCache.size(),
      keys: linkPreviewCache.keys(),
    },
    inviteInfo: {
      size: inviteInfoCache.size(),
      keys: inviteInfoCache.keys(),
    },
    userProfile: {
      size: userProfileCache.size(),
      keys: userProfileCache.keys(),
    },
    message: {
      size: messageCache.size(),
      keys: messageCache.keys(),
    },
    server: {
      size: serverCache.size(),
      keys: serverCache.keys(),
    },
  };
}

export default Cache;
