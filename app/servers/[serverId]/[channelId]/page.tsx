"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ChatLayout from "@/components/ChatLayout";
import ServerList from "@/components/ServerList";
import CreateServerModal from "@/components/CreateServerModal";
import InviteModal from "@/components/InviteModal";
import ServerOverview from "@/components/ServerOverview";
import ProfileModal from "@/components/ProfileModal";
import ViewProfileModal from "@/components/ViewProfileModal";
import { useAuth } from "@/lib/hooks";
import { useMessages } from "@/lib/messages";
import { useServers } from "@/lib/servers";
import { useProfile } from "@/lib/profile";
import { User, Message, Channel, Server } from "@/lib/types";
import { env } from "process";

// Decode JWT payload client-side to restore session user
const decodeUserFromToken = (token: string): User | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1] || ""));
    if (payload?.id && payload?.username && payload?.avatar) {
      return {
        id: payload.id,
        username: payload.username,
        avatar: payload.avatar,
      };
    }
    return null;
  } catch (err) {
    console.error("Failed to decode token", err);
    return null;
  }
};

// Construct WebSocket URL - proxied through nginx via ws.byteptr.xyz domain
const getWebSocketURL = (): string => {
  if (typeof window === "undefined") return "";
  // Always use ws.byteptr.xyz for WebSocket (nginx proxies to port 3002)
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//ws.byteptr.xyz/`;
};

