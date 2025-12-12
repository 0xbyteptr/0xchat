"use client";

import { useState, useMemo } from "react";
import { Bell, X, CheckCircle, MessageCircle, UserPlus, Zap } from "lucide-react";
import { UserNotification } from "@/lib/notification-types";

interface NotificationCenterProps {
  notifications: UserNotification[];
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDismiss?: (notificationId: string) => void;
  onAccept?: (notification: UserNotification) => void;
}

export default function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onAccept,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const getIcon = (type: string) => {
    switch (type) {
      case "mention":
        return <MessageCircle size={16} className="text-blue-400" />;
      case "friendRequest":
        return <UserPlus size={16} className="text-green-400" />;
      case "serverInvite":
        return <Zap size={16} className="text-yellow-400" />;
      case "message":
        return <Bell size={16} className="text-purple-400" />;
      default:
        return <Bell size={16} className="text-gray-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mention: "Mention",
      friendRequest: "Friend Request",
      serverInvite: "Server Invite",
      message: "Message",
    };
    return labels[type] || type;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-400 hover:text-white transition"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Bell size={18} />
              Notifications
            </h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => {
                    onMarkAllAsRead?.();
                  }}
                  className="text-xs px-2 py-1 rounded bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 transition"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          {notifications.length > 0 ? (
            <div className="overflow-y-auto flex-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-slate-700/30 hover:bg-slate-700/30 transition last:border-b-0 ${
                    !notification.read ? "bg-slate-700/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="mt-1 shrink-0">
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-purple-300 font-semibold">
                            {getTypeLabel(notification.type)}
                          </p>
                          <p className="text-sm font-semibold text-white mt-0.5">
                            {notification.from.username}
                          </p>
                          <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                            {notification.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {typeof notification.createdAt === "string"
                              ? new Date(notification.createdAt).toLocaleString()
                              : notification.createdAt.toLocaleString()}
                          </p>
                        </div>

                        {/* Actions */}
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                        )}
                      </div>

                      {/* Accept/Decline buttons for requests */}
                      {(notification.type === "friendRequest" ||
                        notification.type === "serverInvite") && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => {
                              onAccept?.(notification);
                              onMarkAsRead?.(notification.id);
                            }}
                            className="flex-1 text-xs px-2 py-1 rounded bg-green-600/20 text-green-300 hover:bg-green-600/30 transition font-medium"
                          >
                            <CheckCircle size={14} className="inline mr-1" />
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              onDismiss?.(notification.id);
                            }}
                            className="flex-1 text-xs px-2 py-1 rounded bg-red-600/20 text-red-300 hover:bg-red-600/30 transition font-medium"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {/* Read button for other types */}
                      {!notification.read &&
                        notification.type !== "friendRequest" &&
                        notification.type !== "serverInvite" && (
                          <button
                            onClick={() => onMarkAsRead?.(notification.id)}
                            className="text-xs mt-2 text-gray-400 hover:text-gray-200 underline"
                          >
                            Mark as read
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Bell size={32} className="mx-auto text-gray-600 mb-2" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
