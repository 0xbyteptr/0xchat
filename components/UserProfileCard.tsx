"use client";

import { User } from "@/lib/types";
import { UserCircle, Settings } from "lucide-react";

interface UserProfileCardProps {
  currentUser: User | null;
  onProfileClick: () => void;
  onSettingsClick: () => void;
}

export default function UserProfileCard({
  currentUser,
  onProfileClick,
  onSettingsClick,
}: UserProfileCardProps) {
  if (!currentUser) return null;

  return (
    <div className="border-b border-slate-700/50 p-6 space-y-4">
      {/* Avatar and Basic Info */}
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
          {currentUser?.avatar?.startsWith("http") || currentUser?.avatar?.startsWith("data:") ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.username}
              className="w-full h-full object-cover"
              width={64}
              height={64}
            />
          ) : (
            currentUser?.avatar || "😺"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-lg truncate">{currentUser.username}</h3>
          <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            Online
          </p>
        </div>
      </div>

      {/* User Details */}
      <div className="space-y-2 text-sm">
        {currentUser.displayName && (
          <div>
            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Display Name</p>
            <p className="text-white">{currentUser.displayName}</p>
          </div>
        )}
        {currentUser.status && (
          <div>
            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Status</p>
            <p className="text-white">{currentUser.status}</p>
          </div>
        )}
        {currentUser.bio && (
          <div>
            <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">Bio</p>
            <p className="text-white text-sm">{currentUser.bio}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onProfileClick}
          className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <UserCircle size={16} />
          <span>Profile</span>
        </button>
        <button
          onClick={onSettingsClick}
          className="flex-1 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
