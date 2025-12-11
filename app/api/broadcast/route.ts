import { NextRequest, NextResponse } from "next/server";

/**
 * HTTP endpoint to broadcast messages to WebSocket clients
 * POST /api/broadcast
 * Body: { channel: string, message: any }
 */
export async function POST(req: NextRequest) {
  try {
    const { channel, message, type } = await req.json();

    if (!channel || !message) {
      return NextResponse.json(
        { error: "Missing channel or message" },
        { status: 400 }
      );
    }

    // Forward to WebSocket server
    const wsServerUrl = `http://localhost:3002/broadcast`;
    const response = await fetch(wsServerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: type || "message",
        channel,
        message,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to broadcast" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Broadcast sent",
    });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
