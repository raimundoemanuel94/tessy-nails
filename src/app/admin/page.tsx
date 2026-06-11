// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CreditCard,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PLAN_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  pro: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.26)" },
  starter: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.26)" },
  studio: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.26)" },
  free: { color: "#85809b", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.10)" },
};

const STATUS_COPY: Record<string, string> = {
  active: "Ativo",
  trialing: "Trial",
  past_due: "Atrasado",
  canceled: "Cancelado",
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function getStudioMrr(studio: any, priceByPlan: Map<string, number>) {
  if (studio.subscription_status !== "active") return 0;

  const explicitMrr = Number(studio.mrr ?? 0);
  if (Number.isFinite(explicitMrr) && explicitMrr > 0) return explicitMrr;

  const planPrice = Number(priceByPlan.get(studio.plan) ?? 0);
  return Number.isFinite(planPrice) ? planPrice : 0;
}

function buildMonthlySeries(studios: any[], priceByPlan: Map<string, number>) {
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const start = new Date();
    start.setMonth(start.getMonth() - i);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const cumulative = studios.filter((studio) => new Date(studio.created_at) < end);
    const mrr = cumulative.reduce((sum, studio) => sum + getStudioMrr(studio, priceByPlan), 0);

    months.push({
      label: start.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      mrr,
      studios: cumulative.length,
    });
  }

  return months;
}

