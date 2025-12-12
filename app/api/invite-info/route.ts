import { NextRequest, NextResponse } from "next/server";

interface InviteData {
  id: string;
  serverId: string;
  serverName: string;
  serverIcon?: string;
  description?: string;
  memberCount?: number;
  isValid: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "No invite code provided" },
        { status: 400 }
      );
    }

    // Read invite data from JSON file
    const fs = await import("fs/promises");
    const path = await import("path");
    
    const serverPath = path.join(process.cwd(), "data", "servers.json");

    let inviteData: any = null;
    let serverData: any = null;

    try {
      const serverContent = await fs.readFile(serverPath, "utf-8");
      const servers = JSON.parse(serverContent);
      
      // Search through all servers for the invite code
      for (const server of Object.values(servers) as any[]) {
        if (server.invites && Array.isArray(server.invites)) {
          inviteData = server.invites.find((inv: any) => inv.id === code);
          if (inviteData) {
            serverData = server;
            break;
          }
        }
      }
    } catch (err) {
      console.error("Failed to read servers:", err);
    }

    if (!inviteData || !serverData) {
      console.error(`❌ Invalid invite code: ${code}`);
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      );
    }

    const result: InviteData = {
      id: code,
      serverId: serverData.id,
      serverName: serverData.name,
      serverIcon: serverData.icon,
      description: serverData.description,
      memberCount: serverData.members?.length || 0,
      isValid: true,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Invite info fetch error:", error);
    return NextResponse.json(
      { error: "Failed to get invite info" },
      { status: 500 }
    );
  }
}
