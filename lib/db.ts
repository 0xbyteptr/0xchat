// Direct Message (DM) and Friend Invite Interfaces
interface DM {
  id: string;
  from: string; // user id
  to: string;   // user id
  content: string;
  timestamp: string;
  iv?: string;
  tag?: string;
}

interface FriendInvite {
  id: string;
  from: string; // user id
  to: string;   // user id
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

interface DMsData {
  [key: string]: DM[]; // key: `${userId1}-${userId2}` (sorted)
}

interface FriendInvitesData {
  [key: string]: FriendInvite[]; // key: user id
}
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

interface User {
  id: string;
  username: string;
  password: string;
  avatar: string;
  createdAt: string;
  displayName?: string;
  bio?: string;
  status?: string;
  theme?: "dark" | "midnight" | "sunset" | "mint";
  font?: "sans" | "mono" | "serif";
  accentColor?: string;
}

interface Message {
  id: string;
  author: {
    id: string;
  };
  content: string;
  timestamp: string;
  iv?: string;
  tag?: string;
}

interface Channel {
  id: string;
  name: string;
  messages: Message[];
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
  members: string[];
  channels: Channel[];
  invites: Invite[];
  roles?: ServerRole[];
  memberRoles?: ServerMember[];
}

interface UsersData {
  [key: string]: User;
}

interface MessagesData {
  [key: string]: Message[];
}

interface ServersData {
  [key: string]: Server;
}

const DATABASE_TYPE = process.env.DATABASE_TYPE || "json";
const DATA_DIR = path.join(process.cwd(), "data");

// JSON Database Implementation
class JSONDatabase {
    private dmsFile = path.join(DATA_DIR, "dms.json");
    private invitesFile = path.join(DATA_DIR, "friend_invites.json");
  private usersFile = path.join(DATA_DIR, "users.json");
  private messagesFile = path.join(DATA_DIR, "messages.json");
  private serversFile = path.join(DATA_DIR, "servers.json");

  private readJsonFileSafe<T>(filePath: string, fallback: T): T {
    try {
      if (!fs.existsSync(filePath)) return fallback;
      const raw = fs.readFileSync(filePath, "utf-8");
      if (!raw.trim()) return fallback;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`Failed to parse ${path.basename(filePath)}, using fallback`, err);
      return fallback;
    }
  }

  constructor() {
    this.initializeIfEmpty();
  }

  private initializeIfEmpty() {
    // Check if dms.json exists
    if (!fs.existsSync(this.dmsFile)) {
      fs.writeFileSync(this.dmsFile, JSON.stringify({}, null, 2));
    }
    // Check if friend_invites.json exists
    if (!fs.existsSync(this.invitesFile)) {
      fs.writeFileSync(this.invitesFile, JSON.stringify({}, null, 2));
    }
    try {
      this.ensureDataDir();
      // Check if users.json exists and has demo user
      if (!fs.existsSync(this.usersFile)) {
        const demoHash = bcrypt.hashSync("password", 10);
        const usersData: UsersData = {
          demo: {
            id: "demo",
            username: "demo",
            password: demoHash,
            avatar: "😸",
            createdAt: new Date().toISOString(),
            displayName: "demo",
            bio: "",
            status: "",
            theme: "midnight",
            font: "sans",
            accentColor: "#a855f7",
          },
        };
        fs.writeFileSync(this.usersFile, JSON.stringify(usersData, null, 2));
      }

      // Check if messages.json exists
      if (!fs.existsSync(this.messagesFile)) {
        const messagesData: MessagesData = {
          general: [
            {
              id: "1",
              author: { id: "demo" },
              content: "Meow! Welcome to CatboyChat! 💕",
              timestamp: new Date().toISOString(),
            },
          ],
          introductions: [
            {
              id: "2",
              author: { id: "demo" },
              content: "Introduce yourself here! Meow~",
              timestamp: new Date().toISOString(),
            },
          ],
          "cute-stuff": [
            {
              id: "3",
              author: { id: "demo" },
              content: "Share cute things here! 😻",
              timestamp: new Date().toISOString(),
            },
          ],
        };
        fs.writeFileSync(this.messagesFile, JSON.stringify(messagesData, null, 2));
      }

      // Check if servers.json exists
      if (!fs.existsSync(this.serversFile)) {
        const serversData: ServersData = {};
        fs.writeFileSync(this.serversFile, JSON.stringify(serversData, null, 2));
      }
    } catch (error) {
      console.error("Error initializing database:", error);
      // Continue anyway - operations may still work with existing data
    }
  }

