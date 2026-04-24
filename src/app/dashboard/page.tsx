"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn, ensureDate } from "@/lib/utils";
import { getLast30DaysInterval } from "@/lib/analytics-period";
import { PageShell } from "@/components/shared/PageShell";
import { motion, Variants } from "framer-motion";
import {
  DollarSign, CalendarDays, Users, Plus, Target,
  Clock, Sparkles, ChevronRight, TrendingUp, CheckCircle2,
  BarChart3, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { appointmentService } from "@/services/appointments";
import { authService } from "@/services/auth";
import { format, isToday, isPast, startOfDay, getHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import nextDynamic from "next/dynamic";
import { globalStore } from "@/store/globalStore";
import { toast } from "sonner";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const RevenueChart = nextDynamic(
  () => import("@/components/dashboard/DashboardCharts").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <div className="h-[220px] w-full animate-pulse bg-brand-soft/20 rounded-2xl" /> }
);

const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item: Variants = {
  hidden: { y: 14, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 130, damping: 18 } },
};

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  confirmed: { label: "Confirmado", cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  pending:   { label: "Pendente",   cls: "bg-amber-50 text-amber-700",     dot: "bg-amber-400"  },
  completed: { label: "Concluido",  cls: "bg-brand-soft/40 text-brand-primary", dot: "bg-brand-primary" },
};

function greeting(name: string) {
  const h = getHours(new Date());
  const g = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  return g + ", " + name;
}

