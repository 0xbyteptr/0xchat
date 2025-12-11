import { WebSocketServer, WebSocket } from "ws";

const WS_PORT = Number(process.env.WS_PORT || 3001);
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
