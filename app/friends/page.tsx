"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/constants";
import { useAuth } from "@/lib/hooks";
import { FriendInvite } from "@/lib/types";

export default function FriendsPage() {
  const router = useRouter();
  const { token, loadToken } = useAuth();
  const [invites, setInvites] = useState<FriendInvite[]>([]);
  const [toUser, setToUser] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load token on mount
  useEffect(() => {
    loadToken();
  }, [loadToken]);

  // Fetch invites when token available
  useEffect(() => {
    if (!token) return;
    fetchInvites();
  }, [token]);

  const fetchInvites = async () => {
    setError(null);
    setStatusMessage(null);
    try {
      const response = await fetch(API_ENDPOINTS.FRIEND_INVITES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to load invites");
        return;
      }
      setInvites(data.invites || []);
    } catch (err) {
      console.error("Failed to fetch invites", err);
      setError("Network error fetching invites");
    }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    if (!toUser.trim()) {
      setError("Target username is required");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.FRIEND_INVITES, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: toUser.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to send invite");
      } else {
        setStatusMessage("Invite sent");
        setToUser("");
        fetchInvites();
      }
    } catch (err) {
      console.error("Failed to send invite", err);
      setError("Network error sending invite");
    } finally {
      setIsLoading(false);
    }
  };

  const respondToInvite = async (id: string, status: "accepted" | "declined") => {
    setError(null);
    setStatusMessage(null);
    try {
      const response = await fetch(`${API_ENDPOINTS.FRIEND_INVITES}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to update invite");
      } else {
        setStatusMessage(`Invite ${status}`);
        setInvites((prev) =>
          prev.map((inv) => (inv.id === id ? data.invite || inv : inv))
        );
      }
    } catch (err) {
      console.error("Failed to update invite", err);
      setError("Network error updating invite");
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-slate-900 text-gray-200">
        <div className="text-center space-y-4">
          <p>You need to log in to view friend invites.</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100">
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Social</p>
          <h1 className="text-2xl font-bold text-white">Friend Invites</h1>
        </div>
        <button
          onClick={() => router.push("/servers")}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-semibold"
        >
          ← Back to Servers
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        <section className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-6 shadow-lg shadow-slate-900/50">
          <h2 className="text-lg font-semibold mb-3">Send a Friend Invite</h2>
          <p className="text-sm text-slate-400 mb-4">Enter your friend's username to send a request.</p>
          <form onSubmit={sendInvite} className="flex gap-3 items-center">
            <input
              className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="friend-username"
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold"
            >
              {isLoading ? "Sending..." : "Send"}
            </button>
          </form>
        </section>

        <section className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-6 shadow-lg shadow-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">Your Invites</h2>
              <p className="text-sm text-slate-400">Incoming friend requests</p>
            </div>
            <button
              onClick={fetchInvites}
              className="text-sm text-purple-300 hover:text-purple-200"
            >
              Refresh ↻
            </button>
          </div>

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          {statusMessage && <p className="text-green-400 text-sm mb-3">{statusMessage}</p>}

          {invites.length === 0 ? (
            <p className="text-slate-400 text-sm">No invites yet.</p>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">From: {invite.from}</p>
                    <p className="text-xs text-slate-400">Status: {invite.status}</p>
                    <p className="text-xs text-slate-500">{new Date(invite.timestamp).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => respondToInvite(invite.id, "accepted")}
                      className="px-3 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold"
                      disabled={invite.status !== "pending"}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respondToInvite(invite.id, "declined")}
                      className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                      disabled={invite.status !== "pending"}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