  // DMs
  getDMs(userId1: string, userId2: string): DM[] {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.dmsFile)) return [];
      const data: DMsData = JSON.parse(fs.readFileSync(this.dmsFile, 'utf-8'));
      const key = [userId1, userId2].sort().join('-');
      const { decryptMessage } = require('./crypto');
      return (data[key] || []).map((dm: any) => {
        if (dm.content && dm.iv && dm.tag) {
          try {
            return {
              ...dm,
              content: decryptMessage({
                iv: dm.iv,
                encrypted: dm.content,
                tag: dm.tag,
              }),
            };
          } catch {
            return dm;
          }
        }
        return dm;
      });
    } catch {
      return [];
    }
  }

  addDM(userId1: string, userId2: string, dm: DM): DM {
    try {
      this.ensureDataDir();
      let data: DMsData = {};
      if (fs.existsSync(this.dmsFile)) {
        data = JSON.parse(fs.readFileSync(this.dmsFile, 'utf-8'));
      }
      const key = [userId1, userId2].sort().join('-');
      if (!data[key]) data[key] = [];
      const { encryptMessage } = require('./crypto');
      const encrypted = encryptMessage(dm.content);
      const minimalDM = {
        id: dm.id,
        from: dm.from,
        to: dm.to,
        content: encrypted.encrypted,
        timestamp: dm.timestamp,
        iv: encrypted.iv,
        tag: encrypted.tag,
      };
      data[key].push(minimalDM);
      fs.writeFileSync(this.dmsFile, JSON.stringify(data, null, 2));
      return minimalDM;
    } catch (error) {
      console.error('Error adding DM:', error);
      throw error;
    }
  }

  getDMConversations(userId: string): { otherUserId: string; messages: DM[] }[] {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.dmsFile)) return [];

      const data: DMsData = JSON.parse(fs.readFileSync(this.dmsFile, 'utf-8'));
      const { decryptMessage } = require('./crypto');

      const conversations: { otherUserId: string; messages: DM[] }[] = [];

      Object.entries(data).forEach(([key, msgs]) => {
        const [a, b] = key.split('-');
        if (a !== userId && b !== userId) return;

        const otherUserId = a === userId ? b : a;

        const decrypted = msgs.map((dm: any) => {
          if (dm.content && dm.iv && dm.tag) {
            try {
              return {
                ...dm,
                content: decryptMessage({ iv: dm.iv, encrypted: dm.content, tag: dm.tag }),
              };
            } catch {
              return dm;
            }
          }
          return dm;
        });

        conversations.push({ otherUserId, messages: decrypted });
      });

      return conversations;
    } catch (error) {
      console.error('Error reading DM conversations:', error);
      return [];
    }
  }

  // Friend Invites
  getFriendInvites(userId: string): FriendInvite[] {
    try {
      this.ensureDataDir();
      const data: FriendInvitesData = this.readJsonFileSafe(this.invitesFile, {});
      return data[userId] || [];
    } catch {
      return [];
    }
  }

  addFriendInvite(invite: FriendInvite): FriendInvite {
    try {
      this.ensureDataDir();
      let data: FriendInvitesData = this.readJsonFileSafe(this.invitesFile, {});
      if (!data[invite.to]) data[invite.to] = [];
      data[invite.to].push(invite);
      fs.writeFileSync(this.invitesFile, JSON.stringify(data, null, 2));
      return invite;
    } catch (error) {
      console.error('Error adding friend invite:', error);
      throw error;
    }
  }

  findFriendInviteById(inviteId: string): { invite: FriendInvite | null; ownerId: string | null } {
    try {
      this.ensureDataDir();
      const data: FriendInvitesData = this.readJsonFileSafe(this.invitesFile, {});
      for (const [ownerId, invites] of Object.entries(data)) {
        const found = invites.find((i: FriendInvite) => i.id === inviteId);
        if (found) return { invite: found, ownerId };
      }
      return { invite: null, ownerId: null };
    } catch (error) {
      console.error('Error finding friend invite:', error);
      return { invite: null, ownerId: null };
    }
  }

  updateFriendInviteStatusById(inviteId: string, userId: string, status: 'accepted' | 'declined'): boolean {
    try {
      this.ensureDataDir();
      const data: FriendInvitesData = this.readJsonFileSafe(this.invitesFile, {});
      for (const [ownerId, invites] of Object.entries(data)) {
        const idx = invites.findIndex((i: FriendInvite) => i.id === inviteId);
        if (idx >= 0) {
          const invite = invites[idx];
          if (invite.to !== userId) return false; // only recipient can change
          invites[idx] = { ...invite, status };
          fs.writeFileSync(this.invitesFile, JSON.stringify(data, null, 2));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error updating friend invite status:', error);
      return false;
    }
  }

  updateFriendInviteStatus(userId: string, inviteId: string, status: 'accepted' | 'declined'): boolean {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.invitesFile)) return false;
      const data: FriendInvitesData = JSON.parse(fs.readFileSync(this.invitesFile, 'utf-8'));
      if (!data[userId]) return false;
      const invite = data[userId].find((i: FriendInvite) => i.id === inviteId);
      if (!invite) return false;
      invite.status = status;
      fs.writeFileSync(this.invitesFile, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error updating friend invite status:', error);
      return false;
    }
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  getUser(username: string): User | null {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.usersFile)) {
        return null;
      }
      const data: UsersData = JSON.parse(
        fs.readFileSync(this.usersFile, "utf-8")
      );
      return data[username] || null;
    } catch {
      return null;
    }
  }

  createUser(user: User): User {
    try {
      this.ensureDataDir();
      let data: UsersData = {};
      if (fs.existsSync(this.usersFile)) {
        data = JSON.parse(fs.readFileSync(this.usersFile, "utf-8"));
      }
      const userWithDefaults: User = {
        displayName: user.username,
        bio: "",
        status: "",
        theme: "midnight",
        font: "sans",
        accentColor: "#a855f7", // purple-500
        ...user,
      };
      data[user.username] = userWithDefaults;
      fs.writeFileSync(this.usersFile, JSON.stringify(data, null, 2));
      return userWithDefaults;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  updateUser(username: string, updates: Partial<User>): User | null {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.usersFile)) {
        return null;
      }
      const data: UsersData = JSON.parse(fs.readFileSync(this.usersFile, "utf-8"));
      if (!data[username]) return null;
      data[username] = { ...data[username], ...updates };
      fs.writeFileSync(this.usersFile, JSON.stringify(data, null, 2));
      return data[username];
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  getChannelMessages(channel: string): Message[] {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.messagesFile)) {
        return [];
      }
      const data: MessagesData = JSON.parse(
        fs.readFileSync(this.messagesFile, "utf-8")
      );
      const { decryptMessage } = require('./crypto');
      return (data[channel] || []).map((msg: any) => {
        let authorId = msg.author && typeof msg.author === 'object' ? msg.author.id : msg.author;
        if (msg.content && msg.iv && msg.tag) {
          try {
            return {
              id: msg.id,
              author: { id: authorId },
              content: decryptMessage({
                iv: msg.iv,
                encrypted: msg.content,
                tag: msg.tag,
              }),
              timestamp: msg.timestamp,
              iv: msg.iv,
              tag: msg.tag,
            };
          } catch {
            return {
              id: msg.id,
              author: { id: authorId },
              content: msg.content,
              timestamp: msg.timestamp,
              iv: msg.iv,
              tag: msg.tag,
            };
          }
        }
        return {
          id: msg.id,
          author: { id: authorId },
          content: msg.content,
          timestamp: msg.timestamp,
          iv: msg.iv,
          tag: msg.tag,
        };
      });
    } catch {
      return [];
    }
  }

  addMessage(channel: string, message: Message): Message {
    try {
      this.ensureDataDir();
      let data: MessagesData = {};
      if (fs.existsSync(this.messagesFile)) {
        data = JSON.parse(fs.readFileSync(this.messagesFile, "utf-8"));
      }
      if (!data[channel]) {
        data[channel] = [];
      }
      // Encrypt message content
      const { encryptMessage } = require('./crypto');
      const encrypted = encryptMessage(message.content);
      const minimalMessage = {
        id: message.id,
        author: { id: message.author.id },
        content: encrypted.encrypted,
        timestamp: message.timestamp,
        iv: encrypted.iv,
        tag: encrypted.tag,
      };
      data[channel].push(minimalMessage);
      fs.writeFileSync(this.messagesFile, JSON.stringify(data, null, 2));
      return minimalMessage;
    } catch (error) {
      console.error("Error adding message:", error);
      throw error;
    }
  }

  getAllChannels(): string[] {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.messagesFile)) {
        return [];
      }
      const data: MessagesData = JSON.parse(
        fs.readFileSync(this.messagesFile, "utf-8")
      );
      return Object.keys(data);
    } catch {
      return [];
    }
  }

  // Server methods
  createServer(server: Server): Server {
    try {
      this.ensureDataDir();
      let data: ServersData = {};
      if (fs.existsSync(this.serversFile)) {
        data = JSON.parse(fs.readFileSync(this.serversFile, "utf-8"));
      }
      data[server.id] = server;
      fs.writeFileSync(this.serversFile, JSON.stringify(data, null, 2));
      return server;
    } catch (error) {
      console.error("Error creating server:", error);
      throw error;
    }
  }

  getServer(serverId: string): Server | null {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.serversFile)) {
        return null;
      }
      const data: ServersData = JSON.parse(
        fs.readFileSync(this.serversFile, "utf-8")
      );
      return data[serverId] || null;
    } catch {
      return null;
    }
  }

  getUserServers(userId: string): Server[] {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.serversFile)) {
        return [];
      }
      const data: ServersData = JSON.parse(
        fs.readFileSync(this.serversFile, "utf-8")
      );
      return Object.values(data).filter(
        (s) => s.ownerId === userId || s.members.includes(userId)
      );
    } catch {
      return [];
    }
  }

  updateServer(serverId: string, updates: Partial<Server>): Server | null {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.serversFile)) {
        return null;
      }
      const data: ServersData = JSON.parse(
        fs.readFileSync(this.serversFile, "utf-8")
      );
      if (!data[serverId]) {
        return null;
      }
      data[serverId] = { ...data[serverId], ...updates };
      fs.writeFileSync(this.serversFile, JSON.stringify(data, null, 2));
      return data[serverId];
    } catch (error) {
      console.error("Error updating server:", error);
      throw error;
    }
  }

  createInvite(invite: Invite): Invite {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.serversFile)) {
        throw new Error("Servers file not found");
      }
      const data: ServersData = JSON.parse(
        fs.readFileSync(this.serversFile, "utf-8")
      );
      if (!data[invite.serverId]) {
        throw new Error("Server not found");
      }
      data[invite.serverId].invites.push(invite);
      fs.writeFileSync(this.serversFile, JSON.stringify(data, null, 2));
      return invite;
    } catch (error) {
      console.error("Error creating invite:", error);
      throw error;
    }
  }

  getInvite(inviteId: string): Invite | null {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.serversFile)) {
        return null;
      }
      const data: ServersData = JSON.parse(
        fs.readFileSync(this.serversFile, "utf-8")
      );
      for (const server of Object.values(data)) {
        const invite = server.invites.find((i) => i.id === inviteId);
        if (invite) return invite;
      }
      return null;
    } catch {
      return null;
    }
  }

  useInvite(inviteId: string): boolean {
    try {
      this.ensureDataDir();
      if (!fs.existsSync(this.serversFile)) {
        return false;
      }
      const data: ServersData = JSON.parse(
        fs.readFileSync(this.serversFile, "utf-8")
      );
      for (const server of Object.values(data)) {
        const invite = server.invites.find((i) => i.id === inviteId);
        if (invite && invite.active) {
          invite.uses++;
          if (invite.maxUses && invite.uses >= invite.maxUses) {
            invite.active = false;
          }
          fs.writeFileSync(this.serversFile, JSON.stringify(data, null, 2));
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }
}

// Abstract Database Interface for future implementations
abstract class Database {
  abstract getUser(username: string): User | null;
  abstract createUser(user: User): User;
  abstract updateUser(username: string, updates: Partial<User>): User | null;
  abstract getChannelMessages(channel: string): Message[];
  abstract addMessage(channel: string, message: Message): Message;
  abstract getAllChannels(): string[];
  // Direct messages
  abstract getDMs(userId1: string, userId2: string): DM[];
  abstract addDM(userId1: string, userId2: string, dm: DM): DM;
  abstract getDMConversations(userId: string): { otherUserId: string; messages: DM[] }[];
  // Friend invites
  abstract getFriendInvites(userId: string): FriendInvite[];
  abstract addFriendInvite(invite: FriendInvite): FriendInvite;
  abstract findFriendInviteById(inviteId: string): { invite: FriendInvite | null; ownerId: string | null };
  abstract updateFriendInviteStatusById(inviteId: string, userId: string, status: 'accepted' | 'declined'): boolean;
  abstract updateFriendInviteStatus(userId: string, inviteId: string, status: 'accepted' | 'declined'): boolean;
  abstract createServer(server: Server): Server;
  abstract getServer(serverId: string): Server | null;
  abstract getUserServers(userId: string): Server[];
  abstract updateServer(serverId: string, updates: Partial<Server>): Server | null;
  abstract createInvite(invite: Invite): Invite;
  abstract getInvite(inviteId: string): Invite | null;
  abstract useInvite(inviteId: string): boolean;
}

// Factory function to get appropriate database implementation
let dbInstance: Database | null = null;

export function getDatabase(): Database {
  if (!dbInstance) {
    if (DATABASE_TYPE === "json") {
      dbInstance = new JSONDatabase();
    } else if (DATABASE_TYPE === "mongodb") {
      // Future: implement MongoDB
      throw new Error("MongoDB not yet implemented");
    } else if (DATABASE_TYPE === "postgres") {
      // Future: implement PostgreSQL
      throw new Error("PostgreSQL not yet implemented");
    } else {
      throw new Error(`Unknown database type: ${DATABASE_TYPE}`);
    }
  }
  return dbInstance;
}

export type { User, Message, UsersData, MessagesData, Server, Invite, Channel, ServerRole, ServerMember, DM, FriendInvite };
