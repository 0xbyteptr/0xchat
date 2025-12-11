"use client";

import { useState, useEffect } from "react";
import { Server } from "@/lib/types";

interface InviteModalProps {
  isOpen: boolean;
  server: Server | undefined;
  onClose: () => void;
  onCreateInvite: (serverId: string) => Promise<string | null>;
}

export default function InviteModal({
  isOpen,
  server,
  onClose,
  onCreateInvite,
}: InviteModalProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && server) {
      generateInvite();
    }
  }, [isOpen, server]);

  const generateInvite = async () => {
    if (!server) return;
    setIsLoading(true);
    try {
      const code = await onCreateInvite(server.id);
      if (code) {
        setInviteCode(code);
      }
    } catch (error) {
      console.error("Failed to create invite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inviteLink = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inviteCode}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">
          📨 Invite to {server?.name}
        </h2>

        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Share this invite code with friends to let them join your server:
          </p>

          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">INVITE CODE</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xl font-mono text-white break-all">
                {inviteCode || "Generating..."}
              </code>
              <button
                onClick={copyToClipboard}
                disabled={!inviteCode || isLoading}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white text-sm font-semibold rounded transition"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">INVITE LINK</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 rounded text-white text-sm focus:outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded transition"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          <button
            onClick={generateInvite}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 text-white font-semibold rounded-lg transition"
          >
            {isLoading ? "Generating..." : "Generate New Invite"}
          </button>
        </div>

        <div className="flex gap-3 pt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
