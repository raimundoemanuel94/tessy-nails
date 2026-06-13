import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(req: Request, { params }: RouteContext) {
  const { slug } = await params;
  const target = new URL(`/api/public/studios/${encodeURIComponent(slug)}`, req.url);

  return NextResponse.redirect(target, 308);
}
