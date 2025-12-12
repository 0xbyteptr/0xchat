import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";
import { extractToken, verifyToken } from "@/lib/jwt";
import { broadcast, getWSServer } from "@/lib/ws-server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await context.params;
    const body = await req.json();
    const { isPinned } = body;

    if (typeof isPinned !== "boolean") {
      return NextResponse.json({ error: "isPinned boolean is required" }, { status: 400 });
    }

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
    const data = JSON.parse(await fs.readFile(messagesPath, "utf8"));

    // Locate message across channels
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

    if (!foundChannel || foundIndex === -1) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const message = data[foundChannel][foundIndex];
    message.isPinned = isPinned;

    await fs.writeFile(messagesPath, JSON.stringify(data, null, 2));

    // Broadcast pin change
    try {
      getWSServer();
      broadcast(
        JSON.stringify({ type: "message_pin", channel: foundChannel, messageId, isPinned })
      );
    } catch (err) {
      console.error("WS broadcast pin error:", err);
    }

    return NextResponse.json({ success: true, messageId, isPinned });
  } catch (error) {
    console.error("Pin message error:", error);
    return NextResponse.json({ error: "Failed to pin/unpin message" }, { status: 500 });
  }
}
