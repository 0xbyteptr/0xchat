import { WebSocketServer, WebSocket } from "ws";

// Resolve WebSocket port - prefer WS_PORT, otherwise fallback to a safe default (3002)
function resolvePort(): number {
  const direct = process.env.WS_PORT;
  if (direct && Number(direct)) return Number(direct);

  const httpPort = process.env.PORT ? Number(process.env.PORT) : null;
  if (httpPort && httpPort !== 3000) return httpPort;

  // Default dev WS port
  return 3002;
}

const WS_PORT = resolvePort();
let wss: any = null;

function ensureServer() {
  if (wss) return wss;
  wss = new WebSocketServer({ port: WS_PORT });
  console.log(`🔌 WebSocket server listening on port ${WS_PORT}`);
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
