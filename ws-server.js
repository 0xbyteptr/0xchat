#!/usr/bin/env node
/**
 * Real-time WebSocket server for 0xChat
 * Handles message broadcasting by channel
 * Also listens for HTTP POST requests to /broadcast
 * Run: node ws-server.js
 */

const { WebSocketServer } = require("ws");
const http = require("http");
const url = require("url");

const WS_PORT = process.env.WS_PORT || 3002;

// Create HTTP server
const server = http.createServer((req, res) => {
  // Handle /broadcast POST endpoint
  if (req.method === "POST" && req.url === "/broadcast") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const data = JSON.parse(body);
        const { type, channel, message } = data;
        
        console.log(`📡 HTTP broadcast to ${channel}:`, message);
        
        // Broadcast to all subscribers in that channel
        const subscribers = channelSubscriptions.get(channel);
        if (subscribers) {
          subscribers.forEach((ws) => {
            if (ws.readyState === 1) {
              ws.send(JSON.stringify({ type, channel, message }));
            }
          });
        }
        
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        console.error("Broadcast parse error:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Track connected clients by channel
const channelSubscriptions = new Map(); // channel -> Set of clients

wss.on("connection", (ws) => {
  console.log(`✅ Client connected`);
  ws.channels = new Set(); // Track which channels this client is subscribed to

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Handle subscription/presence
      if (message.type === "subscribe" && message.channel) {
        const channel = message.channel;
        if (!channelSubscriptions.has(channel)) {
          channelSubscriptions.set(channel, new Set());
        }
        channelSubscriptions.get(channel).add(ws);
        ws.channels.add(channel);
        console.log(`📍 Client subscribed to: ${channel}`);
        return;
      }

      // Handle message broadcast to channel
      if (message.type === "message" && message.channel) {
        const channel = message.channel;
        const subscribers = channelSubscriptions.get(channel);
        
        if (subscribers) {
          console.log(`📨 Relay to ${channel} (${subscribers.size} clients): ${JSON.stringify(message).substring(0, 60)}...`);
          subscribers.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
              client.send(data);
            }
          });
        }
        return;
      }

      // Default: broadcast to all subscribers in the channel
      if (message.channel) {
        const subscribers = channelSubscriptions.get(message.channel);
        if (subscribers) {
          subscribers.forEach((client) => {
            if (client.readyState === 1) {
              client.send(data);
            }
          });
        }
      }
    } catch (err) {
      console.error(`❌ Message parse error:`, err.message);
    }
  });

  ws.on("close", () => {
    // Remove from all subscribed channels
    ws.channels.forEach((channel) => {
      const subscribers = channelSubscriptions.get(channel);
      if (subscribers) {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          channelSubscriptions.delete(channel);
        }
      }
    });
    console.log(`❌ Client disconnected. Channels: ${ws.channels.size}`);
  });

  ws.on("error", (error) => {
    console.error(`⚠️ WebSocket error:`, error.message);
  });
});

server.listen(WS_PORT, "0.0.0.0", () => {
  console.log(`🚀 Real-time WebSocket server running on port ${WS_PORT}`);
  const broadcastHost = process.env.WS_HOST || "localhost";
  const broadcastUrl = process.env.WS_BROADCAST_URL || `http://${broadcastHost}:${WS_PORT}/broadcast`;
  console.log(`📡 HTTP broadcast endpoint: POST ${broadcastUrl}`);
});

process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down...");
  server.close(() => process.exit(0));
});
