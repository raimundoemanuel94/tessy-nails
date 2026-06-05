// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, DollarSign, Users, TrendingUp, Shield } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("studio_id, name, role").eq("id", user.id).single();

  const isSuperadmin = profile?.role === "superadmin";
  const studioId = profile?.studio_id;

  // Superadmin sem studio → resumo da plataforma
  if (isSuperadmin && !studioId) {
    const [{ data: studios }, { data: appts }] = await Promise.all([
      supabase.from("studios").select("id, is_active"),
      supabase.from("appointments").select("price, status"),
    ]);
    const rev = (appts ?? []).filter(a => a.status === "completed").reduce((s, a) => s + (a.price ?? 0), 0);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f59e0b" }}>
            <Shield size={20} color="#000" />
          </div>
          <div>
            <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>
              Olá, {profile?.name?.split(" ")[0]} 👋
            </h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Você controla toda a plataforma</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="card"><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>Studios ativos</p>
            <p className="text-2xl font-black" style={{ color: "#f59e0b" }}>{(studios ?? []).filter(s => s.is_active).length}</p></div>
          <div className="card"><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>Agendamentos</p>
            <p className="text-2xl font-black" style={{ color: "var(--text)" }}>{(appts ?? []).length}</p></div>
          <div className="card"><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>Receita total</p>
            <p className="text-2xl font-black" style={{ color: "#4ade80" }}>{formatCurrency(rev)}</p></div>
        </div>

        <Link href="/admin" className="btn-primary w-full justify-center"
          style={{ background: "#f59e0b", color: "#000" }}>
          <Shield size={16} /> Abrir Painel Admin
        </Link>
      </div>
    );
  }

  if (!studioId) redirect("/setup");

  const now = new Date();
  const [todayAppts, monthAppts, clients] = await Promise.all([
    supabase.from("appointments").select("id,client_name,service_name,appointment_date,status,price")
      .eq("studio_id", studioId).gte("appointment_date", startOfDay(now).toISOString())
      .lte("appointment_date", endOfDay(now).toISOString()).order("appointment_date"),
    supabase.from("appointments").select("price,status")
      .eq("studio_id", studioId).gte("appointment_date", startOfMonth(now).toISOString())
      .lte("appointment_date", endOfMonth(now).toISOString()),
    supabase.from("clients").select("id", { count: "exact", head: true })
      .eq("studio_id", studioId).eq("is_active", true),
  ]);

  const todayList    = todayAppts.data ?? [];
  const monthRevenue = (monthAppts.data ?? []).filter(a => a.status === "completed").reduce((s, a) => s + (a.price ?? 0), 0);
  const pendingToday = todayList.filter(a => ["pending","confirmed"].includes(a.status)).length;

  const STATUS_MAP = {
    pending:   { label: "Pendente",   cls: "badge-yellow" },
    confirmed: { label: "Confirmado", cls: "badge-green"  },
    completed: { label: "Concluído",  cls: "badge-purple" },
    cancelled: { label: "Cancelado",  cls: "badge-red"    },
    no_show:   { label: "Faltou",     cls: "badge-gray"   },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>
          Olá, {profile?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
          {format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Hoje",        value: `${todayList.length} aptos`, icon: Calendar,   color: "#818cf8" },
          { label: "Pendentes",   value: String(pendingToday),         icon: TrendingUp, color: "#facc15" },
          { label: "Receita/mês", value: formatCurrency(monthRevenue), icon: DollarSign, color: "#4ade80" },
          { label: "Clientes",    value: String(clients.count ?? 0),   icon: Users,      color: "#f472b6" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{label}</span>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-lg font-black" style={{ color: "var(--text)" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text)" }}>Agenda de Hoje</h2>
          <Link href="/agenda" className="text-xs font-bold" style={{ color: "var(--brand-light)" }}>Ver tudo →</Link>
        </div>
        {todayList.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>Nenhum agendamento hoje.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {todayList.map(appt => {
              const st = STATUS_MAP[appt.status] ?? { label: appt.status, cls: "badge-gray" };
              return (
                <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                  <div className="text-sm font-black w-12 shrink-0" style={{ color: "var(--brand-light)" }}>
                    {format(new Date(appt.appointment_date), "HH:mm")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{appt.client_name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{appt.service_name}</p>
                  </div>
                  <span className="text-xs font-bold shrink-0" style={{ color: "var(--text)" }}>{formatCurrency(appt.price)}</span>
                  <span className={`badge ${st.cls} shrink-0`}>{st.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
