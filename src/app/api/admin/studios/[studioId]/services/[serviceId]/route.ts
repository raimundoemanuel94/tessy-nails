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

  if (typeof body.name === "string") payload.name = body.name.trim();
  if (body.price !== undefined) payload.price = Number(body.price);
  if (body.durationMinutes !== undefined) payload.duration_minutes = Number(body.durationMinutes);
  if (body.bufferMinutes !== undefined) payload.buffer_minutes = Number(body.bufferMinutes);
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
