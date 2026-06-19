import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role !== "superadmin" && !profile.studio_id) redirect("/setup");

  const { data: studio } = profile.studio_id
    ? await supabase
        .from("studios")
        .select("name, slug, plan, avatar_url")
        .eq("id", profile.studio_id)
        .maybeSingle()
    : { data: null };

  const sidebarProfile = { ...profile, studios: studio };

  return (
    <div className="salon-shell flex min-h-screen" style={{ background: "#080812" }}>
      <Sidebar profile={sidebarProfile} />
      <main className="dash-main">
        {children}
      </main>
    </div>
  );
}
