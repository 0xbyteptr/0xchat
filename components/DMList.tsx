"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

interface Conversation {
  id: string;
  participants: string[];
  createdAt: string;
  lastMessageAt: string;
  lastMessage?: string;
  otherUser?: { id: string; username: string; avatar: string };
}

interface DMListProps {
  token: string;
  onSelectDM: (userId: string, userName: string, avatar: string) => void;
  selectedUserId?: string;
}

export default function DMList({
  token,
  onSelectDM,
  selectedUserId,
}: DMListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadConversations();
    // Refresh every 5 seconds
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/dms/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error("Error loading DMs:", err);
      setError("Failed to load DMs");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-400 text-sm">Loading DMs...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-400 text-sm">{error}</div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Direct Messages
        </h2>

        {conversations.length === 0 ? (
          <p className="text-gray-400 text-sm">No conversations yet</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  if (conv.otherUser) {
                    onSelectDM(
                      conv.otherUser.id,
                      conv.otherUser.username,
                      conv.otherUser.avatar
                    );
                  }
                }}
                className={`w-full text-left p-3 rounded-lg transition ${
                  selectedUserId === conv.otherUser?.id
                    ? "bg-purple-600 text-white"
                    : "hover:bg-gray-700 text-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  {conv.otherUser?.avatar && (
                    <img
                      src={conv.otherUser.avatar}
                      alt={conv.otherUser.username}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {conv.otherUser?.username}
                    </p>
                    <p className="text-sm opacity-75 truncate">
                      {conv.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
