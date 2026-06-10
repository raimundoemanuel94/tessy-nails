// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign, Building2, Users, TrendingUp, TrendingDown,
  AlertTriangle, Clock, Sparkles, ArrowUpRight, ArrowRight, CheckCircle2, XCircle
} from "lucide-react";
import { AdminCharts } from "./AdminCharts";

export const dynamic = "force-dynamic";

function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const d = new Date(date); d.setHours(0,0,0,0);
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

export default async function AdminPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await sb.from("profiles").select("role, name").eq("id", user.id).single();
  if (me?.role !== "superadmin") redirect("/dashboard");

  const [
    { data: studios },
    { data: allProfiles },
    { data: prices },
  ] = await Promise.all([
    sb.from("studios").select("id, name, slug, plan, is_active, brand_color, avatar_url, created_at, subscription_status, next_billing_date, mrr, trial_ends_at").order("created_at", { ascending: false }),
    sb.from("profiles").select("id, role"),
    sb.from("plan_prices").select("plan, price, label"),
  ]);

  const studioList = studios || [];
  const priceMap = Object.fromEntries((prices || []).map(p => [p.plan, p]));

  // ===== MÉTRICAS DE NEGÓCIO (SaaS) =====
  const activeSubors = studioList.filter(s => s.subscription_status === "active");
  const mrr          = activeSubors.reduce((sum, s) => sum + Number(s.mrr || 0), 0);
  const arr          = mrr * 12;
  const activeStudios = studioList.filter(s => s.is_active).length;
  const usersActive   = (allProfiles || []).length;

  // Crescimento: studios criados nos últimos 30d vs 30-60d
  const now = Date.now();
  const d30 = now - 30*86400000, d60 = now - 60*86400000;
  const new30  = studioList.filter(s => new Date(s.created_at).getTime() >= d30).length;
  const prev30 = studioList.filter(s => { const t = new Date(s.created_at).getTime(); return t >= d60 && t < d30; }).length;
  const growth = prev30 === 0 ? (new30 > 0 ? 100 : 0) : Math.round(((new30 - prev30) / prev30) * 100);

  // ===== ALERTAS =====
  const expiring = studioList.filter(s => {
    const d = daysUntil(s.next_billing_date);
    return s.subscription_status === "active" && d !== null && d >= 0 && d <= 7;
  });
  const overdue = studioList.filter(s => s.subscription_status === "past_due");
  const recentNew = studioList.filter(s => new Date(s.created_at).getTime() >= d30);

  // ===== HERO KPIS (Linha 1) =====
  const HERO = [
    { label: "Receita Mensal (MRR)", value: formatCurrency(mrr), sub: `${formatCurrency(arr)}/ano`, icon: DollarSign, color: "var(--green)", accent: "rgba(34,212,123,.14)", big: true },
    { label: "Salões Ativos",        value: activeStudios,        sub: `${studioList.length} no total`, icon: Building2, color: "var(--brand-light)", accent: "rgba(124,92,191,.14)" },
    { label: "Usuários Ativos",      value: usersActive,          sub: `${activeSubors.length} pagantes`, icon: Users, color: "#5a9ef5", accent: "rgba(90,158,245,.14)" },
    { label: "Crescimento (30d)",    value: `${growth >= 0 ? "+" : ""}${growth}%`, sub: `${new30} novos salões`, icon: growth >= 0 ? TrendingUp : TrendingDown, color: growth >= 0 ? "var(--green)" : "var(--red)", accent: growth >= 0 ? "rgba(34,212,123,.14)" : "rgba(245,90,90,.14)" },
  ];

  // ===== ALERT CARDS (Linha 2) =====
  const ALERTS = [
    { label: "Assinaturas vencendo", count: expiring.length, icon: Clock, color: "var(--yellow)", bg: "rgba(245,200,66,.08)", border: "rgba(245,200,66,.25)", desc: "próximos 7 dias" },
    { label: "Inadimplentes",        count: overdue.length,  icon: AlertTriangle, color: "var(--red)", bg: "rgba(245,90,90,.08)", border: "rgba(245,90,90,.25)", desc: "pagamento atrasado" },
    { label: "Novos salões",         count: recentNew.length, icon: Sparkles, color: "var(--green)", bg: "rgba(34,212,123,.08)", border: "rgba(34,212,123,.25)", desc: "últimos 30 dias" },
  ];

  const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
    active:   { label: "Ativo",       color: "var(--green)",  bg: "rgba(34,212,123,.12)" },
    trial:    { label: "Trial",       color: "var(--brand-light)", bg: "rgba(124,92,191,.12)" },
    past_due: { label: "Inadimplente",color: "var(--red)",    bg: "rgba(245,90,90,.12)" },
    canceled: { label: "Cancelado",   color: "var(--muted)",  bg: "rgba(107,101,133,.12)" },
  };
  const PLAN_C: Record<string,string> = { pro:"var(--brand-light)", starter:"#5a9ef5", free:"var(--muted)", studio:"var(--gold)" };

  // Chart data — últimos 6 meses de crescimento acumulado e MRR
  const months: { label: string; studios: number; mrr: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(); dt.setMonth(dt.getMonth() - i); dt.setDate(1); dt.setHours(0,0,0,0);
    const end = new Date(dt); end.setMonth(end.getMonth() + 1);
    const cumulative = studioList.filter(s => new Date(s.created_at) < end);
    const monthMrr = cumulative.filter(s => s.subscription_status === "active").reduce((sum,s)=>sum+Number(s.mrr||0),0);
    months.push({
      label: dt.toLocaleDateString("pt-BR", { month: "short" }),
      studios: cumulative.length,
      mrr: monthMrr,
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>⚡ Painel Superadmin</div>
          <h1 style={{ fontSize: 27, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: "-.02em" }}>Visão do Negócio</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>Métricas de receita e assinaturas da plataforma</p>
        </div>
        <Link href="/admin/studios" style={{ display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", borderRadius: 13, background: "linear-gradient(135deg, var(--brand-light), var(--brand))", color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none", boxShadow: "0 4px 20px var(--brand-glow)" }}>
          + Novo Salão
        </Link>
      </div>

      {/* ===== LINHA 1: HERO KPIS ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 14 }}>
        {HERO.map(({ label, value, sub, icon: Icon, color, accent, big }) => (
          <div key={label} style={{
            position: "relative", overflow: "hidden",
            background: big ? `linear-gradient(135deg, ${accent}, var(--surface))` : "var(--surface)",
            border: `1px solid ${big ? color.replace("var(--","rgba(").replace(")",", .25)") : "var(--border)"}`,
            borderRadius: 20, padding: "22px 20px",
            boxShadow: big ? `0 8px 30px ${accent}` : "none",
          }}>
            <div style={{ position: "absolute", top: -30, right: -20, width: 100, height: 100, borderRadius: "50%", background: color, opacity: .08, filter: "blur(30px)" }}/>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={17} color={color}/>
              </div>
            </div>
            <div style={{ fontSize: big ? 34 : 30, fontWeight: 900, color: "var(--text)", letterSpacing: "-.03em", lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: color, fontWeight: 600, marginTop: 8 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ===== LINHA 2: ALERTAS ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {ALERTS.map(({ label, count, icon: Icon, color, bg, border, desc }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: "16px 18px" }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={20} color={color}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: "-.02em" }}>{count}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{label}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== LINHA 3: TABELA DE ASSINATURAS ===== */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg,rgba(124,92,191,.05),transparent)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Building2 size={16} color="var(--brand-light)"/>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>Assinaturas</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: "rgba(124,92,191,.15)", color: "var(--brand-light)", border: "1px solid rgba(124,92,191,.25)" }}>{studioList.length}</span>
          </div>
          <Link href="/admin/studios" style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-light)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>Gerenciar <ArrowRight size={13}/></Link>
        </div>

        {studioList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--muted)" }}>Nenhum salão cadastrado.</div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1.3fr 1.2fr 1fr", gap: 12, padding: "10px 20px", borderBottom: "1px solid var(--border)", fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>
              <span>Salão</span><span>Plano</span><span>Status</span><span>Próx. Cobrança</span><span style={{ textAlign: "right" }}>MRR</span>
            </div>
            {studioList.map((s, i) => {
              const st = STATUS_STYLE[s.subscription_status] || STATUS_STYLE.canceled;
              const dleft = daysUntil(s.next_billing_date);
              const rgb = s.brand_color || "#7C5CBF";
              return (
                <Link key={s.id} href={`/admin/studios/${s.id}`} style={{
                  display: "grid", gridTemplateColumns: "2.5fr 1fr 1.3fr 1.2fr 1fr", gap: 12, alignItems: "center",
                  padding: "14px 20px", textDecoration: "none",
                  borderBottom: i < studioList.length-1 ? "1px solid var(--border)" : "none",
                  transition: "background .15s",
                }}>
                  {/* Salão */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: `linear-gradient(140deg,${rgb},rgba(0,0,0,.35))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>
                      {s.avatar_url ? <img src={s.avatar_url} style={{ width: "100%", height: "100%", borderRadius: 9, objectFit: "cover" }} alt=""/> : s.name.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>/{s.slug}</div>
                    </div>
                  </div>
                  {/* Plano */}
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 7, textTransform: "uppercase", letterSpacing: ".04em", background: `${PLAN_C[s.plan]}1f`, color: PLAN_C[s.plan], border: `1px solid ${PLAN_C[s.plan]}33` }}>{s.plan}</span>
                  </div>
                  {/* Status */}
                  <div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, padding: "4px 11px", borderRadius: 8, background: st.bg, color: st.color }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.color }}/>
                      {st.label}
                    </span>
                  </div>
                  {/* Próx cobrança */}
                  <div>
                    {s.next_billing_date ? (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{new Date(s.next_billing_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</div>
                        {dleft !== null && dleft >= 0 && dleft <= 7 && <div style={{ fontSize: 10, color: "var(--yellow)", fontWeight: 600 }}>em {dleft}d</div>}
                        {dleft !== null && dleft < 0 && <div style={{ fontSize: 10, color: "var(--red)", fontWeight: 600 }}>atrasado</div>}
                      </div>
                    ) : <span style={{ fontSize: 12, color: "var(--muted)" }}>—</span>}
                  </div>
                  {/* MRR */}
                  <div style={{ textAlign: "right", fontSize: 14, fontWeight: 800, color: Number(s.mrr) > 0 ? "var(--green)" : "var(--muted)" }}>
                    {Number(s.mrr) > 0 ? formatCurrency(Number(s.mrr)) : "—"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== LINHA 4: GRÁFICOS ===== */}
      <AdminCharts months={months} />
    </div>
  );
}
