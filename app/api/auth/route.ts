import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { generateToken } from "@/lib/jwt";

export async function POST(request: Request) {
  try {
    const { action, username, password } = await request.json();
    const db = getDatabase();

    if (action === "register") {
      const existingUser = db.getUser(username);
      if (existingUser) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 400 }
        );
      }

      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      // 512px avatar via DiceBear (deterministic per username)
      const avatar = `https://api.dicebear.com/7.x/bottts-neutral/png?size=512&seed=${encodeURIComponent(
        username
      )}`;

      const hashedPassword = await hashPassword(password);

      const newUser = {
        id: username,
        username,
        password: hashedPassword,
        avatar,
        createdAt: new Date().toISOString(),
      };

      db.createUser(newUser);

      // Generate JWT token
      const token = generateToken({ id: username, username, avatar });

      return NextResponse.json({
        success: true,
        user: {
          id: username,
          username,
          avatar,
        },
        token,
      });
    }

    if (action === "login") {
      const user = db.getUser(username);

      if (!user) {
        return NextResponse.json(
          { error: "Invalid username or password" },
          { status: 401 }
        );
      }

      const passwordMatch = await verifyPassword(password, user.password);

      if (!passwordMatch) {
        return NextResponse.json(
          { error: "Invalid username or password" },
          { status: 401 }
        );
      }

      // Generate JWT token
      const token = generateToken({ id: user.id, username: user.username, avatar: user.avatar });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
        },
        token,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
