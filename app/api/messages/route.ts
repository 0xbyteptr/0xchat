import { NextRequest } from "next/server";
import { corsJson } from "@/lib/cors";
import { getDatabase } from "@/lib/db";
import { verifyToken, extractToken } from "@/lib/jwt";
import { broadcast, getWSServer } from "@/lib/ws-server";

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
      return corsJson({ error: auth.error }, { status: 401 }, request.headers.get("origin") || undefined);
    }

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");

    if (!channel) {
      return corsJson({ error: "Channel is required" }, { status: 400 }, request.headers.get("origin") || undefined);
    }

    const db = await getDatabase();
    const channelMessages = await db.getChannelMessages(channel);

    // Hydrate author details for client display
    const hydrated = await Promise.all(
      channelMessages.map(async (msg) => {
        const authorId = (msg as any)?.author?.id || (msg as any)?.author;
        const user = authorId ? await db.getUser(authorId) : null;

        if (!user) {
          return {
            ...msg,
            author: {
              id: authorId || "unknown",
              username: authorId || "unknown",
              avatar: "😺",
            },
          };
        }

        const { password, ...safeUser } = user as any;
        return {
          ...msg,
          author: {
            id: safeUser.id,
            username: safeUser.username,
            avatar: safeUser.avatar,
            displayName: safeUser.displayName,
            status: safeUser.status,
          },
        };
      })
    );

    return corsJson({ messages: hydrated }, undefined, request.headers.get("origin") || undefined);
  } catch (error) {
    console.error("Messages GET error:", error);
    return corsJson({ error: "Internal server error" }, { status: 500 }, request.headers.get("origin") || undefined);
  }
}

export async function OPTIONS(request: NextRequest) {
  return corsJson({}, { status: 204 }, request.headers.get("origin") || undefined);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return corsJson({ error: auth.error }, { status: 401 }, request.headers.get("origin") || undefined);
    }

    const { channel, message } = await request.json();

    if (!channel || !message) {
      return corsJson({ error: "Channel and message are required" }, { status: 400 }, request.headers.get("origin") || undefined);
    }

    const db = await getDatabase();
    const user = await db.getUser(auth.user!.id);

    const storedMessage = {
      ...message,
      author: { id: user?.id || auth.user!.id },
    };

    await db.addMessage(channel, storedMessage as any);

    // Broadcast over websocket to connected clients
    try {
      getWSServer();
      broadcast(
        JSON.stringify({
          type: "message",
          channel,
          message: storedMessage,
        })
      );
    } catch (err) {
      console.error("WS broadcast error:", err);
    }

    return corsJson({ success: true }, undefined, request.headers.get("origin") || undefined);
  } catch (error) {
    console.error("Messages POST error:", error);
    return corsJson({ error: "Internal server error" }, { status: 500 }, request.headers.get("origin") || undefined);
  }
}
