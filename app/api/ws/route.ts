import { NextRequest } from "next/server";
import { WebSocketServer } from "ws";
import { createServer } from "http";

let wss: any = null;
let clients = new Set<any>();

function getWSServer() {
  if (wss) return wss;
  
  // Create a standalone WebSocket server
  const port = process.env.WS_PORT || 3002;
  const httpServer = createServer();
  
  wss = new WebSocketServer({ server: httpServer });
  
  wss.on("connection", (ws: any) => {
    console.log("🔌 WebSocket client connected");
    clients.add(ws);

    ws.on("message", (data: any) => {
      console.log("📨 WS message:", data.toString());
      // Broadcast to all clients
      clients.forEach((client: any) => {
        if (client.readyState === 1) { // OPEN
          client.send(data);
        }
      });
    });

    ws.on("close", () => {
      console.log("🔌 WebSocket client disconnected");
      clients.delete(ws);
    });

    ws.on("error", (err: any) => {
      console.error("WebSocket error:", err);
      clients.delete(ws);
    });
  });

  httpServer.listen(port, () => {
    console.log(`🔌 WebSocket server listening on port ${port}`);
  });

  return wss;
}

export async function GET(request: NextRequest) {
  // Initialize the server
  getWSServer();
  
  // The WebSocket upgrade needs to happen at the HTTP level
  // This route just ensures the server is running
  return new Response(JSON.stringify({ status: "WebSocket server running" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}