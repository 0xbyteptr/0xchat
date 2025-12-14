import { NextRequest, NextResponse } from "next/server";
import { corsJson } from "@/lib/cors";
import { getDatabase } from "@/lib/db";
import { verifyToken, extractToken } from "@/lib/jwt";
import { Server, Invite, ServerRole, ServerMember } from "@/lib/db";
import { DEFAULT_ROLES, DEFAULT_PERMISSIONS } from "@/lib/permissions";
import crypto from "crypto";

function generateId(): string {
  return crypto.randomBytes(8).toString("hex");
}

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req.headers.get("authorization") || "");
    if (!token) {
      return corsJson({ error: "Unauthorized" }, { status: 401 }, req.headers.get("origin") || undefined);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return corsJson({ error: "Invalid token" }, { status: 401 }, req.headers.get("origin") || undefined);
    }

    const db = await getDatabase();
    const userId = (payload as any).id;
    const servers = await db.getUserServers(userId);

    return corsJson({ servers: servers || [], success: true }, undefined, req.headers.get("origin") || undefined);
  } catch (error) {
    console.error("Failed to fetch servers", error);
    return NextResponse.json(
      { error: "Failed to fetch servers" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  return corsJson({}, { status: 204 }, req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req.headers.get("authorization") || "");
    if (!token) {
      return corsJson({ error: "Unauthorized" }, { status: 401 }, req.headers.get("origin") || undefined);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return corsJson({ error: "Invalid token" }, { status: 401 }, req.headers.get("origin") || undefined);
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { name, description, icon } = body;
      if (!name || !name.trim()) {
        return corsJson({ error: "Server name is required" }, { status: 400 }, req.headers.get("origin") || undefined);
      }

      const db = await getDatabase();
      const serverId = generateId();

      // Create default roles for the server
      const adminRoleId = generateId();
      const moderatorRoleId = generateId();
      const memberRoleId = generateId();

      const defaultRoles: ServerRole[] = [
        {
          id: adminRoleId,
          serverId: serverId,
          name: DEFAULT_ROLES.ADMIN.name,
          color: DEFAULT_ROLES.ADMIN.color,
          permissions: DEFAULT_ROLES.ADMIN.permissions,
          createdAt: new Date().toISOString(),
        },
        {
          id: moderatorRoleId,
          serverId: serverId,
          name: DEFAULT_ROLES.MODERATOR.name,
          color: DEFAULT_ROLES.MODERATOR.color,
          permissions: DEFAULT_ROLES.MODERATOR.permissions,
          createdAt: new Date().toISOString(),
        },
        {
          id: memberRoleId,
          serverId: serverId,
          name: DEFAULT_ROLES.MEMBER.name,
          color: DEFAULT_ROLES.MEMBER.color,
          permissions: DEFAULT_ROLES.MEMBER.permissions,
          createdAt: new Date().toISOString(),
        },
      ];
      const server: Server = {
        id: serverId,
        name: name.trim(),
        description: description || "",
        ownerId: payload.id,
        icon: icon || "🚀",
        createdAt: new Date().toISOString(),
        members: [payload.id],
        channels: [
          { id: "general", name: "general", messages: [] },
          { id: "introductions", name: "introductions", messages: [] },
          { id: "cute-stuff", name: "cute-stuff", messages: [] },
        ],
        invites: [],
        roles: defaultRoles,
        memberRoles: [
          {
            userId: payload.id,
            serverId,
            roleIds: [adminRoleId], // Owner gets admin role
            joinedAt: new Date().toISOString(),
          },
        ],
      };

      const created = await db.createServer(server);
      return corsJson({ success: true, server: created }, { status: 201 }, req.headers.get("origin") || undefined);
    }

    if (action === "list") {
      const db = await getDatabase();
      const servers = await db.getUserServers(payload.id);
      return corsJson({ success: true, servers }, undefined, req.headers.get("origin") || undefined);
    }

    if (action === "get") {
      const { serverId } = body;
      const db = await getDatabase();
      const server = await db.getServer(serverId);
      if (!server) {
        return corsJson({ error: "Server not found" }, { status: 404 }, req.headers.get("origin") || undefined);
      }
      // Check if user is member
      if (!server.members.includes(payload.id) && server.ownerId !== payload.id) {
        return corsJson({ error: "Forbidden" }, { status: 403 }, req.headers.get("origin") || undefined);
      }
      return corsJson({ success: true, server }, undefined, req.headers.get("origin") || undefined);
    }

    if (action === "createInvite") {
      const { serverId } = body;
      const db = await getDatabase();
      const server = await db.getServer(serverId);
      if (!server) {
        return corsJson({ error: "Server not found" }, { status: 404 }, req.headers.get("origin") || undefined);
      }
      // Only owner can create invites
      if (server.ownerId !== payload.id) {
        return corsJson({ error: "Forbidden" }, { status: 403 }, req.headers.get("origin") || undefined);
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

      const created = await db.createInvite(invite);
      return corsJson({ success: true, invite: created }, { status: 201 }, req.headers.get("origin") || undefined);
    }

    if (action === "joinWithInvite") {
      const { inviteId } = body;
      const db = await getDatabase();
      const invite = await db.getInvite(inviteId);
      if (!invite || !invite.active) {
        return corsJson({ error: "Invalid invite" }, { status: 400 }, req.headers.get("origin") || undefined);
      }

      const server = await db.getServer(invite.serverId);
      if (!server) {
        return corsJson({ error: "Server not found" }, { status: 404 }, req.headers.get("origin") || undefined);
      }

      if (server.members.includes(payload.id)) {
        return corsJson({ error: "Already a member" }, { status: 400 }, req.headers.get("origin") || undefined);
      }

      // Use the invite
      await db.useInvite(inviteId);

      // Add user to server
      const updated = await db.updateServer(invite.serverId, {
        ...server,
        members: [...server.members, payload.id],
      });

      return corsJson({ success: true, server: updated }, undefined, req.headers.get("origin") || undefined);
    }

    return corsJson({ error: "Invalid action" }, { status: 400 }, req.headers.get("origin") || undefined);
  } catch (error) {
    console.error("Server error:", error);
    return corsJson({ error: "Internal server error" }, { status: 500 }, req.headers.get("origin") || undefined);
  }
}
