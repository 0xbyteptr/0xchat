import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const dmsFilePath = path.join(process.cwd(), "data", "dms.json");

function getConversationId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `dm-${sorted[0]}-${sorted[1]}`;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; messageId: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.id) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { userId, messageId } = await params;
    const currentUserId = decoded.id;
    const conversationId = getConversationId(currentUserId, userId);

    const body = await request.json();
    const { content } = body;
    if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });

    const dmsData = JSON.parse(await readFile(dmsFilePath, "utf8"));
    const conversation = dmsData.conversations.find((c: any) => c.id === conversationId);
    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const message = conversation.messages.find((m: any) => m.id === messageId);
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    // Only author can edit
    const authorId = message.author?.id || message.author;
    if (!authorId || authorId !== currentUserId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date().toISOString();

    await writeFile(dmsFilePath, JSON.stringify(dmsData, null, 2));

    // Broadcast edit
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const broadcastUrl = process.env.BROADCAST_API_URL || `http://${process.env.API_HOST || "localhost"}:${process.env.PORT || 3000}/api/broadcast`;
      await fetch(broadcastUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "message_edit",
          channel: conversationId,
          message: { ...message, isDM: true },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (err) {
      console.debug("WebSocket broadcast skipped for DM edit");
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Edit DM message error:", error);
    return NextResponse.json({ error: "Failed to edit message" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; messageId: string }> }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.id) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { userId, messageId } = await params;
    const currentUserId = decoded.id;
    const conversationId = getConversationId(currentUserId, userId);

    const dmsData = JSON.parse(await readFile(dmsFilePath, "utf8"));
    const conversation = dmsData.conversations.find((c: any) => c.id === conversationId);
    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    const message = conversation.messages.find((m: any) => m.id === messageId);
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

    // Only author can delete
    const authorId = message.author?.id || message.author;
    if (!authorId || authorId !== currentUserId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    conversation.messages = conversation.messages.filter((m: any) => m.id !== messageId);
    await writeFile(dmsFilePath, JSON.stringify(dmsData, null, 2));

    // Broadcast delete
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const broadcastUrl = process.env.BROADCAST_API_URL || `http://${process.env.API_HOST || "localhost"}:${process.env.PORT || 3000}/api/broadcast`;
      await fetch(broadcastUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "message_delete",
          channel: conversationId,
          messageId,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (err) {
      console.debug("WebSocket broadcast skipped for DM delete");
    }

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error("Delete DM message error:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
