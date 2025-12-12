"use client";

import { useState } from "react";
import { Server, ServerRole, ServerMember } from "@/lib/types";
import { hasPermission, DEFAULT_PERMISSIONS } from "@/lib/permissions";
import {
  Settings,
  Users,
  MessageSquare,
  Shield,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

interface ServerOverviewProps {
  server: Server | undefined;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  userRoles: ServerRole[];
  onOpenSettings?: () => void;
}

export default function ServerOverview({
  server,
  isOpen,
  onClose,
  currentUserId,
  userRoles,
  onOpenSettings,
}: ServerOverviewProps) {
  const [copiedServerId, setCopiedServerId] = useState(false);

  if (!isOpen || !server) return null;

  const userPermissions = userRoles.flatMap((r) => r.permissions);
  const canManageServer = hasPermission(
    userPermissions,
    DEFAULT_PERMISSIONS.MANAGE_SERVER
  );
  const canManageRoles = hasPermission(
    userPermissions,
    DEFAULT_PERMISSIONS.MANAGE_ROLES
  );
  const canManageChannels = hasPermission(
    userPermissions,
    DEFAULT_PERMISSIONS.MANAGE_CHANNELS
  );
  const canManageMembers = hasPermission(
    userPermissions,
    DEFAULT_PERMISSIONS.MANAGE_MEMBERS
  );
  const isOwner = server.ownerId === currentUserId;

  const getMemberCount = () => server.members.length;
  const getRoleCount = () => server.roles?.length || 0;
  const getChannelCount = () => server.channels.length;
  const getInviteCount = () => server.invites?.length || 0;

  const stats = [
    {
      label: "Members",
      value: getMemberCount(),
      icon: "👥",
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Roles",
      value: getRoleCount(),
      icon: "🎭",
      color: "from-purple-500 to-pink-500",
    },
    {
      label: "Channels",
      value: getChannelCount(),
      icon: "💬",
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Active Invites",
      value: getInviteCount(),
      icon: "📨",
      color: "from-orange-500 to-red-500",
    },
  ];

  const copyServerId = () => {
    navigator.clipboard.writeText(server.id);
    setCopiedServerId(true);
    setTimeout(() => setCopiedServerId(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg w-full max-w-5xl max-h-screen overflow-hidden shadow-2xl flex flex-col">
        {/* Header with Gradient Background */}
        <div className="border-b border-slate-700 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="text-6xl drop-shadow-lg">{server.icon || "🚀"}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-bold text-white">
                    {server.name}
                  </h2>
                  {isOwner && (
                    <span className="inline-block px-3 py-1 bg-linear-to-r from-purple-600 to-purple-500 text-white text-xs font-bold rounded-full">
                      👑 Owner
                    </span>
                  )}
                </div>
                {server.description && (
                  <p className="text-slate-300 text-sm mt-2 max-w-md line-clamp-2">
                    {server.description}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl transition"
            >
              ✕
            </button>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex gap-3 flex-wrap">
            <div className="bg-slate-700/50 px-3 py-1.5 rounded-full text-xs text-slate-300">
              📅 {new Date(server.createdAt).toLocaleDateString()}
            </div>
            <div className="bg-slate-700/50 px-3 py-1.5 rounded-full text-xs text-slate-300">
              👥 {server.members.length} members
            </div>
            <div className="bg-slate-700/50 px-3 py-1.5 rounded-full text-xs text-slate-300">
              💬 {server.channels.length} channels
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            {(isOwner || canManageServer) && (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
              >
                <Settings className="w-4 h-4" />
                Server Settings
              </button>
            )}
            <button
              onClick={copyServerId}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
            >
              {copiedServerId ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Server ID
                </>
              )}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`bg-linear-to-br ${stat.color} rounded-lg p-4 text-white shadow-lg hover:shadow-xl transition`}
              >
                <p className="text-3xl mb-2">{stat.icon}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-white text-opacity-75">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Server Details */}
          <div className="bg-slate-700 rounded-lg p-6 border border-slate-600 hover:border-slate-500 transition">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Server Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-slate-400 text-xs font-semibold mb-1 uppercase">
                  Server ID
                </p>
                <p className="text-white font-mono text-xs break-all">
                  {server.id}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-slate-400 text-xs font-semibold mb-1 uppercase">
                  Owner
                </p>
                <p className="text-white font-semibold">{server.ownerId}</p>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-slate-400 text-xs font-semibold mb-1 uppercase">
                  Created
                </p>
                <p className="text-white font-semibold">
                  {new Date(server.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded p-3">
                <p className="text-slate-400 text-xs font-semibold mb-1 uppercase">
                  Members
                </p>
                <p className="text-white font-semibold">{server.members.length}</p>
              </div>
            </div>
          </div>

          {/* Channels Overview */}
          <div className="bg-slate-700 rounded-lg p-6 border border-slate-600 hover:border-slate-500 transition">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Channels ({getChannelCount()})
              {canManageChannels && (
                <span className="ml-auto text-xs bg-purple-600 px-2 py-1 rounded">
                  Manageable
                </span>
              )}
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {server.channels.length > 0 ? (
                server.channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between bg-slate-800/50 rounded p-3 hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-white font-semibold">#{channel.name}</p>
                        <p className="text-xs text-slate-400">
                          {channel.messages.length} messages
                        </p>
                      </div>
                    </div>
                    {canManageChannels && (
                      <button className="text-slate-400 hover:text-white transition">
                        ⚙️
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-6">No channels</p>
              )}
            </div>
          </div>

          {/* Roles Overview */}
          {(isOwner || canManageRoles) && (
            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600 hover:border-slate-500 transition">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                🎭 Roles ({getRoleCount()})
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {server.roles && server.roles.length > 0 ? (
                  server.roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between bg-slate-800/50 rounded p-3 hover:bg-slate-800 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: role.color || "#3b82f6" }}
                        />
                        <div>
                          <p className="text-white font-semibold">{role.name}</p>
                          <p className="text-xs text-slate-400">
                            {role.permissions.length} permissions
                          </p>
                        </div>
                      </div>
                      {canManageRoles && (
                        <button className="text-slate-400 hover:text-white transition">
                          ⚙️
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-6">No roles</p>
                )}
              </div>
            </div>
          )}

          {/* Members Overview */}
          {(isOwner || canManageMembers) && (
            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600 hover:border-slate-500 transition">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Members ({getMemberCount()})
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {server.memberRoles && server.memberRoles.length > 0 ? (
                  server.memberRoles.slice(0, 15).map((member) => {
                    const memberRoles = server.roles?.filter((r) =>
                      member.roleIds.includes(r.id)
                    ) || [];
                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between bg-slate-800/50 rounded p-3 hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {member.userId.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">
                              {member.userId}
                            </p>
                            {memberRoles.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {memberRoles.slice(0, 2).map((role) => (
                                  <span
                                    key={role.id}
                                    className="px-1.5 py-0.5 rounded text-xs font-semibold text-white"
                                    style={{
                                      backgroundColor: role.color || "#3b82f6",
                                    }}
                                  >
                                    {role.name}
                                  </span>
                                ))}
                                {memberRoles.length > 2 && (
                                  <span className="px-1.5 py-0.5 rounded text-xs font-semibold text-slate-300 bg-slate-700">
                                    +{memberRoles.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {(isOwner || canManageMembers) && (
                          <button className="text-slate-400 hover:text-white transition">
                            ⚙️
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-400 text-center py-6">No members</p>
                )}
                {(server.memberRoles?.length || 0) > 15 && (
                  <p className="text-center text-slate-400 text-xs mt-2">
                    +{(server.memberRoles?.length || 0) - 15} more members
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Invites Overview */}
          {(isOwner || canManageMembers) && (
            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600 hover:border-slate-500 transition">
              <h3 className="text-lg font-bold text-white mb-4">
                📨 Active Invites ({getInviteCount()})
              </h3>
              {server.invites && server.invites.length > 0 ? (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {server.invites
                    .filter((inv) => inv.active)
                    .slice(0, 10)
                    .map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between bg-slate-800/50 rounded p-3 text-sm hover:bg-slate-800 transition"
                      >
                        <div className="flex-1">
                          <p className="text-white font-mono text-xs mb-1">
                            {invite.id}
                          </p>
                          <p className="text-xs text-slate-400">
                            {invite.uses}
                            {invite.maxUses && `/${invite.maxUses}`} uses •{" "}
                            {new Date(invite.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {canManageMembers && (
                          <button className="ml-2 text-slate-400 hover:text-white transition">
                            ⚙️
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-6">No active invites</p>
              )}
            </div>
          )}

          {/* Permissions */}
          <div className="bg-slate-700 rounded-lg p-6 border border-slate-600 hover:border-slate-500 transition">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              🔐 Your Permissions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                {
                  name: "Manage Server",
                  has: canManageServer || isOwner,
                },
                {
                  name: "Manage Roles",
                  has: canManageRoles || isOwner,
                },
                {
                  name: "Manage Channels",
                  has: canManageChannels || isOwner,
                },
                {
                  name: "Manage Members",
                  has: canManageMembers || isOwner,
                },
                {
                  name: "Send Messages",
                  has: hasPermission(
                    userPermissions,
                    DEFAULT_PERMISSIONS.SEND_MESSAGES
                  ),
                },
                {
                  name: "Create Invites",
                  has: hasPermission(
                    userPermissions,
                    DEFAULT_PERMISSIONS.CREATE_INVITES
                  ),
                },
              ].map((perm) => (
                <div
                  key={perm.name}
                  className={`px-3 py-2 rounded text-xs font-semibold transition ${
                    perm.has
                      ? "bg-green-600/20 text-green-300 border border-green-600/50"
                      : "bg-slate-800/50 text-slate-400 border border-slate-600"
                  }`}
                >
                  {perm.has ? "✓" : "✗"} {perm.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 bg-slate-700 flex gap-3 justify-between">
          <div className="text-xs text-slate-400">
            Server ID: {server.id.substring(0, 8)}...
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
