import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { verifyToken, extractToken } from "@/lib/jwt";
import { ServerRole, ServerMember } from "@/lib/db";
import { hasPermission, DEFAULT_PERMISSIONS } from "@/lib/permissions";
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
    const { action, serverId } = body;

    const db = await getDatabase();
    const server = await db.getServer(serverId);
    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Check if user is server owner or has manage_roles permission
    const isOwner = server.ownerId === payload.id;
    const userMemberRole = server.memberRoles?.find(
      (mr) => mr.userId === payload.id
    );
    const userRoles = server.roles?.filter((r) =>
      userMemberRole?.roleIds.includes(r.id)
    ) || [];
    const userPermissions = userRoles.flatMap((r) => r.permissions);

    const canManageRoles =
      isOwner || hasPermission(userPermissions, DEFAULT_PERMISSIONS.MANAGE_ROLES);

    if (action === "createRole") {
      if (!canManageRoles) {
        return NextResponse.json(
          { error: "You don't have permission to manage roles" },
          { status: 403 }
        );
      }

      const { name, color, permissions } = body;
      if (!name || !name.trim()) {
        return NextResponse.json(
          { error: "Role name is required" },
          { status: 400 }
        );
      }

      const newRole: ServerRole = {
        id: generateId(),
        serverId,
        name: name.trim(),
        color: color || "#3b82f6",
        permissions: permissions || [],
        createdAt: new Date().toISOString(),
      };

      if (!server.roles) server.roles = [];
      server.roles.push(newRole);
      await db.updateServer(serverId, { roles: server.roles });

      return NextResponse.json({ success: true, role: newRole }, { status: 201 });
    }

    if (action === "assignRole") {
      if (!canManageRoles) {
        return NextResponse.json(
          { error: "You don't have permission to manage roles" },
          { status: 403 }
        );
      }

      const { userId, roleId } = body;
      if (!userId || !roleId) {
        return NextResponse.json(
          { error: "userId and roleId are required" },
          { status: 400 }
        );
      }

      // Check if role exists
      const role = server.roles?.find((r) => r.id === roleId);
      if (!role) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }

      // Find or create member role entry
      if (!server.memberRoles) server.memberRoles = [];
      let memberRole = server.memberRoles.find((mr) => mr.userId === userId);
      if (!memberRole) {
        memberRole = {
          userId,
          serverId,
          roleIds: [],
          joinedAt: new Date().toISOString(),
        };
        server.memberRoles.push(memberRole);
      }

      // Add role if not already assigned
      if (!memberRole.roleIds.includes(roleId)) {
        memberRole.roleIds.push(roleId);
      }

      await db.updateServer(serverId, { memberRoles: server.memberRoles });

      return NextResponse.json({
        success: true,
        message: "Role assigned",
        memberRole,
      });
    }

    if (action === "removeRole") {
      if (!canManageRoles) {
        return NextResponse.json(
          { error: "You don't have permission to manage roles" },
          { status: 403 }
        );
      }

      const { userId, roleId } = body;
      if (!userId || !roleId) {
        return NextResponse.json(
          { error: "userId and roleId are required" },
          { status: 400 }
        );
      }

      const memberRole = server.memberRoles?.find(
        (mr) => mr.userId === userId
      );
      if (!memberRole) {
        return NextResponse.json(
          { error: "Member role not found" },
          { status: 404 }
        );
      }

      memberRole.roleIds = memberRole.roleIds.filter((id) => id !== roleId);
      await db.updateServer(serverId, { memberRoles: server.memberRoles });

      return NextResponse.json({
        success: true,
        message: "Role removed",
        memberRole,
      });
    }

    if (action === "getRoles") {
      return NextResponse.json({
        success: true,
        roles: server.roles || [],
      });
    }

    if (action === "getMemberRoles") {
      return NextResponse.json({
        success: true,
        memberRoles: server.memberRoles || [],
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error managing roles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
