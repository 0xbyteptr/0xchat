"use client";

import { User } from "@/lib/types";
import { AtSign } from "lucide-react";

interface MentionSelectorProps {
  isOpen: boolean;
  query: string;
  users: User[];
  onSelectUser: (user: User) => void;
}

export default function MentionSelector({
  isOpen,
  query,
  users,
  onSelectUser,
}: MentionSelectorProps) {
  if (!isOpen || users.length === 0) return null;

  // Filter users based on query
  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(query.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(query.toLowerCase())
  );

  if (filteredUsers.length === 0) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">

      {filteredUsers.map((user) => (
        <button
          key={user.id}
          onClick={() => onSelectUser(user)}
          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-700 transition-colors text-left"
        >
          <div className="shrink-0 w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
            {user.avatar?.startsWith("http") || user.avatar?.startsWith("data:") ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              user.avatar || "👤"
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {user.displayName || user.username}
            </p>
            <p className="text-slate-400 text-xs truncate">@{user.username}</p>
          </div>
          <AtSign className="w-4 h-4 text-purple-400 shrink-0" />
        </button>
      ))}
    </div>
  );
}
