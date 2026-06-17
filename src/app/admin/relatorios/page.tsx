import { createClient } from "@/lib/supabase/server";
import { TrendingUp, Building2, Users, CalendarDays, CheckCircle, Clock, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  completed: { label: "Concluídos",  color: "#4ade80", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.18)",   icon: CheckCircle },
  pending:   { label: "Pendentes",   color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.18)",  icon: Clock       },
  cancelled: { label: "Cancelados",  color: "#f87171", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.18)",   icon: XCircle     },
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

export default async function AdminRelatoriosPage() {
  const supabase = await createClient();

  const [
    { data: studios },
    { data: profiles },
    { data: appts },
    { data: services },
  ] = await Promise.all([
    supabase.from("studios").select("id, name, plan, is_active, created_at"),
    supabase.from("profiles").select("id, role, created_at"),
    supabase.from("appointments").select("id, price, status, created_at, studio_id"),
    supabase.from("services").select("id, studio_id, is_active"),
  ]);

  const allStudios = studios ?? [];
  const allProfiles = profiles ?? [];
  const allAppts = appts ?? [];
  const allServices = services ?? [];

  // Aggregate
  const totalRevenue   = allAppts.filter(a => a.status === "completed").reduce((s, a) => s + (a.price ?? 0), 0);
  const activeStudios  = allStudios.filter(s => s.is_active).length;
  const inactiveStudios= allStudios.filter(s => !s.is_active).length;
  const owners         = allProfiles.filter(p => p.role === "owner").length;
  const profs          = allProfiles.filter(p => p.role === "professional").length;
  const completedAppts = allAppts.filter(a => a.status === "completed").length;
  const pendingAppts   = allAppts.filter(a => a.status === "pending").length;
  const cancelledAppts = allAppts.filter(a => a.status === "cancelled").length;
  const activeServices = allServices.filter(s => s.is_active).length;

  // Plan distribution
  const planCount = allStudios.reduce((acc, s) => {
    acc[s.plan] = (acc[s.plan] ?? 0) + 1; return acc;
  }, {} as Record<string, number>);

  // Studios with most appointments
  const apptsByStudio = allAppts.reduce((acc, a) => {
    if (a.studio_id) acc[a.studio_id] = (acc[a.studio_id] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topStudios = allStudios
    .map(s => ({ ...s, apptCount: apptsByStudio[s.id] ?? 0 }))
    .sort((a, b) => b.apptCount - a.apptCount)
    .slice(0, 5);

  // Revenue by studio (completed appointments)
  const revenueByStudio = allAppts
    .filter(a => a.status === "completed")
    .reduce((acc, a) => {
      if (a.studio_id) acc[a.studio_id] = (acc[a.studio_id] ?? 0) + (a.price ?? 0);
      return acc;
    }, {} as Record<string, number>);

  const topByRevenue = allStudios
    .map(s => ({ ...s, revenue: revenueByStudio[s.id] ?? 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Monthly growth — studios created per month (last 6 months)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      label: d.toLocaleDateString("pt-BR", { month: "short" }),
      year: d.getFullYear(), month: d.getMonth(),
    };
  });
  const studiosByMonth = months.map(m => ({
    label: m.label,
    count: allStudios.filter(s => {
      const d = new Date(s.created_at);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length,
  }));
  const maxMonthCount = Math.max(...studiosByMonth.map(m => m.count), 1);

  const planColors: Record<string, string> = {
    pro: "#818cf8", starter: "#60a5fa", free: "#71717a", studio: "#f472b6",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1040 }}>

      {/* Header */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 500, color: C.muted, letterSpacing: "0.06em",
          textTransform: "uppercase", marginBottom: 6 }}>Admin Console</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.025em" }}>Relatórios</h1>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 5 }}>Visão consolidada da plataforma</p>
      </div>

      {/* Top KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { label: "Receita total",    value: fmt(totalRevenue),         sub: "agendamentos concluídos",          icon: TrendingUp,   color: "#818cf8" },
          { label: "Studios ativos",   value: `${activeStudios}`,        sub: `${inactiveStudios} inativo(s)`,    icon: Building2,    color: "#4ade80" },
          { label: "Agendamentos",     value: String(allAppts.length),   sub: `${completedAppts} concluídos`,     icon: CalendarDays, color: "#60a5fa" },
          { label: "Usuários",         value: String(allProfiles.length),sub: `${owners} owners · ${profs} prof`, icon: Users,        color: "#a78bfa" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: C.r, padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
              <div style={{
                width: 26, height: 26, borderRadius: 6,
                background: `${color}14`, border: `1px solid ${color}28`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={12} color={color}/>
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text, lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 3 }}>{value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* Appointment status breakdown */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, padding: "18px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>Status dos agendamentos</p>
          {allAppts.length === 0 ? (
            <p style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "14px 0" }}>Sem dados ainda</p>
          ) : (
            [
              { status: "completed", count: completedAppts },
              { status: "pending",   count: pendingAppts   },
              { status: "cancelled", count: cancelledAppts },
            ].map(({ status, count }) => {
              const info = STATUS_INFO[status];
              const Icon = info.icon;
              const pct = Math.round((count / (allAppts.length || 1)) * 100);
              return (
                <div key={status} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon size={12} color={info.color}/>
                      <span style={{ fontSize: 12, fontWeight: 500, color: C.sub }}>{info.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: info.color }}>{count}</span>
                      <span style={{ fontSize: 10, color: C.muted }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 3, width: `${pct}%`,
                      background: info.color, opacity: 0.7,
                      transition: "width .4s ease",
                    }}/>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Plan distribution */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, padding: "18px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>Distribuição de planos</p>
          {allStudios.length === 0 ? (
            <p style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "14px 0" }}>Sem dados ainda</p>
          ) : (
            Object.entries(planCount).map(([plan, count]) => {
              const color = planColors[plan] ?? C.sub;
              const pct = Math.round(((count as number) / (allStudios.length || 1)) * 100);
              return (
                <div key={plan} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.sub, textTransform: "capitalize" }}>{plan}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color }}>{count as number}</span>
                      <span style={{ fontSize: 10, color: C.muted }}>{pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 3, width: `${pct}%`,
                      background: color, opacity: 0.7, transition: "width .4s ease",
                    }}/>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Row 3 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        {/* Top studios by appointments */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.sep}` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>Top studios — agendamentos</p>
          </div>
          {topStudios.length === 0 || topStudios.every(s => s.apptCount === 0) ? (
            <p style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "24px 0" }}>Sem agendamentos ainda</p>
          ) : (
            topStudios.filter(s => s.apptCount > 0).map((s, i) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 18px",
                borderBottom: i < topStudios.length - 1 ? `1px solid ${C.sep}` : "none",
              }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: C.muted, width: 16, textAlign: "right" }}>{i+1}</span>
                <div style={{
                  width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                  background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "#818cf8",
                }}>{s.name.charAt(0).toUpperCase()}</div>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.apptCount}</span>
              </div>
            ))
          )}
        </div>

        {/* Top studios by revenue */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.sep}` }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>Top studios — receita</p>
          </div>
          {topByRevenue.length === 0 || topByRevenue.every(s => s.revenue === 0) ? (
            <p style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "24px 0" }}>Sem receita registrada</p>
          ) : (
            topByRevenue.filter(s => s.revenue > 0).map((s, i) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 18px",
                borderBottom: i < topByRevenue.length - 1 ? `1px solid ${C.sep}` : "none",
              }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: C.muted, width: 16, textAlign: "right" }}>{i+1}</span>
                <div style={{
                  width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                  background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "#818cf8",
                }}>{s.name.charAt(0).toUpperCase()}</div>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>{fmt(s.revenue)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Monthly studio growth sparkline */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, padding: "18px" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 20 }}>Crescimento — novos studios (últimos 6 meses)</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 80 }}>
          {studiosByMonth.map(({ label, count }) => {
            const barH = maxMonthCount > 0 ? Math.max(4, Math.round((count / maxMonthCount) * 64)) : 4;
            return (
              <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: count > 0 ? C.sub : C.muted }}>{count > 0 ? count : ""}</span>
                <div style={{
                  width: "100%", height: barH, borderRadius: 4,
                  background: count > 0 ? "rgba(99,102,241,0.45)" : "rgba(255,255,255,0.05)",
                  border: count > 0 ? "1px solid rgba(99,102,241,0.30)" : `1px solid ${C.sep}`,
                  transition: "height .3s ease",
                }}/>
                <span style={{ fontSize: 10, color: C.muted, textTransform: "capitalize" }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10,
      }}>
        {[
          { label: "Serviços cadastrados", value: String(allServices.length), sub: `${activeServices} ativos` },
          { label: "Taxa de conclusão",    value: allAppts.length > 0 ? `${Math.round((completedAppts/allAppts.length)*100)}%` : "—", sub: "agendamentos concluídos" },
          { label: "Ticket médio",         value: completedAppts > 0 ? fmt(totalRevenue / completedAppts) : "—", sub: "por agendamento concluído" },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: C.r, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-0.025em", marginBottom: 3 }}>{value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
