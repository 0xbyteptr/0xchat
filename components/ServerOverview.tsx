"use client";

import { Server, ServerRole, ServerMember } from "@/lib/types";
import { hasPermission, DEFAULT_PERMISSIONS } from "@/lib/permissions";

interface ServerOverviewProps {
  server: Server | undefined;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  userRoles: ServerRole[];
}

export default function ServerOverview({
  server,
  isOpen,
  onClose,
  currentUserId,
  userRoles,
}: ServerOverviewProps) {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-screen overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-700 p-6 bg-linear-to-r from-slate-800 to-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{server.icon || "🚀"}</div>
              <div>
                <h2 className="text-3xl font-bold text-white">{server.name}</h2>
                {isOwner && (
                  <span className="inline-block px-2 py-1 mt-1 bg-purple-600 text-white text-xs font-semibold rounded">
                    Server Owner
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
          {server.description && (
            <p className="text-slate-300 text-sm">{server.description}</p>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`bg-linear-to-br ${stat.color} rounded-lg p-4 text-white shadow-lg`}
              >
                <p className="text-3xl mb-2">{stat.icon}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-white text-opacity-75">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Server Details */}
          <div className="bg-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              📊 Server Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-400 mb-1">Created</p>
                <p className="text-white font-semibold">
                  {new Date(server.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Server ID</p>
                <p className="text-white font-mono text-xs break-all">
                  {server.id}
                </p>
              </div>
              <div>
                <p className="text-slate-400 mb-1">Owner</p>
                <p className="text-white font-semibold">{server.ownerId}</p>
              </div>
            </div>
          </div>

          {/* Channels Overview */}
          <div className="bg-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              💬 Channels ({getChannelCount()})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {server.channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between bg-slate-600 rounded p-3"
                >
                  <div>
                    <p className="text-white font-semibold">#{channel.name}</p>
                    <p className="text-xs text-slate-400">
                      {channel.messages.length} messages
                    </p>
                  </div>
                  {canManageChannels && (
                    <button className="text-slate-400 hover:text-white transition">
                      ⚙️
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Roles Overview */}
          {(isOwner || canManageRoles) && (
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                🎭 Roles ({getRoleCount()})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {server.roles?.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between bg-slate-600 rounded p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: role.color || "#3b82f6" }}
                      />
                      <div>
                        <p className="text-white font-semibold">{role.name}</p>
                        <p className="text-xs text-slate-400">
                          {role.permissions.length} permissions
                        </p>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-white transition">
                      ⚙️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Overview */}
          {(isOwner || canManageMembers) && (
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                👥 Members ({getMemberCount()})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {server.memberRoles?.slice(0, 10).map((member) => {
                  const memberRoles = server.roles?.filter((r) =>
                    member.roleIds.includes(r.id)
                  ) || [];
                  return (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between bg-slate-600 rounded p-3"
                    >
                      <div className="flex items-center gap-2">
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
                                  className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                                  style={{
                                    backgroundColor: role.color || "#3b82f6",
                                  }}
                                >
                                  {role.name}
                                </span>
                              ))}
                              {memberRoles.length > 2 && (
                                <span className="px-2 py-0.5 rounded text-xs font-semibold text-slate-300 bg-slate-700">
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
                })}
                {(server.memberRoles?.length || 0) > 10 && (
                  <p className="text-center text-slate-400 text-sm mt-2">
                    +{(server.memberRoles?.length || 0) - 10} more members
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Invites Overview */}
          {(isOwner || canManageMembers) && (
            <div className="bg-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                📨 Active Invites ({getInviteCount()})
              </h3>
              {server.invites && server.invites.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {server.invites
                    .filter((inv) => inv.active)
                    .map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between bg-slate-600 rounded p-3 text-sm"
                      >
                        <div>
                          <p className="text-white font-mono text-sm">
                            {invite.id}
                          </p>
                          <p className="text-xs text-slate-400">
                            Created by {invite.createdBy}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">
                            {invite.uses}
                            {invite.maxUses && `/${invite.maxUses}`} uses
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(invite.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center py-4">
                  No active invites
                </p>
              )}
            </div>
          )}

          {/* Permissions Info */}
          <div className="bg-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
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
                  className={`px-3 py-2 rounded text-sm font-semibold ${
                    perm.has
                      ? "bg-green-600 text-white"
                      : "bg-slate-600 text-slate-400"
                  }`}
                >
                  {perm.has ? "✓" : "✗"} {perm.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-6 bg-slate-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
}
