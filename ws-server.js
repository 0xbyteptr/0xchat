#!/usr/bin/env node
/**
 * Standalone WebSocket server for catboychat
 * Run this: node ws-server.js
 */

const { WebSocketServer } = require("ws");
const http = require("http");

const WS_PORT = process.env.WS_PORT || 3002;

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on("connection", (ws) => {
  console.log(`✅ Client connected. Total: ${clients.size + 1}`);
  clients.add(ws);

  ws.on("message", (data) => {
    console.log(`📨 Broadcast: ${data.toString().substring(0, 50)}...`);
    // Broadcast to all clients
    clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(data);
      }
    });
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`❌ Client disconnected. Total: ${clients.size}`);
  });

  ws.on("error", (error) => {
    console.error(`⚠️ Error:`, error.message);
  });
});

server.listen(WS_PORT, "0.0.0.0", () => {
  console.log(`🚀 WebSocket server running on port ${WS_PORT}`);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down...");
  server.close(() => process.exit(0));
});
