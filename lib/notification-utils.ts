import { Toast, UserNotification, generateToastId, generateNotificationId } from "@/lib/notification-types";

/**
 * Create a success toast notification
 */
export function createSuccessToast(message: string, duration = 3000): Toast {
  return {
    id: generateToastId(),
    type: "success",
    message,
    duration,
  };
}

/**
 * Create an error toast notification
 */
export function createErrorToast(message: string, duration = 4000): Toast {
  return {
    id: generateToastId(),
    type: "error",
    message,
    duration,
  };
}

/**
 * Create an info toast notification
 */
export function createInfoToast(message: string, duration = 3000): Toast {
  return {
    id: generateToastId(),
    type: "info",
    message,
    duration,
  };
}

/**
 * Create a warning toast notification
 */
export function createWarningToast(message: string, duration = 3000): Toast {
  return {
    id: generateToastId(),
    type: "warning",
    message,
    duration,
  };
}

/**
 * Create a mention notification
 */
export function createMentionNotification(
  fromUsername: string,
  fromId: string,
  content: string,
  messageId: string,
  avatar?: string
): UserNotification {
  return {
    id: generateNotificationId(),
    type: "mention",
    from: { id: fromId, username: fromUsername, avatar },
    content,
    data: { messageId },
    read: false,
    createdAt: new Date(),
  };
}

/**
 * Create a friend request notification
 */
export function createFriendRequestNotification(
  fromUsername: string,
  fromId: string,
  avatar?: string
): UserNotification {
  return {
    id: generateNotificationId(),
    type: "friendRequest",
    from: { id: fromId, username: fromUsername, avatar },
    content: `${fromUsername} sent you a friend request`,
    read: false,
    createdAt: new Date(),
  };
}

/**
 * Create a server invite notification
 */
export function createServerInviteNotification(
  fromUsername: string,
  fromId: string,
  serverName: string,
  inviteCode: string,
  avatar?: string
): UserNotification {
  return {
    id: generateNotificationId(),
    type: "serverInvite",
    from: { id: fromId, username: fromUsername, avatar },
    content: `${fromUsername} invited you to join "${serverName}"`,
    data: { inviteCode },
    read: false,
    createdAt: new Date(),
  };
}

/**
 * Create a message notification
 */
export function createMessageNotification(
  fromUsername: string,
  fromId: string,
  messagePreview: string,
  messageId: string,
  avatar?: string
): UserNotification {
  return {
    id: generateNotificationId(),
    type: "message",
    from: { id: fromId, username: fromUsername, avatar },
    content: messagePreview,
    data: { messageId },
    read: false,
    createdAt: new Date(),
  };
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const notifDate = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - notifDate.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return notifDate.toLocaleDateString();
}