function MrrBars({ months }: { months: { label: string; mrr: number; studios: number }[] }) {
  const max = Math.max(...months.map((month) => month.mrr), 1);

  return (
    <div style={{ height: 150, display: "flex", alignItems: "end", gap: 12, paddingTop: 10 }}>
      {months.map((month) => {
        const height = Math.max(8, Math.round((month.mrr / max) * 120));

        return (
          <div key={month.label} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ height: 124, display: "flex", alignItems: "end" }}>
              <div
                title={`${month.label}: ${formatCurrency(month.mrr)}`}
                style={{
                  width: "100%",
                  height,
                  borderRadius: "6px 6px 2px 2px",
                  background: month.mrr > 0
                    ? "linear-gradient(180deg,#34d399,#1f8f62)"
                    : "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            </div>
            <div style={{ marginTop: 8, textAlign: "center", fontSize: 10, fontWeight: 800, color: "#6b6585", textTransform: "uppercase" }}>
              {month.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ data: studios }, { data: profiles }, { data: prices }] = await Promise.all([
    supabase
      .from("studios")
      .select("id, name, slug, plan, is_active, subscription_status, mrr, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, role"),
    supabase.from("plan_prices").select("plan, price, label"),
  ]);

  const studioList = studios ?? [];
  const profileList = profiles ?? [];
  const priceList = prices ?? [];
  const priceByPlan = new Map(priceList.map((price) => [price.plan, Number(price.price ?? 0)]));
  const labelByPlan = new Map(priceList.map((price) => [price.plan, price.label ?? price.plan]));

  const totalStudios = studioList.length;
  const activeStudios = studioList.filter((studio) => studio.is_active).length;
  const paidStudios = studioList.filter((studio) => getStudioMrr(studio, priceByPlan) > 0).length;
  const mrr = studioList.reduce((sum, studio) => sum + getStudioMrr(studio, priceByPlan), 0);
  const arr = mrr * 12;
  const arpu = paidStudios ? mrr / paidStudios : 0;
  const monthlySeries = buildMonthlySeries(studioList, priceByPlan);
  const mrrDelta = monthlySeries.length >= 2 ? monthlySeries[monthlySeries.length - 1].mrr - monthlySeries[monthlySeries.length - 2].mrr : 0;
  const recentStudios = studioList.slice(0, 6);

  const planRows = ["studio", "pro", "starter", "free"].map((plan) => {
    const count = studioList.filter((studio) => studio.plan === plan).length;
    const revenue = studioList
      .filter((studio) => studio.plan === plan)
      .reduce((sum, studio) => sum + getStudioMrr(studio, priceByPlan), 0);

    return {
      plan,
      label: labelByPlan.get(plan) ?? plan,
      count,
      revenue,
      pct: mrr > 0 ? Math.round((revenue / mrr) * 100) : 0,
      style: PLAN_STYLE[plan] ?? PLAN_STYLE.free,
    };
  });

  const C = {
    panel: "rgba(255,255,255,0.045)",
    panel2: "rgba(255,255,255,0.025)",
    border: "rgba(255,255,255,0.10)",
    borderSoft: "rgba(255,255,255,0.06)",
    text: "#ede9fe",
    muted: "#6b6585",
    gold: "#f59e0b",
  };

  const kpis = [
    {
      label: "MRR",
      value: formatCurrency(mrr),
      sub: mrrDelta === 0 ? "sem variação no mês" : `${mrrDelta > 0 ? "+" : ""}${formatCurrency(mrrDelta)} vs mês anterior`,
      icon: DollarSign,
      color: "#34d399",
    },
    {
      label: "Salões pagantes",
      value: `${paidStudios}`,
      sub: `${totalStudios} salões cadastrados`,
      icon: CreditCard,
      color: "#60a5fa",
    },
    {
      label: "ARR",
      value: formatCurrency(arr),
      sub: "receita anual recorrente",
      icon: TrendingUp,
      color: "#a78bfa",
    },
    {
      label: "Usuarios",
      value: `${profileList.length}`,
      sub: `${profileList.filter((profile) => profile.role === "superadmin").length} superadmin`,
      icon: Users,
      color: "#f59e0b",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1160, position: "relative", zIndex: 1 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 18 }}>
        <div>
          <p style={{
            fontSize: 11,
            fontWeight: 900,
            color: C.gold,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}>
            Platform Overview
          </p>
          <h1 style={{ fontSize: 31, fontWeight: 950, color: C.text, margin: 0, lineHeight: 1 }}>
            {getGreeting()}, Admin
          </h1>
          <p style={{ color: C.muted, margin: "9px 0 0", fontSize: 13 }}>
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <Link href="/admin/studios" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          height: 40,
          padding: "0 16px",
          borderRadius: 8,
          textDecoration: "none",
          background: "rgba(245,158,11,0.12)",
          border: "1px solid rgba(245,158,11,0.30)",
          color: C.gold,
          fontSize: 12,
          fontWeight: 850,
        }}>
          Novo studio <ArrowRight size={13} />
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: "18px 18px 16px",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, background: color, opacity: 0.75 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.10em", textTransform: "uppercase", color: C.muted }}>
                {label}
              </span>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `${color}18`,
                border: `1px solid ${color}30`,
              }}>
                <Icon size={15} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 950, color: "#fff", lineHeight: 1, marginBottom: 8 }}>
              {value}
            </div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.35 }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 330px", gap: 16, alignItems: "start" }}>
        <section style={{
          background: C.panel,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}>
          <div style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${C.borderSoft}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: C.panel2,
          }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 900, color: C.text, margin: 0 }}>Studios recentes</h2>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Status comercial e plano atual</p>
            </div>
            <Link href="/admin/studios" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: C.gold, fontSize: 11, fontWeight: 850, textDecoration: "none" }}>
              Ver todos <ArrowUpRight size={12} />
            </Link>
          </div>

          {recentStudios.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 88px 104px 88px 28px", padding: "8px 20px", borderBottom: `1px solid ${C.borderSoft}` }}>
              {["Studio", "Plano", "Assinatura", "MRR", ""].map((heading) => (
                <span key={heading} style={{ fontSize: 10, fontWeight: 900, color: C.muted, letterSpacing: "0.09em", textTransform: "uppercase" }}>
                  {heading}
                </span>
              ))}
            </div>
          )}

          {recentStudios.length === 0 ? (
            <div style={{ padding: "50px 20px", textAlign: "center" }}>
              <Building2 size={28} color={C.muted} />
              <p style={{ fontSize: 14, fontWeight: 850, color: C.text, marginTop: 14 }}>Nenhum studio cadastrado</p>
            </div>
          ) : (
            recentStudios.map((studio, index) => {
              const planStyle = PLAN_STYLE[studio.plan] ?? PLAN_STYLE.free;
              const studioMrr = getStudioMrr(studio, priceByPlan);
              const status = studio.subscription_status ?? (studio.is_active ? "active" : "canceled");
              const statusColor = status === "active" ? "#34d399" : status === "past_due" ? "#f5c842" : "#85809b";

              return (
                <Link
                  key={studio.id}
                  href={`/admin/studios/${studio.id}`}
                  className="a-link-row"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 88px 104px 88px 28px",
                    alignItems: "center",
                    padding: "14px 20px",
                    textDecoration: "none",
                    borderBottom: index < recentStudios.length - 1 ? `1px solid ${C.borderSoft}` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: "linear-gradient(135deg,#f59e0b,#fcd34d)",
                      color: "#05050a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 950,
                      flexShrink: 0,
                    }}>
                      {studio.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 850, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {studio.name}
                      </div>
                      <div style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", marginTop: 2 }}>/{studio.slug}</div>
                    </div>
                  </div>

                  <span style={{
                    width: "fit-content",
                    fontSize: 10,
                    fontWeight: 900,
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: planStyle.bg,
                    color: planStyle.color,
                    border: `1px solid ${planStyle.border}`,
                    textTransform: "uppercase",
                  }}>
                    {studio.plan}
                  </span>

                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: statusColor }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
                    {STATUS_COPY[status] ?? status}
                  </span>

                  <span style={{ fontSize: 12, fontWeight: 900, color: studioMrr > 0 ? "#34d399" : C.muted }}>
                    {formatCurrency(studioMrr)}
                  </span>

                  <ArrowRight size={13} color={C.muted} />
                </Link>
              );
            })
          )}
        </section>

        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <section style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: "18px 18px 16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 900, color: C.text, margin: 0 }}>MRR por plano</h2>
              <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{paidStudios} salões pagantes</p>
              </div>
              <Link href="/admin/config/planos" style={{ color: C.gold, textDecoration: "none", fontSize: 11, fontWeight: 850 }}>
                Editar
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
              {planRows.map(({ plan, label, count, revenue, pct, style }) => (
                <div key={plan}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 850, color: C.text }}>{label}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{count} salões</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 950, color: style.color }}>{formatCurrency(revenue)}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{pct}%</div>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 6, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, borderRadius: 6, background: style.color }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: "18px 18px 16px",
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 900, color: C.text, margin: 0 }}>Saude da base</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              {[
                { label: "Ativos", value: activeStudios },
                { label: "ARPU", value: formatCurrency(arpu) },
              ].map((item) => (
                <div key={item.label} style={{ border: `1px solid ${C.borderSoft}`, borderRadius: 8, padding: 12, background: C.panel2 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 950, color: C.text, marginTop: 8 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "18px 20px 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 900, color: C.text, margin: 0 }}>Evolucao do MRR</h2>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>últimos 6 meses</p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 900, color: mrrDelta >= 0 ? "#34d399" : "#f55a5a" }}>
            {mrrDelta >= 0 ? "+" : ""}{formatCurrency(mrrDelta)}
          </span>
        </div>
        <MrrBars months={monthlySeries} />
      </section>
    </div>
  );
}
