import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, studios!studios_owner_id_fkey(id, name, slug, plan, avatar_url, brand_color)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  // Superadmin não precisa de studio — profissional sim
  if (profile.role !== "superadmin" && !profile.studio_id) redirect("/setup");

  return (
    <div className="flex min-h-screen" style={{ background: "#080812" }}>
      <Sidebar profile={profile} />
      <main className="dash-main">
        {children}
      </main>
    </div>
  );
}
