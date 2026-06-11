// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import {
  Building2, Users, CalendarDays, TrendingUp,
  ArrowUpRight, CheckCircle, Circle, Plus,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const fmtBRL = (n: number) =>
  n === 0 ? "R$ 0,00" : `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

function relTime(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "agora mesmo";
  if (s < 3600) return `${Math.floor(s / 60)}m atrás`;
  if (s < 86400) return `${Math.floor(s / 3600)}h atrás`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d atrás`;
  return new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

const PLAN_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  pro:     { color: "#818cf8", bg: "rgba(99,102,241,0.10)",  border: "rgba(99,102,241,0.22)"  },
  starter: { color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.22)"  },
  free:    { color: "#71717a", bg: "rgba(113,113,122,0.10)", border: "rgba(113,113,122,0.20)" },
  studio:  { color: "#f472b6", bg: "rgba(244,114,182,0.10)", border: "rgba(244,114,182,0.22)" },
};

const C = {
  card:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  sep:    "rgba(255,255,255,0.05)",
  text:   "#f4f4f5",
  sub:    "#a1a1aa",
  muted:  "#52525b",
  r:      10,
};

export default async function AdminPage() {
  const sb = await createClient();

  const [
    { data: studios },
    { data: profiles },
    { data: appts },
  ] = await Promise.all([
    sb.from("studios").select("id,name,slug,plan,is_active,created_at").order("created_at", { ascending: false }),
    sb.from("profiles").select("id,role,created_at"),
    sb.from("appointments").select("price,status,created_at"),
  ]);

  const allStudios  = studios  ?? [];
  const allProfiles = profiles ?? [];
  const allAppts    = appts    ?? [];

  const activeStudios = allStudios.filter(s => s.is_active).length;
  const totalAppts    = allAppts.length;
  const completedAppts= allAppts.filter(a => a.status === "completed").length;
  const pendingAppts  = allAppts.filter(a => a.status === "pending").length;
  const revenue       = allAppts.filter(a => a.status === "completed").reduce((s, a) => s + (a.price ?? 0), 0);
  const owners        = allProfiles.filter(p => p.role === "owner").length;
  const recentStudios = allStudios.slice(0, 5);

  const planCount = allStudios.reduce((acc, s) => {
    acc[s.plan] = (acc[s.plan] ?? 0) + 1; return acc;
  }, {} as Record<string, number>);

  /* Last 6 months — studio signups */
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      label: d.toLocaleDateString("pt-BR", { month: "short" }),
      y: d.getFullYear(), m: d.getMonth(),
    };
  });
  const monthlyStudios = months.map(({ label, y, m }) => ({
    label,
    n: allStudios.filter(s => {
      const d = new Date(s.created_at);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length,
  }));
  const maxMonth = Math.max(...monthlyStudios.map(x => x.n), 1);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1120 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 5 }}>
            Platform Overview
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.025em", lineHeight: 1 }}>
            {greeting}
          </h1>
          <p style={{ color: C.muted, margin: "5px 0 0", fontSize: 13 }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link href="/admin/studios" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 8, textDecoration: "none",
          background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
          fontSize: 13, fontWeight: 600, color: "#818cf8",
        }}>
          <Plus size={13}/> Novo Studio
        </Link>
      </div>

      {/* ── KPI grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          {
            label: "Studios ativos", value: `${activeStudios}`,
            sub: `${allStudios.length - activeStudios} inativo(s)`,
            icon: Building2, color: "#6366f1",
          },
          {
            label: "Usuários", value: String(allProfiles.length),
            sub: `${owners} owner(s)`,
            icon: Users, color: "#22c55e",
          },
          {
            label: "Agendamentos", value: String(totalAppts),
            sub: `${pendingAppts} pendente(s)`,
            icon: CalendarDays, color: "#60a5fa",
          },
          {
            label: "Receita", value: fmtBRL(revenue),
            sub: `${completedAppts} concluído(s)`,
            icon: TrendingUp, color: "#a78bfa",
          },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: C.r, padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
              <div style={{
                width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                background: `${color}14`, border: `1px solid ${color}28`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={12} color={color}/>
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 4 }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main two-column ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12, alignItems: "start" }}>

        {/* Studios recentes */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, overflow: "hidden" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "13px 18px", borderBottom: `1px solid ${C.sep}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Studios recentes</span>
              {allStudios.length > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 20,
                  background: "rgba(255,255,255,0.05)", color: C.muted, border: `1px solid ${C.border}`,
                }}>{allStudios.length}</span>
              )}
            </div>
            <Link href="/admin/studios" style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 12, fontWeight: 500, color: C.muted, textDecoration: "none",
            }} className="a-nav-item">
              Ver todos <ArrowUpRight size={11}/>
            </Link>
          </div>

          {recentStudios.length === 0 ? (
            /* Empty state */
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, margin: "0 auto 14px",
                background: "rgba(99,102,241,0.08)", border: "1px dashed rgba(99,102,241,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Building2 size={20} color="#6366f1" style={{ opacity: 0.5 }}/>
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.sub, marginBottom: 4 }}>Nenhum studio ainda</p>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>Crie o primeiro studio da plataforma</p>
              <Link href="/admin/studios" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8, textDecoration: "none",
                background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.22)",
                fontSize: 13, fontWeight: 600, color: "#818cf8",
              }}>
                <Plus size={13}/> Criar studio
              </Link>
            </div>
          ) : (
            <>
              {/* Col headers */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 72px 68px 28px",
                padding: "6px 18px", borderBottom: `1px solid ${C.sep}`,
              }}>
                {["Studio", "Plano", "Status", ""].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</span>
                ))}
              </div>
              {recentStudios.map((s, i) => {
                const pc = PLAN_COLORS[s.plan] ?? PLAN_COLORS.free;
                return (
                  <Link key={s.id} href={`/admin/studios/${s.id}`} className="a-link-row" style={{
                    display: "grid", gridTemplateColumns: "1fr 72px 68px 28px",
                    alignItems: "center", padding: "12px 18px", textDecoration: "none",
                    borderBottom: i < recentStudios.length - 1 ? `1px solid ${C.sep}` : "none",
                    opacity: s.is_active ? 1 : 0.5,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                        background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.20)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700, color: "#818cf8",
                      }}>{s.name.charAt(0).toUpperCase()}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                        <div style={{ fontSize: 10, color: C.muted }}>{relTime(s.created_at)}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
                      {s.plan}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.is_active ? "#22c55e" : "#3f3f46" }}/>
                      <span style={{ fontSize: 11, color: s.is_active ? "#4ade80" : C.muted }}>
                        {s.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <ArrowUpRight size={12} color={C.muted}/>
                  </Link>
                );
              })}
            </>
          )}
        </div>

        {/* ── Right panel ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Planos */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, padding: "15px 16px" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 14 }}>Planos</p>
            {allStudios.length === 0 ? (
              <p style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "8px 0" }}>Sem dados</p>
            ) : (
              Object.entries(PLAN_COLORS).map(([plan, pc]) => {
                const n = planCount[plan] ?? 0;
                if (!n) return null;
                const pct = Math.round((n / allStudios.length) * 100);
                return (
                  <div key={plan} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: C.sub, textTransform: "capitalize" }}>{plan}</span>
                      <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: pc.color }}>{n}</span>
                        <span style={{ fontSize: 10, color: C.muted }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: pc.color, opacity: 0.7 }}/>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick actions */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, overflow: "hidden" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, padding: "13px 14px 10px" }}>Ações rápidas</p>
            {[
              { href: "/admin/studios",      label: "Criar novo studio",   desc: "Adicionar à plataforma",  icon: Building2,    color: "#6366f1" },
              { href: "/admin/profissionais", label: "Ver usuários",        desc: "Gerenciar contas",        icon: Users,        color: "#22c55e" },
              { href: "/admin/relatorios",    label: "Ver relatórios",      desc: "Métricas da plataforma",  icon: TrendingUp,   color: "#a78bfa" },
            ].map(({ href, label, desc, icon: Icon, color }, i, arr) => (
              <Link key={href} href={href} className="a-link-row" style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", textDecoration: "none",
                borderTop: i > 0 ? `1px solid ${C.sep}` : "none",
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: `${color}12`, border: `1px solid ${color}22`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={13} color={color}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>{label}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{desc}</div>
                </div>
                <ArrowUpRight size={11} color={C.muted} style={{ flexShrink: 0 }}/>
              </Link>
            ))}
          </div>

          {/* System status */}
          <div style={{
            background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.14)",
            borderRadius: C.r, padding: "12px 14px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <CheckCircle size={13} color="#22c55e" style={{ flexShrink: 0 }}/>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#4ade80" }}>Sistemas operacionais</span>
            </div>
            <div style={{ display: "flex", gap: 12, paddingLeft: 20 }}>
              {["Supabase", "Vercel", "Auth"].map(s => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#22c55e" }}/>
                  <span style={{ fontSize: 10, color: C.muted }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* Crescimento mensal */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, margin: 0 }}>Novos studios — últimos 6 meses</p>
            <span style={{ fontSize: 11, color: C.muted }}>{allStudios.length} total</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 72 }}>
            {monthlyStudios.map(({ label, n }) => {
              const h = Math.max(4, Math.round((n / maxMonth) * 60));
              return (
                <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  {n > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: C.sub }}>{n}</span>}
                  <div style={{
                    width: "100%", height: h, borderRadius: 4,
                    background: n > 0 ? "rgba(99,102,241,0.40)" : "rgba(255,255,255,0.04)",
                    border: n > 0 ? "1px solid rgba(99,102,241,0.28)" : `1px solid ${C.sep}`,
                  }}/>
                  <span style={{ fontSize: 10, color: C.muted, textTransform: "capitalize" }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumo da plataforma */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, padding: "16px 18px" }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 14 }}>Resumo da plataforma</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { label: "Studios inativos",  value: `${allStudios.length - activeStudios}`,                                  color: allStudios.length - activeStudios > 0 ? "#f87171" : C.muted },
              { label: "Taxa de conclusão", value: totalAppts > 0 ? `${Math.round((completedAppts / totalAppts) * 100)}%` : "—", color: C.sub },
              { label: "Ticket médio",      value: completedAppts > 0 ? fmtBRL(revenue / completedAppts) : "—",              color: C.sub },
              { label: "Owners vinculados", value: String(owners),                                                            color: C.sub },
              { label: "Plano mais usado",  value: Object.entries(planCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",   color: C.sub },
            ].map(({ label, value, color }, i, arr) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: i < arr.length - 1 ? `1px solid ${C.sep}` : "none",
              }}>
                <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
