"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { getApiUrl } from "@/lib/api";

export default function InviteJoinPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const inviteCode = params?.code;
  const { token, loadToken } = useAuth();
  const [status, setStatus] = useState<"idle" | "joining" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  useEffect(() => {
    const join = async () => {
      if (!inviteCode) return;
      if (!token) {
        setError("You need to log in to accept invites.");
        return;
      }
      setStatus("joining");
      setError(null);
      try {
        const res = await fetch(getApiUrl("/api/servers"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "joinWithInvite", inviteId: inviteCode }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to join server with this invite.");
          setStatus("error");
          return;
        }
        const server = data.server;
        if (server?.id && server?.channels?.[0]?.id) {
          setStatus("done");
          router.push(`/servers/${server.id}/${server.channels[0].id}`);
        } else {
          setError("Joined, but no server/channel returned.");
          setStatus("error");
        }
      } catch (err) {
        console.error("Join via invite error", err);
        setError("Network error joining server.");
        setStatus("error");
      }
    };
    join();
  }, [inviteCode, token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-gray-100 px-4">
      <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-xl">
        <h1 className="text-xl font-bold mb-2">Joining server…</h1>
        <p className="text-sm text-slate-400 mb-4">Invite code: {inviteCode}</p>
        {status === "joining" && <p className="text-sm text-slate-300">Working on it…</p>}
        {status === "done" && <p className="text-sm text-green-400">Joined! Redirecting…</p>}
        {error && (
          <div className="text-red-400 text-sm space-y-3">
            <p>{error}</p>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/servers")}
                className="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-sm"
              >
                Go to Servers
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-3 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
