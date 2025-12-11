"use client";

import { useState, useEffect } from "react";
import { Server, ServerRole, ServerMember } from "@/lib/types";
import { DEFAULT_PERMISSIONS, PERMISSION_DESCRIPTIONS } from "@/lib/permissions";

interface RoleManagerProps {
  server: Server | undefined;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onCreateRole: (name: string, color: string, permissions: string[]) => Promise<void>;
  onAssignRole: (userId: string, roleId: string) => Promise<void>;
  onRemoveRole: (userId: string, roleId: string) => Promise<void>;
}

export default function RoleManager({
  server,
  isOpen,
  isLoading,
  onClose,
  onCreateRole,
  onAssignRole,
  onRemoveRole,
}: RoleManagerProps) {
  const [tab, setTab] = useState<"roles" | "members">("roles");
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("#3b82f6");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newRoleName.trim()) {
      setError("Role name is required");
      return;
    }

    try {
      await onCreateRole(newRoleName.trim(), newRoleColor, selectedPermissions);
      setNewRoleName("");
      setNewRoleColor("#3b82f6");
      setSelectedPermissions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create role");
    }
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  if (!isOpen || !server) return null;

  const isOwner = server.ownerId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">⚙️ Manage Roles</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4">
            <button
              onClick={() => setTab("roles")}
              className={`px-4 py-2 font-semibold rounded transition ${
                tab === "roles"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Roles
            </button>
            <button
              onClick={() => setTab("members")}
              className={`px-4 py-2 font-semibold rounded transition ${
                tab === "members"
                  ? "bg-purple-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Members
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {tab === "roles" && (
            <div className="space-y-6">
              {/* Create New Role */}
              <div className="bg-slate-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Create New Role
                </h3>
                <form onSubmit={handleCreateRole} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Role Name
                    </label>
                    <input
                      type="text"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g., Moderator"
                      className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Role Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={newRoleColor}
                        onChange={(e) => setNewRoleColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                        disabled={isLoading}
                      />
                      <input
                        type="text"
                        value={newRoleColor}
                        onChange={(e) => setNewRoleColor(e.target.value)}
                        className="flex-1 px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white font-mono focus:outline-none focus:border-purple-500"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      Permissions
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(DEFAULT_PERMISSIONS).map(
                        ([key, permission]) => (
                          <label
                            key={permission}
                            className="flex items-center gap-3 p-2 bg-slate-600 rounded hover:bg-slate-500 cursor-pointer transition"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission)}
                              onChange={() => togglePermission(permission)}
                              className="w-4 h-4 rounded"
                              disabled={isLoading}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">
                                {key.replace(/_/g, " ")}
                              </p>
                              <p className="text-xs text-slate-400">
                                {PERMISSION_DESCRIPTIONS[permission]}
                              </p>
                            </div>
                          </label>
                        )
                      )}
                    </div>
                  </div>

                  {error && <p className="text-red-400 text-sm">{error}</p>}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition"
                  >
                    {isLoading ? "Creating..." : "Create Role"}
                  </button>
                </form>
              </div>

              {/* Existing Roles */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Server Roles
                </h3>
                <div className="space-y-2">
                  {server.roles?.map((role) => (
                    <div
                      key={role.id}
                      className="bg-slate-700 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: role.color || "#3b82f6" }}
                        />
                        <div>
                          <p className="font-semibold text-white">{role.name}</p>
                          <p className="text-xs text-slate-400">
                            {role.permissions.length} permissions
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "members" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Server Members
              </h3>
              <div className="space-y-2">
                {server.memberRoles?.map((member) => {
                  const memberRoles = server.roles?.filter((r) =>
                    member.roleIds.includes(r.id)
                  ) || [];
                  return (
                    <div
                      key={member.userId}
                      className="bg-slate-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">
                            {member.userId}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {memberRoles.map((role) => (
                              <span
                                key={role.id}
                                className="px-2 py-1 rounded text-xs font-semibold text-white"
                                style={{
                                  backgroundColor: role.color || "#3b82f6",
                                }}
                              >
                                {role.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
