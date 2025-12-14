import { NextRequest } from "next/server";
import { corsJson } from "@/lib/cors";
import { verify } from "jsonwebtoken";
import { readFile, writeFile } from "fs/promises";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const dmsFilePath = path.join(process.cwd(), "data", "dms.json");

interface DMConversation {
  id: string;
  participants: string[];
  createdAt: string;
  lastMessageAt: string;
  messages?: Array<{ id: string; author: string; content: string; timestamp: string }>;
  lastMessage?: string;
  otherUser?: { id: string; username: string; avatar: string };
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return corsJson({ error: "Unauthorized" }, { status: 401 }, request.headers.get("origin") || undefined);
    }

    const decoded = verify(token, JWT_SECRET) as { id: string };
    const currentUserId = decoded.id;

    // Read DMs file
    let dmsData: any;
    try {
      dmsData = JSON.parse(await readFile(dmsFilePath, "utf8"));
    } catch (err) {
      // DMs file doesn't exist or is invalid
      return corsJson({ success: true, conversations: [] }, undefined, request.headers.get("origin") || undefined);
    }

    // Read users file
    let usersData: any;
    try {
      usersData = JSON.parse(
        await readFile(path.join(process.cwd(), "data", "users.json"), "utf8")
      );
    } catch (err) {
      console.error("Error reading users.json:", err);
      usersData = { users: [] };
    }

    const users = usersData.users || [];

    // Filter conversations where current user is a participant and deduplicate by ID
    const seenIds = new Set<string>();
    const userConversations = (dmsData.conversations || [])
      .filter((conv: DMConversation) =>
        conv.participants && conv.participants.includes(currentUserId)
      )
      .filter((conv: DMConversation) => {
        if (seenIds.has(conv.id)) {
          return false;
        }
        seenIds.add(conv.id);
        return true;
      })
      .map((conv: DMConversation) => {
        const otherUserId = conv.participants?.find(
          (id: string) => id !== currentUserId
        );
        const otherUser = users.find(
          (u: any) => u.id === otherUserId
        );

        return {
          id: conv.id,
          participants: conv.participants,
          createdAt: conv.createdAt,
          lastMessageAt: conv.lastMessageAt,
          lastMessage:
            conv.messages && conv.messages.length > 0
              ? conv.messages[conv.messages.length - 1].content
              : null,
          otherUser: otherUser
            ? {
                id: otherUser.id,
                username: otherUser.username,
                avatar: otherUser.avatar,
              }
            : { id: otherUserId, username: otherUserId, avatar: "" },
        };
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
      );

    return corsJson({ success: true, conversations: userConversations }, undefined, request.headers.get("origin") || undefined);
  } catch (error) {
    console.error("Error fetching DMs:", error);
    return corsJson({ error: "Failed to fetch DMs" }, { status: 500 }, request.headers.get("origin") || undefined);
  }
}
