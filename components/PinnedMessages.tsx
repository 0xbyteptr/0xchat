"use client";

import { useState } from "react";
import { Message } from "@/lib/types";
import { X, Pin, Trash2 } from "lucide-react";

interface PinnedMessagesProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedMessages: Message[];
  onUnpin?: (messageId: string) => void;
  onDeletePin?: (messageId: string) => void;
  onJumpToMessage?: (messageId: string) => void;
}

export default function PinnedMessages({
  isOpen,
  onClose,
  pinnedMessages,
  onUnpin,
  onDeletePin,
  onJumpToMessage,
}: PinnedMessagesProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-slate-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 p-6 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Pin size={24} className="text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Pinned Messages</h2>
            <span className="bg-purple-600/30 text-purple-300 px-3 py-1 rounded-full text-sm font-semibold">
              {pinnedMessages.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {pinnedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <Pin size={48} className="text-slate-600" />
              <p className="text-gray-400">No pinned messages yet</p>
              <p className="text-xs text-gray-500">Pin important messages to find them later</p>
            </div>
          ) : (
            pinnedMessages.map((message) => (
              <div
                key={message.id}
                className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4 hover:bg-slate-700/50 transition-colors group"
              >
                {/* Author Info */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {message.author?.avatar?.startsWith("http") ||
                    message.author?.avatar?.startsWith("data:") ? (
                      <img
                        src={message.author.avatar}
                        alt={message.author.username}
                        className="w-full h-full object-cover"
                        width={32}
                        height={32}
                      />
                    ) : (
                      message.author?.avatar || "👤"
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {message.author?.username || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(message.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Message Content */}
                <p className="text-white text-sm mb-3 wrap-break-word whitespace-pre-wrap">
                  {message.content}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onJumpToMessage && (
                    <button
                      onClick={() => onJumpToMessage(message.id)}
                      className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                    >
                      Jump to Message
                    </button>
                  )}
                  {onUnpin && (
                    <button
                      onClick={() => onUnpin(message.id)}
                      className="px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded flex items-center gap-1 transition-colors"
                    >
                      <Pin size={12} />
                      Unpin
                    </button>
                  )}
                  {onDeletePin && (
                    <button
                      onClick={() => onDeletePin(message.id)}
                      className="px-3 py-1 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
