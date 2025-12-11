import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { verifyToken, extractToken } from "@/lib/jwt";
import { Server, Invite, ServerRole, ServerMember } from "@/lib/db";
import { DEFAULT_ROLES, DEFAULT_PERMISSIONS } from "@/lib/permissions";
import crypto from "crypto";

function generateId(): string {
  return crypto.randomBytes(8).toString("hex");
}

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req.headers.get("authorization") || "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { name, description } = body;
      if (!name || !name.trim()) {
        return NextResponse.json(
          { error: "Server name is required" },
          { status: 400 }
        );
      }

      // Create default roles for the server
      const adminRoleId = generateId();
      const moderatorRoleId = generateId();
      const memberRoleId = generateId();

      const defaultRoles: ServerRole[] = [
        {
          id: adminRoleId,
          serverId: generateId(),
          name: DEFAULT_ROLES.ADMIN.name,
          color: DEFAULT_ROLES.ADMIN.color,
          permissions: DEFAULT_ROLES.ADMIN.permissions,
          createdAt: new Date().toISOString(),
        },
        {
          id: moderatorRoleId,
          serverId: generateId(),
          name: DEFAULT_ROLES.MODERATOR.name,
          color: DEFAULT_ROLES.MODERATOR.color,
          permissions: DEFAULT_ROLES.MODERATOR.permissions,
          createdAt: new Date().toISOString(),
        },
        {
          id: memberRoleId,
          serverId: generateId(),
          name: DEFAULT_ROLES.MEMBER.name,
          color: DEFAULT_ROLES.MEMBER.color,
          permissions: DEFAULT_ROLES.MEMBER.permissions,
          createdAt: new Date().toISOString(),
        },
      ];

      const db = getDatabase();
      const serverId = generateId();
      const server: Server = {
        id: serverId,
        name: name.trim(),
        description: description || "",
        ownerId: payload.id,
        icon: "🚀",
        createdAt: new Date().toISOString(),
        members: [payload.id],
        channels: [
          { id: "general", name: "general", messages: [] },
          { id: "introductions", name: "introductions", messages: [] },
          { id: "cute-stuff", name: "cute-stuff", messages: [] },
        ],
        invites: [],
        roles: defaultRoles.map((role) => ({
          ...role,
          serverId,
        })),
        memberRoles: [
          {
            userId: payload.id,
            serverId,
            roleIds: [adminRoleId], // Owner gets admin role
            joinedAt: new Date().toISOString(),
          },
        ],
      };

      const created = db.createServer(server);
      return NextResponse.json(
        { success: true, server: created },
        { status: 201 }
      );
    }

    if (action === "list") {
      const db = getDatabase();
      const servers = db.getUserServers(payload.id);
      return NextResponse.json({ success: true, servers });
    }

    if (action === "get") {
      const { serverId } = body;
      const db = getDatabase();
      const server = db.getServer(serverId);
      if (!server) {
        return NextResponse.json({ error: "Server not found" }, { status: 404 });
      }
      // Check if user is member
      if (!server.members.includes(payload.id) && server.ownerId !== payload.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json({ success: true, server });
    }

    if (action === "createInvite") {
      const { serverId } = body;
      const db = getDatabase();
      const server = db.getServer(serverId);
      if (!server) {
        return NextResponse.json({ error: "Server not found" }, { status: 404 });
      }
      // Only owner can create invites
      if (server.ownerId !== payload.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const invite: Invite = {
        id: generateId(),
        serverId,
        createdBy: payload.id,
        createdAt: new Date().toISOString(),
        maxUses: 0, // Unlimited
        uses: 0,
        active: true,
      };

      const created = db.createInvite(invite);
      return NextResponse.json(
        { success: true, invite: created },
        { status: 201 }
      );
    }

    if (action === "joinWithInvite") {
      const { inviteId } = body;
      const db = getDatabase();
      const invite = db.getInvite(inviteId);
      if (!invite || !invite.active) {
        return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
      }

      const server = db.getServer(invite.serverId);
      if (!server) {
        return NextResponse.json({ error: "Server not found" }, { status: 404 });
      }

      if (server.members.includes(payload.id)) {
        return NextResponse.json(
          { error: "Already a member" },
          { status: 400 }
        );
      }

      // Use the invite
      db.useInvite(inviteId);

      // Add user to server
      const updated = db.updateServer(invite.serverId, {
        ...server,
        members: [...server.members, payload.id],
      });

      return NextResponse.json({ success: true, server: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
