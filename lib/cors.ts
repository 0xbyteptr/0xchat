import { NextResponse } from "next/server";

export function corsJson(data: any, init?: ResponseInit, origin?: string) {
  const allowOrigin = origin || "*";

  // 204 No Content must not include a response body. Create an empty
  // NextResponse when status is 204 to avoid the Edge runtime throwing
  // "Invalid response status code 204" when a body is included.
  let res: NextResponse;
  if (init && init.status === 204) {
    res = new NextResponse(null, init);
  } else {
    res = NextResponse.json(data, init);
  }

  res.headers.set("Access-Control-Allow-Origin", allowOrigin);
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  return res;
}
