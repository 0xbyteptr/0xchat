"use client";

import { User, Message, Channel, Server } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import ChatHeader from "@/components/ChatHeader";
import MessagesList from "@/components/MessagesList";
import MessageInput from "@/components/MessageInput";
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
  onProfileClick: () => void;
  onLogout: () => void;
  onShowInvite?: () => void;
  onShowOverview?: () => void;
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
  onProfileClick,
  onLogout,
  onShowInvite,
  onShowOverview,
}: ChatLayoutProps) {
  const selectedChannel = channels.find((ch) => ch.id === selectedChannelId);

  return (
    <div className="flex flex-1 h-screen w-full bg-slate-900">
      <Sidebar
        currentUser={currentUser}
        server={server}
        channels={channels}
        selectedChannelId={selectedChannelId}
        onChannelSelect={onChannelSelect}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
        onShowInvite={onShowInvite}
      />

      <div className="flex-1 flex flex-col bg-slate-900">
        <ChatHeader server={server} selectedChannel={selectedChannel} onShowOverview={onShowOverview} />

        <MessagesList
          messages={selectedChannel?.messages || []}
          messagesEndRef={messagesEndRef}
          onAvatarClick={onAvatarClick}
        />

        <MessageInput
          value={messageInput}
          placeholder={`Message #${selectedChannel?.name}`}
          disabled={false}
          onChange={onMessageInputChange}
          onSubmit={onSendMessage}
        />
      </div>
    </div>
  );
}
