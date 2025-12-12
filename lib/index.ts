// Re-export all library functions for convenience
export { getDatabase } from "./db";
export { hashPassword, verifyPassword } from "./crypto";
export { useAuth } from "./hooks";
export { useMessages } from "./messages";
export { CHANNELS, AVATARS, API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from "./constants";
export type { User, Message, Channel } from "./types";
// Cache utilities
export {
  linkPreviewCache,
  inviteInfoCache,
  userProfileCache,
  messageCache,
  serverCache,
  CACHE_TTL,
  getOrSet,
  createCacheKey,
  clearAllCaches,
  pruneAllCaches,
  getCacheStats,
} from "./cache";

// Cache headers
export {
  getCacheControl,
  CACHE_PRESETS,
  generateETag,
  etagMatches,
  parseIfModifiedSince,
  formatHttpDate,
  isModifiedSince,
} from "./cache-headers";

// Twemoji utilities
export { useTwemoji, parseTwemoji, getEmojiUrl, getTwemojiHTML } from "./use-twemoji";