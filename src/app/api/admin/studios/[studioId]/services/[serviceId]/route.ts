// @ts-nocheck
import { NextResponse } from "next/server";
import { requireSuperadmin } from "../../../../_shared";

export async function PUT(request: Request, { params }: { params: { studioId: string; serviceId: string } }) {
  const auth = await requireSuperadmin();
  if ("response" in auth) return auth.response;

  const { admin } = auth;
  const { studioId, serviceId } = params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    if (!body.name.trim()) return NextResponse.json({ error: "Nome não pode ser vazio" }, { status: 400 })
    payload.name = body.name.trim()
  }
  if (body.price !== undefined) {
    const p = Number(body.price)
    if (!Number.isFinite(p) || p < 0) return NextResponse.json({ error: "Preço deve ser >= 0" }, { status: 400 })
    payload.price = p
  }
  if (body.durationMinutes !== undefined) {
    const d = Number(body.durationMinutes)
    if (!Number.isFinite(d) || d <= 0) return NextResponse.json({ error: "Duração deve ser > 0" }, { status: 400 })
    payload.duration_minutes = d
  }
  if (body.bufferMinutes !== undefined) {
    const b = Number(body.bufferMinutes)
    if (!Number.isFinite(b) || b < 0) return NextResponse.json({ error: "Buffer deve ser >= 0" }, { status: 400 })
    payload.buffer_minutes = b
  }
  if (typeof body.isActive === "boolean") payload.is_active = body.isActive;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const { error } = await admin
    .from("services")
    .update(payload)
    .eq("studio_id", studioId)
    .eq("id", serviceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { studioId: string; serviceId: string } }) {
  const auth = await requireSuperadmin();
  if ("response" in auth) return auth.response;

  const { admin } = auth;
  const { studioId, serviceId } = params;

  const { error } = await admin
    .from("services")
    .delete()
    .eq("studio_id", studioId)
    .eq("id", serviceId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
