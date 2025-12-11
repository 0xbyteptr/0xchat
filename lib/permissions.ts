// Default permissions available in the system
export const DEFAULT_PERMISSIONS = {
  // Server management
  MANAGE_SERVER: "manage_server",
  MANAGE_ROLES: "manage_roles",
  MANAGE_CHANNELS: "manage_channels",
  MANAGE_MEMBERS: "manage_members",
  KICK_MEMBERS: "kick_members",
  BAN_MEMBERS: "ban_members",

  // Messaging
  SEND_MESSAGES: "send_messages",
  DELETE_MESSAGES: "delete_messages",
  MANAGE_MESSAGES: "manage_messages",
  PIN_MESSAGES: "pin_messages",

  // Invites
  CREATE_INVITES: "create_invites",
  MANAGE_INVITES: "manage_invites",
};

export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  manage_server: "Manage server name, description, and settings",
  manage_roles: "Create, edit, and delete roles",
  manage_channels: "Create, edit, and delete channels",
  manage_members: "Manage member roles and permissions",
  kick_members: "Remove members from the server",
  ban_members: "Ban members from the server",
  send_messages: "Send messages in channels",
  delete_messages: "Delete own messages",
  manage_messages: "Delete and manage any messages",
  pin_messages: "Pin important messages",
  create_invites: "Create server invites",
  manage_invites: "Manage and revoke invites",
};

// Default roles
export const DEFAULT_ROLES = {
  ADMIN: {
    name: "Admin",
    color: "#ef4444",
    permissions: [
      DEFAULT_PERMISSIONS.MANAGE_SERVER,
      DEFAULT_PERMISSIONS.MANAGE_ROLES,
      DEFAULT_PERMISSIONS.MANAGE_CHANNELS,
      DEFAULT_PERMISSIONS.MANAGE_MEMBERS,
      DEFAULT_PERMISSIONS.KICK_MEMBERS,
      DEFAULT_PERMISSIONS.BAN_MEMBERS,
      DEFAULT_PERMISSIONS.SEND_MESSAGES,
      DEFAULT_PERMISSIONS.DELETE_MESSAGES,
      DEFAULT_PERMISSIONS.MANAGE_MESSAGES,
      DEFAULT_PERMISSIONS.PIN_MESSAGES,
      DEFAULT_PERMISSIONS.CREATE_INVITES,
      DEFAULT_PERMISSIONS.MANAGE_INVITES,
    ],
  },
  MODERATOR: {
    name: "Moderator",
    color: "#f59e0b",
    permissions: [
      DEFAULT_PERMISSIONS.MANAGE_CHANNELS,
      DEFAULT_PERMISSIONS.MANAGE_MEMBERS,
      DEFAULT_PERMISSIONS.KICK_MEMBERS,
      DEFAULT_PERMISSIONS.SEND_MESSAGES,
      DEFAULT_PERMISSIONS.DELETE_MESSAGES,
      DEFAULT_PERMISSIONS.MANAGE_MESSAGES,
      DEFAULT_PERMISSIONS.PIN_MESSAGES,
      DEFAULT_PERMISSIONS.CREATE_INVITES,
    ],
  },
  MEMBER: {
    name: "Member",
    color: "#3b82f6",
    permissions: [
      DEFAULT_PERMISSIONS.SEND_MESSAGES,
      DEFAULT_PERMISSIONS.DELETE_MESSAGES,
      DEFAULT_PERMISSIONS.CREATE_INVITES,
    ],
  },
};

export function hasPermission(
  userPermissions: string[],
  permission: string
): boolean {
  return userPermissions.includes(permission);
}

export function hasAnyPermission(
  userPermissions: string[],
  permissions: string[]
): boolean {
  return permissions.some((p) => userPermissions.includes(p));
}

export function hasAllPermissions(
  userPermissions: string[],
  permissions: string[]
): boolean {
  return permissions.every((p) => userPermissions.includes(p));
}
