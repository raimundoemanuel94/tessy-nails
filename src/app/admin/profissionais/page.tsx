import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfissionaisClient } from "./ProfissionaisClient";

export const dynamic = "force-dynamic";

export default async function AdminProfissionaisPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "superadmin") redirect("/dashboard");

  const [{ data: profiles }, { data: studios }] = await Promise.all([
    sb.from("profiles").select("id, name, email, role, studio_id, created_at, studios!studios_owner_id_fkey(id, name, slug)").order("created_at", { ascending: false }),
    sb.from("studios").select("id, name, slug, owner_id, is_active, subscription_status, trial_ends_at"),
  ]);

  return <ProfissionaisClient initialProfiles={profiles ?? []} studios={studios ?? []} />;
}
