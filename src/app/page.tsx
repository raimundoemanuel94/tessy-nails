// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Root() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, studio_id").eq("id", user.id).single();

  // Superadmin vai direto pro dashboard (sem precisar de studio)
  if (profile?.role === "superadmin") redirect("/dashboard");

  // Profissional sem studio → setup
  if (!profile?.studio_id) redirect("/setup");

  redirect("/dashboard");
}
