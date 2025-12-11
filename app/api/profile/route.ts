import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { extractToken, verifyToken } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req.headers.get("authorization") || "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const db = getDatabase();
    const searchParams = req.nextUrl.searchParams;
    const targetUsername = searchParams.get("username") || payload.username || payload.id;
    const user = db.getUser(targetUsername);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { password, ...safeUser } = user as any;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = extractToken(req.headers.get("authorization") || "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json();
    const { displayName, bio, status, avatar, theme, font, accentColor } = body;

    const db = getDatabase();
    const user = db.getUser(payload.username || payload.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updates: any = {};
    if (typeof displayName === "string") updates.displayName = displayName.slice(0, 64);
    if (typeof bio === "string") updates.bio = bio.slice(0, 280);
    if (typeof status === "string") updates.status = status.slice(0, 64);
    if (typeof avatar === "string") updates.avatar = avatar;
    if (theme === "dark" || theme === "midnight" || theme === "sunset" || theme === "mint")
      updates.theme = theme;
    if (font === "sans" || font === "mono" || font === "serif") updates.font = font;
    if (typeof accentColor === "string" && accentColor.trim()) updates.accentColor = accentColor.trim();

    const updated = db.updateUser(user.username, updates);
    if (!updated) return NextResponse.json({ error: "Failed to update" }, { status: 500 });

    const { password, ...safeUser } = updated as any;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
