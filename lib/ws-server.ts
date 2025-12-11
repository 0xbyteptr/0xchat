import { WebSocketServer, WebSocket } from "ws";

// Derive port from WS_PORT, or from WS_URL/NEXT_PUBLIC_WS_URL if provided, else default 3001
function resolvePort(): number {
  const direct = process.env.WS_PORT;
  if (direct && Number(direct)) return Number(direct);

  const url = process.env.WS_URL || process.env.NEXT_PUBLIC_WS_URL;
  if (url) {
    try {
      const parsed = new URL(url);
      if (parsed.port) return Number(parsed.port);
      // default ports when none provided
      if (parsed.protocol === "wss:") return 443;
      if (parsed.protocol === "ws:") return 80;
    } catch (err) {
      console.warn("Invalid WS_URL, falling back to 3001", err);
    }
  }

  return 3001;
}

const WS_PORT = resolvePort();
let wss: any = null;

function ensureServer() {
  if (wss) return wss;
  wss = new WebSocketServer({ port: WS_PORT });
  wss.on("connection", (socket: any) => {
    socket.on("message", (data: any) => {
      // simple echo/broadcast
      broadcast(data.toString());
    });
  });
  return wss;
}

export function getWSServer(): any {
  return ensureServer();
}

export function broadcast(message: string) {
  if (!wss) return;
  wss.clients.forEach((client: any) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
