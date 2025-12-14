import { NextRequest } from "next/server";
import { corsJson } from "@/lib/cors";
import { getDatabase } from "@/lib/db";
import { generateToken } from "@/lib/jwt";
import { ethers } from "ethers";

export async function POST(request: NextRequest) {
  try {
    const { address, message, signature } = await request.json();

    if (!address || !message || !signature) {
      return corsJson({ error: "Missing required fields: address, message, signature" }, { status: 400 }, request.headers.get("origin") || undefined);
    }

    // Verify the signature
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (err) {
      return corsJson({ error: "Invalid signature" }, { status: 401 }, request.headers.get("origin") || undefined);
    }

    // Check that signature matches the claimed address
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return corsJson({ error: "Signature does not match wallet address" }, { status: 401 }, request.headers.get("origin") || undefined);
    }

    const db = getDatabase();

    // Check if wallet already has an account, or create one
    let user = db.getUser(address);

    if (!user) {
      // Create new user with wallet address as username
      const avatar = `https://api.dicebear.com/7.x/bottts-neutral/png?size=512&seed=${encodeURIComponent(
        address
      )}`;

      const newUser = {
        id: address,
        username: address.substring(0, 10),
        password: "", // No password for wallet auth
        avatar,
        createdAt: new Date().toISOString(),
        displayName: `${address.substring(2, 6)}`,
        bio: "🔐 Verified wallet holder",
        status: "",
        theme: "midnight" as const,
        font: "sans" as const,
        accentColor: "#3b82f6", // blue for Web3
      };

      user = db.createUser(newUser);
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
    });

    return corsJson({ success: true, user: { id: user.id, username: user.username, avatar: user.avatar, displayName: user.displayName }, token }, undefined, request.headers.get("origin") || undefined);
  } catch (error) {
    console.error("Web3 auth error:", error);
    return corsJson({ error: "Internal server error" }, { status: 500 }, request.headers.get("origin") || undefined);
  }
}
