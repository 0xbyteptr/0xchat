"use client";

import { useEffect, useState, useRef } from "react";
import { Send } from "lucide-react";

interface Message {
  id: string;
  author: { id: string; username: string; avatar: string };
  content: string;
  timestamp: string;
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
      const response = await fetch(`/api/dms/${partnerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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

  // Subscribe to real-time updates via polling
  useEffect(() => {
    // Poll for new messages every 2 seconds
    const interval = setInterval(() => {
      loadMessages();
    }, 2000);

    return () => clearInterval(interval);
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
      const response = await fetch(`/api/dms/${partnerId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: messageContent }),
      });

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
      fetch(`/api/dms/${partnerId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "typing" }),
      }).catch(() => {
        // Silently fail - typing indicator is not critical
      });
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
              className={`flex ${authorId === partnerId ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg wrap-break-word ${
                  authorId === partnerId
                    ? "bg-slate-700 text-white"
                    : "bg-purple-600 text-white"
                }`}
              >
                <p className="wrap-break-word">{msg.content}</p>
                <span className="text-xs opacity-70 block mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
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
