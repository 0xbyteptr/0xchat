const { WebSocketServer } = require("ws");
const { createServer } = require("http");

const PORT = process.env.WS_PORT || 3002;
const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("🔌 WebSocket client connected");
  clients.add(ws);

  ws.on("message", (data) => {
    console.log("📨 WS message:", data.toString());
    // Broadcast to all clients
    clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(data);
      }
    });
  });

  ws.on("close", () => {
    console.log("🔌 WebSocket client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
    clients.delete(ws);
  });
});

httpServer.listen(PORT, () => {
  console.log(`✅ WebSocket server listening on port ${PORT}`);
});
