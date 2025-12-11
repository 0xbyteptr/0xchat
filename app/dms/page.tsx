"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { useServers } from "@/lib/servers";
import { Server, User } from "@/lib/types";
import DMList from "@/components/DMList";
import DMChat from "@/components/DMChat";
import ServerList from "@/components/ServerList";

function DMsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { token, loadToken } = useAuth();
  const { listServers, createServer } = useServers(token);
  const [selectedPartner, setSelectedPartner] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [servers, setServers] = useState<Server[]>([]);
  const [serversLoading, setServersLoading] = useState(false);
  const [autoLoadedPartner, setAutoLoadedPartner] = useState<string | null>(null);
  const hasRedirectedToLogin = useRef(false);
  const ensuredConversations = useRef<Set<string>>(new Set());

  const loadServers = async () => {
    if (!token) return;
    setServersLoading(true);
    const data = await listServers();
    setServers(data);
    setServersLoading(false);
  };

  const ensureConversation = async (partnerId: string) => {
    if (!token || !partnerId) return;
    if (ensuredConversations.current.has(partnerId)) return;
    ensuredConversations.current.add(partnerId);

    try {
      await fetch("/api/dms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ to: partnerId, content: "" }),
      });
    } catch (err) {
      console.error("Failed to auto-create DM", err);
    }
  };

  useEffect(() => {
    loadToken();
    // allow token validation to complete
    const timer = setTimeout(() => setAuthReady(true), 150);
    return () => clearTimeout(timer);
  }, [loadToken]);

  useEffect(() => {
    if (token) {
      loadServers();
    }
  }, [token]);

  // If not logged in, send to login with redirect back to this DM target
  useEffect(() => {
    if (!authReady) return;
    if (token || hasRedirectedToLogin.current) return;

    const target = searchParams.get("user");
    const redirectUrl = target ? `/dms?user=${encodeURIComponent(target)}` : pathname || "/dms";
    hasRedirectedToLogin.current = true;
    router.replace(`/?redirect=${encodeURIComponent(redirectUrl)}`);
  }, [authReady, token, searchParams, pathname, router]);

  // Auto-open DM when ?user=username is provided
  useEffect(() => {
    const targetUser = searchParams.get("user");
    if (!token || !authReady || !targetUser) return;
    if (autoLoadedPartner === targetUser) return;

    const loadPartner = async () => {
      try {
        const res = await fetch(`/api/profile?username=${encodeURIComponent(targetUser)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.profile) {
          setSelectedPartner(data.profile as User);
          ensureConversation((data.profile as User).id || (data.profile as User).username);
          setAutoLoadedPartner(targetUser);
        }
      } catch (err) {
        console.error("Failed to load target DM user", err);
      }
    };

    loadPartner();
  }, [token, authReady, searchParams, autoLoadedPartner]);

  if (!authReady) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
        <p className="text-slate-400">Please log in to view DMs.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Server list (icon rail) */}
      <ServerList
        servers={servers}
        selectedServerId={null}
        onServerSelect={(serverId) => {
          const server = servers.find((s) => s.id === serverId);
          const firstChannel = server?.channels?.[0]?.id || "general";
          router.push(`/servers/${serverId}/${firstChannel}`);
        }}
        onCreateClick={async () => {
          const created = await createServer("New Server");
          if (created) {
            await loadServers();
            const firstChannel = created.channels?.[0]?.id || "general";
            router.push(`/servers/${created.id}/${firstChannel}`);
          }
        }}
      />

      {/* Left Sidebar - Conversations List */}
      <div className="w-64 border-r border-slate-700 bg-slate-900/50 backdrop-blur overflow-y-auto">
        <div className="p-4">
          <h1 className="text-xl font-bold text-white mb-6">Messages</h1>
          {token && (
            <DMList
              token={token}
              onSelectConversation={(partnerId, partner) => {
                setSelectedPartner(partner);
                ensureConversation(partnerId);
              }}
              selectedPartnerId={selectedPartner?.id}
              initialPartner={selectedPartner}
            />
          )}
          {serversLoading && (
            <p className="text-xs text-slate-500 mt-3">Loading servers…</p>
          )}
        </div>
      </div>

      {/* Right Side - Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedPartner ? (
          <DMChat
            partnerId={selectedPartner.id}
            partnerName={selectedPartner.displayName || selectedPartner.username}
            partnerAvatar={selectedPartner.avatar}
            token={token}
            onClose={() => setSelectedPartner(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DMsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen flex items-center justify-center bg-linear-to-b from-slate-900 via-slate-800 to-slate-900">
          <p className="text-slate-400">Loading...</p>
        </div>
      }
    >
      <DMsPageContent />
    </Suspense>
  );
}
