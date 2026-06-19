// @ts-nocheck
import { NextResponse } from "next/server";
import { requireSuperadmin } from "../../../_shared";

export async function POST(request: Request, { params }: { params: Promise<{ studioId: string }> }) {
  const auth = await requireSuperadmin();
  if ("response" in auth) return auth.response;

  const { admin } = auth;
  const { studioId } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const price = Number(body.price);
  const durationMinutes = Number(body.durationMinutes);
  const bufferMinutes = Number(body.bufferMinutes ?? 0);

  if (!name || !Number.isFinite(price) || !Number.isFinite(durationMinutes)) {
    return NextResponse.json({ error: "Campos obrigatórios inválidos" }, { status: 400 });
  }

  const { data: service, error } = await admin
    .from("services")
    .insert({
      studio_id: studioId,
      name,
      price,
      duration_minutes: durationMinutes,
      buffer_minutes: Number.isFinite(bufferMinutes) ? bufferMinutes : 0,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: service.id }, { status: 201 });
}
