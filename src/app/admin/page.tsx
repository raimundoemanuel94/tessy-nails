// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { Building2, Users, CalendarDays, TrendingUp, ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const PLAN_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  pro:     { bg: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "rgba(167,139,250,0.28)" },
  starter: { bg: "rgba(96,165,250,0.15)",  color: "#60a5fa", border: "rgba(96,165,250,0.28)"  },
  free:    { bg: "rgba(107,107,154,0.12)", color: "#7a7a9a", border: "rgba(107,107,154,0.25)" },
  studio:  { bg: "rgba(244,114,182,0.15)", color: "#f472b6", border: "rgba(244,114,182,0.28)" },
};

function relativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `${Math.floor(diff/60)}m atrás`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h atrás`;
  if (diff < 2592000) return `${Math.floor(diff/86400)}d atrás`;
  return d.toLocaleDateString("pt-BR", { day:"numeric", month:"short" });
}

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

  const C = {
    card:    "rgba(255,255,255,0.05)",
    border:  "rgba(255,255,255,0.10)",
    border2: "rgba(255,255,255,0.05)",
    text:    "#ede9fe",
    muted:   "#6b6585",
    r:       16,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 30, maxWidth: 1120, position: "relative", zIndex: 1 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", letterSpacing: "0.12em",
            textTransform: "uppercase", marginBottom: 8 }}>Platform Overview</p>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: C.text, margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {greeting}, Admin 👋
          </h1>
          <p style={{ color: C.muted, margin: "7px 0 0", fontSize: 13 }}>
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link href="/admin/studios" style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "11px 20px", borderRadius: 10, textDecoration: "none",
          background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.35)",
          fontSize: 13, fontWeight: 800, color: "#f59e0b",
          boxShadow: "0 2px 12px rgba(245,158,11,0.12)",
          transition: "all .15s",
        }}>
          + Novo Studio <ArrowRight size={13} />
        </Link>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[
          { label: "Studios ativos",  value: `${activeStudios}`,
            sub: `de ${totalStudios} total`,
            icon: Building2,  color: "#f59e0b", glow: "rgba(245,158,11,0.30)" },
          { label: "Usuários",         value: String(totalUsers),
            sub: `${profiles?.filter(p => p.role === "superadmin").length ?? 0} superadmin`,
            icon: Users,       color: "#a78bfa", glow: "rgba(167,139,250,0.30)" },
          { label: "Agendamentos",     value: String(totalAppts),
            sub: `${pending} pendentes`,
            icon: CalendarDays, color: "#34d399", glow: "rgba(52,211,153,0.30)" },
          { label: "Receita total",    value: fmt(totalRevenue),
            sub: "agendamentos concluídos",
            icon: TrendingUp,  color: "#f472b6", glow: "rgba(244,114,182,0.30)" },
        ].map(({ label, value, sub, icon: Icon, color, glow }) => (
          <div key={label} style={{
            position: "relative", overflow: "hidden",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: C.r, padding: "22px 24px",
            transition: "border-color .15s",
          }}>
            {/* Large glow orb */}
            <div style={{
              position: "absolute", top: -40, right: -40,
              width: 140, height: 140, borderRadius: "50%",
              background: glow, filter: "blur(50px)",
              pointerEvents: "none",
            }}/>
            {/* Icon */}
            <div style={{
              position: "relative",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.muted,
                letterSpacing: "0.09em", textTransform: "uppercase" }}>{label}</span>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: `${color}18`, border: `1px solid ${color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={15} color={color}/>
              </div>
            </div>
            {/* Value */}
            <div style={{
              fontSize: 38, fontWeight: 900, color: "#fff", lineHeight: 1,
              letterSpacing: "-0.04em", position: "relative",
              marginBottom: 6,
            }}>{value}</div>
            <div style={{ fontSize: 11, color: C.muted, position: "relative" }}>{sub}</div>
            {/* Bottom accent bar */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
              background: `linear-gradient(90deg,${color},${color}00)`,
            }}/>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", gap: 18, alignItems: "start" }}>

        {/* Studios table */}
        <div style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: C.r, overflow: "hidden",
        }}>
          {/* Table header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 22px", borderBottom: `1px solid ${C.border2}`,
            background: "rgba(255,255,255,0.02)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.text, letterSpacing: "-0.01em" }}>Studios</span>
              {totalStudios > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
                  background: "rgba(245,158,11,0.14)", color: "#f59e0b",
                  border: "1px solid rgba(245,158,11,0.28)",
                }}>{totalStudios}</span>
              )}
            </div>
            <Link href="/admin/studios" style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 700, color: "#f59e0b", textDecoration: "none",
            }}>
              Ver todos <ArrowUpRight size={12}/>
            </Link>
          </div>

          {/* Col headers */}
          {recentStudios.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 80px 80px 36px",
              padding: "7px 22px", borderBottom: `1px solid ${C.border2}`,
            }}>
              {["Studio", "Plano", "Status", ""].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted,
                  letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
          )}

          {recentStudios.length === 0 ? (
            <div style={{ padding: "56px 22px", textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
                background: "rgba(245,158,11,0.08)", border: "1px dashed rgba(245,158,11,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Building2 size={24} color="#f59e0b" style={{ opacity: 0.5 }}/>
              </div>
              <p style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 5 }}>Nenhum studio</p>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Crie o primeiro studio da plataforma</p>
              <Link href="/admin/studios" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 20px", borderRadius: 9, textDecoration: "none",
                background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.30)",
                fontSize: 12, fontWeight: 800, color: "#f59e0b",
              }}>+ Criar studio</Link>
            </div>
          ) : (
            recentStudios.map((s, i) => {
              const pc = PLAN_COLOR[s.plan] ?? PLAN_COLOR.free;
              return (
                <Link key={s.id} href={`/admin/studios/${s.id}`}
                  className="a-link-row"
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 80px 80px 36px",
                    alignItems: "center", padding: "14px 22px", textDecoration: "none",
                    borderBottom: i < recentStudios.length - 1 ? `1px solid ${C.border2}` : "none",
                  }}
                >
                  {/* Studio info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: "linear-gradient(135deg,#f59e0b,#fcd34d)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 900, color: "#000",
                      boxShadow: "0 2px 8px rgba(245,158,11,0.3)",
                    }}>{s.name.charAt(0).toUpperCase()}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace" }}>/{s.slug}</div>
                    </div>
                  </div>
                  {/* Plan */}
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
                      background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`,
                      textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>{s.plan}</span>
                  </div>
                  {/* Status */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className={s.is_active ? "dot-active" : ""} style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: s.is_active ? "#34d399" : "#4a4a6a",
                      flexShrink: 0,
                    }}/>
                    <span style={{ fontSize: 11, fontWeight: 600,
                      color: s.is_active ? "#34d399" : C.muted }}>
                      {s.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {/* Arrow */}
                  <ArrowRight size={13} color={C.muted}/>
                </Link>
              );
            })
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Plan distribution */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: C.r, padding: "18px 20px",
          }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 18, letterSpacing: "-0.01em" }}>
              Planos
            </p>
            {totalStudios === 0 ? (
              <p style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "14px 0" }}>Sem dados ainda</p>
            ) : (
              Object.entries(PLAN_COLOR).map(([plan, pc]) => {
                const count = planCount[plan] ?? 0;
                const pct = Math.round((count / (totalStudios || 1)) * 100);
                return (
                  <div key={plan} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text, textTransform: "capitalize" }}>
                        {plan}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: pc.color }}>{count}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 4, width: `${pct}%`,
                        background: `linear-gradient(90deg,${pc.color},${pc.color}99)`,
                        transition: "width .5s ease",
                      }}/>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick actions */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: C.r, padding: "18px 20px",
          }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 14, letterSpacing: "-0.01em" }}>
              Ações rápidas
            </p>
            {[
              { href: "/admin/studios",       label: "+ Criar studio",  color: "#f59e0b", icon: Building2 },
              { href: "/admin/profissionais",  label: "Ver usuários",   color: "#a78bfa", icon: Users     },
            ].map(({ href, label, color, icon: Icon }) => (
              <Link key={href} href={href}
                className="a-link-row"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 13px", borderRadius: 10, textDecoration: "none",
                  border: `1px solid ${C.border2}`,
                  marginBottom: 8,
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `${color}15`, border: `1px solid ${color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={13} color={color}/>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text, flex: 1 }}>{label}</span>
                <ArrowRight size={12} color={C.muted}/>
              </Link>
            ))}
          </div>

          {/* System status */}
          <div style={{
            background: "rgba(52,211,153,0.06)",
            border: "1px solid rgba(52,211,153,0.18)",
            borderRadius: C.r, padding: "14px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="dot-active" style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "#34d399", flexShrink: 0,
              }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#34d399" }}>Todos os sistemas operacionais</span>
            </div>
            <p style={{ fontSize: 11, color: "#6b6585", marginTop: 6, paddingLeft: 15 }}>
              Supabase · Vercel · Auth
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
