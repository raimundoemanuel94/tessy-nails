// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { RelatoriosCharts } from "./RelatoriosCharts";
import { DollarSign, TrendingUp, Building2, Percent, CreditCard, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminRelatoriosPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "superadmin") redirect("/dashboard");

  const [{ data: studios }, { data: prices }] = await Promise.all([
    sb.from("studios").select("id, name, plan, is_active, subscription_status, mrr, created_at"),
    sb.from("plan_prices").select("plan, price, label"),
  ]);

  const list = studios || [];
  const active = list.filter(s => s.subscription_status === "active");
  const mrr = active.reduce((sum, s) => sum + Number(s.mrr || 0), 0);
  const arr = mrr * 12;
  const arpu = active.length ? mrr / active.length : 0;
  const canceled = list.filter(s => s.subscription_status === "canceled").length;
  const churn = list.length ? Math.round((canceled / list.length) * 100) : 0;

  // Distribuição por plano
  const planDist = (prices || []).map(p => {
    const count = list.filter(s => s.plan === p.plan && s.subscription_status === "active").length;
    return { plan: p.plan, label: p.label, price: Number(p.price), count, revenue: count * Number(p.price) };
  });

  // Crescimento mensal (6 meses)
  const months: { label: string; studios: number; mrr: number; newStudios: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(); dt.setMonth(dt.getMonth() - i); dt.setDate(1); dt.setHours(0,0,0,0);
    const end = new Date(dt); end.setMonth(end.getMonth() + 1);
    const cumulative = list.filter(s => new Date(s.created_at) < end);
    const newInMonth = list.filter(s => { const t = new Date(s.created_at); return t >= dt && t < end; }).length;
    months.push({
      label: dt.toLocaleDateString("pt-BR", { month: "short" }),
      studios: cumulative.length,
      newStudios: newInMonth,
      mrr: cumulative.filter(s => s.subscription_status === "active").reduce((sum,s)=>sum+Number(s.mrr||0),0),
    });
  }

  const KPIS = [
    { label: "MRR",            value: formatCurrency(mrr),  icon: DollarSign, color: "var(--green)" },
    { label: "ARR (anual)",    value: formatCurrency(arr),  icon: TrendingUp, color: "var(--brand-light)" },
    { label: "ARPU",           value: formatCurrency(arpu), icon: CreditCard, color: "#5a9ef5", hint: "receita média/cliente" },
    { label: "Churn",          value: `${churn}%`,          icon: Percent,    color: churn > 5 ? "var(--red)" : "var(--green)", hint: "cancelamentos" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>⚡ Relatórios</div>
        <h1 style={{ fontSize: 27, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: "-.02em" }}>Análise Financeira</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Receita, crescimento e saúde das assinaturas</p>
      </div>

      {/* KPIs financeiros */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {KPIS.map(({ label, value, icon: Icon, color, hint }) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 12, right: 12, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)`, opacity: .7 }}/>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</span>
              <Icon size={16} color={color}/>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em" }}>{value}</div>
            {hint && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>{hint}</div>}
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <RelatoriosCharts months={months} planDist={planDist} />

      {/* Distribuição por plano */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,rgba(124,92,191,.05),transparent)" }}>
          <Building2 size={16} color="var(--brand-light)"/>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Receita por Plano</span>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {planDist.map(p => {
            const pct = mrr > 0 ? Math.round((p.revenue / mrr) * 100) : 0;
            const PLAN_C = { pro:"var(--brand-light)", starter:"#5a9ef5", free:"var(--muted)", studio:"var(--gold)" };
            const color = PLAN_C[p.plan] || "var(--muted)";
            return (
              <div key={p.plan}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", textTransform: "capitalize" }}>{p.label}</span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{p.count} {p.count === 1 ? "salão" : "salões"} · {formatCurrency(p.price)}/mês</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 800, color }}>{formatCurrency(p.revenue)}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "var(--surface2)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${color},${color}aa)`, borderRadius: 4, transition: "width .4s" }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