interface ApptItem { id: string; client: string; service: string; price: number; time: string; date: string; isToday: boolean; status: string; }
interface SvcItem  { name: string; count: number; }
interface RevPoint { date: string; total: number; }

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({ revenue: 0, today: 0, clients: 0, rate: 0 });
  const [appts,    setAppts]    = useState<ApptItem[]>([]);
  const [services, setServices] = useState<SvcItem[]>([]);
  const [chart,    setChart]    = useState<RevPoint[]>([]);
  const [busy,     setBusy]     = useState(true);
  const [dialog,   setDialog]   = useState(false);

  const displayName =
    user?.name && user.name.trim() !== "" && user.name.trim().toLowerCase() !== "usuario"
      ? user.name.split(" ")[0]
      : user?.email?.split("@")[0] || "Tessy";

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push("/login"); return; }
      if (user.role !== "admin" && user.role !== "professional") { router.push("/cliente"); return; }
    }
  }, [user, loading, router]);

  const fetchData = useCallback(async () => {
    if (loading || !user || (user.role !== "admin" && user.role !== "professional")) return;
    try {
      setBusy(true);
      const { start, end } = getLast30DaysInterval();
      const [rawAppts, clients, svcs] = await Promise.all([
        appointmentService.getByDateRange(start, end),
        globalStore.fetchRecentClients(false),
        globalStore.fetchServices(false),
      ]);
      const unknownIds = rawAppts
        .map((a) => a.clientId)
        .filter((id, i, arr) => Boolean(id) && arr.indexOf(id) === i)
        .filter((id) => !clients.some((c) => c.id === id));
      const extraUsers = unknownIds.length > 0 ? await authService.getUsersByIds(unknownIds) : [];
      const priceById = new Map(svcs.map((s) => [s.id, Number(s.price) || 0]));
      const done      = rawAppts.filter((a) => a.status === "completed");
      const todayAppts = rawAppts.filter(
        (a) => isToday(ensureDate(a.appointmentDate)) && a.status !== "cancelled" && a.status !== "no_show"
      );
      const revenue   = done.reduce((t, a) => t + (priceById.get(a.serviceId) ?? 0), 0);
      const clientSet = new Set(done.map((a) => a.clientId).filter(Boolean)).size;
      const rate      = rawAppts.length > 0 ? Math.round((done.length / rawAppts.length) * 100) : 0;
      setStats({ revenue, today: todayAppts.length, clients: clientSet, rate });
      const upcoming = rawAppts
        .filter((a) => (a.status === "pending" || a.status === "confirmed") &&
          (!isPast(ensureDate(a.appointmentDate)) || isToday(ensureDate(a.appointmentDate))))
        .sort((a, b) => ensureDate(a.appointmentDate).getTime() - ensureDate(b.appointmentDate).getTime())
        .slice(0, 6)
        .map((a) => {
          const c = clients.find((x) => x.id === a.clientId) ?? extraUsers.find((x) => x.uid === a.clientId);
          const s = svcs.find((x) => x.id === a.serviceId);
          return {
            id: a.id ?? "",
            client: c?.name || "Cliente",
            service: s?.name || "Servico",
            price: s?.price || 0,
            time: format(ensureDate(a.appointmentDate), "HH:mm"),
            date: format(ensureDate(a.appointmentDate), "EEE dd/MM", { locale: ptBR }),
            isToday: isToday(ensureDate(a.appointmentDate)),
            status: a.status,
          };
        });
      setAppts(upcoming);
      const top = svcs
        .map((s) => ({ name: s.name, count: rawAppts.filter((a) => a.serviceId === s.id && a.status === "completed").length }))
        .sort((a, b) => b.count - a.count).slice(0, 5);
      setServices(top);
      const now2 = new Date();
      const weekStart = startOfDay(new Date(new Date().setDate(now2.getDate() - now2.getDay())));
      const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateStr = format(d, "dd/MM");
        return {
          date: dateStr,
          total: done
            .filter((a) => format(ensureDate(a.appointmentDate), "dd/MM") === dateStr)
            .reduce((t, a) => t + (priceById.get(a.serviceId) ?? 0), 0),
        };
      });
      setChart(chartData);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setBusy(false);
    }
  }, [loading, user]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  if (loading || busy) {
    return (
      <PageShell className="max-w-none pb-0">
        <div className="mx-auto max-w-7xl space-y-6 pb-12 animate-pulse">
          <div className="h-16 rounded-2xl bg-brand-soft/30 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => <div key={i} className="h-28 rounded-2xl bg-brand-soft/30" />)}
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 h-80 rounded-2xl bg-brand-soft/30" />
            <div className="h-80 rounded-2xl bg-brand-soft/30" />
          </div>
          <div className="h-64 rounded-2xl bg-brand-soft/30" />
        </div>
      </PageShell>
    );
  }

  const goalPct = Math.min(Math.round((stats.revenue / 15000) * 100), 100);
  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });

  return (
    <PageShell className="max-w-none pb-0">
      <motion.div variants={container} initial="hidden" animate="visible"
        className="mx-auto max-w-7xl space-y-6 pb-12">

        {/* HEADER */}
        <motion.div variants={item}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-text-sub mb-1 capitalize">{today}</p>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-brand-text-main">
              {greeting(displayName)} ✨
            </h1>
            <p className="text-sm text-brand-text-sub mt-1 opacity-60">
              Visao rapida do que importa no seu studio hoje.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm"
              onClick={() => router.push("/relatorios")}
              className="rounded-2xl border-brand-accent/20 text-brand-text-sub hover:text-brand-primary font-semibold gap-2 h-11">
              <BarChart3 size={15} /> Relatorios
            </Button>
            <Button onClick={() => setDialog(true)}
              className="h-11 px-6 bg-brand-primary text-white font-bold rounded-2xl shadow-md hover:opacity-90 active:scale-95 transition-all gap-2">
              <Plus size={16} /> Novo Agendamento
            </Button>
          </div>
        </motion.div>

        {/* 4 KPI CARDS */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden rounded-2xl bg-brand-primary p-5 text-white shadow-xl col-span-2 lg:col-span-1">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/8" />
            <div className="absolute right-2 bottom-2 h-12 w-12 rounded-full bg-white/5" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Receita 30d</p>
                <DollarSign size={16} className="text-white/40" />
              </div>
              <p className="text-3xl font-black tracking-tight">
                <span className="text-base font-semibold mr-0.5">R$</span>
                {stats.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold text-white/50">
                  <span>Meta R$ 15.000</span><span>{goalPct}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/15 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: goalPct + "%" }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-white/80 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-accent/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-text-sub">Agend. Hoje</p>
              <CalendarDays size={16} className="text-brand-primary" />
            </div>
            <p className="text-3xl font-black tracking-tight text-brand-text-main">{stats.today}</p>
            <p className="text-[10px] font-bold text-brand-text-sub opacity-50 mt-2">
              {stats.today === 0 ? "nenhum agendamento" : stats.today + " agendamentos"}
            </p>
          </div>

          <div className="rounded-2xl border border-brand-accent/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-text-sub">Clientes 30d</p>
              <Users size={16} className="text-emerald-500" />
            </div>
            <p className="text-3xl font-black tracking-tight text-brand-text-main">{stats.clients}</p>
            <p className="text-[10px] font-bold text-brand-text-sub opacity-50 mt-2">clientes unicos atendidos</p>
          </div>

          <div className="rounded-2xl border border-brand-accent/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-text-sub">Taxa Conclusao</p>
              <CheckCircle2 size={16} className={stats.rate >= 70 ? "text-emerald-500" : "text-amber-400"} />
            </div>
            <p className={cn("text-3xl font-black tracking-tight", stats.rate >= 70 ? "text-emerald-600" : "text-amber-600")}>
              {stats.rate}%
            </p>
            <p className="text-[10px] font-bold text-brand-text-sub opacity-50 mt-2">
              {stats.rate >= 70 ? "excelente performance" : "pode melhorar"}
            </p>
          </div>
        </motion.div>

        {/* MAIN GRID */}
        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div variants={item} className="lg:col-span-2">
            <div className="rounded-2xl border border-brand-accent/10 bg-white shadow-sm h-full flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-accent/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                    <Clock size={15} className="text-brand-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-brand-text-main">Proximos Atendimentos</h2>
                    <p className="text-[10px] font-bold text-brand-text-sub opacity-50">pendentes e confirmados</p>
                  </div>
                </div>
                <button onClick={() => router.push("/agendamentos")}
                  className="flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:underline">
                  Ver agenda <ChevronRight size={13} />
                </button>
              </div>
              <div className="flex-1">
                {appts.length > 0 ? (
                  <div>
                    {appts.map((a, i) => {
                      const st = STATUS[a.status] ?? STATUS.pending;
                      return (
                        <motion.div key={a.id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => router.push("/agendamentos")}
                          className="flex items-center gap-4 px-6 py-3.5 border-b border-brand-accent/5 last:border-0 hover:bg-brand-soft/10 cursor-pointer transition-colors">
                          <div className="text-center w-12 shrink-0">
                            <p className="text-base font-black text-brand-primary tabular-nums">{a.time}</p>
                            <p className="text-[9px] font-bold text-brand-text-sub opacity-50 capitalize">
                              {a.isToday ? "hoje" : a.date}
                            </p>
                          </div>
                          <div className="w-px h-9 bg-brand-accent/10 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-brand-text-main truncate">{a.client}</p>
                            <p className="text-[11px] text-brand-text-sub opacity-60 truncate mt-0.5">{a.service}</p>
                          </div>
                          {Number(a.price) > 0 && (
                            <p className="text-sm font-black text-brand-text-main tabular-nums shrink-0">
                              R$ {Number(a.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                          )}
                          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black shrink-0", st.cls)}>
                            <div className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                            {st.label}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-6 py-8 flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-soft/30 flex items-center justify-center">
                      <Sparkles size={22} className="text-brand-accent" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-brand-text-main">Agenda livre agora</p>
                      <p className="text-xs text-brand-text-sub opacity-50 mt-1">Nenhum atendimento pendente no momento.</p>
                    </div>
                    <Button size="sm" onClick={() => setDialog(true)}
                      className="rounded-xl bg-brand-primary text-white hover:opacity-90 text-xs font-bold gap-1.5">
                      <Plus size={13} /> Agendar agora
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div variants={item}>
            <div className="rounded-2xl border border-brand-accent/10 bg-white shadow-sm h-full flex flex-col">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-brand-accent/5">
                <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                  <TrendingUp size={15} className="text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-brand-text-main">Top Servicos</h2>
                  <p className="text-[10px] font-bold text-brand-text-sub opacity-50">concluidos nos ultimos 30d</p>
                </div>
              </div>
              <div className="flex-1 p-5 space-y-4">
                {services.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2 opacity-40">
                    <Target size={24} strokeWidth={1.5} className="text-brand-text-sub" />
                    <p className="text-xs font-bold text-brand-text-sub">Nenhum servico registrado.</p>
                  </div>
                ) : (
                  services.map((svc, idx) => {
                    const max = services[0]?.count || 1;
                    const pct = Math.round((svc.count / max) * 100);
                    return (
                      <div key={svc.name} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-brand-text-main truncate max-w-[75%]">{svc.name}</p>
                          <span className="text-[10px] font-black text-brand-text-sub">{svc.count}x</span>
                        </div>
                        <div className="h-1.5 w-full bg-brand-soft/30 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: pct + "%" }}
                            transition={{ delay: 0.3 + idx * 0.07, duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full bg-brand-primary" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="px-5 pb-5">
                <button onClick={() => router.push("/relatorios")}
                  className="w-full flex items-center justify-center gap-1.5 text-[11px] font-black text-brand-primary hover:underline">
                  Ver relatorio completo <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* GRAFICO */}
        <motion.div variants={item}>
          <div className="rounded-2xl border border-brand-accent/10 bg-white shadow-sm p-6">
            <RevenueChart data={chart} compact={false} />
          </div>
        </motion.div>

      </motion.div>

      <Dialog open={dialog} onOpenChange={(open) => {
        if (!open) (document.activeElement as HTMLElement)?.blur();
        setDialog(open);
      }}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-brand-accent/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-brand-primary">Novo Agendamento</DialogTitle>
          </DialogHeader>
          <AppointmentForm onSuccess={() => {
            setDialog(false);
            void fetchData();
            toast.success("Agendamento criado com sucesso!");
          }} />
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
