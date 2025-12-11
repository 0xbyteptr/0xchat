// Re-export all library functions for convenience
export { getDatabase } from "./db";
export { hashPassword, verifyPassword } from "./crypto";
export { useAuth } from "./hooks";
export { useMessages } from "./messages";
export { CHANNELS, AVATARS, API_ENDPOINTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from "./constants";
export type { User, Message, Channel } from "./types";
