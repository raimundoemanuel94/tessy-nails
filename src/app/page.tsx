// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPostAuthRedirectPath } from "@/lib/auth/post-auth-redirect";

export default async function Root() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, studio_id")
    .eq("id", user.id)
    .maybeSingle();

  redirect(getPostAuthRedirectPath(profile));
}
