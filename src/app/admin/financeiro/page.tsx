import { redirect } from "next/navigation";
import { ArrowRight, CreditCard, DollarSign, Layers, ShieldAlert, TrendingDown, TrendingUp, Users } from "lucide-react";
import {
  AdminActionButton,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/AdminUI";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PLAN_COLOR: Record<string, string> = {
  studio: "#f472b6",
  pro: "#7c3aed",
  starter: "#60a5fa",
  free: "#94a3b8",
};

function monthBounds(offset = 0) {
  const start = new Date();
  start.setMonth(start.getMonth() + offset);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}

function daysUntil(date?: string | null) {
  if (!date) return null;
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function MiniArea({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);
  return (
    <div style={{ padding: 18, display: "grid", gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`, gap: 10, alignItems: "end", height: 150 }}>
      {data.map((item) => (
        <div key={item.label} style={{ minWidth: 0 }}>
          <div style={{ height: 108, display: "flex", alignItems: "end" }}>
            <div style={{ width: "100%", height: Math.max(8, Math.round((item.value / max) * 104)), borderRadius: "7px 7px 3px 3px", background: "linear-gradient(180deg,#4ade80,#166534)", border: "1px solid rgba(255,255,255,0.08)" }} />
          </div>
          <p style={{ marginTop: 8, textAlign: "center", color: "#94a3b8", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export default async function FinanceiroPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "superadmin") redirect("/dashboard");

  const [{ data: studios }, { data: prices }] = await Promise.all([
    sb.from("studios").select("id,name,slug,plan,is_active,subscription_status,mrr,next_billing_date,trial_ends_at,created_at"),
    sb.from("plan_prices").select("plan,price,label").order("price"),
  ]);

  const studioList = studios ?? [];
  const priceList = prices ?? [];
  const priceByPlan = new Map(priceList.map((price) => [price.plan, Number(price.price ?? 0)]));
  const labelByPlan = new Map(priceList.map((price) => [price.plan, price.label ?? price.plan]));

  const active = studioList.filter((studio) => studio.subscription_status === "active");
  const pastDue = studioList.filter((studio) => studio.subscription_status === "past_due");
  const trials = studioList.filter((studio) => studio.subscription_status === "trial" || studio.subscription_status === "trialing");
  const canceled = studioList.filter((studio) => studio.subscription_status === "canceled" || !studio.is_active);
  const expiringTrials = trials.filter((studio) => {
    const days = daysUntil(studio.trial_ends_at);
    return days !== null && days >= 0 && days <= 7;
  });

  const getMrr = (studio: any) => {
    const explicit = Number(studio.mrr ?? 0);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    return studio.subscription_status === "active" ? Number(priceByPlan.get(studio.plan) ?? 0) : 0;
  };

  const mrr = active.reduce((sum, studio) => sum + getMrr(studio), 0);
  const arr = mrr * 12;
  const arpu = active.length ? mrr / active.length : 0;
  const mrrAtRisk = pastDue.reduce((sum, studio) => sum + Number(studio.mrr ?? priceByPlan.get(studio.plan) ?? 0), 0);

  const currentMonth = monthBounds(0);
  const previousMonth = monthBounds(-1);
  const newThisMonth = active.filter((studio) => {
    const created = new Date(studio.created_at);
    return created >= currentMonth.start && created < currentMonth.end;
  });
  const newMrr = newThisMonth.reduce((sum, studio) => sum + getMrr(studio), 0);
  const churnedThisMonth = canceled.filter((studio) => {
    const created = new Date(studio.created_at);
    return created < currentMonth.start;
  });
  const churnedMrrApprox = churnedThisMonth.reduce((sum, studio) => sum + Number(priceByPlan.get(studio.plan) ?? 0), 0);
  const previousNew = active.filter((studio) => {
    const created = new Date(studio.created_at);
    return created >= previousMonth.start && created < previousMonth.end;
  }).length;
  const growthRate = previousNew === 0 ? (newThisMonth.length > 0 ? 100 : 0) : Math.round(((newThisMonth.length - previousNew) / previousNew) * 100);

  const series = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setMonth(end.getMonth() + 1);
    const cumulative = studioList.filter((studio) => new Date(studio.created_at) < end && studio.subscription_status === "active");
    return {
      label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      value: cumulative.reduce((sum, studio) => sum + getMrr(studio), 0),
    };
  });

  const byPlan = ["studio", "pro", "starter", "free"].map((plan) => {
    const rows = active.filter((studio) => studio.plan === plan);
    const revenue = rows.reduce((sum, studio) => sum + getMrr(studio), 0);
    return {
      plan,
      label: labelByPlan.get(plan) ?? plan,
      price: Number(priceByPlan.get(plan) ?? 0),
      count: rows.length,
      revenue,
      pct: mrr ? Math.round((revenue / mrr) * 100) : 0,
      color: PLAN_COLOR[plan] ?? "#94a3b8",
    };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1160 }}>
      <AdminPageHeader
        eyebrow="Financeiro SaaS"
        title="Receita e assinaturas"
        description="MRR, risco, períodos de teste e distribuição de receita por plano. As métricas históricas usam os dados disponíveis hoje."
        actions={
          <>
            <AdminActionButton href="/admin/financeiro/assinaturas" tone="brand">Assinaturas <ArrowRight size={13} /></AdminActionButton>
            <AdminActionButton href="/admin/financeiro/inadimplencia" tone={pastDue.length ? "danger" : "muted"}>Inadimplência</AdminActionButton>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(3, 1fr)", gap: 12 }}>
        <AdminMetricCard label="MRR atual" value={formatCurrency(mrr)} sub={`${active.length} assinaturas ativas`} icon={DollarSign} tone="success" large />
        <AdminMetricCard label="ARR" value={formatCurrency(arr)} sub="recorrência anual" icon={TrendingUp} tone="brand" />
        <AdminMetricCard label="ARPU" value={formatCurrency(arpu)} sub="receita média por pagante" icon={Users} tone="default" />
        <AdminMetricCard label="MRR em risco" value={formatCurrency(mrrAtRisk)} sub={`${pastDue.length} inadimplentes`} icon={ShieldAlert} tone={pastDue.length ? "danger" : "muted"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <AdminMetricCard label="Novo MRR" value={formatCurrency(newMrr)} sub={`${newThisMonth.length} novos pagantes no mês`} icon={CreditCard} tone="success" />
        <AdminMetricCard label="MRR perdido aprox." value={formatCurrency(churnedMrrApprox)} sub={`${churnedThisMonth.length} contas canceladas/inativas`} icon={TrendingDown} tone={churnedMrrApprox ? "danger" : "muted"} />
        <AdminMetricCard label="Em teste" value={trials.length} sub={`${expiringTrials.length} vencendo em 7 dias`} icon={Layers} tone={expiringTrials.length ? "warning" : "brand"} />
        <AdminMetricCard label="Crescimento" value={`${growthRate >= 0 ? "+" : ""}${growthRate}%`} sub="novos ativos vs mês anterior" icon={growthRate >= 0 ? TrendingUp : TrendingDown} tone={growthRate >= 0 ? "success" : "danger"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.35fr .65fr", gap: 14, alignItems: "start" }}>
        <AdminPanel title="Evolução do MRR" description="Série de 6 meses calculada com os registros atuais." tone="success">
          <MiniArea data={series} />
        </AdminPanel>

        <AdminPanel title="Status da carteira" description="Distribuição comercial atual." tone="brand">
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            {[
              ["Ativas", active.length, "success"],
              ["Em teste", trials.length, "warning"],
              ["Inadimplentes", pastDue.length, pastDue.length ? "danger" : "muted"],
              ["Canceladas/inativas", canceled.length, "muted"],
            ].map(([label, value, tone]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8", fontSize: 12 }}>{label}</span>
                <AdminStatusBadge tone={tone as any} dot>{value}</AdminStatusBadge>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="Receita por plano" description="Quais planos sustentam o MRR atual." tone="brand">
        <div style={{ padding: 18, display: "grid", gap: 14 }}>
          {byPlan.map((plan) => (
            <div key={plan.plan}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 7 }}>
                <div>
                  <strong style={{ color: "#1a1a2e", fontSize: 13 }}>{plan.label}</strong>
                  <span style={{ color: "#94a3b8", fontSize: 12, marginLeft: 8 }}>{plan.count} pagantes · {formatCurrency(plan.price)}/mês</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "#94a3b8", fontSize: 11 }}>{plan.pct}%</span>
                  <strong style={{ color: plan.color, fontSize: 13, minWidth: 88, textAlign: "right" }}>{formatCurrency(plan.revenue)}</strong>
                </div>
              </div>
              <div style={{ height: 7, borderRadius: 999, background: "#e8e8f0", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${plan.pct}%`, background: `linear-gradient(90deg,${plan.color},${plan.color}99)` }} />
              </div>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
