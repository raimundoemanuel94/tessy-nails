import { NextResponse } from "next/server";
import { isUuid, requireSuperadmin } from "../../../_shared";

type StudioServicesRouteContext = { params: Promise<{ studioId: string }> };

export async function POST(request: Request, { params }: StudioServicesRouteContext) {
  const auth = await requireSuperadmin();
  if ("response" in auth) return auth.response;

  const { admin } = auth;
  const { studioId } = await params;
  const body = await request.json().catch(() => null);

  if (!isUuid(studioId)) {
    return NextResponse.json({ error: "Studio não encontrado" }, { status: 404 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const price = Number(body.price);
  const durationMinutes = Number(body.durationMinutes);
  const bufferMinutes = Number(body.bufferMinutes ?? 0);

  if (!name || !Number.isFinite(price) || price < 0 || !Number.isFinite(durationMinutes) || durationMinutes <= 0 || bufferMinutes < 0) {
    return NextResponse.json({ error: "Campos inválidos: preço deve ser >= 0, duração > 0" }, { status: 400 });
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
