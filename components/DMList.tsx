"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { getApiUrl } from "@/lib/api";

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
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const baseInterval = 15000; // 15s when visible
    const hiddenInterval = 60000; // 60s when hidden

    const getInterval = () => (document.visibilityState === "visible" && document.hasFocus() ? baseInterval : hiddenInterval);

    const poll = async () => {
      if (cancelled || !token) return;
      try {
        await loadConversations();
      } catch (err) {
        // handled inside loadConversations
      }
      if (cancelled) return;
      timeoutId = setTimeout(poll, getInterval());
    };

    const onVisibilityChange = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(poll, getInterval());
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onVisibilityChange);
    window.addEventListener("blur", onVisibilityChange);

    // initial load and start polling
    loadConversations();
    timeoutId = setTimeout(poll, getInterval());

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onVisibilityChange);
      window.removeEventListener("blur", onVisibilityChange);
    };
  }, [token]);

  const loadConversations = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    const endpoint = "/api/dms/list";
    const resolvedUrl = getApiUrl(endpoint);
    console.debug("DMList: resolvedUrl", resolvedUrl);

    const tryFetch = async (fetchUrl: string) => {
      console.debug("DMList: trying fetch", fetchUrl);
      const resp = await fetch(fetchUrl, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      return resp;
    };

    try {
      let response: Response | null = null;

      try {
        response = await tryFetch(resolvedUrl);
      } catch (err) {
        console.warn("DMList: fetch to resolvedUrl failed, will fallback to relative endpoint", err);
      }

      // If resolved fetch failed or returned non-ok, try the site-relative path
      if (!response || !response.ok) {
        try {
          response = await tryFetch(endpoint);
        } catch (err) {
          console.error("DMList: fallback fetch failed", err);
          throw err;
        }
      }

      console.debug("DMList: response", response.status, response.statusText);
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations);
      } else {
        console.warn("DMList: no success flag", data);
        setError("Failed to load DMs");
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
        </h2>or

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
