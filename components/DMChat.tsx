"use client";

import { useEffect, useState, useRef } from "react";
import { DM } from "@/lib/types";
import { API_ENDPOINTS } from "@/lib/constants";
import { Send } from "lucide-react";

interface DMChatProps {
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  token: string;
  onClose?: () => void;
}

export default function DMChat({
  partnerId,
  partnerName,
  partnerAvatar,
  token,
  onClose,
}: DMChatProps) {
  const [messages, setMessages] = useState<DM[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const response = await fetch(
        `${API_ENDPOINTS.DMS}?with=${encodeURIComponent(partnerId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to load messages");
        return;
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to load DM messages", err);
      setError("Failed to load messages");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.DMS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: partnerId,
          content: messageContent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to send message");
        setNewMessage(messageContent); // Restore message on error
        return;
      }

      const data = await response.json();
      setMessages([...messages, data.message]);
    } catch (err) {
      console.error("Failed to send DM", err);
      setError("Failed to send message");
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.from === partnerId ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg wrap-break-word ${
                msg.from === partnerId
                  ? "bg-slate-700 text-white"
                  : "bg-purple-600 text-white"
              }`}
            >
              <p>{msg.content}</p>
              <span className="text-xs opacity-70 block mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
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
            onChange={(e) => setNewMessage(e.target.value)}
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
