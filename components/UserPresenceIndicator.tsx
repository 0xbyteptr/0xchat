"use client";

interface UserPresenceIndicatorProps {
  status: "online" | "away" | "offline" | "dnd";
  size?: "sm" | "md" | "lg";
}

const statusColors = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  offline: "bg-gray-500",
  dnd: "bg-red-500",
};

const statusLabels = {
  online: "Online",
  away: "Away",
  offline: "Offline",
  dnd: "Do Not Disturb",
};

const sizeClasses = {
  sm: "w-2 h-2",
  md: "w-3 h-3",
  lg: "w-4 h-4",
};

export default function UserPresenceIndicator({
  status = "offline",
  size = "md",
}: UserPresenceIndicatorProps) {
  return (
    <div
      className={`${sizeClasses[size]} ${statusColors[status]} rounded-full animate-pulse`}
      title={statusLabels[status]}
    />
  );
}
