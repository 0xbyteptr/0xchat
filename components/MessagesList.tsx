"use client";

import { RefObject, useState, useEffect, useMemo } from "react";
import { Message } from "@/lib/types";
import { extractLinksFromContent, isInviteUrl, extractInviteCode } from "@/lib/link-utils";
import MessageReactions from "./MessageReactions";
import MediaPreview from "./MediaPreview";
import LinkPreview from "./LinkPreview";
import InvitePreview from "./InvitePreview";
import MarkdownContent from "./MarkdownContent";
import { Pin } from "lucide-react";

interface MessagesListProps {
  messages: Message[];
  messagesEndRef: RefObject<HTMLDivElement>;
  onAvatarClick?: (user: Message["author"]) => void;
  onMentionClick?: (username: string) => void;
  onPinMessage?: (messageId: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  currentUserId?: string;
}

export default function MessagesList({
  messages,
  messagesEndRef,
  onAvatarClick,
  onMentionClick,
  onPinMessage,
  onAddReaction,
  onRemoveReaction,
  currentUserId,
}: MessagesListProps) {
  const [selectedMessageId, setSelectedMessageId] = useState<string>("");

  // Extract links from all messages dynamically (in case they weren't extracted on send)
  const messagesWithLinks = useMemo(() => {
    return messages.map((message) => {
      // If message already has links, use them
      if (message.links && message.links.length > 0) {
        return message;
      }
      
      // Otherwise, extract from content
      const extractedLinks = extractLinksFromContent(message.content);
      if (extractedLinks.length > 0) {
        console.log("🔄 Extracted links from message content:", message.id, extractedLinks);
        return { ...message, links: extractedLinks };
      }
      
      return message;
    });
  }, [messages]);

  // Debug logging
  useEffect(() => {
    const messagesWithLinksData = messagesWithLinks.filter((m) => m.links && m.links.length > 0);
    if (messagesWithLinksData.length > 0) {
      console.log("📨 Messages with links found:", messagesWithLinksData.length);
      messagesWithLinksData.forEach((m) => {
        console.log("  - Message:", m.id, "Links:", m.links);
      });
    }
  }, [messagesWithLinks]);

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
      {messagesWithLinks.map((message, index) => (
        <div
          key={message.id}
          className="flex gap-4 hover:bg-slate-800/40 px-4 py-2 rounded-lg transition animate-slide-in group"
          style={{
            animationDelay: `${index * 30}ms`,
          }}
          onMouseEnter={() => setSelectedMessageId(message.id)}
          onMouseLeave={() => setSelectedMessageId("")}
        >
          <button
            type="button"
            onClick={() => onAvatarClick?.(message.author)}
            className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-400 hover:scale-110 transition-transform"
            title={`View ${message.author.username}'s profile`}
          >
            {message.author.avatar?.startsWith("http") || message.author.avatar?.startsWith("data:") ? (
              <img
                src={message.author.avatar}
                alt={message.author.username}
                className="w-full h-full object-cover"
                width={40}
                height={40}
              />
            ) : (
              <span>{message.author.avatar || "😺"}</span>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap justify-between">
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
                {message.isPinned && (
                  <span className="text-xs flex items-center gap-1 text-amber-400">
                    <Pin size={12} />
                    Pinned
                  </span>
                )}
              </div>
              {selectedMessageId === message.id && (
                <button
                  onClick={() => onPinMessage?.(message.id)}
                  className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white transition flex items-center gap-1"
                >
                  <Pin size={14} />
                  Pin
                </button>
              )}
            </div>
            <MarkdownContent content={message.content} onMentionClick={onMentionClick} />
            
            {/* Media Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <MediaPreview attachments={message.attachments} />
            )}

            {/* Link Previews */}
            {message.links && message.links.length > 0 && (
              <div className="space-y-2 mt-3">
                {message.links.map((link, idx) => {
                  // Check if this is an invite URL
                  if (isInviteUrl(link)) {
                    const code = extractInviteCode(link);
                    return code ? (
                      <InvitePreview
                        key={idx}
                        code={code}
                        onJoin={(serverId, code) => {
                          console.log("User clicked join on invite:", serverId, code);
                          // Join action will be handled by parent component
                        }}
                      />
                    ) : null;
                  }
                  
                  // Regular link preview
                  return <LinkPreview key={idx} url={link} />;
                })}
              </div>
            )}

            {/* Message Reactions */}
            {(message.reactions && Object.keys(message.reactions).length > 0) && (
              <div className="mt-3">
                <MessageReactions
                  reactions={message.reactions}
                  onAddReaction={(emoji) => onAddReaction?.(message.id, emoji)}
                  onRemoveReaction={(emoji) => onRemoveReaction?.(message.id, emoji)}
                  isOwn={message.author.id === currentUserId}
                />
              </div>
            )}

            {/* Reaction Picker (always visible on hover) */}
            {selectedMessageId === message.id && !message.reactions && (
              <div className="mt-2">
                <MessageReactions
                  reactions={{}}
                  onAddReaction={(emoji) => onAddReaction?.(message.id, emoji)}
                  onRemoveReaction={(emoji) => onRemoveReaction?.(message.id, emoji)}
                />
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
