"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Message } from "@/lib/types";
import { searchMessages } from "@/lib/mention-utils";

interface MessageSearchProps {
  messages: Message[];
  onSelect?: (message: Message) => void;
}

export default function MessageSearch({
  messages,
  onSelect,
}: MessageSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query) return [];
    return searchMessages(messages, query).slice(0, 10);
  }, [query, messages]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-white transition"
        title="Search messages"
      >
        <Search size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50 max-h-96 flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b border-slate-700">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-transparent text-white outline-none placeholder-gray-500"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {results.length > 0 ? (
            <div className="overflow-y-auto">
              {results.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => {
                    onSelect?.(msg);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-700/50 transition border-b border-slate-700/30 last:border-b-0"
                >
                  <p className="text-xs text-purple-300 font-semibold">
                    {msg.author.username}
                  </p>
                  <p className="text-sm text-gray-300 line-clamp-2">
                    {msg.content}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {typeof msg.timestamp === "string"
                      ? new Date(msg.timestamp).toLocaleString()
                      : msg.timestamp.toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-gray-400">
              <p className="text-sm">No messages found</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
