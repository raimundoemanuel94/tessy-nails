// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { Building2, Users, CalendarDays, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const PLAN_COLOR: Record<string, { bg: string; color: string; border: string }> = {
  pro:     { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },
  starter: { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", border: "rgba(96,165,250,0.25)"  },
  free:    { bg: "rgba(107,107,154,0.12)", color: "#6b6b9a", border: "rgba(107,107,154,0.25)" },
  studio:  { bg: "rgba(244,114,182,0.12)", color: "#f472b6", border: "rgba(244,114,182,0.25)" },
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", letterSpacing: "0.1em",
            textTransform: "uppercase", marginBottom: 6 }}>Platform Overview</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#f0f0ff", margin: 0, letterSpacing: "-0.02em" }}>
            {greeting}, Admin 👋
          </h1>
          <p style={{ color: "#6b6585", margin: "5px 0 0", fontSize: 13 }}>
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link href="/admin/studios" style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "10px 18px", borderRadius: 10, textDecoration: "none",
          background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
          fontSize: 12, fontWeight: 800, color: "#f59e0b",
        }}>
          + Novo Studio <ArrowRight size={13} />
        </Link>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[
          { label: "Studios ativos", value: `${activeStudios}/${totalStudios}`,
            sub: totalStudios === 0 ? "nenhum criado" : `${totalStudios - activeStudios} inativos`,
            icon: Building2, color: "#f59e0b", glow: "rgba(245,158,11,0.15)" },
          { label: "Usuários", value: String(totalUsers),
            sub: `${profiles?.filter(p => p.role === "superadmin").length ?? 0} admin`,
            icon: Users, color: "#a78bfa", glow: "rgba(167,139,250,0.15)" },
          { label: "Agendamentos", value: String(totalAppts),
            sub: `${pending} pendentes`,
            icon: CalendarDays, color: "#34d399", glow: "rgba(52,211,153,0.15)" },
          { label: "Receita total", value: fmt(totalRevenue),
            sub: "agendamentos concluídos",
            icon: TrendingUp, color: "#f472b6", glow: "rgba(244,114,182,0.15)" },
        ].map(({ label, value, sub, icon: Icon, color, glow }) => (
          <div key={label} style={{
            position: "relative", overflow: "hidden",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "20px 22px",
          }}>
            <div style={{
              position: "absolute", top: -25, right: -25,
              width: 100, height: 100, borderRadius: "50%",
              background: glow, filter: "blur(25px)", pointerEvents: "none",
            }}/>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, position: "relative" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#6b6585",
                letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: `${color}18`, border: `1px solid ${color}28`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={13} color={color}/>
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1,
              letterSpacing: "-0.02em", position: "relative" }}>{value}</div>
            <div style={{ fontSize: 11, color: "#6b6585", marginTop: 5, position: "relative" }}>{sub}</div>
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg,${color}70,transparent)`,
            }}/>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 18, alignItems: "start" }}>

        {/* Studios table */}
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#f0f0ff" }}>Studios</span>
              {totalStudios > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 20,
                  background: "rgba(245,158,11,0.12)", color: "#f59e0b",
                  border: "1px solid rgba(245,158,11,0.25)",
                }}>{totalStudios}</span>
              )}
            </div>
            <Link href="/admin/studios" style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 700, color: "#f59e0b", textDecoration: "none",
            }}>Ver todos <ArrowRight size={11}/></Link>
          </div>

          {/* col headers */}
          {recentStudios.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 80px 80px 32px",
              padding: "7px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              {["Studio", "Plano", "Status", ""].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#6b6585",
                  letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>
          )}

          {recentStudios.length === 0 ? (
            <div style={{ padding: "52px 20px", textAlign: "center" }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, margin: "0 auto 14px",
                background: "rgba(245,158,11,0.08)", border: "1px dashed rgba(245,158,11,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Building2 size={22} color="#f59e0b" style={{ opacity: 0.5 }}/>
              </div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#f0f0ff", marginBottom: 5 }}>
                Nenhum studio
              </p>
              <p style={{ fontSize: 12, color: "#6b6585", marginBottom: 18 }}>
                Crie o primeiro studio da plataforma
              </p>
              <Link href="/admin/studios" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 18px", borderRadius: 9, textDecoration: "none",
                background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
                fontSize: 12, fontWeight: 800, color: "#f59e0b",
              }}>
                + Criar studio
              </Link>
            </div>
          ) : (
            recentStudios.map((s, i) => {
              const pc = PLAN_COLOR[s.plan] ?? PLAN_COLOR.free;
              return (
                <Link key={s.id} href={`/admin/studios/${s.id}`} style={{
                  display: "grid", gridTemplateColumns: "1fr 80px 80px 32px",
                  alignItems: "center", padding: "12px 20px", textDecoration: "none",
                  borderBottom: i < recentStudios.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  transition: "background .1s",
                  background: "transparent",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                      background: "linear-gradient(135deg,#f59e0b,#fcd34d)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 900, color: "#000",
                    }}>{s.name.charAt(0)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0ff",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: "#6b6585", fontFamily: "monospace" }}>/{s.slug}</div>
                    </div>
                  </div>
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 6,
                      background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`,
                      textTransform: "uppercase",
                    }}>{s.plan}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: s.is_active ? "#34d399" : "#6b6585",
                      boxShadow: s.is_active ? "0 0 5px #34d39960" : "none",
                    }}/>
                    <span style={{ fontSize: 11, fontWeight: 600,
                      color: s.is_active ? "#34d399" : "#6b6585" }}>
                      {s.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <ArrowRight size={12} color="#6b6585"/>
                </Link>
              );
            })
          )}
        </div>

        {/* Sidebar panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Plan distribution */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "16px 18px",
          }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#f0f0ff", marginBottom: 16 }}>Distribuição de planos</p>
            {totalStudios === 0 ? (
              <p style={{ fontSize: 12, color: "#6b6585", textAlign: "center", padding: "12px 0" }}>
                Sem dados ainda
              </p>
            ) : (
              Object.entries(PLAN_COLOR).map(([plan, pc]) => {
                const count = planCount[plan] ?? 0;
                const pct = Math.round((count / (totalStudios || 1)) * 100);
                return (
                  <div key={plan} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#f0f0ff", textTransform: "capitalize" }}>{plan}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: pc.color }}>{count}</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                      <div style={{
                        height: "100%", borderRadius: 4,
                        width: `${pct}%`, background: pc.color,
                        transition: "width .4s ease",
                      }}/>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick actions */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "16px 18px",
          }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#f0f0ff", marginBottom: 12 }}>Ações rápidas</p>
            {[
              { href: "/admin/studios", label: "+ Criar studio",    color: "#f59e0b", icon: Building2 },
              { href: "/admin/profissionais", label: "Ver usuários", color: "#a78bfa", icon: Users    },
            ].map(({ href, label, color, icon: Icon }) => (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "10px 12px", borderRadius: 9, textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.06)",
                marginBottom: 8, transition: "all .12s",
                background: "transparent",
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={12} color={color}/>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#f0f0ff", flex: 1 }}>{label}</span>
                <ArrowRight size={11} color="#6b6585"/>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
