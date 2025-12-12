"use client";

interface TypingIndicatorProps {
  usernames: string[];
}

export default function TypingIndicator({ usernames }: TypingIndicatorProps) {
  if (!usernames || usernames.length === 0) return null;

  const displayText =
    usernames.length === 1
      ? `${usernames[0]} is typing`
      : usernames.length === 2
        ? `${usernames[0]} and ${usernames[1]} are typing`
        : `${usernames.slice(0, 2).join(", ")} and ${usernames.length - 2} more are typing`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400">
      <span>{displayText}</span>
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
        <span
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></span>
        <span
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.4s" }}
        ></span>
      </div>
    </div>
  );
}
