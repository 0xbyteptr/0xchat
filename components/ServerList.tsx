"use client";

import Link from "next/link";
import { Server } from "@/lib/types";
import { Users } from "lucide-react";

interface ServerListProps {
  servers: Server[];
  selectedServerId: string | null;
  onServerSelect: (serverId: string) => void;
  onCreateClick: () => void;
}

export default function ServerList({
  servers,
  selectedServerId,
  onServerSelect,
  onCreateClick,
}: ServerListProps) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-950 border-r border-slate-700 w-20 items-center">
      {/* Create Server Button */}
      <button
        onClick={onCreateClick}
        className="w-12 h-12 rounded-full bg-linear-to-br from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600 flex items-center justify-center text-white font-bold text-lg transition-all duration-200 hover:scale-110"
        title="Create a new server"
      >
        +
      </button>

      <div className="w-full h-px bg-slate-700"></div>

      {/* Friends shortcut */}
      <Link
        href="/friends"
        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white hover:scale-105"
        title="Friends"
      >
        <Users size={20} />
      </Link>

      {/* Server List */}
      {servers.map((server) => (
        <button
          key={server.id}
          onClick={() => onServerSelect(server.id)}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
            selectedServerId === server.id
              ? "bg-linear-to-br from-pink-400 to-purple-500 text-white scale-110 shadow-lg shadow-purple-500/50"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 hover:scale-105"
          }`}
          title={server.name}
        >
          {server.icon || server.name.charAt(0).toUpperCase()}
        </button>
      ))}
    </div>
  );
}
