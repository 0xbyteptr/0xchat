const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { createReadStream } = require("fs");
const compression = require("compression");

const app = express();
const PORT = process.env.CDN_PORT || 3003;
const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

// Middleware
app.use(compression());
app.use(
  cors({
    origin: ["https://byteptr.xyz", "https://dev.byteptr.xyz", "http://localhost:3000"],
    credentials: true,
  })
);

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Default cache control - will be overridden by specific routes
  res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour default
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve uploaded files
app.get("/uploads/:filename", (req, res) => {
  const { filename } = req.params;

  if (filename.includes("..") || filename.includes("/")) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  const filepath = path.join(UPLOADS_DIR, filename);
  const resolvedPath = path.resolve(filepath);
  if (!resolvedPath.startsWith(path.resolve(UPLOADS_DIR))) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!fs.existsSync(filepath)) {
    console.log(`❌ File not found: ${filepath}`);
    return res.status(404).json({ error: "File not found" });
  }

  const stats = fs.statSync(filepath);
  if (!stats.isFile()) {
    return res.status(404).json({ error: "Not a file" });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
  };

  const contentType = contentTypes[ext] || "application/octet-stream";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", stats.size);

  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("ETag", `"${stats.mtimeMs}"`);
  res.setHeader("Last-Modified", stats.mtime.toUTCString());

  const stream = createReadStream(filepath);
  stream.pipe(res);

  stream.on("error", (error) => {
    console.error(`📡 Stream error for ${filename}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream file" });
    }
  });

  console.log(`📥 Served file: ${filename}`);
});

// Serve files by type
app.get("/files/:type/:filename", (req, res) => {
  const { type, filename } = req.params;

  if (filename.includes("..") || filename.includes("/") || type.includes("..") || type.includes("/")) {
    return res.status(400).json({ error: "Invalid path" });
  }

  const filepath = path.join(DATA_DIR, type, filename);
  const resolvedPath = path.resolve(filepath);
  if (!resolvedPath.startsWith(path.resolve(DATA_DIR))) {
    return res.status(403).json({ error: "Access denied" });
  }

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const stats = fs.statSync(filepath);
  if (!stats.isFile()) {
    return res.status(404).json({ error: "Not a file" });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".txt": "text/plain",
    ".json": "application/json",
  };

  const contentType = contentTypes[ext] || "application/octet-stream";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", stats.size);

  const stream = createReadStream(filepath);
  stream.pipe(res);

  stream.on("error", (error) => {
    console.error(`📡 Stream error for ${type}/${filename}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream file" });
    }
  });

  console.log(`📥 Served file: ${type}/${filename}`);
});

// List files
app.get("/list/:directory", (req, res) => {
  const { directory } = req.params;
  const allowedDirs = ["uploads", "avatars", "profiles"];
  if (!allowedDirs.includes(directory)) {
    return res.status(403).json({ error: "Access denied" });
  }

  const dirPath = path.join(DATA_DIR, directory);
  const resolvedPath = path.resolve(dirPath);

  if (!resolvedPath.startsWith(path.resolve(DATA_DIR))) {
    return res.status(403).json({ error: "Access denied" });
  }

  try {
    if (!fs.existsSync(dirPath)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(dirPath);
    const fileStats = files.map((file) => {
      const filepath = path.join(dirPath, file);
      const stat = fs.statSync(filepath);
      return {
        name: file,
        size: stat.size,
        modified: stat.mtime.toISOString(),
        isDirectory: stat.isDirectory(),
      };
    });

    res.json({ directory, files: fileStats, count: fileStats.length });
  } catch (error) {
    console.error(`Error listing directory ${directory}:`, error);
    res.status(500).json({ error: "Failed to list directory" });
  }
});

// POST /cleanup
app.post("/cleanup", express.json(), (req, res) => {
  const { olderThanDays = 30, directory = "uploads" } = req.body;
  if (directory !== "uploads") {
    return res.status(403).json({ error: "Can only cleanup uploads directory" });
  }

  const dirPath = path.join(DATA_DIR, directory);
  const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  try {
    if (!fs.existsSync(dirPath)) {
      return res.json({ deletedCount: 0, message: "Directory not found" });
    }

    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
      const filepath = path.join(dirPath, file);
      const stat = fs.statSync(filepath);

      if (stat.isFile() && stat.mtimeMs < cutoffTime) {
        fs.unlinkSync(filepath);
        deletedCount++;
        console.log(`🗑️ Deleted old file: ${file}`);
      }
    });

    res.json({
      deletedCount,
      message: `Deleted ${deletedCount} files older than ${olderThanDays} days`,
    });
  } catch (error) {
    console.error(`Error during cleanup:`, error);
    res.status(500).json({ error: "Failed to cleanup files" });
  }
});

// Error handling
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
    method: req.method,
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════╗\n║   📡 CDN Server Started            ║\n╠════════════════════════════════════╣\n║ URL: http://localhost:${PORT}        ║\n║ Data: ${DATA_DIR}  ║\n║                                    ║\n║ Endpoints:                         ║\n║ GET  /health                       ║\n║ GET  /uploads/:filename            ║\n║ GET  /files/:type/:filename        ║\n║ GET  /list/:directory              ║\n║ POST /cleanup                      ║\n╚════════════════════════════════════╝\n  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});
