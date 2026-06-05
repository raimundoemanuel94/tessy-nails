// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, DollarSign, Users, TrendingUp, Shield, Plus, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "#f5c842", confirmed: "#22d47b",
    completed: "#9D7FD4", cancelled: "#f55a5a", no_show: "#6B6585"
  };
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[status] ?? "#6B6585", display: "inline-block", flexShrink: 0 }} />;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado",
  completed: "Concluído", cancelled: "Cancelado", no_show: "Faltou"
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("studio_id, name, role").eq("id", user.id).single();

  const isSuperadmin = profile?.role === "superadmin";
  const studioId = profile?.studio_id;

  // ── Superadmin sem studio ────────────────────────────────────────────────
  if (isSuperadmin && !studioId) {
    const [{ data: studios }, { data: appts }] = await Promise.all([
      supabase.from("studios").select("id, is_active"),
      supabase.from("appointments").select("price, status"),
    ]);
    const rev = (appts ?? []).filter(a => a.status === "completed").reduce((s, a) => s + (a.price ?? 0), 0);
    const active = (studios ?? []).filter(s => s.is_active).length;

    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(245,158,11,0.35)" }}>
              <Shield size={22} color="#000" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>
                Olá, {profile?.name?.split(" ")[0]} 👋
              </h1>
              <p style={{ fontSize: 13, color: "var(--muted)" }}>Você controla toda a plataforma Nailit</p>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Studios ativos", value: String(active), sub: `de ${studios?.length ?? 0} total`, color: "#f59e0b" },
            { label: "Agendamentos", value: String(appts?.length ?? 0), sub: "na plataforma", color: "#9D7FD4" },
            { label: "Receita total", value: formatCurrency(rev), sub: "concluídos", color: "#22d47b" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="kpi-card" style={{ "--accent-color": color } as any}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "var(--muted)", marginBottom: 10 }}>{label}</p>
              <p style={{ fontSize: 26, fontWeight: 900, color: "var(--text)" }}>{value}</p>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{sub}</p>
            </div>
          ))}
        </div>

        <Link href="/admin" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: "16px 24px", borderRadius: 16, textDecoration: "none",
          background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(252,211,77,0.08) 100%)",
          border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontWeight: 700, fontSize: 15
        }}>
          <Shield size={18} /> Abrir Painel Admin <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  if (!studioId) redirect("/setup");

  const now = new Date();
  const [todayAppts, monthAppts, clients, week7] = await Promise.all([
    supabase.from("appointments").select("id,client_name,service_name,appointment_date,status,price")
      .eq("studio_id", studioId).gte("appointment_date", startOfDay(now).toISOString())
      .lte("appointment_date", endOfDay(now).toISOString()).order("appointment_date"),
    supabase.from("appointments").select("price,status")
      .eq("studio_id", studioId).gte("appointment_date", startOfMonth(now).toISOString())
      .lte("appointment_date", endOfMonth(now).toISOString()),
    supabase.from("clients").select("id", { count: "exact", head: true })
      .eq("studio_id", studioId).eq("is_active", true),
    supabase.from("appointments").select("price,status,appointment_date")
      .eq("studio_id", studioId).gte("appointment_date", subDays(now, 6).toISOString()),
  ]);

  const todayList    = todayAppts.data ?? [];
  const monthList    = monthAppts.data ?? [];
  const monthRevenue = monthList.filter(a => a.status === "completed").reduce((s, a) => s + (a.price ?? 0), 0);
  const pendingToday = todayList.filter(a => ["pending","confirmed"].includes(a.status)).length;
  const completedMonth = monthList.filter(a => a.status === "completed").length;

  // Mini sparkline data (last 7 days revenue)
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i);
    const key = format(d, "yyyy-MM-dd");
    const rev = (week7.data ?? [])
      .filter(a => a.status === "completed" && a.appointment_date?.startsWith(key))
      .reduce((s, a) => s + (a.price ?? 0), 0);
    return { day: format(d, "EEE", { locale: ptBR }).slice(0, 3), rev };
  });
  const maxRev = Math.max(...days7.map(d => d.rev), 1);

  const KPI = [
    { label: "Hoje",           value: `${todayList.length}`,         sub: `${pendingToday} pendente${pendingToday !== 1 ? "s" : ""}`, icon: Calendar,   color: "#9D7FD4" },
    { label: "Receita do mês", value: formatCurrency(monthRevenue),  sub: `${completedMonth} concluídos`,                             icon: DollarSign, color: "#22d47b" },
    { label: "Clientes",       value: String(clients.count ?? 0),    sub: "ativas no studio",                                         icon: Users,      color: "#5a9ef5" },
    { label: "Tendência",      value: `${monthList.length}`,          sub: "agendamentos no mês",                                      icon: TrendingUp, color: "#f5c842" },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>
          Olá, {profile?.name?.split(" ")[0]} ✨
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
          {format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 