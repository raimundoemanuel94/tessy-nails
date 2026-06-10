// @ts-nocheck
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, name, email").eq("id", user.id).single();

  if (profile?.role !== "superadmin") redirect("/dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <AdminSidebar name={profile?.name ?? "Admin"} email={profile?.email ?? ""} />
      <main className="dash-admin">
        {children}
      </main>
    </div>
  );
}
