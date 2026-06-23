"use client";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp, Building2, Users, CalendarDays, CheckCircle, Clock, XCircle } from "lucide-react";

const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const STATUS_INFO: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  completed: { label: "Concluídos",  color: "#4ade80", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.18)",   icon: CheckCircle },
  pending:   { label: "Pendentes",   color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.18)",  icon: Clock       },
  cancelled: { label: "Cancelados",  color: "#f87171", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.18)",   icon: XCircle     },
};

const C = {
  card: "#ffffff", border: "#e8e8f0",
  sep: "#1a1a2e", text: "#1a1a2e", sub: "#64748b", muted: "#94a3b8", r: 10,
};

const planColors: Record<string, string> = {
  pro: "#7c3aed", starter: "#60a5fa", free: "#94a3b8", studio: "#f472b6",
};

const PERIODS = [
  { key: "7d",    label: "7 dias"      },
  { key: "30d",   label: "30 dias"     },
  { key: "90d",   label: "3 meses"     },
  { key: "180d",  label: "6 meses"     },
  { key: "all",   label: "Tudo"        },
];

function startOfPeriod(key: string): Date | null {
  const now = new Date();
  if (key === "7d")   { const d = new Date(now); d.setDate(d.getDate() - 7);   return d; }
  if (key === "30d")  { const d = new Date(now); d.setDate(d.getDate() - 30);  return d; }
  if (key === "90d")  { const d = new Date(now); d.setDate(d.getDate() - 90);  return d; }
  if (key === "180d") { const d = new Date(now); d.setDate(d.getDate() - 180); return d; }
  return null;
}

