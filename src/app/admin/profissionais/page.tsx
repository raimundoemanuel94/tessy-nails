// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { Building2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminProfissionaisPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, role, studio_id, studios!studios_owner_id_fkey(name, slug)")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Profissionais</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>{profiles?.length ?? 0} contas na plataforma</p>
      </div>

      <div className="card space-y-4">
        <div className="p-3 rounded-xl text-xs" style={{ background: "var(--surface2)", color: "var(--muted)" }}>
          💡 Para adicionar uma nova manicure:
          <ol className="mt-2 space-y-1 list-decimal list-inside">
            <li>Peça para ela criar uma conta em <strong style={{ color: "var(--brand-light)" }}>/login</strong></li>
            <li>Vá em <Link href="/admin/studios" style={{ color: "#f59e0b" }}>Studios</Link> → crie o studio dela</li>
            <li>Edite o studio → vincule o profissional</li>
            <li>Ela já consegue logar e ver o próprio dashboard</li>
          </ol>
        </div>

        <div className="flex flex-col gap-2">
          {(profiles ?? []).map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shrink-0"
                style={{ background: p.role === "superadmin" ? "#f59e0b" : "var(--brand)", color: p.role === "superadmin" ? "#000" : "#fff" }}>
                {(p.name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{p.name ?? "—"}</p>
                  <span className={`badge ${p.role === "superadmin" ? "badge-yellow" : "badge-purple"}`}>{p.role}</span>
                </div>
                <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{p.email}</p>
              </div>
              <div className="shrink-0 text-right">
                {p.studios
                  ? <div className="flex items-center gap-1 text-xs" style={{ color: "#4ade80" }}>
                      <Building2 size={11} /> {p.studios.name}
                    </div>
                  : <span className="text-xs" style={{ color: p.role === "superadmin" ? "#f59e0b" : "#f87171" }}>
                      {p.role === "superadmin" ? "Admin geral" : "Sem studio"}
                    </span>
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
