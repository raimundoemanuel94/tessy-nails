import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const source = new URL(req.url);
  const target = new URL("/api/public/slots", source.origin);

  source.searchParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });

  return NextResponse.redirect(target, 308);
}