export default function AdminRelatoriosPage() {
  const [period, setPeriod] = useState("30d");
  const [studios,  setStudios]  = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [appts,    setAppts]    = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("studios").select("id, name, plan, is_active, created_at"),
      sb.from("profiles").select("id, role, created_at"),
      sb.from("appointments").select("id, price, status, created_at, studio_id, appointment_date"),
      sb.from("services").select("id, studio_id, is_active"),
    ]).then(([s, p, a, sv]) => {
      setStudios(s.data ?? []);
      setProfiles(p.data ?? []);
      setAppts(a.data ?? []);
      setServices(sv.data ?? []);
      setLoading(false);
    });
  }, []);

  const filteredAppts = useMemo(() => {
    const start = startOfPeriod(period);
    if (!start) return appts;
    return appts.filter(a => new Date(a.appointment_date || a.created_at) >= start);
  }, [appts, period]);

  const totalRevenue    = filteredAppts.filter(a => a.status === "completed").reduce((s, a) => s + (a.price ?? 0), 0);
  const activeStudios   = studios.filter(s => s.is_active).length;
  const inactiveStudios = studios.filter(s => !s.is_active).length;
  const owners          = profiles.filter(p => p.role === "owner").length;
  const profs           = profiles.filter(p => p.role === "professional").length;
  const completedAppts  = filteredAppts.filter(a => a.status === "completed").length;
  const pendingAppts    = filteredAppts.filter(a => a.status === "pending").length;
  const cancelledAppts  = filteredAppts.filter(a => a.status === "cancelled").length;
  const activeServices  = services.filter(s => s.is_active).length;

  const planCount = studios.reduce((acc, s) => { acc[s.plan] = (acc[s.plan] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  const apptsByStudio = filteredAppts.reduce((acc, a) => {
    if (a.studio_id) acc[a.studio_id] = (acc[a.studio_id] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topStudios = studios
    .map(s => ({ ...s, apptCount: apptsByStudio[s.id] ?? 0 }))
    .sort((a, b) => b.apptCount - a.apptCount).slice(0, 5);

  const revenueByStudio = filteredAppts
    .filter(a => a.status === "completed")
    .reduce((acc, a) => { if (a.studio_id) acc[a.studio_id] = (acc[a.studio_id] ?? 0) + (a.price ?? 0); return acc; }, {} as Record<string, number>);

  const topByRevenue = studios
    .map(s => ({ ...s, revenue: revenueByStudio[s.id] ?? 0 }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { label: d.toLocaleDateString("pt-BR", { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
  });
  const studiosByMonth = months.map(m => ({
    label: m.label,
    count: studios.filter(s => { const d = new Date(s.created_at); return d.getFullYear() === m.year && d.getMonth() === m.month; }).length,
  }));
  const maxMonthCount = Math.max(...studiosByMonth.map(m => m.count), 1);

  if (loading) return <div style={{ color: C.muted, padding: 40, textAlign: "center" }}>Carregando...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1040 }}>
      {/* Header + filtro de período */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Inteligência da plataforma</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.025em" }}>Relatórios</h1>
          <p style={{ fontSize: 13, color: C.muted, marginTop: 5 }}>Visão consolidada da plataforma</p>
        </div>
        {/* Filtro de período */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                border: period === p.key ? "none" : "1px solid rgba(255,255,255,0.08)",
                background: period === p.key ? "#818cf8" : "#ffffff",
                color: period === p.key ? "#fff" : C.muted,
                transition: "all .15s" }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { label: "Receita total",  value: fmt(totalRevenue),          sub: `${completedAppts} concluídos`,      icon: TrendingUp,   color: "#7c3aed" },
          { label: "Salões ativos",  value: `${activeStudios}`,         sub: `${inactiveStudios} inativo(s)`,     icon: Building2,    color: "#4ade80" },
          { label: "Agendamentos",   value: String(filteredAppts.length),sub: `no período selecionado`,            icon: CalendarDays, color: "#60a5fa" },
          { label: "Usuários",       value: String(profiles.length),    sub: `${owners} responsáveis · ${profs} profissionais`,  icon: Users,        color: "#a78bfa" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</span>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: `${color}14`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={12} color={color}/>
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.text, lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 3 }}>{value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Status + planos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, padding: "18px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>Status dos agendamentos</p>
          {filteredAppts.length === 0 ? (
            <p style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "14px 0" }}>Sem dados no período</p>
          ) : (
            [{ status: "completed", count: completedAppts }, { status: "pending", count: pendingAppts }, { status: "cancelled", count: cancelledAppts }]
              .map(({ status, count }) => {
                const info = STATUS_INFO[status]; const Icon = info.icon;
                const pct = Math.round((count / (filteredAppts.length || 1)) * 100);
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
                    <div style={{ height: 3, borderRadius: 3, background: "#e8e8f0", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: info.color, opacity: 0.7 }}/>
                    </div>
                  </div>
                );
              })
          )}
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, padding: "18px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 16 }}>Distribuição de planos</p>
          {Object.entries(planCount).map(([plan, count]) => {
            const color = planColors[plan] ?? C.sub;
            const pct = Math.round(((count as number) / (studios.length || 1)) * 100);
            return (
              <div key={plan} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.sub, textTransform: "capitalize" }}>{plan}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color }}>{count as number}</span>
                    <span style={{ fontSize: 10, color: C.muted }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: 3, borderRadius: 3, background: "#e8e8f0", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 3, width: `${pct}%`, background: color, opacity: 0.7 }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top salões */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { title: "Top salões — agendamentos", items: topStudios.filter(s => s.apptCount > 0), getValue: (s: any) => String(s.apptCount), color: C.text, empty: "Sem agendamentos no período" },
          { title: "Top salões — receita",      items: topByRevenue.filter(s => s.revenue > 0), getValue: (s: any) => fmt(s.revenue),   color: "#4ade80", empty: "Sem receita no período" },
        ].map(({ title, items, getValue, color, empty }) => (
          <div key={title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.sep}` }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{title}</p>
            </div>
            {items.length === 0 ? (
              <p style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "24px 0" }}>{empty}</p>
            ) : items.map((s: any, i: number) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderBottom: i < items.length - 1 ? `1px solid ${C.sep}` : "none" }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: C.muted, width: 16, textAlign: "right" }}>{i+1}</span>
                <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#7c3aed" }}>
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color }}>{getValue(s)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Crescimento */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, padding: "18px" }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 20 }}>Crescimento — novos salões (últimos 6 meses)</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 80 }}>
          {studiosByMonth.map(({ label, count }) => {
            const barH = Math.max(4, Math.round((count / maxMonthCount) * 64));
            return (
              <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: count > 0 ? C.sub : C.muted }}>{count > 0 ? count : ""}</span>
                <div style={{ width: "100%", height: barH, borderRadius: 4, background: count > 0 ? "rgba(99,102,241,0.45)" : "#1a1a2e", border: count > 0 ? "1px solid rgba(99,102,241,0.30)" : `1px solid ${C.sep}` }}/>
                <span style={{ fontSize: 10, color: C.muted, textTransform: "capitalize" }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumo */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[
          { label: "Serviços cadastrados", value: String(services.length), sub: `${activeServices} ativos` },
          { label: "Taxa de conclusão", value: filteredAppts.length > 0 ? `${Math.round((completedAppts/filteredAppts.length)*100)}%` : "—", sub: "no período" },
          { label: "Ticket médio", value: completedAppts > 0 ? fmt(totalRevenue / completedAppts) : "—", sub: "por agendamento concluído" },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-0.025em", marginBottom: 3 }}>{value}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
