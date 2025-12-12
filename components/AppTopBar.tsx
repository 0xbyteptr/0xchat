"use client";

import { User } from "@/lib/types";
import NotificationCenter from "./NotificationCenter";
import { UserNotification } from "@/lib/notification-types";

interface AppTopBarProps {
  currentUser: User | null;
  notifications?: UserNotification[];
  onMarkNotificationAsRead?: (notificationId: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onDismissNotification?: (notificationId: string) => void;
  onAcceptNotification?: (notification: UserNotification) => void;
}

export default function AppTopBar({
  currentUser,
  notifications = [],
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onDismissNotification,
  onAcceptNotification,
}: AppTopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 flex items-center justify-between px-6 z-40">
      {/* Left: Brand/Logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          0xChat
        </span>
      </div>

      {/* Center: User Info (optional) */}
      {currentUser && (
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>{currentUser.username}</span>
        </div>
      )}

      {/* Right: Notifications */}
      <div className="flex items-center gap-4">
        <NotificationCenter
          notifications={notifications}
          onMarkAsRead={onMarkNotificationAsRead}
          onMarkAllAsRead={onMarkAllNotificationsAsRead}
          onDismiss={onDismissNotification}
          onAccept={onAcceptNotification}
        />
      </div>
    </div>
  );
}
