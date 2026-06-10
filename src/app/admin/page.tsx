// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Users, CalendarDays, DollarSign, TrendingUp, Activity } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function hexToRgb(hex: string) {
  try {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  } catch { return "124,92,191"; }
}

export default async function AdminPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "superadmin") redirect("/dashboard");

  const [
    { data: studios },
    { data: allProfiles },
    { data: allAppts },
    { data: allClients },
  ] = await Promise.all([
    sb.from("studios").select("id, name, slug, plan, is_active, brand_color, avatar_url, created_at").order("created_at", { ascending: false }),
    sb.from("profiles").select("id, role, studio_id"),
    sb.from("appointments").select("id, studio_id, price, status, created_at"),
    sb.from("clients").select("id, studio_id"),
  ]);

  const studioList  = studios || [];
  const activeCount = studioList.filter(s => s.is_active).length;
  const profCount   = (allProfiles || []).filter(p => p.role === "professional").length;
  const apptTotal   = (allAppts || []).length;
  const revenue     = (allAppts || []).filter(a => a.status === "completed").reduce((s,a) => s + (a.price||0), 0);
  const clientTotal = (allClients || []).length;

  // Stats per studio
  const studioStats = studioList.map(s => ({
    ...s,
    appts:   (allAppts   || []).filter(a => a.studio_id === s.id).length,
    clients: (allClients || []).filter(c => c.studio_id === s.id).length,
    revenue: (allAppts   || []).filter(a => a.studio_id === s.id && a.status === "completed").reduce((sum,a) => sum+(a.price||0),0),
  }));

  const KPIS = [
    { label: "Studios ativos",   value: `${activeCount}/${studioList.length}`, icon: Building2,    color: "var(--brand)",       bg: "rgba(124,92,191,.12)" },
    { label: "Profissionais",    value: profCount,                             icon: Users,        color: "#818cf8",            bg: "rgba(129,140,248,.12)" },
    { label: "Total agendamentos",value: apptTotal,                           icon: CalendarDays, color: "var(--green)",       bg: "rgba(34,212,123,.1)"  },
    { label: "Receita total",    value: formatCurrency(revenue),              icon: DollarSign,   color: "var(--gold)",        bg: "rgba(245,158,11,.1)"  },
    { label: "Clientes",         value: clientTotal,                          icon: Activity,     color: "#f472b6",            bg: "rgba(244,114,182,.1)" },
  ];

  const PLAN_C: Record<string,string> = { pro:"var(--brand-light)", starter:"#818cf8", free:"var(--muted)", studio:"var(--gold)" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>⚡ Painel Superadmin</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: "-.02em" }}>Visão Geral</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
            {studioList.length} studio{studioList.length!==1?"s":""} na plataforma
          </p>
        </div>
        <Link href="/admin/studios" style={{
          display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px",
          borderRadius: 13, background: "linear-gradient(135deg, var(--brand-light), var(--brand))",
          color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none",
          boxShadow: "0 4px 20px var(--brand-glow)",
        }}>+ Novo Studio</Link>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
        {KPIS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} style={{
            position: "relative", overflow: "hidden",
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 18, padding: "18px 16px",
          }}>
            <div style={{ position: "absolute", top: 0, left: 12, right: 12, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)`, opacity: .7 }}/>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={14} color={color}/>
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em", lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Studios */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 22, overflow: "hidden" }}>
        <div style={{
          padding: "18px 22px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(135deg,rgba(124,92,191,.06),transparent)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Building2 size={16} color="var(--brand-light)"/>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Studios</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: "rgba(124,92,191,.15)", color: "var(--brand-light)", border: "1px solid rgba(124,92,191,.25)" }}>{studioList.length}</span>
          </div>
          <Link href="/admin/studios" style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-light)", textDecoration: "none" }}>Ver todos →</Link>
        </div>

        {studioList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "52px 20px", color: "var(--muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 10, opacity: .3 }}>🏠</div>
            <div style={{ fontSize: 14 }}>Nenhum studio cadastrado ainda</div>
            <Link href="/admin/studios" style={{ display: "inline-block", marginTop: 16, padding: "9px 20px", borderRadius: 12, background: "rgba(124,92,191,.15)", color: "var(--brand-light)", textDecoration: "none", fontSize: 13, fontWeight: 700, border: "1px solid rgba(124,92,191,.25)" }}>
              Criar primeiro studio
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {studioStats.map((s, i) => {
              const rgb = hexToRgb(s.brand_color || "#7C5CBF");
              return (
                <Link key={s.id} href={`/admin/studios/${s.id}`} style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "16px 22px", textDecoration: "none", transition: "background .15s",
                  borderBottom: i < studioStats.length-1 ? "1px solid var(--border)" : "none",
                  opacity: s.is_active ? 1 : 0.5,
                }}
                  onMouseEnter={(e: any) => e.currentTarget.style.background = "var(--surface2)"}
                  onMouseLeave={(e: any) => e.currentTarget.style.background = "transparent"}>
                  {/* Logo */}
                  <div style={{
                    width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                    background: `linear-gradient(140deg,${s.brand_color||"#7C5CBF"},rgba(0,0,0,.35))`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 17, fontWeight: 900, color: "#fff",
                    boxShadow: `0 4px 16px rgba(${rgb},.35)`,
                  }}>
                    {s.avatar_url
                      ? <img src={s.avatar_url} style={{ width: "100%", height: "100%", borderRadius: 12, objectFit: "cover" }} alt="" />
                      : s.name.slice(0,2).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{s.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: ".04em", background: `rgba(${rgb},.15)`, color: s.brand_color||"var(--brand-light)", border: `1px solid rgba(${rgb},.25)` }}>{s.plan}</span>
                      {!s.is_active && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "rgba(248,113,113,.1)", color: "#f87171", border: "1px solid rgba(248,113,113,.2)" }}>INATIVO</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", gap: 10 }}>
                      <span style={{ color: `rgba(${rgb},.7)`, fontFamily: "monospace" }}>/agendar/{s.slug}</span>
                    </div>
                  </div>
                  {/* Stats */}
                  <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
                    {[
                      ["Agend.", s.appts, "var(--brand-light)"],
                      ["Clientes", s.clients, "var(--green)"],
                      ["Receita", formatCurrency(s.revenue), "var(--gold)"],
                    ].map(([l,v,c]) => (
                      <div key={l as string} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: c as string }}>{v as any}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em" }}>{l as string}</div>
                      </div>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
