"use client";

import { useEffect, useState } from "react";
import { API_ENDPOINTS } from "@/lib/constants";
import { User, DM } from "@/lib/types";
import { Send } from "lucide-react";

interface Conversation {
  otherUserId: string;
  otherUser: User;
  messages: DM[];
  lastMessage?: DM;
}

interface DMListProps {
  token: string;
  onSelectConversation: (partnerId: string, partner: User) => void;
  selectedPartnerId?: string;
  initialPartner?: User | null;
}

export default function DMList({
  token,
  onSelectConversation,
  selectedPartnerId,
  initialPartner,
}: DMListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandDMs, setExpandDMs] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadConversations();

    // Refresh every 5 seconds (in production, use WebSocket)
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const loadConversations = async () => {
    try {
      setError(null);
      const response = await fetch(API_ENDPOINTS.DMS, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to load conversations");
        return;
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Failed to load conversations", err);
      setError("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const displayedConversations = (() => {
    if (!initialPartner) return conversations;
    const partnerId = initialPartner.id || initialPartner.username;
    const exists = conversations.some((c) => c.otherUserId === partnerId);
    if (exists) return conversations;
    const stub: Conversation = {
      otherUserId: partnerId,
      otherUser: initialPartner,
      messages: [],
      lastMessage: undefined,
    };
    return [stub, ...conversations];
  })();

  return (
    <div className="w-full">
      {/* DMs Header */}
      <button
        onClick={() => setExpandDMs(!expandDMs)}
        className="w-full px-4 py-3 text-left font-semibold text-slate-300 hover:bg-slate-800 transition flex items-center justify-between rounded-lg group"
      >
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4" />
          <span>Direct Messages</span>
        </div>
        <span className="text-xs text-slate-500 group-hover:text-slate-400">
          {expandDMs ? "▼" : "▶"}
        </span>
      </button>

      {/* Conversations List */}
      {expandDMs && (
        <div className="mt-2 space-y-1">
          {isLoading && (
            <p className="px-4 py-2 text-xs text-slate-400">Loading...</p>
          )}
          {error && (
            <p className="px-4 py-2 text-xs text-red-400">{error}</p>
          )}
          {conversations.length === 0 && !isLoading && !error && (
            <p className="px-4 py-2 text-xs text-slate-400">
              No conversations yet
            </p>
          )}

          {displayedConversations.map((conv) => (
            <button
              key={conv.otherUserId}
              onClick={() =>
                onSelectConversation(conv.otherUserId, conv.otherUser)
              }
              className={`w-full px-4 py-2 text-left rounded-lg transition ${
                selectedPartnerId === conv.otherUserId
                  ? "bg-purple-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Avatar */}
                {conv.otherUser.avatar &&
                (conv.otherUser.avatar.startsWith("http") ||
                  conv.otherUser.avatar.startsWith("data:")) ? (
                  <img
                    src={conv.otherUser.avatar}
                    alt={conv.otherUser.username}
                    className="w-6 h-6 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span className="text-lg shrink-0">
                    {conv.otherUser.avatar || "😺"}
                  </span>
                )}

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {conv.otherUser.displayName ||
                      conv.otherUser.username}
                  </p>
                  {conv.lastMessage && (
                    <p className="text-xs opacity-70 truncate">
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
