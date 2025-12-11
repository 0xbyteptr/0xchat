// Channel names and IDs
export const CHANNELS = [
  { id: "general", name: "general" },
  { id: "introductions", name: "introductions" },
  { id: "cute-stuff", name: "cute-stuff" },
] as const;

// Avatar emojis
export const AVATARS = ["😺", "😸", "😻", "😼", "😽"] as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: "/api/auth",
  MESSAGES: "/api/messages",
  FRIEND_INVITES: "/api/friend/invite",
  PROFILE: "/api/profile",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Invalid username or password",
  USERNAME_EXISTS: "Username already exists",
  WEAK_PASSWORD: "Password must be at least 6 characters",
  NETWORK_ERROR: "Connection error. Please try again.",
  INTERNAL_ERROR: "Internal server error",
  FILL_FIELDS: "Please fill in all fields",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGGED_IN: "Successfully logged in!",
  ACCOUNT_CREATED: "Account created successfully!",
} as const;
