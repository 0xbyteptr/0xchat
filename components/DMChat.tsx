"use client";

import { useEffect, useState, useRef } from "react";
import MessageActions from "./MessageActions";
import MarkdownContent from "./MarkdownContent";
import { Send } from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface Message {
  id: string;
  author: { id: string; username: string; avatar: string };
  content: string;
  timestamp: string;
  isEdited?: boolean;
  editedAt?: string;
}

interface DMChatProps {
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  currentUserId: string;
  token: string;
  onClose?: () => void;
}

export default function DMChat({
  partnerId,
  partnerName,
  partnerAvatar,
  currentUserId,
  token,
  onClose,
}: DMChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string>("");
  const [editingMessageId, setEditingMessageId] = useState<string>("");
  const [editingContent, setEditingContent] = useState<string>("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when partner changes
  useEffect(() => {
    if (!token || !partnerId) return;
    loadMessages();
  }, [token, partnerId]);

  const loadMessages = async () => {
    try {
      setError(null);
      const endpoint = `/api/dms/${partnerId}`;
      const resolved = getApiUrl(endpoint);
      console.debug("DMChat: loadMessages resolved url", resolved);

      let response: Response | null = null;
      try {
        response = await fetch(resolved, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
      } catch (err) {
        console.warn("DMChat: resolved fetch failed, falling back to relative endpoint", err);
      }

      if (!response || !response.ok) {
        response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
      }

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to load messages");
        return;
      }

      const data = await response.json();
      // Check if partner was typing (included in response)
      if (data.isTyping) {
        setIsPartnerTyping(true);
        // Clear typing indicator after 3 seconds of inactivity
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsPartnerTyping(false);
        }, 3000);
      }
      
      setMessages((prevMessages) => {
        const incomingMessages = data.messages || [];
        
        // Preserve optimistic messages while adding real ones
        const optimisticMessages = prevMessages.filter((m) =>
          m.id.includes("pending")
        );
        
        // Merge and deduplicate
        const merged = [...incomingMessages];
        for (const optimistic of optimisticMessages) {
          if (!merged.some((m) => m.id === optimistic.id)) {
            merged.push(optimistic);
          }
        }
        
        // Sort by timestamp
        return merged.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      });
    } catch (err) {
      console.error("Failed to load DM messages", err);
      setError("Failed to load messages");
    }
  };

  // Adaptive polling: poll for new messages with backoff and pause when hidden
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const baseInterval = 5000; // 5s when visible
    const hiddenInterval = 30000; // 30s when tab is hidden

    const getInterval = () => (document.visibilityState === "visible" && document.hasFocus() ? baseInterval : hiddenInterval);

    const poll = async () => {
      if (cancelled || !token || !partnerId) return;
      try {
        await loadMessages();
      } catch (err) {
        // ignore, loadMessages already logs
      }
      if (cancelled) return;
      timeoutId = setTimeout(poll, getInterval());
    };

    const onVisibilityChange = () => {
      // restart poll loop to pick up new interval
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(poll, getInterval());
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onVisibilityChange);
    window.addEventListener("blur", onVisibilityChange);

    // start polling
    timeoutId = setTimeout(poll, getInterval());

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onVisibilityChange);
      window.removeEventListener("blur", onVisibilityChange);
    };
  }, [token, partnerId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsLoading(true);
    setError(null);
    setIsPartnerTyping(false); // Clear typing indicator when sending

    // Create optimistic message
    const optimisticMessage: Message = {
      id: `msg-${Date.now()}-pending`,
      author: {
        id: currentUserId,
        username: currentUserId,
        avatar: "",
      },
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    // Add optimistic message to UI
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const endpoint = `/api/dms/${partnerId}`;
      const resolved = getApiUrl(endpoint);
      console.debug("DMChat: sending message to", resolved);

      let response: Response | null = null;
      try {
        response = await fetch(resolved, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ content: messageContent }),
        });
      } catch (err) {
        console.warn("DMChat: resolved POST failed, falling back to relative endpoint", err);
      }

      if (!response || !response.ok) {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ content: messageContent }),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to send message");
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
        setNewMessage(messageContent); // Restore message on error
        return;
      }

      // Real message will arrive via WebSocket, replace optimistic version
      const sentData = await response.json();
      if (sentData.message) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticMessage.id ? sentData.message : m
          )
        );
      }
    } catch (err) {
      console.error("Failed to send DM", err);
      setError("Failed to send message");
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsLoading(false);
    }
  };

  // Broadcast typing status
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);

    // Notify partner that we're typing
    if (value.trim() && token) {
      const endpoint = `/api/dms/${partnerId}`;
      const resolved = getApiUrl(endpoint);
      fetch(resolved, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ action: "typing" }),
      }).catch(() => {
        // Silently fail - typing indicator is not critical
        // Try fallback to relative endpoint
        fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ action: "typing" }),
        }).catch(() => {});
      });
    }
  };

  // compute conversation id like server route
  const getConversationId = (a: string, b: string) => {
    const sorted = [a, b].sort();
    return `dm-${sorted[0]}-${sorted[1]}`;
  };

  const getWebSocketURL = (): string => {
    if (typeof window === "undefined") return "";
    // Allow configuring the WS URL via NEXT_PUBLIC_WS_URL; otherwise use same-origin host
    const configured = (window as any).NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_WS_URL;
    if (configured && typeof configured === "string" && configured.trim()) {
      if (/^wss?:\/\//i.test(configured)) return configured; // already full URL
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${configured.replace(/^\/+/, "")}`;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const portFromEnv = (window as any).NEXT_PUBLIC_WS_PORT || process.env.NEXT_PUBLIC_WS_PORT;
    const host = window.location.hostname;
    const port = `:${portFromEnv || "3002"}`;
    return `${protocol}//${host}${port}/`;
  };

  // Initialize websocket subscription for DM updates
  useEffect(() => {
    if (!token || !partnerId || !currentUserId) return;
    const channel = getConversationId(currentUserId, partnerId);
    if (wsRef.current) return;
    try {
      const ws = new WebSocket(getWebSocketURL());
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "subscribe", channel }));
      };
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data?.type === "message" && data?.channel === channel) {
            const incoming = data.message;
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            });
          }
          if (data?.type === "message_edit" && data?.channel === channel) {
            const incoming = data.message;
            setMessages((prev) => prev.map((m) => (m.id === incoming.id ? { ...m, content: incoming.content, isEdited: true, editedAt: incoming.editedAt || new Date().toISOString() } : m)));
          }
          if (data?.type === "message_delete" && data?.channel === channel) {
            const { messageId } = data;
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          }
        } catch (err) {
          console.warn("DM WS parse error", err);
        }
      };
      ws.onerror = (err) => console.warn("DM WS error", err);
      ws.onclose = () => { wsRef.current = null; };
      wsRef.current = ws;
    } catch (err) {
      console.warn("Failed to init DM websocket", err);
    }
    return () => { wsRef.current?.close(); wsRef.current = null; };
  }, [token, partnerId, currentUserId]);

  // Delete DM message
  const handleDeleteMessage = async (messageId: string) => {
    if (!token) return;
    const endpoint = `/api/dms/${partnerId}/${messageId}`;
    const resolved = getApiUrl(endpoint);
    try {
      let response: Response | null = null;
      try {
        response = await fetch(resolved, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
      } catch (err) {
        response = await fetch(endpoint, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
      }
      if (response && response.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (err) {
      console.error("Failed to delete DM message", err);
    }
  };

  // Edit DM message
  const handleEditMessage = async (messageId: string, content: string) => {
    if (!token) return;
    setIsSavingEdit(true);
    const endpoint = `/api/dms/${partnerId}/${messageId}`;
    const resolved = getApiUrl(endpoint);
    try {
      let response: Response | null = null;
      try {
        response = await fetch(resolved, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          credentials: "include",
          body: JSON.stringify({ content }),
        });
      } catch (err) {
        response = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, credentials: "include", body: JSON.stringify({ content }) });
      }
      if (response && response.ok) {
        const data = await response.json();
        if (data) {
          setMessages((prev) => prev.map((m) => (m.id === data.id ? data : m)));
        }
      }
    } catch (err) {
      console.error("Failed to edit DM message", err);
    } finally {
      setIsSavingEdit(false);
      setEditingMessageId("");
      setEditingContent("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 hide-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="flex items-center gap-3">
          {partnerAvatar && (
            (partnerAvatar.startsWith("http") ||
              partnerAvatar.startsWith("data:")) ? (
              <img
                src={partnerAvatar}
                alt={partnerName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl">{partnerAvatar}</span>
            )
          )}
          <div>
            <h2 className="font-semibold text-white">{partnerName}</h2>
            <p className="text-xs text-slate-400">Direct Message</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((msg) => {
          // Handle both old (string author) and new (object author) formats
          const authorId = typeof msg.author === "string" ? msg.author : msg.author?.id;
          return (
            <div
              key={msg.id}
              onMouseEnter={() => setSelectedMessageId(msg.id)}
              onMouseLeave={() => setSelectedMessageId("")}
              className={`flex ${authorId === partnerId ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg wrap-break-word ${
                  authorId === partnerId
                    ? "bg-slate-700 text-white"
                    : "bg-purple-600 text-white"
                }`}
              >
                {editingMessageId === msg.id ? (
                  <div>
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full rounded-xl bg-slate-700/50 border border-slate-600/50 px-3 py-2 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={async () => {
                          if (!editingContent.trim()) return;
                          await handleEditMessage(msg.id, editingContent);
                        }}
                        className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {isSavingEdit ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingMessageId("");
                          setEditingContent("");
                        }}
                        className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <MarkdownContent content={msg.content} onMentionClick={() => {}} />
                    {msg.isEdited && (
                      <span className="text-xs italic text-gray-300 block mt-1">• edited</span>
                    )}
                    <span className="text-xs opacity-70 block mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {selectedMessageId === msg.id && (
                      <div className="mt-2 flex gap-2">
                        <MessageActions
                          messageId={msg.id}
                          isOwn={authorId === currentUserId}
                          onDelete={async (id) => await handleDeleteMessage(id)}
                          onEdit={() => {
                            setEditingMessageId(msg.id);
                            setEditingContent(msg.content);
                          }}
                          visible={true}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Typing indicator */}
        {isPartnerTyping && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-lg bg-slate-700 text-white">
              <div className="flex items-center gap-1">
                <span className="text-sm text-slate-300">{partnerName} is typing</span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-slate-700 bg-slate-900/50 backdrop-blur"
      >
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
