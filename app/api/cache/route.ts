import { NextRequest, NextResponse } from "next/server";
import { getCacheStats, pruneAllCaches, clearAllCaches } from "@/lib/cache";

/**
 * Cache management endpoints
 * GET /api/cache/stats - Get cache statistics
 * POST /api/cache/prune - Clean up expired entries
 * POST /api/cache/clear - Clear all caches (admin only)
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    switch (action) {
      case "stats":
        return NextResponse.json({
          timestamp: new Date().toISOString(),
          caches: getCacheStats(),
        });

      default:
        return NextResponse.json({
          message: "Cache management API",
          endpoints: {
            "GET ?action=stats": "Get cache statistics",
            "POST ?action=prune": "Clean up expired entries",
            "POST ?action=clear": "Clear all caches (admin)",
          },
        });
    }
  } catch (error) {
    console.error("Cache management error:", error);
    return NextResponse.json(
      { error: "Cache management failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    // Check admin authorization (in production, verify JWT token)
    const isAdmin = searchParams.get("admin_token") === process.env.ADMIN_TOKEN;

    switch (action) {
      case "prune":
        const pruneResults = pruneAllCaches();
        return NextResponse.json({
          message: "Cache pruned successfully",
          removed: pruneResults,
          timestamp: new Date().toISOString(),
        });

      case "clear":
        if (!isAdmin) {
          return NextResponse.json(
            { error: "Unauthorized - admin token required" },
            { status: 403 }
          );
        }

        clearAllCaches();
        return NextResponse.json({
          message: "All caches cleared successfully",
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Cache management error:", error);
    return NextResponse.json(
      { error: "Cache management failed" },
      { status: 500 }
    );
  }
}
