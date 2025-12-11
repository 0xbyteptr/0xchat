"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks";
import DMList from "@/components/DMList";
import DMChat from "@/components/DMChat";
import ServerList from "@/components/ServerList";
import NewDMModal from "@/components/NewDMModal";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function DMsPage() {
  const router = useRouter();
  const { token, loadToken } = useAuth();
  const [authReady, setAuthReady] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [selectedUserAvatar, setSelectedUserAvatar] = useState<string>("");
  const [isNewDMModalOpen, setIsNewDMModalOpen] = useState(false);
  const [servers, setServers] = useState<any[]>([]);

  useEffect(() => {
    loadToken();
    const timer = setTimeout(() => setAuthReady(true), 150);
    return () => clearTimeout(timer);
  }, [loadToken]);

  // Decode current user from token
  useEffect(() => {
    if (!token) return;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return;
      const payload = parts[1];
      const decoded = JSON.parse(
        decodeURIComponent(
          atob(payload)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        )
      );
      setCurrentUserId(decoded.id || "");
    } catch (err) {
      console.error("Failed to decode token:", err);
    }
  }, [token]);

  // Load servers
  useEffect(() => {
    if (!token) return;
    const loadServers = async () => {
      try {
        const response = await fetch("/api/servers", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ action: "list" }),
        });
        if (response.ok) {
          const data = await response.json();
          setServers(data.servers || []);
        }
      } catch (err) {
        console.error("Failed to load servers:", err);
      }
    };
    loadServers();
  }, [token]);

  useEffect(() => {
    if (!authReady || !token) {
      if (authReady && !token) {
        router.replace("/?redirect=" + encodeURIComponent("/dms"));
      }
    }
  }, [authReady, token, router]);

  if (!authReady) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-linear-to-b from-gray-900 via-gray-800 to-gray-900">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-linear-to-b from-gray-900 via-gray-800 to-gray-900">
        <p className="text-gray-400">Please log in to view DMs.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex bg-linear-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Server list */}
      <ServerList
        servers={servers}
        selectedServerId={null}
        onServerSelect={(serverId) => {
          // Find the server to get its first channel
          const server = servers.find(s => s.id === serverId);
          if (server && server.channels && server.channels.length > 0) {
            router.push(`/servers/${serverId}/${server.channels[0].id}`);
          }
        }}
        onCreateClick={() => {}}
      />

      {/* DM List sidebar */}
      <div className="w-64 border-r border-gray-700 bg-gray-900/80 backdrop-blur overflow-y-auto flex flex-col hide-scrollbar">
        <div className="p-4 flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-white">Messages</h1>
            <button
              onClick={() => setIsNewDMModalOpen(true)}
              className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-300 hover:text-white"
              title="Start a new DM"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <DMList
            token={token}
            onSelectDM={(userId, userName, avatar) => {
              setSelectedUserId(userId);
              setSelectedUserName(userName);
              setSelectedUserAvatar(avatar);
            }}
            selectedUserId={selectedUserId || undefined}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUserId ? (
          <DMChat
            partnerId={selectedUserId}
            partnerName={selectedUserName}
            partnerAvatar={selectedUserAvatar}
            currentUserId={currentUserId}
            token={token}
            onClose={() => setSelectedUserId(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* New DM Modal */}
      <NewDMModal
        token={token}
        isOpen={isNewDMModalOpen}
        onClose={() => setIsNewDMModalOpen(false)}
        onSelectUser={(userId, userName, avatar) => {
          setSelectedUserId(userId);
          setSelectedUserName(userName);
          setSelectedUserAvatar(avatar);
        }}
      />
    </div>
  );
}
