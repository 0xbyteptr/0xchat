import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractToken } from "@/lib/jwt";

/**
 * Middleware to verify JWT tokens
 * Use this for protecting API routes
 */
export function withAuth(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const authHeader = request.headers.get("authorization");
      const token = extractToken(authHeader);

      if (!token) {
        return NextResponse.json(
          { error: "Missing authorization token" },
          { status: 401 }
        );
      }

      const payload = verifyToken(token);

      if (!payload) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }

      return handler(request, payload);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
