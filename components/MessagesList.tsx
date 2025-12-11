"use client";

import { RefObject } from "react";
import { Message } from "@/lib/types";

interface MessagesListProps {
  messages: Message[];
  messagesEndRef: RefObject<HTMLDivElement>;
  onAvatarClick?: (user: Message["author"]) => void;
}

export default function MessagesList({
  messages,
  messagesEndRef,
  onAvatarClick,
}: MessagesListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-linear-to-b from-slate-900/50 to-slate-900">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-400">
            <p className="text-4xl mb-2">💬</p>
            <p>No messages yet. Start the conversation!</p>
          </div>
        </div>
      )}
      {messages.map((message, index) => (
        <div
          key={message.id}
          className="flex gap-4 hover:bg-slate-800/40 px-4 py-2 rounded-lg transition animate-slide-in group"
          style={{
            animationDelay: `${index * 30}ms`,
          }}
        >
          <button
            type="button"
            onClick={() => onAvatarClick?.(message.author)}
            className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-400 hover:scale-110 transition-transform"
            title={`View ${message.author.username}'s profile`}
          >
            {message.author.avatar?.startsWith("http") ? (
              <img
                src={message.author.avatar}
                alt={message.author.username}
                className="w-full h-full object-cover"
                width={40}
                height={40}
                loading="lazy"
              />
            ) : (
              <span>{message.author.avatar || "😺"}</span>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-bold text-white hover:underline cursor-pointer hover:text-purple-300 transition">
                {message.author.username}
              </span>
              <span className="text-xs text-gray-500">
                {(typeof message.timestamp === "string"
                  ? new Date(message.timestamp)
                  : message.timestamp
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-gray-200 mt-1 text-sm leading-relaxed">
              {message.content}
            </p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
