import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

async function getAdminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function requireSuperadmin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: profile } = await sb.from("profiles").select("role, email, name").eq("id", user.id).single();
  if (profile?.role !== "superadmin") return null;
  return { user, profile };
}

async function logAction(actor: any, action: string, entity: string, entityId: string, details: any) {
  const sb = await createClient();
  await sb.from("audit_logs").insert({
    actor_id: actor.user.id,
    actor_email: actor.profile.email,
    action, entity, entity_id: entityId, details,
  });
}

export async function POST(req: NextRequest) {
  const actor = await requireSuperadmin();
  if (!actor) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  if (action === "create_admin") {
    const { email, password, name } = body;
    if (!email || !password || !name) return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    const admin = await getAdminClient();
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await admin.from("profiles").update({ name, role: "superadmin", email }).eq("id", data.user.id);
    await logAction(actor, "create_admin", "profiles", data.user.id, { email, name });
    return NextResponse.json({ ok: true, userId: data.user.id });
  }

  if (action === "reset_password") {
    const { email } = body;
    if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
    const sb = await createClient();
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://tessy-nails.vercel.app"}/login`,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await logAction(actor, "reset_password", "profiles", email, { email });
    return NextResponse.json({ ok: true });
  }

  if (action === "update_trial") {
    const { studioId, days, status } = body;
    if (!studioId) return NextResponse.json({ error: "Studio obrigatório" }, { status: 400 });
    const sb = await createClient();
    const updates: any = {};
    if (days != null) {
      const d = new Date();
      d.setDate(d.getDate() + Number(days));
      updates.trial_ends_at = d.toISOString();
    }
    if (status) updates.subscription_status = status;
    const { error } = await sb.from("studios").update(updates).eq("id", studioId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await logAction(actor, "update_trial", "studios", studioId, { days, status });
    return NextResponse.json({ ok: true });
  }

  if (action === "impersonate") {
    const { ownerEmail, studioId } = body;
    if (!ownerEmail) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
    const admin = await getAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: ownerEmail,
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://tessy-nails.vercel.app"}/dashboard` },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await logAction(actor, "impersonate", "studios", studioId ?? ownerEmail, { ownerEmail });
    return NextResponse.json({ ok: true, link: data.properties?.action_link });
  }

  if (action === "manual_charge") {
    const { studioId, amount, notes } = body;
    if (!studioId) return NextResponse.json({ error: "Studio obrigatório" }, { status: 400 });
    await logAction(actor, "manual_charge_attempt", "studios", studioId, { amount, notes });
    return NextResponse.json({ ok: true, message: "Registrado nos logs. Stripe pendente." });
  }

  return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
}
