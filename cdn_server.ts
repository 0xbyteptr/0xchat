import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { createReadStream } from "fs";
import compression from "compression";

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
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Default cache control - will be overridden by specific routes
  res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour default
  next();
});

// Routes

/**
 * GET /health - Health check
 */
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * GET /uploads/:filename - Serve uploaded files
 * Example: /uploads/abc123def456.png
 */
app.get("/uploads/:filename", (req: Request, res: Response) => {
  const { filename } = req.params;

  // Security: Prevent directory traversal
  if (filename.includes("..") || filename.includes("/")) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  const filepath = path.join(UPLOADS_DIR, filename);

  // Verify file exists and is within UPLOADS_DIR
  const resolvedPath = path.resolve(filepath);
  if (!resolvedPath.startsWith(path.resolve(UPLOADS_DIR))) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Check if file exists
  if (!fs.existsSync(filepath)) {
    console.log(`❌ File not found: ${filepath}`);
    return res.status(404).json({ error: "File not found" });
  }

  // Get file stats
  const stats = fs.statSync(filepath);
  if (!stats.isFile()) {
    return res.status(404).json({ error: "Not a file" });
  }

  // Determine content type based on extension
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: Record<string, string> = {
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

  // Hashed filenames are immutable - cache for 1 year
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  // Set ETag for cache validation
  res.setHeader("ETag", `"${stats.mtimeMs}"`);
  // Set Last-Modified
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

/**
 * GET /files/:type/:id - Serve files by type and ID
 * Examples:
 * /files/avatars/user123.png
 * /files/profiles/bio-user456.txt
 */
app.get("/files/:type/:filename", (req: Request, res: Response) => {
  const { type, filename } = req.params;

  // Security: Prevent directory traversal
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    type.includes("..") ||
    type.includes("/")
  ) {
    return res.status(400).json({ error: "Invalid path" });
  }

  const filepath = path.join(DATA_DIR, type, filename);
  const resolvedPath = path.resolve(filepath);

  // Verify path is within DATA_DIR
  if (!resolvedPath.startsWith(path.resolve(DATA_DIR))) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Check if file exists
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const stats = fs.statSync(filepath);
  if (!stats.isFile()) {
    return res.status(404).json({ error: "Not a file" });
  }

  // Determine content type
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: Record<string, string> = {
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

/**
 * GET /list/:directory - List files in a directory (for admin/debug)
 * Example: /list/uploads
 */
app.get("/list/:directory", (req: Request, res: Response) => {
  const { directory } = req.params;

  // Security: Only allow specific directories
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

/**
 * POST /cleanup - Delete old files (only from specific directory)
 * Body: { olderThanDays: number, directory: string }
 */
app.post("/cleanup", express.json(), (req: Request, res: Response) => {
  const { olderThanDays = 30, directory = "uploads" } = req.body;

  // Security: Only allow cleanup in uploads
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
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
    method: req.method,
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║   📡 CDN Server Started            ║
╠════════════════════════════════════╣
║ URL: http://localhost:${PORT}        ║
║ Data: ${DATA_DIR}  ║
║                                    ║
║ Endpoints:                         ║
║ GET  /health                       ║
║ GET  /uploads/:filename            ║
║ GET  /files/:type/:filename        ║
║ GET  /list/:directory              ║
║ POST /cleanup                      ║
╚════════════════════════════════════╝
  `);
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
