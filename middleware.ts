import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to add permissive CORS headers to API routes during development.
 * Allows requests from different hosts (e.g., accessing the app via LAN IP).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") || "*";
    // Handle preflight
    if (request.method === "OPTIONS") {
      // Preflight should be a 204 No Content with appropriate CORS headers
      const res = new NextResponse(null, { status: 204 });
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS"
      );
      res.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization"
      );
      res.headers.set("Access-Control-Allow-Credentials", "true");
      return res;
    }

    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization"
    );
    response.headers.set("Access-Control-Allow-Credentials", "true");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
