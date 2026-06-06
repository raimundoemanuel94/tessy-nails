// @ts-nocheck
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Busca direto do banco — ignora JWT cacheado
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, studios!studios_owner_id_fkey(name, slug, plan)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Se não tem studio_id, tenta encontrar pelo owner_id diretamente
  // (resolve casos onde o profile foi atualizado depois do login)
  if (profile.role !== "superadmin" && !profile.studio_id) {
    const { data: studioByOwner } = await supabase
      .from("studios")
      .select("id")
      .eq("owner_id", user.id)
      .eq("is_active", true)
      .single();

    if (studioByOwner) {
      // Corrige o profile automaticamente e continua
      await supabase
        .from("profiles")
        .update({ studio_id: studioByOwner.id })
        .eq("id", user.id);

      // Recarrega o profile com studio_id correto
      const { data: profileFixed } = await supabase
        .from("profiles")
        .select("*, studios!studios_owner_id_fkey(name, slug, plan)")
        .eq("id", user.id)
        .single();

      return (
        <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
          <Sidebar profile={profileFixed ?? profile} />
          <main className="flex-1 md:ml-64 p-4 md:p-6 pb-24 md:pb-6">
            {children}
          </main>
        </div>
      );
    }

    redirect("/setup");
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar profile={profile} />
      <main className="flex-1 md:ml-64 p-4 md:p-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}
