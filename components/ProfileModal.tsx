"use client";

import { useEffect, useState } from "react";
import { User } from "@/lib/types";

interface ProfileModalProps {
  isOpen: boolean;
  isLoading: boolean;
  profile: User | null;
  onClose: () => void;
  onSave: (updates: Partial<User>) => Promise<User | null>;
}

export default function ProfileModal({
  isOpen,
  isLoading,
  profile,
  onClose,
  onSave,
}: ProfileModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState("");
  const [avatar, setAvatar] = useState("");
  const [theme, setTheme] = useState<User["theme"]>("midnight");
  const [font, setFont] = useState<User["font"]>("sans");
  const [accentColor, setAccentColor] = useState("#a855f7");
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || profile.username || "");
      setBio(profile.bio || "");
      setStatus(profile.status || "");
      setAvatar(profile.avatar || "");
      setTheme(profile.theme || "midnight");
      setFont(profile.font || "sans");
      setAccentColor(profile.accentColor || "#a855f7");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const updated = await onSave({ displayName, bio, status, avatar, theme, font, accentColor });
    if (updated) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white text-sm"
            disabled={isLoading}
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center text-xl">
              {avatar?.startsWith("http") ? (
                <img
                  src={avatar}
                  alt={displayName || profile?.username || "avatar"}
                  className="w-full h-full object-cover"
                  width={64}
                  height={64}
                  loading="lazy"
                />
              ) : (
                <span>{avatar || "😺"}</span>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Avatar URL</label>
                <input
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full rounded-lg bg-slate-700 px-3 py-2 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://..."
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg bg-slate-700 px-3 py-2 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={64}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Status</label>
            <input
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg bg-slate-700 px-3 py-2 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={64}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-sm text-slate-300 mb-1">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as User["theme"])}
                className="w-full rounded-lg bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              >
                <option value="midnight">Midnight</option>
                <option value="dark">Dark</option>
                <option value="sunset">Sunset</option>
                <option value="mint">Mint</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm text-slate-300 mb-1">Font</label>
              <select
                value={font}
                onChange={(e) => setFont(e.target.value as User["font"])}
                className="w-full rounded-lg bg-slate-700 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
              >
                <option value="sans">Sans</option>
                <option value="mono">Mono</option>
                <option value="serif">Serif</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm text-slate-300 mb-1">Accent</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-12 rounded bg-slate-700 border border-slate-600"
                  disabled={isLoading}
                />
                <input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-lg bg-slate-700 px-3 py-2 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              maxLength={280}
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
