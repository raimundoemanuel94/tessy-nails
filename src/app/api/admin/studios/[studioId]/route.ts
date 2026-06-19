/* eslint-disable */
import { NextResponse } from "next/server";
import { mapServiceRow, mapSettingsRow, mapStudioRow, requireSuperadmin } from "../../_shared";

type StudioRouteContext = { params: Promise<{ studioId: string }> };

export async function GET(_: Request, { params }: StudioRouteContext) {
  const auth = await requireSuperadmin();
  if ("response" in auth) return auth.response;

  const { admin } = auth;
  const { studioId } = await params;

  const { data: studio, error: studioError } = await admin
    .from("studios")
    .select("id, name, slug, owner_id, phone, plan, is_active, subscription_status, mrr, next_billing_date, trial_ends_at, created_at, updated_at")
    .eq("id", studioId)
    .maybeSingle();

  if (studioError) {
    return NextResponse.json({ error: studioError.message }, { status: 500 });
  }

  if (!studio) {
    return NextResponse.json({ error: "Studio não encontrado" }, { status: 404 });
  }

  const [
    { data: owner },
    { data: services, error: servicesError },
    { data: settings },
    { count: appointmentsCount, error: appointmentsError },
  ] = await Promise.all([
    studio.owner_id
      ? admin
          .from("profiles")
          .select("id, name, email, phone, role")
          .eq("id", studio.owner_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("services")
      .select("id, name, price, duration_minutes, buffer_minutes, is_active")
      .eq("studio_id", studioId)
      .order("name", { ascending: true }),
    admin
      .from("salon_settings")
      .select("slot_duration, advance_days, cancel_hours, auto_confirm, working_hours")
      .eq("studio_id", studioId)
      .maybeSingle(),
    admin
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("studio_id", studioId),
  ]);

  if (servicesError) {
    return NextResponse.json({ error: servicesError.message }, { status: 500 });
  }

  if (appointmentsError) {
    return NextResponse.json({ error: appointmentsError.message }, { status: 500 });
  }

  return NextResponse.json({
    studio: mapStudioRow(studio),
    owner: owner
      ? {
          uid: owner.id,
          name: owner.name ?? "",
          email: owner.email ?? "",
          phone: owner.phone ?? null,
          role: owner.role ?? "",
        }
      : null,
    services: (services ?? []).map(mapServiceRow),
    settings: mapSettingsRow(settings),
    stats: {
      appointments: appointmentsCount ?? 0,
      services: (services ?? []).length,
    },
  });
}

export async function PUT(request: Request, { params }: StudioRouteContext) {
  const auth = await requireSuperadmin();
  if ("response" in auth) return auth.response;

  const { admin } = auth;
  const { studioId } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim()
    if (!name) return NextResponse.json({ error: "Nome não pode ser vazio" }, { status: 400 })
    payload.name = name
  }
  if (typeof body.slug === "string") {
    const slug = body.slug.trim().toLowerCase()
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: "Slug inválido: use apenas letras minúsculas, números e hífens" }, { status: 400 })
    }
    const { data: conflict } = await admin.from("studios").select("id").eq("slug", slug).neq("id", studioId).maybeSingle()
    if (conflict) return NextResponse.json({ error: "Este slug já está em uso por outro studio" }, { status: 409 })
    payload.slug = slug
  }
  if (typeof body.plan === "string") payload.plan = body.plan.trim();
  if (typeof body.isActive === "boolean") payload.is_active = body.isActive;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
  }

  const { error } = await admin.from("studios").update(payload).eq("id", studioId);

  if (error) {
    const status = error.message.toLowerCase().includes("unique") ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ ok: true });
}
