// @ts-nocheck
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, name").eq("id", user.id).single();

  if (profile?.role !== "superadmin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <AdminSidebar name={profile?.name ?? "Admin"} />
      <main style={{ flex: 1, marginLeft: 240, padding: "24px 28px", minWidth: 0, overflowX: "hidden", boxSizing: "border-box" }}>
        {children}
      </main>
    </div>
  );
}
