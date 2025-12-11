import { WebSocketServer, WebSocket } from "ws";

// Resolve WebSocket port - use WS_PORT env var, or default to same port as HTTP
function resolvePort(): number {
  const direct = process.env.WS_PORT;
  if (direct && Number(direct)) return Number(direct);
  
  // Use PORT env var (set by Next.js or your server) or default to 3000
  const httpPort = process.env.PORT ? Number(process.env.PORT) : 3000;
  return httpPort;
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
