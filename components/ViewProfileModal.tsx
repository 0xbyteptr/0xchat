"use client";

import { User } from "@/lib/types";

interface ViewProfileModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
}

export default function ViewProfileModal({ isOpen, user, onClose }: ViewProfileModalProps) {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Profile</h2>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white text-sm"
          >
            Close
          </button>
        </div>

        <div className="flex gap-4 items-center mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center text-xl">
            {user.avatar?.startsWith("http") ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full object-cover"
                width={64}
                height={64}
                loading="lazy"
              />
            ) : (
              <span>{user.avatar || "😺"}</span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold text-white">{user.displayName || user.username}</p>
            <p className="text-sm text-slate-400">@{user.username}</p>
            {user.status ? (
              <p className="text-xs text-green-400 mt-1">{user.status}</p>
            ) : null}
          </div>
        </div>

        {user.bio ? (
          <div className="mb-4">
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
          <div>
            <p className="text-slate-400">Theme</p>
            <p className="font-medium text-white">{user.theme || "midnight"}</p>
          </div>
          <div>
            <p className="text-slate-400">Font</p>
            <p className="font-medium text-white">{user.font || "sans"}</p>
          </div>
          <div>
            <p className="text-slate-400">Accent</p>
            <div className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: user.accentColor || "#a855f7" }} />
              <span className="font-medium text-white">{user.accentColor || "#a855f7"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
