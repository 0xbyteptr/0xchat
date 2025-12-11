"use client";

import { useState } from "react";
import { Server } from "@/lib/types";

interface CreateServerModalProps {
  isOpen: boolean;
  isLoading: boolean;
  serverError?: string;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<Server | null>;
  onJoinClick?: (inviteCode: string) => void;
}

export default function CreateServerModal({
  isOpen,
  isLoading,
  serverError,
  onClose,
  onCreate,
  onJoinClick,
}: CreateServerModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");
  const [inviteCode, setInviteCode] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Server name is required");
      return;
    }

    const server = await onCreate(name.trim(), description);
    if (server) {
      setName("");
      setDescription("");
      onClose();
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      setError("Invite code is required");
      return;
    }
    // Trigger parent's join logic with invite code
    if (onJoinClick) {
      onJoinClick(inviteCode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">
          {mode === "create" ? "Create a Server" : "Join a Server"}
        </h2>

        {mode === "create" ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Server Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Server"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-pink-500"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us about your server..."
                rows={3}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-pink-500"
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg transition-all duration-200"
              >
                {isLoading ? "Creating..." : "Create Server"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMode("join");
                setError("");
              }}
              className="w-full text-pink-400 hover:text-pink-300 text-sm font-medium mt-4 transition-colors"
            >
              Have an invite code?
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code..."
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-pink-500"
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg transition-all duration-200"
              >
                {isLoading ? "Joining..." : "Join Server"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMode("create");
                setError("");
              }}
              className="w-full text-pink-400 hover:text-pink-300 text-sm font-medium mt-4 transition-colors"
            >
              Create a server instead
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
