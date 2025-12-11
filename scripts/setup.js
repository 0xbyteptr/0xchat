#!/usr/bin/env node
/**
 * Setup script to initialize demo users with hashed passwords
 * Run with: node scripts/setup.js
 */

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;
const DATA_DIR = path.join(__dirname, "..", "data");

async function setup() {
  console.log("🐱 CatboyChat - Setup Script\n");

  // Create data directory if it doesn't exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log("✓ Created data directory");
  }

  // Hash demo passwords
  const demoPassword = await bcrypt.hash("password", SALT_ROUNDS);
  const catboyPassword = await bcrypt.hash("catboy123", SALT_ROUNDS);

  // Create users.json with hashed passwords
  const usersData = {
    demo: {
      id: "demo",
      username: "demo",
      password: demoPassword,
      avatar: "😸",
      createdAt: new Date().toISOString(),
    },
    catboy: {
      id: "catboy",
      username: "CatboyBot",
      password: catboyPassword,
      avatar: "🐱",
      createdAt: new Date().toISOString(),
    },
  };

  fs.writeFileSync(
    path.join(DATA_DIR, "users.json"),
    JSON.stringify(usersData, null, 2)
  );
  console.log("✓ Created users.json with hashed passwords");

  // Create messages.json
  const messagesData = {
    general: [
      {
        id: "1",
        author: { id: "catboy", username: "CatboyBot", avatar: "🐱" },
        content: "Meow! Welcome to CatboyChat! 💕",
        timestamp: new Date().toISOString(),
      },
    ],
    introductions: [
      {
        id: "2",
        author: { id: "catboy", username: "CatboyBot", avatar: "🐱" },
        content: "Introduce yourself here! Meow~",
        timestamp: new Date().toISOString(),
      },
    ],
    "cute-stuff": [
      {
        id: "3",
        author: { id: "catboy", username: "CatboyBot", avatar: "🐱" },
        content: "Share cute things here! 😻",
        timestamp: new Date().toISOString(),
      },
    ],
  };

  fs.writeFileSync(
    path.join(DATA_DIR, "messages.json"),
    JSON.stringify(messagesData, null, 2)
  );
  console.log("✓ Created messages.json\n");

  console.log("✨ Setup complete!\n");
  console.log("Demo credentials:");
  console.log("  Username: demo");
  console.log("  Password: password\n");
  console.log("Bot credentials:");
  console.log("  Username: catboy");
  console.log("  Password: catboy123\n");
  console.log("Run 'npm run dev' to start the development server.");
}

setup().catch((error) => {
  console.error("❌ Setup failed:", error);
  process.exit(1);
});
