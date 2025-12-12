"use client";

import Link from "next/link";
import { User, Channel, Server } from "@/lib/types";
import { UserCircle, Settings, Send } from "lucide-react";

interface SidebarProps {
  currentUser: User | null;
  server: Server | undefined;
  channels: Channel[];
  selectedChannelId: string;
  onChannelSelect: (channelId: string) => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  onShowInvite?: () => void;
}

export default function Sidebar({
  currentUser,
  server,
  channels,
  selectedChannelId,
  onChannelSelect,
  onProfileClick,
  onSettingsClick,
  onLogout,
  onShowInvite,
}: SidebarProps) {
  return (
    <div className="w-72 bg-slate-800/50 pt-15 backdrop-blur-md flex flex-col border-r border-slate-700/50 h-screen">
      {/* Server Name */}
      <div className="border-b border-slate-700/50 p-6">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{server?.icon || "🚀"}</span>
            <h2 className="text-xl font-bold text-white">{server?.name || "0xChat"}</h2>
          </div>
          <p className="text-xs text-gray-400">{server?.members?.length || 0} members</p>
        </div>
        {server && (
          <button
            onClick={onShowInvite}
            className="w-full px-3 py-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Send size={16} />
            <span>Invite Members</span>
          </button>
        )}
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <p className="text-xs font-bold text-gray-500 px-2 mb-3 uppercase tracking-wide">
          Channels
        </p>
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onChannelSelect(channel.id)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium flex items-center gap-2 ${
              selectedChannelId === channel.id
                ? "bg-slate-600/80 text-white shadow-lg shadow-purple-500/25 transform scale-105"
                : "text-gray-400 hover:bg-slate-700/50 hover:text-gray-200"
            }`}
          >
            <span className="text-lg">#</span>
            <span>{channel.name}</span>
            {selectedChannelId === channel.id && (
              <span className="ml-auto w-2 h-2 bg-purple-400 rounded-full"></span>
            )}
          </button>
        ))}
      </div>

      {/* User Profile */}
      <div className="border-t border-slate-700/50 p-4 space-y-3">
        <div className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {currentUser?.avatar?.startsWith("http") || currentUser?.avatar?.startsWith("data:") ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  className="w-full h-full object-cover"
                  width={40}
                  height={40}
                />
              ) : (
                currentUser?.avatar || "😺"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {currentUser?.username}
              </p>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                Online
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onProfileClick}
            className="flex-1 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-white px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <UserCircle size={16} />
            <span>Profile</span>
          </button>
          <button
            onClick={onSettingsClick}
            className="flex-1 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-white px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
