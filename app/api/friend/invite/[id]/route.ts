import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { verifyToken, extractToken } from "@/lib/jwt";

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = extractToken(authHeader);

  if (!token) {
    return { authenticated: false, error: "Missing authorization token" };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { authenticated: false, error: "Invalid or expired token" };
  }

  return { authenticated: true, user: payload };
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const user = auth.user!;
    const { id } = await ctx.params;
    const db = await getDatabase();
    const { invite } = await db.findFriendInviteById(id);
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    return NextResponse.json({ invite });
  } catch (error) {
    console.error("Friend invite GET by id error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const user = auth.user!;
    const { id } = await ctx.params;
    const body = await request.json();
    const status = body?.status;
    if (status !== "accepted" && status !== "declined") {
      return NextResponse.json({ error: "Status must be 'accepted' or 'declined'" }, { status: 400 });
    }

    const db = await getDatabase();
    const { invite } = await db.findFriendInviteById(id);
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Only the invite recipient can update status
    if (invite.to !== user.id) {
      return NextResponse.json({ error: "Not authorized to update this invite" }, { status: 403 });
    }

    const ok = await db.updateFriendInviteStatusById(id, user.id, status);
    if (!ok) {
      return NextResponse.json({ error: "Failed to update invite" }, { status: 500 });
    }
    const updated = (await db.findFriendInviteById(id)).invite;
    return NextResponse.json({ invite: updated });
  } catch (error) {
    console.error("Friend invite PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
