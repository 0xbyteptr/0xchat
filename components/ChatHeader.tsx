"use client";

import { Channel, Server, Message } from "@/lib/types";
import { BarChart3, Hash, Pin } from "lucide-react";
import MessageSearch from "./MessageSearch";

interface ChatHeaderProps {
  server: Server | undefined;
  selectedChannel: Channel | undefined;
  messages?: Message[];
  onShowOverview?: () => void;
  onShowPinnedMessages?: () => void;
  onSelectSearchResult?: (message: Message) => void;
}

export default function ChatHeader({ 
  server, 
  selectedChannel, 
  messages = [],
  onShowOverview, 
  onShowPinnedMessages,
  onSelectSearchResult,
}: ChatHeaderProps) {
  return (
    <div className="border-b border-slate-700/50 px-8 py-5 bg-slate-800/40 backdrop-blur-md flex items-center justify-between sticky top-14 z-10">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Hash size={24} className="text-purple-400" />
            <h3 className="text-lg font-bold text-white">
              {selectedChannel?.name}
            </h3>
          </div>
          <p className="text-xs text-gray-400">
            {server?.name} • {selectedChannel?.messages.length} messages
          </p>
        </div>
      </div>
      
      {server && (
        <div className="flex items-center gap-3">
          <MessageSearch 
            messages={messages}
            onSelect={onSelectSearchResult}
          />
          <button
            onClick={onShowPinnedMessages}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
            title="View pinned messages"
          >
            <Pin size={18} />
            <span className="hidden sm:inline">Pinned</span>
          </button>
          <button
            onClick={onShowOverview}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <BarChart3 size={18} />
            <span className="hidden sm:inline">Overview</span>
          </button>
        </div>
      )}
    </div>
  );
}