export default function ServerChat() {
  const router = useRouter();
  const params = useParams();
  const serverId = params?.serverId as string;
  const channelId = params?.channelId as string;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Server state
  const [servers, setServers] = useState<Server[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [viewProfileUser, setViewProfileUser] = useState<User | null>(null);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [serverMembers, setServerMembers] = useState<User[]>([]);

  const {
    token,
    clearToken,
    loadToken,
  } = useAuth();

  const { loadMessages, sendMessage } = useMessages(token);
  const { createServer, listServers, createInvite, joinWithInvite, isLoading: isServerLoading } = useServers(token);
  const { profile, isLoading: isProfileLoading, loadProfile, loadProfileByUsername, updateProfile } = useProfile(token);

  // Track if we've already attempted redirect to avoid loops
  const hasCheckedAuth = useRef(false);

  // Debug logging for currentUser and profile states
  useEffect(() => {
    console.log("🧑 CurrentUser:", currentUser);
    console.log("👤 Profile:", profile);
  }, [currentUser, profile]);

  // Load token from localStorage on mount
  useEffect(() => {
    loadToken();
  }, [loadToken]);

  // Check authentication - redirect if not logged in (only once)
  useEffect(() => {
    if (hasCheckedAuth.current) return;
    if (token === null) return; // Still loading token
    
    if (!token) {
      hasCheckedAuth.current = true;
      router.push("/");
    } else {
      hasCheckedAuth.current = true;
    }
  }, [token, router]);

  // When token is available, restore user session and mark logged in
  useEffect(() => {
    if (!token) return;
    const userFromToken = decodeUserFromToken(token);
    if (userFromToken) {
      setCurrentUser(userFromToken);
      setIsLoggedIn(true);
    }
  }, [token]);

  // Load full profile once token is available
  useEffect(() => {
    if (!token) return;
    (async () => {
      const loaded = await loadProfile();
      if (loaded) {
        setCurrentUser((prev) => ({ ...prev, ...loaded } as User));
        setIsLoggedIn(true);
      }
    })();
  }, [token, loadProfile]);

  // Apply theme, font, and accent to document
  useEffect(() => {
    if (typeof document === "undefined") return;
    const theme = (currentUser?.theme as string) || "midnight";
    const font = (currentUser?.font as string) || "sans";
    const accent = currentUser?.accentColor || "#a855f7";
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-font", font);
    root.style.setProperty("--accent", accent);
  }, [currentUser?.theme, currentUser?.font, currentUser?.accentColor]);

  // Track if we've loaded messages for this channel to avoid re-fetching
  const hasLoadedMessages = useRef<string | null>(null);

  // Load servers when token is available
  useEffect(() => {
    if (!token) return;

    const loadUserServers = async () => {
      const userServers = await listServers();
      setServers(userServers);
    };

    loadUserServers();
  }, [token, listServers]);

  // Load server members when server changes
  useEffect(() => {
    if (!token || !serverId) return;

    const selectedServer = servers.find((s) => s.id === serverId);
    if (!selectedServer) return;

    const loadMembers = async () => {
      const memberIds = selectedServer.members || [];
      const memberProfiles: User[] = [];

      for (const memberId of memberIds) {
        try {
          const response = await fetch(`/api/profile?username=${memberId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              memberProfiles.push(data.user);
            }
          }
        } catch (error) {
          console.error(`Failed to load member ${memberId}:`, error);
        }
      }

      setServerMembers(memberProfiles);
    };

    loadMembers();
  }, [token, serverId, servers]);

  // Load messages from selected server and channel (only once per channel)
  useEffect(() => {
    if (!token || !serverId || !channelId) return;

    // Only load if we haven't loaded this channel yet
    const cacheKey = `${serverId}-${channelId}`;
    if (hasLoadedMessages.current === cacheKey) return;

    const loadChannelMessages = async () => {
      const messages = await loadMessages(cacheKey);
      setServers((prev) =>
        prev.map((s) =>
          s.id === serverId
            ? {
                ...s,
                channels: s.channels.map((ch) =>
                  ch.id === channelId ? { ...ch, messages } : ch
                ),
              }
            : s
        )
      );
      hasLoadedMessages.current = cacheKey;
    };

    loadChannelMessages();
  }, [token, serverId, channelId, loadMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [channelId, servers]);

  // Initialize websocket when logged in
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    if (wsRef.current) return;

    try {
      const ws = new WebSocket(getWebSocketURL());

      ws.onopen = () => {
        console.log("✅ WS connected");
        // Subscribe to this channel
        ws.send(
          JSON.stringify({
            type: "subscribe",
            channel: `${serverId}-${channelId}`,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📩 WS message received:", data);
          
          if (data?.type === "message" && data?.channel === `${serverId}-${channelId}`) {
            const incoming: Message = data.message;
            console.log("✨ Message object:", incoming);
            console.log("✨ Author:", incoming.author);
            
            setServers((prev) =>
              prev.map((s) =>
                s.id === serverId
                  ? {
                      ...s,
                      channels: s.channels.map((ch) =>
                        ch.id === channelId
                          ? ch.messages.find((m) => m.id === incoming.id)
                            ? ch
                            : { ...ch, messages: [...ch.messages, incoming] }
                          : ch
                      ),
                    }
                  : s
              )
            );
          } else {
            console.log("❌ Message type/channel mismatch:", {
              type: data?.type,
              expectedChannel: `${serverId}-${channelId}`,
              actualChannel: data?.channel,
            });
          }
        } catch (err) {
          console.warn("WS message parse error", err);
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
      };

      ws.onerror = (err) => {
        console.warn("WS error", err);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("WS init error", err);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isLoggedIn, currentUser, serverId, channelId, setServers]);

  const handleCreateServer = async (name: string, description: string) => {
    const newServer = await createServer(name, description);
    if (newServer) {
      setServers([...servers, newServer]);
      router.push(`/servers/${newServer.id}/${newServer.channels[0].id}`);
      setIsModalOpen(false);
      return newServer;
    }
    return null;
  };

  const handleJoinServer = async (code?: string) => {
    const joinCode = (code ?? inviteCode).trim();
    if (!joinCode) return;
    const server = await joinWithInvite(joinCode);
    if (server) {
      setServers([...servers, server]);
      router.push(`/servers/${server.id}/${server.channels[0].id}`);
      setInviteCode("");
      setIsModalOpen(false);
    }
  };

  const handleCreateInvite = async (serverId: string) => {
    const invite = await createInvite(serverId);
    return invite?.id || null;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !serverId || !channelId || !token) return;

    // Ensure we have full user data - if profile not loaded, load it now
    let author = profile || currentUser;
    
    // If still no profile loaded, attempt to load it synchronously
    if (!author || !author.username) {
      console.warn("⚠️ Profile not loaded, attempting fresh load...");
      const freshProfile = await loadProfile();
      author = freshProfile || currentUser;
    }
    
    if (!author) {
      console.warn("⚠️ No user profile available");
      return;
    }

    console.log("🔍 Author before message creation:", author);

    const messageAuthor: User = {
      id: author.id || author.username || "unknown",
      username: author.username || author.id || "unknown",
      avatar: author.avatar || `https://api.dicebear.com/7.x/bottts-neutral/png?size=512&seed=${encodeURIComponent(author.username || author.id || "unknown")}`,
    };
    
    console.log("✍️ Message author being sent:", messageAuthor);

    const newMessage: Message = {
      id: Date.now().toString(),
      author: messageAuthor,
      content: messageInput,
      timestamp: new Date().toISOString(),
    };

    // Optimistically update UI
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId
          ? {
              ...s,
              channels: s.channels.map((ch) =>
                ch.id === channelId
                  ? { ...ch, messages: [...ch.messages, newMessage] }
                  : ch
              ),
            }
          : s
      )
    );

    // Send to server
    const success = await sendMessage(
      `${serverId}-${channelId}`,
      newMessage
    );

    if (!success) {
      console.error("Failed to send message");
    }

    // Send via websocket if connected
    if (wsRef.current && wsRef.current.readyState === 1) {
      const wsPayload = {
        type: "message",
        channel: `${serverId}-${channelId}`,
        message: newMessage,
      };
      console.log("📤 Sending via WebSocket:", wsPayload);
      wsRef.current.send(JSON.stringify(wsPayload));
    }

    setMessageInput("");
  };

  const handleProfileSave = async (updates: Partial<User>) => {
    const updated = await updateProfile(updates);
    if (updated) {
      setCurrentUser((prev) => ({ ...prev, ...updated } as User));
    }
    return updated;
  };

  const handleAvatarClick = async (user: User) => {
    if (!user?.username) return;
    const full = await loadProfileByUsername(user.username);
    if (full) {
      setViewProfileUser(full as User);
      setIsViewProfileOpen(true);
    }
  };

  const handleServerSelect = (id: string) => {
    const server = servers.find((s) => s.id === id);
    if (server) {
      setIsTransitioning(true);
      setTimeout(() => {
        router.push(`/servers/${id}/${server.channels[0].id}`);
      }, 150);
    }
  };

  const handleChannelSelect = (id: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      router.push(`/servers/${serverId}/${id}`);
    }, 150);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setServers([]);
    clearToken();
    router.push("/");
  };

  // Render loading state while checking auth
  if (!token || !isLoggedIn) {
    return null;
  }

  const selectedServer = servers.find((s) => s.id === serverId);
  const channels = selectedServer?.channels || [];

  return (
    <div className="flex h-screen w-screen bg-slate-900">
      {/* Server List Sidebar */}
      <ServerList
        servers={servers}
        selectedServerId={serverId}
        onServerSelect={handleServerSelect}
        onCreateClick={() => setIsModalOpen(true)}
      />

      {/* Chat Area */}
      {selectedServer ? (
        <div
          className={`flex-1 transition-opacity duration-300 ${
            isTransitioning ? "opacity-50" : "opacity-100"
          }`}
          onAnimationEnd={() => setIsTransitioning(false)}
        >
          <ChatLayout
            currentUser={currentUser}
            server={selectedServer}
          channels={channels}
          selectedChannelId={channelId}
          messageInput={messageInput}
          messagesEndRef={messagesEndRef}
          onChannelSelect={handleChannelSelect}
          onMessageInputChange={setMessageInput}
          onSendMessage={handleSendMessage}
          onAvatarClick={handleAvatarClick}
          onProfileClick={() => setIsProfileOpen(true)}
          onLogout={handleLogout}
          onShowInvite={() => setIsModalOpen(true)}
          onShowOverview={() => setIsOverviewOpen(true)}
          serverMembers={serverMembers}
        />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="text-center space-y-8 px-4">
            <div className="space-y-4">
              <div className="text-8xl animate-bounce mb-4">🐱</div>
              <h2 className="text-4xl font-black text-white">
                Welcome to CatboyChat
              </h2>
              <p className="text-xl text-gray-400">
                Where catboys and catgirls unite
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
              <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 backdrop-blur">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-sm text-gray-300">Connect & Chat</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 backdrop-blur">
                <div className="text-3xl mb-2">🎪</div>
                <p className="text-sm text-gray-300">Organize Servers</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30 backdrop-blur">
                <div className="text-3xl mb-2">👥</div>
                <p className="text-sm text-gray-300">Manage Roles</p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-pink-500/50"
            >
              ✨ Create Your First Server
            </button>
          </div>
        </div>
      )}

      {/* Create/Join Server Modal */}
      <CreateServerModal
        isOpen={isModalOpen}
        isLoading={isServerLoading}
        onClose={() => {
          setIsModalOpen(false);
          setInviteCode("");
        }}
        onCreate={handleCreateServer}
        onJoinClick={handleJoinServer}
      />

      <InviteModal
        isOpen={isModalOpen && !!selectedServer}
        server={selectedServer}
        onClose={() => setIsModalOpen(false)}
        onCreateInvite={handleCreateInvite}
      />

      <ServerOverview
        server={selectedServer}
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        currentUserId={currentUser?.id || ""}
        userRoles={
          selectedServer?.roles?.filter((role) =>
            selectedServer.memberRoles?.find(
              (mr) => mr.userId === currentUser?.id && mr.roleIds.includes(role.id)
            )
          ) || []
        }
      />

      <ProfileModal
        isOpen={isProfileOpen}
        isLoading={isProfileLoading}
        profile={(profile as User) || currentUser}
        onClose={() => setIsProfileOpen(false)}
        onSave={handleProfileSave}
      />

      <ViewProfileModal
        isOpen={isViewProfileOpen}
        user={viewProfileUser}
        onClose={() => setIsViewProfileOpen(false)}
      />
    </div>
  );
}
