import { NextResponse } from "next/server";
import { getWSServer } from "@/lib/ws-server";

export async function GET() {
  getWSServer();
  return NextResponse.json({ ok: true });
}