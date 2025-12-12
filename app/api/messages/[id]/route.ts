import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";
import { verifyToken, extractToken } from "@/lib/jwt";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await context.params;
    const { content } = await req.json();

    if (!content || !messageId) {
      return NextResponse.json(
        { error: "Missing content or message ID" },
        { status: 400 }
      );
    }
    // Authentication: require a bearer token
    const authHeader = req.headers.get("authorization");
    const token = extractToken(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const messagesPath = path.join(process.cwd(), "data", "messages.json");
    const data = JSON.parse(await fs.readFile(messagesPath, "utf-8"));

    // Find message across channels
    let message: any = null;
    let channelKey: string | null = null;
    for (const key of Object.keys(data)) {
      const found = data[key].find((m: any) => m.id === messageId);
      if (found) {
        message = found;
        channelKey = key;
        break;
      }
    }
    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Authorization: only the author may edit
    const authorId = message.author && typeof message.author === 'object' ? message.author.id : message.author;
    if (!authorId || payload.id !== authorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    message.content = content;
    message.editedAt = new Date().toISOString();
    message.isEdited = true;

    await fs.writeFile(messagesPath, JSON.stringify(data, null, 2));

    console.log(`✏️ Message edited: ${messageId}`);
    return NextResponse.json(message);
  } catch (error) {
    console.error("Edit message error:", error);
    return NextResponse.json(
      { error: "Failed to edit message" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await context.params;

    const authHeader = req.headers.get("authorization");
    const token = extractToken(authHeader);
    if (!token) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const messagesPath = path.join(process.cwd(), "data", "messages.json");
    const data = JSON.parse(await fs.readFile(messagesPath, "utf-8"));

    // Find message across channels and ensure author matches token
    let foundChannel: string | null = null;
    let foundIndex = -1;
    for (const key of Object.keys(data)) {
      const idx = data[key].findIndex((m: any) => m.id === messageId);
      if (idx >= 0) {
        foundChannel = key;
        foundIndex = idx;
        break;
      }
    }

    if (foundIndex === -1 || !foundChannel) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const messageObj = data[foundChannel][foundIndex];
    const authorId = messageObj.author && typeof messageObj.author === 'object' ? messageObj.author.id : messageObj.author;
    if (!authorId || payload.id !== authorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filteredChannel = data[foundChannel].filter((m: any) => m.id !== messageId);
    data[foundChannel] = filteredChannel;

    await fs.writeFile(messagesPath, JSON.stringify(data, null, 2));

    console.log(`🗑️ Message deleted: ${messageId}`);
    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
