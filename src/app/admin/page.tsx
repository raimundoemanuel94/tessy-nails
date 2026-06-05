// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { Building2, Users, CalendarDays, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: studios }, { data: profiles }, { data: appts }] = await Promise.all([
    supabase.from("studios").select("id, name, slug, plan, is_active, created_at"),
    supabase.from("profiles").select("id, role"),
    supabase.from("appointments").select("price, status"),
  ]);

  const totalStudios  = studios?.length ?? 0;
  const activeStudios = studios?.filter(s => s.is_active).length ?? 0;
  const totalProfs    = profiles?.filter(p => p.role === "professional").length ?? 0;
  const totalAppts    = appts?.length ?? 0;
  const totalRevenue  = appts?.filter(a => a.status === "completed").reduce((s, a) => s + (a.price ?? 0), 0) ?? 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Painel Admin</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Visão geral da plataforma</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Studios ativos",   value: `${activeStudios}/${totalStudios}`, icon: Building2,    color: "#f59e0b" },
          { label: "Profissionais",    value: totalProfs,                          icon: Users,        color: "#818cf8" },
          { label: "Agendamentos",     value: totalAppts,                          icon: CalendarDays, color: "#4ade80" },
          { label: "Receita total",    value: formatCurrency(totalRevenue),        icon: DollarSign,   color: "#f472b6" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{label}</span>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-xl font-black" style={{ color: "var(--text)" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text)" }}>Studios</h2>
          <Link href="/admin/studios" className="text-xs font-bold" style={{ color: "#f59e0b" }}>Ver todos →</Link>
        </div>
        {(studios ?? []).length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>Nenhum studio cadastrado.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(studios ?? []).map(s => (
              <Link key={s.id} href={`/admin/studios/${s.id}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-80"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white shrink-0"
                  style={{ background: "#f59e0b", color: "#000" }}>
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{s.name}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>/agendar/{s.slug}</p>
                </div>
                <span className={`badge ${s.is_active ? "badge-green" : "badge-gray"}`}>
                  {s.is_active ? "Ativo" : "Inativo"}
                </span>
                <span className="badge badge-purple capitalize">{s.plan}</span>
              </Link>
            ))}
          </div>
        )}
        <Link href="/admin/studios"
          className="btn-primary w-full mt-4 justify-center"
          style={{ background: "#f59e0b", color: "#000" }}>
          + Novo Studio / Profissional
        </Link>
      </div>
    </div>
  );
}
