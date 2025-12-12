"use client";

import { useState } from "react";
import { Server, ServerRole } from "@/lib/types";
import { Settings, Save, Trash2, Plus, Copy, Check } from "lucide-react";

interface ServerSettingsProps {
  server: Server | undefined;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  userRoles: ServerRole[];
  onUpdateServer?: (updates: Partial<Server>) => Promise<void>;
  onDeleteServer?: () => Promise<void>;
}

type TabType = "general" | "roles" | "channels" | "members" | "invites" | "moderation";

export default function ServerSettings({
  server,
  isOpen,
  onClose,
  currentUserId,
  userRoles,
  onUpdateServer,
  onDeleteServer,
}: ServerSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [serverName, setServerName] = useState(server?.name || "");
  const [serverDescription, setServerDescription] = useState(
    server?.description || ""
  );
  const [serverIcon, setServerIcon] = useState(server?.icon || "");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState<string | null>(null);

  if (!isOpen || !server) return null;

  const isOwner = server.ownerId === currentUserId;
  const canManageSettings = isOwner;

  const handleSaveSettings = async () => {
    if (!onUpdateServer || !canManageSettings) return;

    setIsSaving(true);
    try {
      await onUpdateServer({
        name: serverName,
        description: serverDescription,
        icon: serverIcon,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(`chat.byteptr.xyz/invite/${code}`);
    setCopiedInvite(code);
    setTimeout(() => setCopiedInvite(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg w-full max-w-5xl max-h-screen overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-700 p-6 bg-linear-to-r from-slate-800 to-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Server Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl transition"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700 bg-slate-800 px-6 flex gap-2 overflow-x-auto">
          {(
            [
              { id: "general", label: "⚙️ General" },
              { id: "roles", label: "🎭 Roles" },
              { id: "channels", label: "💬 Channels" },
              { id: "members", label: "👥 Members" },
              { id: "invites", label: "📨 Invites" },
              { id: "moderation", label: "🛡️ Moderation" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? "text-purple-400 border-purple-400"
                  : "text-slate-400 border-transparent hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* General Settings Tab */}
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Server Information
                </h3>
                <div className="space-y-4">
                  {/* Server Icon */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Server Icon (Emoji)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={serverIcon}
                        onChange={(e) => setServerIcon(e.target.value)}
                        placeholder="e.g., 🚀"
                        disabled={!canManageSettings}
                        maxLength={2}
                        className="flex-1 px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                      />
                      <div className="text-4xl">{serverIcon || "🚀"}</div>
                    </div>
                  </div>

                  {/* Server Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Server Name
                    </label>
                    <input
                      type="text"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      disabled={!canManageSettings}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={serverDescription}
                      onChange={(e) => setServerDescription(e.target.value)}
                      disabled={!canManageSettings}
                      maxLength={500}
                      rows={4}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-purple-500 focus:outline-none disabled:opacity-50 resize-none"
                      placeholder="Describe your server..."
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {serverDescription.length}/500
                    </p>
                  </div>

                  {/* Server ID */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Server ID
                    </label>
                    <input
                      type="text"
                      value={server.id}
                      disabled
                      className="w-full px-4 py-2 bg-slate-700 text-slate-400 rounded border border-slate-600 font-mono text-sm disabled:opacity-50"
                    />
                  </div>

                  {/* Server Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    {[
                      { label: "Members", value: server.members.length },
                      { label: "Channels", value: server.channels.length },
                      { label: "Roles", value: server.roles?.length || 0 },
                      {
                        label: "Created",
                        value: new Date(server.createdAt).toLocaleDateString(),
                      },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="bg-slate-700 rounded p-3 text-center"
                      >
                        <p className="text-slate-400 text-xs mb-1">
                          {stat.label}
                        </p>
                        <p className="text-white font-bold text-lg">
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              {isOwner && (
                <div className="border-t border-slate-700 pt-6">
                  <h3 className="text-lg font-semibold text-red-400 mb-4">
                    Danger Zone
                  </h3>
                  <button
                    onClick={onDeleteServer}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded flex items-center justify-center gap-2 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete Server
                  </button>
                  <p className="text-xs text-slate-400 mt-2">
                    This action cannot be undone. All data will be permanently
                    deleted.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === "roles" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Server Roles ({server.roles?.length || 0})
                </h3>
                {canManageSettings && (
                  <button className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-semibold transition">
                    <Plus className="w-4 h-4" />
                    Add Role
                  </button>
                )}
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {server.roles && server.roles.length > 0 ? (
                  server.roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between bg-slate-700 rounded p-4"
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
                      {canManageSettings && (
                        <button className="text-slate-400 hover:text-white transition">
                          ⚙️
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-8">
                    No roles created yet
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Channels Tab */}
          {activeTab === "channels" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Channels ({server.channels.length})
                </h3>
                {canManageSettings && (
                  <button className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-semibold transition">
                    <Plus className="w-4 h-4" />
                    Add Channel
                  </button>
                )}
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {server.channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between bg-slate-700 rounded p-4"
                  >
                    <div>
                      <p className="text-white font-semibold">
                        #{channel.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {channel.messages.length} messages
                      </p>
                    </div>
                    {canManageSettings && (
                      <button className="text-slate-400 hover:text-white transition">
                        ⚙️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Members ({server.members.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {server.memberRoles?.map((member) => {
                  const memberRoles = server.roles?.filter((r) =>
                    member.roleIds.includes(r.id)
                  ) || [];
                  return (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between bg-slate-700 rounded p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {member.userId.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-semibold">
                            {member.userId}
                          </p>
                          {memberRoles.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {memberRoles.slice(0, 3).map((role) => (
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
                            </div>
                          )}
                        </div>
                      </div>
                      {canManageSettings && (
                        <button className="text-slate-400 hover:text-white transition">
                          ⚙️
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Invites Tab */}
          {activeTab === "invites" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Active Invites
                </h3>
                {canManageSettings && (
                  <button className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-semibold transition">
                    <Plus className="w-4 h-4" />
                    Create Invite
                  </button>
                )}
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {server.invites && server.invites.length > 0 ? (
                  server.invites
                    .filter((inv) => inv.active)
                    .map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between bg-slate-700 rounded p-4"
                      >
                        <div className="flex-1">
                          <p className="text-white font-mono text-sm mb-1">
                            chat.byteptr.xyz/invite/{invite.id}
                          </p>
                          <p className="text-xs text-slate-400">
                            {invite.uses}
                            {invite.maxUses ? `/${invite.maxUses}` : ""} uses •
                            Created{" "}
                            {new Date(invite.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => copyInviteCode(invite.id)}
                          className="ml-2 p-2 text-slate-400 hover:text-white transition"
                        >
                          {copiedInvite === invite.id ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    ))
                ) : (
                  <p className="text-slate-400 text-center py-8">
                    No active invites
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Moderation Tab */}
          {activeTab === "moderation" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Moderation Settings
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      label: "Auto-moderation",
                      description: "Automatically filter inappropriate content",
                      enabled: false,
                    },
                    {
                      label: "Require Verification",
                      description: "New members must verify before chatting",
                      enabled: false,
                    },
                    {
                      label: "Message Logs",
                      description: "Keep audit log of deleted messages",
                      enabled: true,
                    },
                  ].map((setting) => (
                    <div
                      key={setting.label}
                      className="flex items-center justify-between bg-slate-700 rounded p-4"
                    >
                      <div>
                        <p className="text-white font-semibold">
                          {setting.label}
                        </p>
                        <p className="text-xs text-slate-400">
                          {setting.description}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!canManageSettings}
                          defaultChecked={setting.enabled}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 disabled:opacity-50" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-6 bg-slate-700 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded transition"
          >
            Cancel
          </button>
          {activeTab === "general" && canManageSettings && (
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
