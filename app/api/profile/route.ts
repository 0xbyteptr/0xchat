import { NextRequest } from "next/server";
import { corsJson } from "@/lib/cors";
import { getDatabase } from "@/lib/db";
import { extractToken, verifyToken } from "@/lib/jwt";

export async function OPTIONS(req: Request) {
  // Reply to preflight requests with CORS headers
  return corsJson({}, { status: 204 }, (req as any).headers?.get("origin") || undefined);
}

export async function GET(req: NextRequest) {
  try {
    const token = extractToken(req.headers.get("authorization") || "");
    if (!token) return corsJson({ error: "Unauthorized" }, { status: 401 }, req.headers.get("origin") || undefined);

    const payload = verifyToken(token);
    if (!payload) return corsJson({ error: "Invalid token" }, { status: 401 }, req.headers.get("origin") || undefined);

    const db = getDatabase();
    const searchParams = req.nextUrl.searchParams;
    
    // Support querying by username or id
    const byUsername = searchParams.get("username");
    const byId = searchParams.get("id");
    
    let targetUsername: string;
    if (byUsername) {
      targetUsername = byUsername;
    } else if (byId) {
      // ID is typically the same as username in this system
      targetUsername = byId;
    } else {
      // Default to current user
      targetUsername = payload.username || payload.id;
    }
    
    const user = db.getUser(targetUsername);
    if (!user) return corsJson({ error: "User not found" }, { status: 404 }, req.headers.get("origin") || undefined);

    const { password, ...safeUser } = user as any;
    return corsJson({ success: true, user: safeUser }, undefined, req.headers.get("origin") || undefined);
  } catch (error) {
    console.error("Profile GET error:", error);
    return corsJson({ error: "Internal server error" }, { status: 500 }, req.headers.get("origin") || undefined);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = extractToken(req.headers.get("authorization") || "");
    if (!token) return corsJson({ error: "Unauthorized" }, { status: 401 }, req.headers.get("origin") || undefined);

    const payload = verifyToken(token);
    if (!payload) return corsJson({ error: "Invalid token" }, { status: 401 }, req.headers.get("origin") || undefined);

    const body = await req.json();
    const { displayName, bio, status, avatar, theme, font, accentColor } = body;

    const db = getDatabase();
    const user = db.getUser(payload.username || payload.id);
    if (!user) return corsJson({ error: "User not found" }, { status: 404 }, req.headers.get("origin") || undefined);

    const updates: any = {};
    if (typeof displayName === "string") updates.displayName = displayName.slice(0, 64);
    if (typeof bio === "string") updates.bio = bio.slice(0, 280);
    if (typeof status === "string") updates.status = status.slice(0, 64);
    if (typeof avatar === "string") {
      // Allow both URLs and base64 data URIs (up to 1MB for base64)
      if (avatar.length <= 1048576) {
        updates.avatar = avatar;
      }
    }
    if (theme === "dark" || theme === "midnight" || theme === "sunset" || theme === "mint")
      updates.theme = theme;
    if (font === "sans" || font === "mono" || font === "serif") updates.font = font;
    if (typeof accentColor === "string" && accentColor.trim()) updates.accentColor = accentColor.trim();

    const updated = db.updateUser(user.username, updates);
    if (!updated) return corsJson({ error: "Failed to update" }, { status: 500 }, req.headers.get("origin") || undefined);

    const { password, ...safeUser } = updated as any;
    return corsJson({ success: true, user: safeUser }, undefined, req.headers.get("origin") || undefined);
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return corsJson({ error: "Internal server error" }, { status: 500 }, req.headers.get("origin") || undefined);
  }
}
