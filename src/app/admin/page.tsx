// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { Building2, Users, CalendarDays, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const PLAN_COLOR: Record<string, { color: string; bg: string; border: string }> = {
  pro:     { color: "#818cf8", bg: "rgba(99,102,241,0.10)",  border: "rgba(99,102,241,0.22)"  },
  starter: { color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.22)"  },
  free:    { color: "#71717a", bg: "rgba(113,113,122,0.10)", border: "rgba(113,113,122,0.20)" },
  studio:  { color: "#f472b6", bg: "rgba(244,114,182,0.10)", border: "rgba(244,114,182,0.22)" },
};

function relativeTime(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `${Math.floor(diff/60)}m atrás`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h atrás`;
  if (diff < 2592000) return `${Math.floor(diff/86400)}d atrás`;
  return new Date(dateStr).toLocaleDateString("pt-BR", { day:"numeric", month:"short" });
}

const C = {
  bg:     "#09090b",
  card:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  sep:    "rgba(255,255,255,0.05)",
  text:   "#f4f4f5",
  sub:    "#a1a1aa",
  muted:  "#52525b",
  r:      10,
};

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: studios }, { data: profiles }, { data: appts }] = await Promise.all([
    supabase.from("studios").select("id, name, slug, plan, is_active, created_at").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, role"),
    supabase.from("appointments").select("price, status"),
  ]);

  const totalStudios  = studios?.length ?? 0;
  const activeStudios = studios?.filter(s => s.is_active).length ?? 0;
  const totalUsers    = profiles?.length ?? 0;
  const totalAppts    = appts?.length ?? 0;
  const pending       = appts?.filter(a => a.status === "pending").length ?? 0;
  const totalRevenue  = appts?.filter(a => a.status === "completed").reduce((s, a) => s + (a.price ?? 0), 0) ?? 0;
  const recentStudios = (studios ?? []).slice(0, 6);

  const planCount = (studios ?? []).reduce((acc, s) => {
    acc[s.plan] = (acc[s.plan] ?? 0) + 1; return acc;
  }, {} as Record<string, number>);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const kpis = [
    { label: "Studios ativos",  value: `${activeStudios}/${totalStudios}`, sub: `${totalStudios - activeStudios} inativo${totalStudios - activeStudios !== 1 ? "s" : ""}`,  icon: Building2,    color: "#6366f1" },
    { label: "Usuários",         value: String(totalUsers),                  sub: `${profiles?.filter(p => p.role === "owner").length ?? 0} owners`,                           icon: Users,        color: "#22c55e" },
    { label: "Agendamentos",     value: String(totalAppts),                  sub: `${pending} pendente${pending !== 1 ? "s" : ""}`,                                             icon: CalendarDays, color: "#60a5fa" },
    { label: "Receita",          value: fmt(totalRevenue),                   sub: "concluídos",                                                                                  icon: TrendingUp,   color: "#a78bfa" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: C.muted, letterSpacing: "0.06em",
            textTransform: "uppercase", marginBottom: 6 }}>Platform Overview</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.025em", lineHeight: 1 }}>
            {greeting}
          </h1>
          <p style={{ color: C.muted, margin: "5px 0 0", fontSize: 13 }}>
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link href="/admin/studios" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 16px", borderRadius: 8, textDecoration: "none",
          background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
          fontSize: 13, fontWeight: 600, color: "#818cf8",
        }}>
          + Novo Studio
        </Link>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: C.r, padding: "18px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: C.muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                {label}
              </span>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: `${color}14`, border: `1px solid ${color}28`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={13} color={color}/>
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 4 }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 256px", gap: 14, alignItems: "start" }}>

        {/* Studios table */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, overflow: "hidden" }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px", borderBottom: `1px solid ${C.sep}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Studios recentes</span>
              {totalStudios > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 20,
                  background: "rgba(255,255,255,0.06)", color: C.sub,
                  border: `1px solid ${C.border}`,
                }}>{totalStudios}</span>
              )}
            </div>
            <Link href="/admin/studios" style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 12, fontWeight: 500, color: C.muted, textDecoration: "none",
              transition: "color .12s",
            }}
              className="a-nav-link"
            >
              Ver todos <ArrowUpRight size={11}/>
            </Link>
          </div>

          {recentStudios.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 76px 72px 32px",
              padding: "6px 18px", borderBottom: `1px solid ${C.sep}`,
            }}>
              {["Studio", "Plano", "Status", ""].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
          )}

          {recentStudios.length === 0 ? (
            <div style={{ padding: "48px 18px", textAlign: "center" }}>
              <Building2 size={24} color={C.muted} style={{ opacity: 0.4, marginBottom: 12 }}/>
              <p style={{ fontSize: 13, fontWeight: 500, color: C.sub, marginBottom: 4 }}>Nenhum studio</p>
              <p style={{ fontSize: 12, color: C.muted }}>Crie o primeiro studio da plataforma</p>
            </div>
          ) : (
            recentStudios.map((s, i) => {
              const pc = PLAN_COLOR[s.plan] ?? PLAN_COLOR.free;
              return (
                <Link key={s.id} href={`/admin/studios/${s.id}`}
                  className="a-link-row"
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 76px 72px 32px",
                    alignItems: "center", padding: "12px 18px", textDecoration: "none",
                    borderBottom: i < recentStudios.length - 1 ? `1px solid ${C.sep}` : "none",
                    opacity: s.is_active ? 1 : 0.5,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "#818cf8",
                    }}>{s.name.charAt(0).toUpperCase()}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace" }}>/{s.slug}</div>
                    </div>
                  </div>
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
                      background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`,
                    }}>{s.plan}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: s.is_active ? "#22c55e" : "#3f3f46", flexShrink: 0,
                    }}/>
                    <span style={{ fontSize: 11, color: s.is_active ? "#22c55e" : C.muted }}>
                      {s.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <ArrowUpRight size={12} color={C.muted}/>
                </Link>
              );
            })
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Plan distribution */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, padding: "16px 18px" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>Planos</p>
            {totalStudios === 0 ? (
              <p style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "10px 0" }}>Sem dados ainda</p>
            ) : (
              Object.entries(PLAN_COLOR).map(([plan, pc]) => {
                const count = planCount[plan] ?? 0;
                if (!count) return null;
                const pct = Math.round((count / (totalStudios || 1)) * 100);
                return (
                  <div key={plan} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: C.sub, textTransform: "capitalize" }}>{plan}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>{count}</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 3, width: `${pct}%`,
                        background: pc.color, opacity: 0.7,
                        transition: "width .4s ease",
                      }}/>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick actions */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, padding: "16px 18px" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>Ações rápidas</p>
            {[
              { href: "/admin/studios",       label: "Gerenciar studios",  icon: Building2 },
              { href: "/admin/profissionais",  label: "Ver usuários",       icon: Users     },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className="a-link-row"
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "9px 10px", borderRadius: 7, textDecoration: "none",
                  border: `1px solid ${C.sep}`,
                  marginBottom: 6,
                }}
              >
                <Icon size={13} color={C.sub}/>
                <span style={{ fontSize: 12, fontWeight: 500, color: C.sub, flex: 1 }}>{label}</span>
                <ArrowUpRight size={11} color={C.muted}/>
              </Link>
            ))}
          </div>

          {/* System status */}
          <div style={{
            background: "rgba(34,197,94,0.04)",
            border: "1px solid rgba(34,197,94,0.15)",
            borderRadius: C.r, padding: "12px 14px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }}/>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#4ade80" }}>Sistemas operacionais</span>
            </div>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 4, paddingLeft: 12 }}>
              Supabase · Vercel · Auth
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
