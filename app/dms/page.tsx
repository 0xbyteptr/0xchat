"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/hooks";
import DMList from "@/components/DMList";
import DMChat from "@/components/DMChat";
import ServerList from "@/components/ServerList";
import CreateServerModal from "@/components/CreateServerModal";
import NewDMModal from "@/components/NewDMModal";
import UserProfileCard from "@/components/UserProfileCard";
import ProfileModal from "@/components/ProfileModal";
import SettingsModal from "@/components/SettingsModal";
import AppTopBar from "@/components/AppTopBar";
import ToastContainer from "@/components/ToastContainer";
import { useRouter } from "next/navigation";
import { useServers } from "@/lib/servers";
import { Plus } from "lucide-react";
import { User } from "@/lib/types";
import { Toast, UserNotification } from "@/lib/notification-types";
import { getApiUrl } from "@/lib/api";

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false);
  const [serverError, setServerError] = useState("");

  const { createServer, isLoading: isServerLoading, joinWithInvite } = useServers(token);

  // Notification state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  // Toast management
  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Notification management
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const acceptNotification = useCallback((notification: UserNotification) => {
    console.log("Accepting notification:", notification);
  }, []);

  useEffect(() => {
    loadToken();
    const timer = setTimeout(() => setAuthReady(true), 150);
    return () => clearTimeout(timer);
  }, [loadToken]);

  // Decode current user from token and load profile
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
      const userId = decoded.id || "";
      setCurrentUserId(userId);

      // Load full user profile
      const loadProfile = async () => {
        try {
          const profileUrl = getApiUrl(`/api/profile?id=${userId}`);
          console.debug("DMsPage: fetch profile", profileUrl);
          const response = await fetch(profileUrl, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              setCurrentUser(data.user as User);
            }
          }
        } catch (err) {
          console.error("Failed to load user profile:", err);
        }
      };
      loadProfile();
    } catch (err) {
      console.error("Failed to decode token:", err);
    }
  }, [token]);

  // Load servers
  useEffect(() => {
    if (!token) return;
    const loadServers = async () => {
      try {
        const url = getApiUrl("/api/servers");
        console.debug("DMsPage: fetch servers", url);
        const response = await fetch(url, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          credentials: "include",
          body: JSON.stringify({ action: "list" }),
        });
        console.debug("DMsPage: servers response", response.status, response.statusText);
        if (response.ok) {
          const data = await response.json();
          setServers(data.servers || []);
        } else {
          const bodyText = await response.text();
          console.warn("DMsPage: servers fetch non-ok", response.status, bodyText);
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
        onCreateClick={() => setIsCreateServerModalOpen(true)}
      />
      <CreateServerModal
        isOpen={isCreateServerModalOpen}
        isLoading={isServerLoading}
        serverError={serverError}
        onClose={() => {
          setIsCreateServerModalOpen(false);
          setServerError("");
        }}
        onCreate={async (name: string, description: string, icon?: string) => {
          setServerError("");
          const server = await createServer(name, description, icon);
          if (server) {
            setIsCreateServerModalOpen(false);
            router.push(`/servers/${server.id}/${server.channels[0].id}`);
            return server;
          }
          setServerError("Failed to create server");
          return null;
        }}
        onJoinClick={async (inviteCode: string) => {
          try {
            const joined = await joinWithInvite(inviteCode);
            if (joined) {
              setIsCreateServerModalOpen(false);
              router.push(`/servers/${joined.id}/${joined.channels[0].id}`);
            } else {
              setServerError("Failed to join server with invite");
            }
          } catch (err) {
            setServerError(err instanceof Error ? err.message : "Failed to join server");
          }
        }}
      />

      {/* DM List sidebar */}
      <div className="w-64 border-r border-gray-700 bg-gray-900/80 backdrop-blur overflow-y-auto flex flex-col hide-scrollbar pt-14">
        {/* User Profile Card */}
        <UserProfileCard
          currentUser={currentUser}
          onProfileClick={() => setIsProfileOpen(true)}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />

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

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        isLoading={false}
        profile={currentUser}
        onClose={() => setIsProfileOpen(false)}
        onSave={async (updates: any) => {
          setCurrentUser((prev) => ({ ...prev, ...updates } as User));
          setIsProfileOpen(false);
          return { ...currentUser, ...updates } as User;
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        isLoading={false}
        user={currentUser}
        onClose={() => setIsSettingsOpen(false)}
        onSave={async (updates: any) => {
          setCurrentUser((prev) => ({ ...prev, ...updates } as User));
        }}
        onLogout={() => {
          localStorage.removeItem("token");
          window.location.href = "/";
        }}
      />

      {/* App Top Bar */}
      <AppTopBar
        currentUser={currentUser}
        notifications={notifications}
        onMarkNotificationAsRead={markNotificationAsRead}
        onMarkAllNotificationsAsRead={markAllNotificationsAsRead}
        onDismissNotification={dismissNotification}
        onAcceptNotification={acceptNotification}
      />

      {/* Toast Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </div>
  );
}
