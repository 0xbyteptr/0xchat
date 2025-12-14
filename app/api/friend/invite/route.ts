import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
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

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const user = auth.user!;
    const db = await getDatabase();
    const invites = await db.getFriendInvites(user.id);
    return NextResponse.json({ invites });
  } catch (error) {
    console.error("Friend invites GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch (err) {
      console.error("Friend invite POST json parse error", err);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { to } = body || {};
    if (!to || typeof to !== "string") {
      return NextResponse.json({ error: "Target user id is required" }, { status: 400 });
    }

    const user = auth.user!;

    if (to === user.id) {
      return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 });
    }

    const db = await getDatabase();
    const targetUser = await db.getUser(to);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const invite = {
      id: crypto.randomUUID(),
      from: user.id,
      to,
      status: "pending" as const,
      timestamp: new Date().toISOString(),
    };

    try {
      await db.addFriendInvite(invite);
    } catch (err) {
      console.error("Friend invite POST db error", err);
      return NextResponse.json({ error: "Failed to save invite" }, { status: 500 });
    }

    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    console.error("Friend invite POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
