"use client";

import { useState, useEffect } from "react";
import { UserPlus, AlertCircle } from "lucide-react";

interface InviteData {
  id: string;
  serverId: string;
  serverName: string;
  serverIcon?: string;
  description?: string;
  memberCount?: number;
  isValid: boolean;
}

interface InvitePreviewProps {
  code: string;
  onJoin?: (serverId: string, code: string) => void;
}

export default function InvitePreview({ code, onJoin }: InvitePreviewProps) {
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        setLoading(true);
        setError(false);
        console.log("🎫 Fetching invite info for:", code);

        const response = await fetch(
          `/api/invite-info?code=${encodeURIComponent(code)}`
        );

        console.log("📡 Invite response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Invite data received:", data);
          setInvite(data);
        } else {
          console.warn("⚠️ Invite fetch failed with status:", response.status);
          setError(true);
        }
      } catch (err) {
        console.error("❌ Failed to fetch invite:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [code]);

  const handleJoin = async () => {
    if (!invite) return;
    setJoining(true);
    try {
      onJoin?.(invite.serverId, code);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-slate-700/30 rounded-lg h-24 border border-slate-600/50 mt-3" />
    );
  }

  if (error || !invite) {
    return (
      <div className="block mt-3 bg-slate-700/50 border border-slate-600/50 rounded-lg overflow-hidden p-3">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-gray-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">Invalid invite code: {code}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="block mt-3 bg-linear-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg overflow-hidden hover:border-purple-500/50 transition-colors">
      <div className="flex gap-3 p-4">
        {/* Server Icon */}
        {invite.serverIcon ? (
          <img
            src={invite.serverIcon}
            alt={invite.serverName}
            className="w-16 h-16 rounded-lg object-cover shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 text-2xl font-bold text-white">
            {invite.serverName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Server Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              {invite.serverName}
            </h3>
            {invite.description && (
              <p className="text-xs text-gray-300 line-clamp-2">
                {invite.description}
              </p>
            )}
            {invite.memberCount !== undefined && (
              <p className="text-xs text-gray-400 mt-1">
                👥 {invite.memberCount} member{invite.memberCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoin}
            disabled={joining}
            className="mt-3 w-full px-3 py-2 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <UserPlus size={14} />
            {joining ? "Joining..." : "Join Server"}
          </button>
        </div>
      </div>
    </div>
  );
}
