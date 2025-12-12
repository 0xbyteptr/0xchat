"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import ChatLayout from "@/components/ChatLayout";
import AppTopBar from "@/components/AppTopBar";
import ServerList from "@/components/ServerList";
import CreateServerModal from "@/components/CreateServerModal";
import InviteModal from "@/components/InviteModal";
import ServerOverview from "@/components/ServerOverview";
import ProfileModal from "@/components/ProfileModal";
import ViewProfileModal from "@/components/ViewProfileModal";
import SettingsModal from "@/components/SettingsModal";
import PinnedMessages from "@/components/PinnedMessages";
import ToastContainer from "@/components/ToastContainer";
import { useAuth } from "@/lib/hooks";
import { useMessages } from "@/lib/messages";
import { useServers } from "@/lib/servers";
import { useProfile } from "@/lib/profile";
import { extractLinksFromContent, isValidUrl } from "@/lib/link-utils";
import { User, Message, Channel, Server } from "@/lib/types";
import { Toast, UserNotification } from "@/lib/notification-types";
import { env } from "process";
import { getApiUrl } from "@/lib/api";

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

  // Guard against undefined params in Next.js 15
  if (!serverId || !channelId) {
    return <div className="flex items-center justify-center w-full h-screen bg-slate-900 text-white">Loading...</div>;
  }

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Server state
  const [servers, setServers] = useState<Server[]>([]);
  const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [serverError, setServerError] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [viewProfileUser, setViewProfileUser] = useState<User | null>(null);
  const [isViewProfileOpen, setIsViewProfileOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [serverMembers, setServerMembers] = useState<User[]>([]);
  const [isPinnedMessagesOpen, setIsPinnedMessagesOpen] = useState(false);

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

  // Cache for resolved user profiles to avoid repeated API calls
  const profileCacheRef = useRef<Map<string, User>>(new Map());

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
    // Handle based on type
    if (notification.type === "serverInvite" && notification.data?.inviteCode) {
      console.log("Accepting server invite:", notification.data.inviteCode);
    } else if (notification.type === "friendRequest") {
      console.log("Accepting friend request from:", notification.from.username);
    }
  }, []);

  // Function to resolve user profile by ID
  const resolveUserProfile = useCallback(async (userId: string): Promise<User | null> => {
    if (!token) return null;
    
    // Check cache first
    if (profileCacheRef.current.has(userId)) {
      return profileCacheRef.current.get(userId) || null;
    }
    
    try {
      const url = getApiUrl(`/api/profile?id=${encodeURIComponent(userId)}`);
      console.debug("resolveUserProfile: fetching", url);
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          profileCacheRef.current.set(userId, data.user);
          return data.user;
        }
      }
    } catch (error) {
      console.error(`Failed to resolve profile for ${userId}:`, error);
    }
    return null;
  }, [token]);

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
          const url = getApiUrl(`/api/profile?username=${memberId}`);
          console.debug("loadMembers: fetching", url);
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
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

  useEffect(() => {
    setReplyMessage(null);
  }, [channelId]);

  const updateMessagePinState = useCallback(
    (messageId: string, isPinned: boolean) => {
      setServers((prev) =>
        prev.map((s) =>
          s.id === serverId
            ? {
                ...s,
                channels: s.channels.map((ch) =>
                  ch.id === channelId
                    ? {
                        ...ch,
                        messages: ch.messages.map((m) =>
                          m.id === messageId ? { ...m, isPinned } : m
                        ),
                      }
                    : ch
                ),
              }
            : s
        )
      );
    },
    [serverId, channelId]
  );

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

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📩 WS message received:", data);
          
          // Ignore subscribe confirmations
          if (data?.type === "subscribe") {
            console.log("✅ Subscribed to channel:", data?.channel);
            return;
          }
          
          if (data?.type === "message" && data?.channel === `${serverId}-${channelId}`) {
            let incoming: Message = data.message;
            console.log("✨ Message object:", incoming);
            console.log("✨ Author:", incoming.author);
            
            // If author is incomplete (only has id), resolve full profile
            if (incoming.author && !incoming.author.username) {
              console.log("🔍 Author incomplete, resolving profile for:", incoming.author.id);
              const fullProfile = await resolveUserProfile(incoming.author.id);
              if (fullProfile) {
                incoming.author = fullProfile;
                console.log("✅ Author resolved:", incoming.author);
              } else {
                // Fallback: use ID as username and generate avatar
                incoming.author = {
                  id: incoming.author.id,
                  username: incoming.author.id,
                  avatar: `https://api.dicebear.com/7.x/bottts-neutral/png?size=512&seed=${encodeURIComponent(incoming.author.id)}`,
                };
                console.log("⚠️ Author resolved with fallback:", incoming.author);
              }
            }
            
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
                }

                // Handle message edit broadcasts
                if (data?.type === "message_edit" && data?.channel === `${serverId}-${channelId}`) {
                  const incoming: Message = data.message;
                  setServers((prev) =>
                    prev.map((s) =>
                      s.id === serverId
                        ? {
                            ...s,
                            channels: s.channels.map((ch) =>
                              ch.id === channelId
                                ? {
                                    ...ch,
                                    messages: ch.messages.map((m) =>
                                      m.id === incoming.id
                                        ? { ...m, content: incoming.content, isEdited: true, editedAt: incoming.editedAt || new Date().toISOString() }
                                        : m
                                    ),
                                  }
                                : ch
                            ),
                          }
                        : s
                    )
                  );
                }

                // Handle message delete broadcasts
                if (data?.type === "message_delete" && data?.channel === `${serverId}-${channelId}`) {
                  const { messageId } = data;
                  setServers((prev) =>
                    prev.map((s) =>
                      s.id === serverId
                        ? {
                            ...s,
                            channels: s.channels.map((ch) =>
                              ch.id === channelId
                                ? { ...ch, messages: ch.messages.filter((m) => m.id !== messageId) }
                                : ch
                            ),
                          }
                        : s
                    )
                  );
                }
                if (data?.type === "message_pin" && data?.channel === `${serverId}-${channelId}`) {
                  const { messageId, isPinned } = data;
                  if (messageId) {
                    updateMessagePinState(messageId, Boolean(isPinned));
                  }
                }
          if (data?.type === "message") {
            console.log("📨 Message for different channel, ignoring:", {
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
  }, [isLoggedIn, currentUser, serverId, channelId, updateMessagePinState]);

  const handleCreateServer = async (name: string, description: string, icon?: string) => {
    setServerError("");
    const newServer = await createServer(name, description, icon);
    if (newServer) {
      setServers([...servers, newServer]);
      router.push(`/servers/${newServer.id}/${newServer.channels[0].id}`);
      setIsCreateServerModalOpen(false);
      return newServer;
    } else {
      setServerError("Failed to create server. Please try again.");
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
      setIsCreateServerModalOpen(false);
    }
  };

  const handleCreateInvite = async (serverId: string) => {
    const invite = await createInvite(serverId);
    return invite?.id || null;
  };

  const handleReplyMessage = (message: Message) => {
    setReplyMessage(message);
    scrollToBottom();
  };

  const clearReplyMessage = () => {
    setReplyMessage(null);
  };

  const handleSendMessage = async (e: React.FormEvent, files?: File[]) => {
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

    // Process attachments
    const attachments = files ? files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f), // In production, upload to server and get real URL
    })) : undefined;

    // Extract links from message content
    const links = extractLinksFromContent(messageInput)
      .filter(isValidUrl);
    
    console.log("🔍 Link extraction result:", {
      content: messageInput,
      linksFound: links,
      linksCount: links.length,
    });

    const replyPayload = replyMessage
      ? {
          messageId: replyMessage.id,
          authorId: replyMessage.author.id,
          authorUsername: replyMessage.author.username,
          content: replyMessage.content,
        }
      : undefined;

    const newMessage: Message = {
      id: Date.now().toString(),
      author: messageAuthor,
      content: messageInput,
      timestamp: new Date().toISOString(),
      attachments,
      links: links.length > 0 ? links : undefined,
      replyTo: replyPayload,
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
    setReplyMessage(null);
  };

  const handleProfileSave = async (updates: Partial<User>) => {
    const updated = await updateProfile(updates);
    if (updated) {
      setCurrentUser((prev) => ({ ...prev, ...updated } as User));
    }
    return updated;
  };

  const handleSettingsSave = async (updates: Partial<User>) => {
    const updated = await updateProfile(updates);
    if (updated) {
      setCurrentUser((prev) => ({ ...prev, ...updated } as User));
    }
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

  const handleAddReaction = (messageId: string, emoji: string) => {
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId
          ? {
              ...s,
              channels: s.channels.map((ch) =>
                ch.id === channelId
                  ? {
                      ...ch,
                      messages: ch.messages.map((m) => {
                        if (m.id === messageId) {
                          const reactions = m.reactions ? { ...m.reactions } : {};
                          const existingReaction = reactions[emoji];
                          
                          if (existingReaction) {
                            // User already reacted, increment count
                            reactions[emoji] = {
                              emoji,
                              count: existingReaction.count + 1,
                              userReacted: true,
                            };
                          } else {
                            // New reaction
                            reactions[emoji] = {
                              emoji,
                              count: 1,
                              userReacted: true,
                            };
                          }
                          return { ...m, reactions };
                        }
                        return m;
                      }),
                    }
                  : ch
              ),
            }
          : s
      )
    );
  };

  const handleRemoveReaction = (messageId: string, emoji: string) => {
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId
          ? {
              ...s,
              channels: s.channels.map((ch) =>
                ch.id === channelId
                  ? {
                      ...ch,
                      messages: ch.messages.map((m) => {
                        if (m.id === messageId) {
                          const reactions = { ...m.reactions };
                          const existingReaction = reactions[emoji];
                          
                          if (existingReaction && existingReaction.count > 1) {
                            // Decrement count
                            reactions[emoji] = {
                              emoji,
                              count: existingReaction.count - 1,
                              userReacted: false,
                            };
                          } else {
                            // Remove reaction completely
                            delete reactions[emoji];
                          }
                          return { ...m, reactions };
                        }
                        return m;
                      }),
                    }
                  : ch
              ),
            }
          : s
      )
    );
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!token) return;
    try {
      const endpoint = `/api/messages/${messageId}`;
      const resolved = getApiUrl(endpoint);

      let res: Response | null = null;
      try {
        res = await fetch(resolved, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
      } catch (err) {
        console.warn("Delete message failed, trying relative endpoint", err);
      }

      if ((!res || !res.ok) && resolved !== endpoint) {
        res = await fetch(endpoint, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
      }

      if (res && res.ok) {
        setServers((prev) =>
          prev.map((s) =>
            s.id === serverId
              ? {
                  ...s,
                  channels: s.channels.map((ch) =>
                    ch.id === channelId
                      ? { ...ch, messages: ch.messages.filter((m) => m.id !== messageId) }
                      : ch
                  ),
                }
              : s
          )
        );
      } else {
        console.error("Failed to delete message", res);
      }
    } catch (error) {
      console.error("Delete message error:", error);
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    if (!token) return;
    try {
      const endpoint = `/api/messages/${messageId}`;
      const resolved = getApiUrl(endpoint);

      let res: Response | null = null;
      try {
        res = await fetch(resolved, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content }),
        });
      } catch (err) {
        console.warn("Edit message failed, trying relative endpoint", err);
      }

      if ((!res || !res.ok) && resolved !== endpoint) {
        res = await fetch(endpoint, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content }),
        });
      }

      if (res && res.ok) {
        const data = await res.json();
        // Update local state with edited content
        setServers((prev) =>
          prev.map((s) =>
            s.id === serverId
              ? {
                  ...s,
                  channels: s.channels.map((ch) =>
                    ch.id === channelId
                      ? {
                          ...ch,
                          messages: ch.messages.map((m) =>
                            m.id === messageId ? { ...m, content: data.content ?? content, isEdited: true, editedAt: data.editedAt ?? new Date().toISOString() } : m
                          ),
                        }
                      : ch
                  ),
                }
              : s
          )
        );
      } else {
        console.error("Failed to edit message", res);
      }
    } catch (error) {
      console.error("Edit message error:", error);
    }
  };

  const handlePinMessage = async (message: Message, targetState?: boolean) => {
    if (!token) return;
    const desiredState = typeof targetState === "boolean" ? targetState : !message.isPinned;
    const endpoint = `/api/messages/${message.id}/pin`;
    const resolvedUrl = getApiUrl(endpoint);
    const requestOptions: RequestInit = {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ isPinned: desiredState }),
    };

    let res: Response | null = null;
    try {
      res = await fetch(resolvedUrl, requestOptions);
    } catch (err) {
      console.warn("Pin message failed, trying relative endpoint", err);
    }

    if ((!res || !res.ok) && resolvedUrl !== endpoint) {
      try {
        res = await fetch(endpoint, requestOptions);
      } catch (err) {
        console.warn("Pin message fallback failed", err);
      }
    }

    if (res && res.ok) {
      updateMessagePinState(message.id, desiredState);
    } else {
      console.error("Failed to toggle pin state", res);
    }
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
        onCreateClick={() => setIsCreateServerModalOpen(true)}
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
            onSettingsClick={() => setIsSettingsOpen(true)}
            onLogout={handleLogout}
            onShowInvite={() => setIsInviteModalOpen(true)}
            onShowOverview={() => setIsOverviewOpen(true)}
            onShowPinnedMessages={() => setIsPinnedMessagesOpen(true)}
            onAddReaction={handleAddReaction}
            onRemoveReaction={handleRemoveReaction}
            onDeleteMessage={handleDeleteMessage}
            onEditMessage={handleEditMessage}
            onPinMessage={handlePinMessage}
            replyMessage={replyMessage}
            onReplyMessage={handleReplyMessage}
            onClearReply={clearReplyMessage}
            serverMembers={serverMembers}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="text-center space-y-8 px-4">
            <div className="space-y-4">
              <div className="text-8xl animate-bounce mb-4">😻</div>
              <h2 className="text-4xl font-black text-white">
                Welcome to 0xChat
              </h2>
              <p className="text-xl text-gray-400">
                Friendly chat for everyone
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
              onClick={() => setIsCreateServerModalOpen(true)}
              className="px-8 py-4 bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-pink-500/50"
            >
              ✨ Create Your First Server
            </button>
          </div>
        </div>
      )}

      {/* Create/Join Server Modal */}
      <CreateServerModal
        isOpen={isCreateServerModalOpen}
        isLoading={isServerLoading}
        serverError={serverError}
        onClose={() => {
          setIsCreateServerModalOpen(false);
          setInviteCode("");
          setServerError("");
        }}
        onCreate={handleCreateServer}
        onJoinClick={handleJoinServer}
      />

      <InviteModal
        isOpen={isInviteModalOpen && !!selectedServer}
        server={selectedServer}
        onClose={() => setIsInviteModalOpen(false)}
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

      <SettingsModal
        isOpen={isSettingsOpen}
        isLoading={isProfileLoading}
        user={currentUser}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSettingsSave}
        onLogout={() => {
          localStorage.removeItem("token");
          window.location.href = "/";
        }}
      />

      <ViewProfileModal
        isOpen={isViewProfileOpen}
        user={viewProfileUser}
        onClose={() => setIsViewProfileOpen(false)}
      />

      <PinnedMessages
        isOpen={isPinnedMessagesOpen}
        pinnedMessages={selectedServer?.channels.find((ch) => ch.id === channelId)?.messages.filter((m) => m.isPinned) || []}
        onClose={() => setIsPinnedMessagesOpen(false)}
        onUnpin={(messageId) => {
          const targetMessage = selectedServer?.channels
            .find((ch) => ch.id === channelId)
            ?.messages.find((m) => m.id === messageId);
          if (targetMessage) {
            handlePinMessage(targetMessage, false);
          }
        }}
        onDeletePin={(messageId) => handleDeleteMessage(messageId)}
        onJumpToMessage={(messageId) => {
          // Jump to message in chat
          setTimeout(() => {
            const messageEl = document.getElementById(`message-${messageId}`);
            messageEl?.scrollIntoView({ behavior: "smooth" });
          }, 100);
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
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
      />

      {/* Toast Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </div>
  );
}
