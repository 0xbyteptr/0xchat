// Notification types and utilities
export type NotificationType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number; // in ms, 0 = no auto-dismiss
}

export interface UserNotification {
  id: string;
  type: "mention" | "friendRequest" | "serverInvite" | "message";
  from: {
    id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  data?: {
    messageId?: string;
    serverId?: string;
    inviteCode?: string;
    inviteId?: string;
  };
  read: boolean;
  createdAt: Date | string;
}

export function generateToastId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function generateNotificationId(): string {
  return Math.random().toString(36).substring(2, 9);
}
