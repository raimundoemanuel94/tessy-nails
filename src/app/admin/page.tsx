import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  CreditCard,
  DollarSign,
  Link2,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  AdminActionButton,
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/AdminUI";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
};

function daysBetween(date: string | null | undefined) {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function daysUntil(date: string | null | undefined) {
  if (!date) return null;
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function getStudioMrr(studio: any, priceByPlan: Map<string, number>, includeTrials = false) {
  const isActive = studio.subscription_status === "active";
  const isTrial = studio.subscription_status === "trial" || studio.subscription_status === "trialing";
  if (!isActive && !(includeTrials && isTrial)) return 0;
  const explicit = Number(studio.mrr ?? 0);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return Number(priceByPlan.get(studio.plan) ?? 0);
}

function buildMrrSeries(studios: any[], priceByPlan: Map<string, number>) {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    date.setDate(1);
    date.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setMonth(end.getMonth() + 1);

    const cumulative = studios.filter((studio) => new Date(studio.created_at) < end);
    const mrr = cumulative.reduce((sum, studio) => sum + getStudioMrr(studio, priceByPlan), 0);

    return {
      label: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      mrr,
      studios: cumulative.length,
    };
  });
}

function MiniBars({ data }: { data: { label: string; mrr: number }[] }) {
  const max = Math.max(...data.map((item) => item.mrr), 1);

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`, gap: 10, alignItems: "end", height: 140, padding: "18px" }}>
      {data.map((item) => (
        <div key={item.label} style={{ minWidth: 0 }}>
          <div style={{ height: 104, display: "flex", alignItems: "end" }}>
            <div
              title={`${item.label}: ${formatCurrency(item.mrr)}`}
              style={{
                width: "100%",
                height: Math.max(8, Math.round((item.mrr / max) * 100)),
                borderRadius: "7px 7px 3px 3px",
                background: item.mrr > 0 ? "linear-gradient(180deg,#4ade80,#15803d)" : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>
          <p style={{ marginTop: 8, textAlign: "center", fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function RiskRow({ icon: Icon, title, description, href, tone }: any) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "34px 1fr auto", gap: 12, alignItems: "center", padding: "13px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", color: tone === "danger" ? "#f87171" : tone === "warning" ? "#fbbf24" : "#818cf8" }}>
        <Icon size={16} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, color: "#f4f4f5", fontSize: 13, fontWeight: 750 }}>{title}</p>
        <p style={{ margin: "3px 0 0", color: "#71717a", fontSize: 12 }}>{description}</p>
      </div>
      <AdminActionButton href={href} tone={tone}>
        Resolver <ArrowRight size={12} />
      </AdminActionButton>
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: studios }, { data: profiles }, { data: prices }, { data: appointments }, { data: clients }] = await Promise.all([
    supabase
      .from("studios")
      .select("id, name, slug, owner_id, plan, is_active, subscription_status, mrr, trial_ends_at, next_billing_date, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, role, studio_id, created_at"),
    supabase.from("plan_prices").select("plan, price, label"),
    supabase.from("appointments").select("id, studio_id, appointment_date, status, price, created_at"),
    supabase.from("clients").select("id, studio_id, source, is_active, created_at"),
  ]);

  const studioList = studios ?? [];
  const profileList = profiles ?? [];
  const priceList = prices ?? [];
  const appointmentList = appointments ?? [];
  const clientList = clients ?? [];
  const priceByPlan = new Map(priceList.map((price) => [price.plan, Number(price.price ?? 0)]));

  const paidStudios = studioList.filter((studio) => getStudioMrr(studio, priceByPlan) > 0);
  const activeStudios = studioList.filter((studio) => studio.is_active);
  const trials = studioList.filter((studio) => studio.subscription_status === "trial" || studio.subscription_status === "trialing");
  const pastDue = studioList.filter((studio) => studio.subscription_status === "past_due");
  const withoutOwner = studioList.filter((studio) => !studio.owner_id);
  const inactiveStudios = studioList.filter((studio) => !studio.is_active);
  const mrr = studioList.reduce((sum, studio) => sum + getStudioMrr(studio, priceByPlan), 0);
  const arr = mrr * 12;
  const arpu = paidStudios.length ? mrr / paidStudios.length : 0;
  const nowIso = new Date().toISOString();
  const completedAppointments = appointmentList.filter((appointment) => appointment.status === "completed");
  const upcomingAppointments = appointmentList.filter((appointment) => appointment.appointment_date >= nowIso && !["completed", "cancelled", "canceled"].includes(appointment.status));
  const publicClients = clientList.filter((client) => client.source === "public").length;
  const completedRevenue = completedAppointments.reduce((sum, appointment) => sum + Number(appointment.price ?? 0), 0);

  const lastByStudio = new Map<string, string>();
  for (const appointment of appointmentList) {
    if (!appointment.studio_id || !appointment.appointment_date) continue;
    const current = lastByStudio.get(appointment.studio_id);
    if (!current || appointment.appointment_date > current) lastByStudio.set(appointment.studio_id, appointment.appointment_date);
  }

  const staleStudios = activeStudios.filter((studio) => {
    const lastAppt = lastByStudio.get(studio.id);
    if (lastAppt) return daysBetween(lastAppt)! > 30;
    // No appointments: only flag as stale if studio is older than 7 days
    const age = daysBetween(studio.created_at);
    return age !== null && age > 7;
  });
  const trialExpiring = trials.filter((studio) => {
    const days = daysUntil(studio.trial_ends_at);
    return days !== null && days >= 0 && days <= 7;
  });
  const mrrAtRisk = pastDue.reduce((sum, studio) => sum + Number(studio.mrr ?? priceByPlan.get(studio.plan) ?? 0), 0);
  const mrrSeries = buildMrrSeries(studioList, priceByPlan);
  const currentMrr = mrrSeries.at(-1)?.mrr ?? 0;
  const previousMrr = mrrSeries.at(-2)?.mrr ?? 0;
  const mrrDelta = currentMrr - previousMrr;

  const planRows = ["studio", "pro", "starter", "free"].map((plan) => {
    const inPlan = studioList.filter((studio) => studio.plan === plan);
    const revenue = inPlan.reduce((sum, studio) => sum + getStudioMrr(studio, priceByPlan), 0);
    return { plan, count: inPlan.length, revenue, pct: mrr ? Math.round((revenue / mrr) * 100) : 0 };
  });

  const studioOps = studioList.map((studio) => {
    const studioAppointments = appointmentList.filter((appointment) => appointment.studio_id === studio.id);
    const studioClients = clientList.filter((client) => client.studio_id === studio.id && client.is_active !== false);
    const completed = studioAppointments.filter((appointment) => appointment.status === "completed");
    const upcoming = studioAppointments.filter((appointment) => appointment.appointment_date >= nowIso && !["completed", "cancelled", "canceled"].includes(appointment.status));
    const revenue = completed.reduce((sum, appointment) => sum + Number(appointment.price ?? 0), 0);
    const last = studioAppointments
      .filter((appointment) => appointment.appointment_date)
      .sort((a, b) => String(b.appointment_date).localeCompare(String(a.appointment_date)))[0]?.appointment_date ?? null;

    return {
      studio,
      clients: studioClients.length,
      publicClients: studioClients.filter((client) => client.source === "public").length,
      appointments: studioAppointments.length,
      completed: completed.length,
      upcoming: upcoming.length,
      revenue,
      last,
    };
  }).sort((a, b) => b.upcoming - a.upcoming || b.revenue - a.revenue || b.appointments - a.appointments);

  const urgentItems = [
    withoutOwner.length > 0 && {
      icon: Link2,
      title: `${withoutOwner.length} studio${withoutOwner.length > 1 ? "s" : ""} sem profissional`,
      description: "Esses tenants existem, mas ainda não têm owner vinculado.",
      href: "/admin/profissionais",
      tone: "warning",
    },
    pastDue.length > 0 && {
      icon: ShieldAlert,
      title: `${pastDue.length} assinatura${pastDue.length > 1 ? "s" : ""} inadimplente${pastDue.length > 1 ? "s" : ""}`,
      description: `${formatCurrency(mrrAtRisk)} de MRR em risco por atraso.`,
      href: "/admin/financeiro/inadimplencia",
      tone: "danger",
    },
    trialExpiring.length > 0 && {
      icon: CreditCard,
      title: `${trialExpiring.length} trial${trialExpiring.length > 1 ? "s" : ""} vencendo`,
      description: "Boa hora para converter antes de perder ativação.",
      href: "/admin/financeiro/assinaturas",
      tone: "warning",
    },
    staleStudios.length > 0 && {
      icon: CalendarClock,
      title: `${staleStudios.length} studio${staleStudios.length > 1 ? "s" : ""} sem agenda recente`,
      description: "Possível risco de churn ou onboarding incompleto.",
      href: "/admin/studios",
      tone: "brand",
    },
    inactiveStudios.length > 0 && {
      icon: AlertTriangle,
      title: `${inactiveStudios.length} studio${inactiveStudios.length > 1 ? "s" : ""} inativo${inactiveStudios.length > 1 ? "s" : ""}`,
      description: "Revise se é churn, suspensão temporária ou erro operacional.",
      href: "/admin/studios",
      tone: "muted",
    },
  ].filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1180 }}>
      <AdminPageHeader
        eyebrow="Central de comando"
        title="Operação SaaS"
        description="Visão executiva para receita, ativação, risco e ações do dia na plataforma Nailit."
        actions={
          <>
            <AdminActionButton href="/admin/studios" tone="brand">
              Novo studio <ArrowRight size={13} />
            </AdminActionButton>
            <AdminActionButton href="/admin/financeiro" tone="success">
              Ver financeiro
            </AdminActionButton>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(3, 1fr)", gap: 12 }}>
        <AdminMetricCard label="MRR (ativos)" value={formatCurrency(mrr)} sub={`${mrrDelta >= 0 ? "+" : ""}${formatCurrency(mrrDelta)} vs mês anterior · ${trials.length} em trial`} icon={DollarSign} tone="success" large />
        <AdminMetricCard label="ARR" value={formatCurrency(arr)} sub="receita anual recorrente" icon={TrendingUp} tone="brand" />
        <AdminMetricCard label="Pagantes" value={paidStudios.length} sub={`${studioList.length} studios totais`} icon={CreditCard} tone="default" />
        <AdminMetricCard label="ARPU" value={formatCurrency(arpu)} sub={`${trials.length} em trial`} icon={Users} tone="warning" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <AdminMetricCard label="Clientes totais" value={clientList.length} sub={`${publicClients} vieram do link público`} icon={Users} tone="brand" />
        <AdminMetricCard label="Próximos horários" value={upcomingAppointments.length} sub="agenda futura ativa" icon={CalendarClock} tone="warning" />
        <AdminMetricCard label="Concluídos" value={completedAppointments.length} sub={formatCurrency(completedRevenue)} icon={BarChart3} tone="success" />
        <AdminMetricCard label="Ticket médio" value={formatCurrency(completedAppointments.length ? completedRevenue / completedAppointments.length : 0)} sub="por atendimento concluído" icon={DollarSign} tone="default" />
      </div>

      <AdminPanel
        title="Mapa operacional por salão"
        description="Clientes, agenda futura, atendimentos concluídos e receita por tenant."
        tone="brand"
        actions={<AdminActionButton href="/admin/clientes" tone="muted">Ver clientes</AdminActionButton>}
      >
        {studioOps.length === 0 ? (
          <AdminEmptyState title="Nenhum salão encontrado" description="Quando houver studios cadastrados, eles aparecem neste mapa operacional." />
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1.25fr .7fr .75fr .75fr .75fr .8fr .8fr", gap: 12, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {["Salão", "Clientes", "Públicos", "Próximos", "Concluídos", "Receita", "Último"].map((heading) => (
                <span key={heading} style={{ color: "#71717a", fontSize: 10, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase" }}>{heading}</span>
              ))}
            </div>
            {studioOps.slice(0, 12).map((row) => {
              const status = row.studio.subscription_status ?? (row.studio.is_active ? "active" : "canceled");
              const statusTone = status === "active" ? "success" : status === "past_due" ? "danger" : status === "trial" || status === "trialing" ? "warning" : "muted";
              return (
                <a
                  key={row.studio.id}
                  href={`/admin/studios/${row.studio.id}`}
                  style={{ display: "grid", gridTemplateColumns: "1.25fr .7fr .75fr .75fr .75fr .8fr .8fr", gap: 12, alignItems: "center", padding: "14px 16px", color: "inherit", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", color: "#f4f4f5", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.studio.name}</strong>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <span style={{ color: "#71717a", fontSize: 11, fontFamily: "monospace" }}>/{row.studio.slug}</span>
                      <AdminStatusBadge tone={statusTone as any} dot>{row.studio.is_active ? "Ativo" : "Inativo"}</AdminStatusBadge>
                    </span>
                  </div>
                  <strong style={{ color: "#f4f4f5", fontSize: 13 }}>{row.clients}</strong>
                  <span style={{ color: row.publicClients ? "#818cf8" : "#71717a", fontSize: 13, fontWeight: 800 }}>{row.publicClients}</span>
                  <span style={{ color: row.upcoming ? "#fbbf24" : "#71717a", fontSize: 13, fontWeight: 800 }}>{row.upcoming}</span>
                  <span style={{ color: row.completed ? "#4ade80" : "#71717a", fontSize: 13, fontWeight: 800 }}>{row.completed}</span>
                  <strong style={{ color: row.revenue ? "#4ade80" : "#71717a", fontSize: 13 }}>{formatCurrency(row.revenue)}</strong>
                  <span style={{ color: "#a1a1aa", fontSize: 12 }}>{row.last ? new Date(row.last).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Sem agenda"}</span>
                </a>
              );
            })}
          </div>
        )}
      </AdminPanel>

      <div style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 14, alignItems: "start" }}>
        <AdminPanel
          title="Ações urgentes"
          description="O que pede atenção antes de virar churn, suporte ou perda de receita."
          tone={urgentItems.length ? "warning" : "success"}
        >
          {urgentItems.length ? (
            urgentItems.slice(0, 6).map((item: any) => <RiskRow key={item.title} {...item} />)
          ) : (
            <AdminEmptyState title="Operação sem alertas críticos" description="Nenhum trial vencendo, inadimplente ou studio sem owner no momento." tone="success" />
          )}
        </AdminPanel>

        <AdminPanel title="Saúde da base" description="Resumo rápido dos tenants ativos e em risco." tone="brand">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: 16 }}>
            <AdminMetricCard label="Ativos" value={activeStudios.length} sub="com acesso liberado" icon={Building2} tone="success" />
            <AdminMetricCard label="Risco" value={staleStudios.length + pastDue.length} sub="uso baixo ou atraso" icon={AlertTriangle} tone={staleStudios.length + pastDue.length ? "danger" : "muted"} />
          </div>
          <div style={{ padding: "0 16px 16px", display: "grid", gap: 10 }}>
            {planRows.map((row) => (
              <div key={row.plan}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#f4f4f5", fontWeight: 700 }}>{PLAN_LABEL[row.plan] ?? row.plan}</span>
                  <span style={{ fontSize: 12, color: "#71717a" }}>{row.count} studios · {formatCurrency(row.revenue)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ width: `${row.pct}%`, height: "100%", background: row.plan === "studio" ? "#f472b6" : row.plan === "pro" ? "#818cf8" : row.plan === "starter" ? "#60a5fa" : "#71717a" }} />
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
        <AdminPanel
          title="Studios recentes"
          description="Novos tenants e status comercial."
          actions={<AdminActionButton href="/admin/studios" tone="muted">Ver todos</AdminActionButton>}
        >
          {studioList.slice(0, 7).map((studio) => {
            const status = studio.subscription_status ?? (studio.is_active ? "active" : "canceled");
            const statusTone = status === "active" ? "success" : status === "past_due" ? "danger" : status === "trial" || status === "trialing" ? "warning" : "muted";
            return (
              <a
                key={studio.id}
                href={`/admin/studios/${studio.id}`}
                style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center", padding: "13px 16px", color: "inherit", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, color: "#f4f4f5", fontSize: 13, fontWeight: 750, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{studio.name}</p>
                  <p style={{ margin: "3px 0 0", color: "#71717a", fontSize: 11, fontFamily: "monospace" }}>/{studio.slug}</p>
                </div>
                <AdminStatusBadge tone={statusTone as any} dot>{status === "past_due" ? "Atrasado" : status === "trialing" || status === "trial" ? "Trial" : studio.is_active ? "Ativo" : "Inativo"}</AdminStatusBadge>
                <span style={{ color: getStudioMrr(studio, priceByPlan) ? "#4ade80" : "#71717a", fontSize: 12, fontWeight: 800 }}>
                  {formatCurrency(getStudioMrr(studio, priceByPlan))}
                </span>
              </a>
            );
          })}
        </AdminPanel>

        <AdminPanel title="Evolução do MRR" description="Últimos 6 meses, calculado a partir dos dados atuais." tone="success">
          <MiniBars data={mrrSeries} />
        </AdminPanel>
      </div>
    </div>
  );
}
