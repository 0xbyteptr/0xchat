import { NextResponse } from "next/server";

export function corsJson(data: any, init?: ResponseInit, origin?: string) {
  const res = NextResponse.json(data, init);
  const allowOrigin = origin || "*";
  res.headers.set("Access-Control-Allow-Origin", allowOrigin);
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  return res;
}
