import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const dmsFilePath = path.join(process.cwd(), "data", "dms.json");

// In-memory store for typing status (expires after 3 seconds)
const typingStatus = new Map<string, { userId: string; expiresAt: number }>();

// Helper to sort user IDs for consistent conversation IDs
function getConversationId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `dm-${sorted[0]}-${sorted[1]}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as { id: string };
    const currentUserId = decoded.id;
    const { userId } = await params;
    const otherUserId = userId;

    const dmsData = JSON.parse(await readFile(dmsFilePath, "utf8"));
    const conversationId = getConversationId(currentUserId, otherUserId);

    const conversation = dmsData.conversations.find(
      (c: any) => c.id === conversationId
    );

    if (!conversation) {
      return NextResponse.json(
        { success: true, messages: [], otherUserId },
        { status: 200 }
      );
    }

    // Check if other user is typing
    const typingKey = `${otherUserId}-${currentUserId}`;
    const typing = typingStatus.get(typingKey);
    const isTyping = typing && typing.expiresAt > Date.now();

    // Clean up expired typing status
    if (typing && typing.expiresAt <= Date.now()) {
      typingStatus.delete(typingKey);
    }

    return NextResponse.json({
      success: true,
      messages: conversation.messages || [],
      otherUserId,
      isTyping: isTyping || false,
    });
  } catch (error) {
    console.error("Error fetching DM messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const currentUserId = decoded.id;
    const { userId } = await params;
    const otherUserId = userId;

    const body = await request.json();
    const { content, action } = body;

    // Handle typing status
    if (action === "typing") {
      const typingKey = `${currentUserId}-${otherUserId}`;
      typingStatus.set(typingKey, {
        userId: currentUserId,
        expiresAt: Date.now() + 3000, // 3 second timeout
      });
      return NextResponse.json({ success: true });
    }

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Read users to get current user's info
    let usersData: any = { users: [] };
    try {
      usersData = JSON.parse(
        await readFile(path.join(process.cwd(), "data", "users.json"), "utf8")
      );
    } catch (err) {
      console.error("Error reading users.json:", err);
    }

    const users = Array.isArray(usersData?.users) ? usersData.users : [];
    const currentUser = users.find((u: any) => u.id === currentUserId) || {
      id: currentUserId,
      username: decoded.username || currentUserId,
      avatar: decoded.avatar || `https://api.dicebear.com/7.x/bottts-neutral/png?size=512&seed=${currentUserId}`,
    };

    const dmsData = JSON.parse(await readFile(dmsFilePath, "utf8"));
    const conversationId = getConversationId(currentUserId, otherUserId);

    // Find or create conversation
    let conversation = dmsData.conversations.find(
      (c: any) => c.id === conversationId
    );

    if (!conversation) {
      conversation = {
        id: conversationId,
        participants: [currentUserId, otherUserId],
        createdAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
        messages: [],
      };
      dmsData.conversations.push(conversation);
    }

    // Add message
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      author: {
        id: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      content,
      timestamp: new Date().toISOString(),
    };

    conversation.messages.push(message);
    conversation.lastMessageAt = new Date().toISOString();

    // Save updated DMs
    await writeFile(dmsFilePath, JSON.stringify(dmsData, null, 2));

    // Broadcast via the internal broadcast endpoint
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    try {
        const broadcastUrl = process.env.BROADCAST_API_URL || `http://${process.env.API_HOST || "localhost"}:${process.env.PORT || 3000}/api/broadcast`;
      await fetch(broadcastUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "message",
          channel: conversationId,
          message: {
            id: message.id,
            author: currentUser,
            content: message.content,
            timestamp: message.timestamp,
            isDM: true,
          },
        }),
        signal: controller.signal,
      });
    } catch (wsError) {
      // Silently fail - WebSocket server is optional, messages will be fetched on reload
      console.debug("WebSocket broadcast skipped");
    } finally {
      clearTimeout(timeout);
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Error sending DM:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
