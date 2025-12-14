import { NextResponse } from "next/server";
import { corsJson } from "@/lib/cors";
import { getDatabase } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { generateToken } from "@/lib/jwt";

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch (err) {
      console.error("Auth route: failed to parse JSON body:", err);
      return corsJson({ error: "Invalid JSON body" }, { status: 400 }, (request as any).headers?.get("origin") || undefined);
    }

    const { action, username, password } = body || {};
    console.debug("Auth route called", { action, username: typeof username, hasPassword: typeof password !== 'undefined' });

    if (!action || typeof action !== "string") {
      return corsJson({ error: "Missing or invalid action" }, { status: 400 }, (request as any).headers?.get("origin") || undefined);
    }
    const db = getDatabase();

    if (action === "register") {
      if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
        return corsJson({ error: "Missing username or password" }, { status: 400 }, (request as any).headers?.get("origin") || undefined);
      }
      const existingUser = db.getUser(username);
      if (existingUser) {
        return corsJson({ error: "Username already exists" }, { status: 400 }, (request as any).headers?.get("origin") || undefined);
      }

      if (!password || password.length < 6) {
        return corsJson({ error: "Password must be at least 6 characters" }, { status: 400 }, (request as any).headers?.get("origin") || undefined);
      }

      // 512px avatar via DiceBear (deterministic per username)
      const avatar = `https://api.dicebear.com/7.x/bottts-neutral/png?size=512&seed=${encodeURIComponent(
        username
      )}`;

      const hashedPassword = await hashPassword(password);

      const newUser = {
        id: username,
        username,
        password: hashedPassword,
        avatar,
        createdAt: new Date().toISOString(),
      };

      db.createUser(newUser);

      // Generate JWT token
      const token = generateToken({ id: username, username, avatar });

      return corsJson({ success: true, user: { id: username, username, avatar }, token }, undefined, (request as any).headers?.get("origin") || undefined);
    }

    if (action === "login") {
      if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
        return corsJson({ error: "Missing username or password" }, { status: 400 }, (request as any).headers?.get("origin") || undefined);
      }

      const user = db.getUser(username);

      if (!user) {
        return corsJson({ error: "Invalid username or password" }, { status: 401 }, (request as any).headers?.get("origin") || undefined);
      }

      const passwordMatch = await verifyPassword(password, user.password);

      if (!passwordMatch) {
        return corsJson({ error: "Invalid username or password" }, { status: 401 }, (request as any).headers?.get("origin") || undefined);
      }

      // Generate JWT token
      const token = generateToken({ id: user.id, username: user.username, avatar: user.avatar });

      return corsJson({ success: true, user: { id: user.id, username: user.username, avatar: user.avatar }, token }, undefined, (request as any).headers?.get("origin") || undefined);
    }
    return corsJson({ error: "Invalid action" }, { status: 400 }, (request as any).headers?.get("origin") || undefined);
  } catch (error) {
    console.error("Auth error:", error);
    return corsJson({ error: "Internal server error" }, { status: 500 }, (request as any).headers?.get("origin") || undefined);
  }
}
