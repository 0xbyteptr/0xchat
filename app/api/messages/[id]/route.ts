import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { content } = await req.json();
    const messageId = params.id;

    if (!content || !messageId) {
      return NextResponse.json(
        { error: "Missing content or message ID" },
        { status: 400 }
      );
    }

    const messagesPath = path.join(process.cwd(), "data", "messages.json");
    const data = JSON.parse(await fs.readFile(messagesPath, "utf-8"));

    // Find and update message
    const message = data.find((m: any) => m.id === messageId);
    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
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
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id;

    const messagesPath = path.join(process.cwd(), "data", "messages.json");
    const data = JSON.parse(await fs.readFile(messagesPath, "utf-8"));

    // Filter out deleted message
    const filteredData = data.filter((m: any) => m.id !== messageId);

    if (filteredData.length === data.length) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    await fs.writeFile(messagesPath, JSON.stringify(filteredData, null, 2));

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
