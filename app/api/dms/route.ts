import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { verifyToken, extractToken } from "@/lib/jwt";
import { broadcast } from "@/lib/ws-server";
import { DM } from "@/lib/types";

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
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const db = getDatabase();
    const userId = (auth.user as any).id;
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get("with");

    // If specific partner requested, get that conversation
    if (partnerId) {
      const messages = db.getDMs(userId, partnerId);
      const partner = db.getUser(partnerId);
      return NextResponse.json({
        messages,
        partner: partner || { id: partnerId, username: partnerId },
      });
    }

    // List conversations for this user
    const conversationsRaw = db.getDMConversations(userId);

    const conversations = conversationsRaw
      .map((conv) => {
        const otherUser = db.getUser(conv.otherUserId);
        const messagesSorted = [...conv.messages].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        return {
          otherUserId: conv.otherUserId,
          otherUser: otherUser || { id: conv.otherUserId, username: conv.otherUserId },
          messages: messagesSorted,
          lastMessage: messagesSorted[messagesSorted.length - 1],
        };
      })
      .sort((a, b) => {
        const aTime = new Date(a.lastMessage?.timestamp || 0).getTime();
        const bTime = new Date(b.lastMessage?.timestamp || 0).getTime();
        return bTime - aTime;
      });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Failed to fetch DMs", error);
    return NextResponse.json(
      { error: "Failed to fetch DMs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth.authenticated) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, content } = body;

    if (!to || !content) {
      return NextResponse.json(
        { error: "Missing required fields: to, content" },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const fromUserId = (auth.user as any).id;

    // Verify recipient exists
    const recipient = db.getUser(to);
    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Create DM
    const newDM: DM = {
      id: `dm_${Date.now()}`,
      from: fromUserId,
      to,
      content,
      timestamp: new Date().toISOString(),
    };

    // Save to database (encryption handled by addDM)
    const dbDM = {
      ...newDM,
      timestamp: newDM.timestamp as string,
    };
    db.addDM(fromUserId, to, dbDM);

    // Get sender details for response
    const sender = db.getUser(fromUserId);

    // Broadcast to WebSocket
    try {
      broadcast(
        JSON.stringify({
          type: "dm",
          from: fromUserId,
          to,
          message: newDM,
          sender: sender,
        })
      );
    } catch (wsError) {
      console.error("WebSocket broadcast failed, but DM was saved", wsError);
    }

    return NextResponse.json({
      success: true,
      message: newDM,
    });
  } catch (error) {
    console.error("Failed to send DM", error);
    return NextResponse.json(
      { error: "Failed to send DM" },
      { status: 500 }
    );
  }
}

