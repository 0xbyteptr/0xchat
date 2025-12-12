"use client";

import { User, Message, Channel, Server } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import ChatHeader from "@/components/ChatHeader";
import MessagesList from "@/components/MessagesList";
import MessageInput from "@/components/MessageInput";
import MessageReplyPreview from "@/components/MessageReplyPreview";
import { RefObject } from "react";

interface ChatLayoutProps {
  currentUser: User | null;
  server: Server | undefined;
  channels: Channel[];
  selectedChannelId: string;
  messageInput: string;
  messagesEndRef: RefObject<HTMLDivElement>;
  onChannelSelect: (channelId: string) => void;
  onMessageInputChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onAvatarClick?: (user: User) => void;
  onMentionClick?: (username: string) => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  onShowInvite?: () => void;
  onShowOverview?: () => void;
  onShowPinnedMessages?: () => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onPinMessage?: (message: Message) => void;
  replyMessage?: Message | null;
  onReplyMessage?: (message: Message) => void;
  onClearReply?: () => void;
  serverMembers?: User[];
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function ChatLayout({
  currentUser,
  server,
  channels,
  selectedChannelId,
  messageInput,
  messagesEndRef,
  onChannelSelect,
  onMessageInputChange,
  onSendMessage,
  onAvatarClick,
  onMentionClick,
  onProfileClick,
  onSettingsClick,
  onLogout,
  onShowInvite,
  onShowOverview,
  onShowPinnedMessages,
  onAddReaction,
  onRemoveReaction,
  onDeleteMessage,
  onEditMessage,
  onPinMessage,
  replyMessage,
  onReplyMessage,
  onClearReply,
  serverMembers = [],
  isSidebarOpen = false,
  onToggleSidebar,
}: ChatLayoutProps) {
  const selectedChannel = channels.find((ch) => ch.id === selectedChannelId);

  return (
    <div className="flex flex-1 h-screen w-full bg-slate-900">
      {/* Desktop sidebar: hidden on mobile */}
      <div className="hidden md:flex">
        <Sidebar
          currentUser={currentUser}
          server={server}
          channels={channels}
          selectedChannelId={selectedChannelId}
          onChannelSelect={onChannelSelect}
          onProfileClick={onProfileClick}
          onSettingsClick={onSettingsClick}
          onLogout={onLogout}
          onShowInvite={onShowInvite}
          className=""
        />
      </div>

      {/* Mobile drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onToggleSidebar} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-800/50 p-4">
            <Sidebar
              currentUser={currentUser}
              server={server}
              channels={channels}
              selectedChannelId={selectedChannelId}
              onChannelSelect={(id) => {
                onChannelSelect(id);
                onToggleSidebar?.();
              }}
              onProfileClick={onProfileClick}
              onSettingsClick={onSettingsClick}
              onLogout={onLogout}
              onShowInvite={onShowInvite}
              className=""
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col bg-slate-900">
        <ChatHeader server={server} selectedChannel={selectedChannel} onShowOverview={onShowOverview} onShowPinnedMessages={onShowPinnedMessages} />

        <MessagesList
          messages={selectedChannel?.messages || []}
          messagesEndRef={messagesEndRef}
          onAvatarClick={onAvatarClick}
          onMentionClick={onMentionClick}
          currentUserId={currentUser?.id}
          onPinMessage={onPinMessage}
          onAddReaction={onAddReaction}
          onRemoveReaction={onRemoveReaction}
          onDelete={onDeleteMessage}
          onEdit={onEditMessage}
          onReply={onReplyMessage}
        />

        <div className="px-8">
          {replyMessage && (
            <MessageReplyPreview
              reply={{
                messageId: replyMessage.id,
                authorId: replyMessage.author.id,
                authorUsername: replyMessage.author.username,
                content: replyMessage.content,
              }}
              onClear={onClearReply}
            />
          )}
          <MessageInput
            value={messageInput}
            placeholder={`Message #${selectedChannel?.name}`}
            disabled={false}
            onChange={onMessageInputChange}
            onSubmit={onSendMessage}
            availableUsers={serverMembers}
          />
        </div>
      </div>

      {/* Members List */}
      <div className="hidden md:flex w-80 pt-15 bg-slate-800/50 backdrop-blur-md flex-col border-l border-slate-700/50 h-screen overflow-y-auto">
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs font-bold text-gray-500 px-2 mb-3 uppercase tracking-wide">
            Members ({serverMembers.length})
          </p>
          <div className="space-y-2">
            {serverMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => onAvatarClick?.(member)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {member?.avatar?.startsWith("http") || member?.avatar?.startsWith("data:") ? (
                      <img
                        src={member.avatar}
                        alt={member.username}
                        className="w-full h-full object-cover"
                        width={32}
                        height={32}
                      />
                    ) : (
                      member?.avatar || "👤"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 group-hover:text-white truncate font-medium">
                      {member.displayName || member.username}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
