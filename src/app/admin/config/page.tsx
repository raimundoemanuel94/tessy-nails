/* eslint-disable */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConfigClient } from "./ConfigClient";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "superadmin") redirect("/dashboard");

  const [
    { data: plans },
    { data: studios },
    { data: settings },
    { count: clientsCount },
    { count: appointmentsCount },
    { count: professionalsCount },
  ] = await Promise.all([
    sb.from("plan_prices").select("plan, label, price, updated_at").order("price"),
    sb.from("studios").select("id, name, plan, is_active, subscription_status, mrr, created_at"),
    sb.from("salon_settings").select("studio_id, slot_duration, advance_days, cancel_hours, auto_confirm, working_hours"),
    sb.from("clients").select("id", { count: "exact", head: true }),
    sb.from("appointments").select("id", { count: "exact", head: true }),
    sb.from("profiles").select("id", { count: "exact", head: true }).in("role", ["owner", "professional"]),
  ]);

  const envStatus = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    stripeSecret: Boolean(process.env.STRIPE_SECRET_KEY),
    stripePublic: Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    whatsapp: Boolean(process.env.WHATSAPP_API_KEY || process.env.ZAPI_TOKEN || process.env.EVOLUTION_API_KEY),
    bookingTimezone: process.env.NEXT_PUBLIC_BOOKING_TIME_ZONE || process.env.BOOKING_TIME_ZONE || "America/Cuiaba",
  };

  return (
    <ConfigClient
      plans={plans ?? []}
      studios={studios ?? []}
      settings={settings ?? []}
      counts={{
        clients: clientsCount ?? 0,
        appointments: appointmentsCount ?? 0,
        professionals: professionalsCount ?? 0,
      }}
      envStatus={envStatus}
    />
  );
}
