interface User {
  id: string;
  username: string;
  avatar: string;
  displayName?: string;
  bio?: string;
  status?: "online" | "away" | "offline" | "dnd"; // do not disturb
  theme?: "dark" | "midnight" | "sunset" | "mint";
  font?: "sans" | "mono" | "serif";
  accentColor?: string;
}

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface Mention {
  userId: string;
  username: string;
  start: number;
  end: number;
}

interface MessageReply {
  messageId: string;
  authorId: string;
  authorUsername: string;
  content: string; // Preview of replied message
}

interface Message {
  id: string;
  author: User;
  content: string;
  timestamp: Date | string;
  reactions?: Record<string, Reaction>;
  isPinned?: boolean;
  attachments?: { name: string; size: number; type: string; url: string }[];
  links?: string[]; // URLs found in message content
  editedAt?: Date | string; // When message was last edited
  isEdited?: boolean; // Flag to show message was edited
  replyTo?: MessageReply; // Reply to another message
  mentions?: Mention[]; // @mentions in message
  voiceUrl?: string; // Voice message URL
}

interface DM {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string | Date;
  iv?: string;
  tag?: string;
}

interface FriendInvite {
  id: string;
  from: string;
  to: string;
  status: "pending" | "accepted" | "declined";
  timestamp: string;
}

interface Channel {
  id: string;
  name: string;
  messages: Message[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface ServerRole {
  id: string;
  serverId: string;
  name: string;
  color?: string;
  permissions: string[]; // Permission IDs
  createdAt: string;
}

interface ServerMember {
  userId: string;
  serverId: string;
  roleIds: string[]; // Role IDs for this server
  joinedAt: string;
}

interface Server {
  id: string;
  name: string;
  ownerId: string;
  description?: string;
  icon?: string;
  createdAt: string;
  members: string[]; // User IDs
  channels: Channel[];
  invites: Invite[];
  roles: ServerRole[];
  memberRoles: ServerMember[];
}

interface Invite {
  id: string;
  serverId: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  uses: number;
  active: boolean;
}

export type { User, Message, Channel, Server, Invite, ServerRole, ServerMember, Permission, DM, FriendInvite, Mention, MessageReply };
