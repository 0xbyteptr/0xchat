import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { createHash } from "crypto";
import { existsSync } from "fs";

// Get CDN URL from environment, fallback to app URL
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = (formData.get("type") as string) || "uploads"; // avatars | images | uploads
    const userId = (formData.get("userId") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Generate hash from file content
    const hash = createHash("sha256")
      .update(uint8Array)
      .digest("hex")
      .slice(0, 16); // Use first 16 chars of hash

    // Get file extension
    const ext = file.name.split(".").pop() || "bin";

    // Determine destination directory
    const safeType = type === "avatars" || type === "images" ? type : "uploads";
    const baseDir = join(process.cwd(), "data", safeType);
    const targetDir = userId ? join(baseDir, userId) : baseDir;

    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    // Save file with hash.extension naming
    const filename = `${hash}.${ext}`;
    const filepath = join(targetDir, filename);

    await writeFile(filepath, uint8Array);

    // Use CDN URL if available, otherwise use app-relative files route
    const fileUrl = CDN_URL
      ? `${CDN_URL}/files/${safeType}/${userId ? `${encodeURIComponent(userId)}/${filename}` : filename}`
      : `/files/${safeType}/${userId ? `${encodeURIComponent(userId)}/${filename}` : filename}`;

    return NextResponse.json({
      success: true,
      filename,
      hash,
      extension: ext,
      size: file.size,
      mimeType: file.type,
      url: fileUrl,
      type: safeType,
      userId: userId || null,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve file info
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "No filename provided" },
        { status: 400 }
      );
    }

    // Validate filename format (prevent directory traversal)
    if (filename.includes("..") || filename.includes("/")) {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
    }

    const filepath = join(process.cwd(), "data", "uploads", filename);

    if (!existsSync(filepath)) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      filename,
      url: `/data/uploads/${filename}`,
    });
  } catch (error) {
    console.error("Get file error:", error);
    return NextResponse.json(
      { error: "Failed to get file info" },
      { status: 500 }
    );
  }
}
