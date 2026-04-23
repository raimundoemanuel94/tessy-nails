"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn, ensureDate } from "@/lib/utils";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { motion, Variants } from "framer-motion";
import {
  DollarSign,
  Clock,
  Users,
  TrendingUp,
  Plus,
  Target,
  CalendarDays,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appointmentService } from "@/services/appointments";
import { authService } from "@/services/auth";
import { salonService } from "@/services/salon";
import { format, isToday, isPast, startOfDay, subDays, endOfDay } from "date-fns";
import nextDynamic from "next/dynamic";
import { globalStore } from "@/store/globalStore";

const RevenueChart = nextDynamic(
  () => import("@/components/dashboard/DashboardCharts").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <div className="h-[280px] w-full animate-pulse bg-brand-soft/20 rounded-2xl" /> }
);

import { toast } from "sonner";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  confirmed: { label: "Confirmado", color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  pending:   { label: "Pendente",   color: "text-amber-700",   bg: "bg-amber-50",   dot: "bg-amber-400"  },
  completed: { label: "Concluído",  color: "text-brand-primary", bg: "bg-brand-soft/30", dot: "bg-brand-primary" },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants: Variants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 18 } },
};

interface RecentAppointmentItem {
  id: string;
  client: string;
  service: string;
  price: number;
  time: string;
  date: string;
  isToday: boolean;
  status: string;
}

interface TopServiceItem {
  name: string;
  count: number;
}

interface RevenueDataPoint {
  date: string;
  Revenue: number;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    totalClients: 0,
    todayAppointments: 0,
    dailyRevenue: 0,
    monthlyRevenue: 0,
    completionRate: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointmentItem[]>([]);
  const [topServices, setTopServices] = useState<TopServiceItem[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const displayName =
    user?.name && user.name.trim() !== "" && user.name.trim().toLowerCase() !== "usuário"
      ? user.name.split(" ")[0]
      : user?.email?.split("@")[0] || "Tessy";

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push("/login"); return; }
      if (user.role !== "admin" && user.role !== "professional") { router.push("/cliente"); return; }
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    if (loading || !user || (user.role !== "admin" && user.role !== "professional")) return;
    try {
      setDataLoading(true);
      const rangeStart = startOfDay(subDays(new Date(), 30));
      const rangeEnd = endOfDay(new Date());

      const [appointments, clients, services] = await Promise.all([
        appointmentService.getByDateRange(rangeStart, rangeEnd),
        globalStore.fetchRecentClients(false),
        globalStore.fetchServices(false),
      ]);

      const unresolvedClientIds = appointments
        .map((apt) => apt.clientId)
        .filter((id, i, arr) => Boolean(id) && arr.indexOf(id) === i)
        .filter((id) => !clients.some((c) => c.id === id));

      const clientUsers =
        unresolvedClientIds.length > 0 ? await authService.getUsersByIds(unresolvedClientIds) : [];

      const todayApps = appointments.filter(
        (apt) => isToday(ensureDate(apt.appointmentDate)) && (apt.status === "pending" || apt.status === "confirmed")
      );
      const completedMonth = appointments.filter((apt) => {
        const d = ensureDate(apt.appointmentDate);
        const now = new Date();
        return apt.status === "completed" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const dailyRevenue = appointments
        .filter((apt) => isToday(ensureDate(apt.appointmentDate)) && apt.status === "completed")
        .reduce((t, apt) => t + (services.find((s) => s.id === apt.serviceId)?.price || 0), 0);
      const monthlyRevenue = completedMonth.reduce(
        (t, apt) => t + (services.find((s) => s.id === apt.serviceId)?.price || 0), 0
      );
      const completionRate =
        appointments.length > 0
          ? (appointments.filter((a) => a.status === "completed").length / appointments.length) * 100
          : 0;

      setStats({
        totalClients: clients.length,
        todayAppointments: todayApps.length,
        dailyRevenue,
        monthlyRevenue,
        completionRate: Math.round(completionRate),
      });

      const next = appointments
        .filter(
          (apt) =>
            (apt.status === "pending" || apt.status === "confirmed") &&
            (!isPast(ensureDate(apt.appointmentDate)) || isToday(ensureDate(apt.appointmentDate)))
        )
        .sort((a, b) => ensureDate(a.appointmentDate).getTime() - ensureDate(b.appointmentDate).getTime())
        .slice(0, 6)
        .map((apt) => {
          const client = clients.find((c) => c.id === apt.clientId);
          const clientUser = clientUsers.find((u) => u.uid === apt.clientId);
          const service = services.find((s) => s.id === apt.serviceId);
          return {
            id: apt.id ?? "",
            client: client?.name || clientUser?.name || "Cliente",
            service: service?.name || "Serviço",
            price: service?.price || 0,
            time: format(ensureDate(apt.appointmentDate), "HH:mm"),
            date: format(ensureDate(apt.appointmentDate), "dd/MM"),
            isToday: isToday(ensureDate(apt.appointmentDate)),
            status: apt.status,
          };
        });
      setRecentAppointments(next);

      const serviceStats = services
        .map((s) => ({ name: s.name, count: appointments.filter((a) => a.serviceId === s.id).length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);
      setTopServices(serviceStats);

      const now2 = new Date();
      const weekStart = startOfDay(new Date(new Date().setDate(now2.getDate() - now2.getDay())));
      const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateStr = format(d, "dd/MM");
        return {
          date: dateStr,
          Revenue: appointments
            .filter((apt) => apt.status === "completed" && format(ensureDate(apt.appointmentDate), "dd/MM") === dateStr)
            .reduce((t, apt) => t + (services.find((s) => s.id === apt.serviceId)?.price || 0), 0),
        };
      });
      setRevenueData(chartData);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user, loading]);

  if (loading || dataLoading) {
    return (
      <AdminLayout>
        <div className="flex h-full min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
            <p className="text-xs font-semibold text-brand-text-sub uppercase tracking-widest">Carregando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const goalPct = Math.min(Math.round((stats.monthlyRevenue / 15000) * 100), 100);

  return (
    <AdminLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8 pb-20"
      >
        {/* ── HEADER ── */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-text-sub mb-1">
            </p>
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-brand-text-main">
              Olá, {displayName} ✨
            </h1>
            <p className="text-sm text-brand-text-sub mt-1">Aqui está o resumo do seu studio hoje.</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="self-start sm:self-auto h-12 px-6 bg-linear-to-r from-brand-primary to-brand-secondary text-white font-semibold rounded-2xl shadow-premium hover:shadow-premium-hover transition-all active:scale-95 border-none"
          >
            <Plus size={18} className="mr-2" />
            Novo Agendamento
          </Button>
        </motion.div>

        {/* ── KPI CARDS ── */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Clientes", value: stats.totalClients, icon: Users, suffix: "", color: "from-brand-accent/20 to-brand-accent/5", iconBg: "bg-brand-accent/20 text-brand-accent" },
            { label: "Hoje", value: stats.todayAppointments, icon: CalendarDays, suffix: " aptos", color: "from-brand-primary/15 to-brand-primary/5", iconBg: "bg-brand-primary/15 text-brand-primary" },
            { label: "Receita Hoje", value: stats.dailyRevenue, icon: DollarSign, prefix: "R$", color: "from-success/15 to-success/5", iconBg: "bg-success/15 text-success" },
            { label: "Taxa Conclusão", value: stats.completionRate, icon: Target, suffix: "%", color: "from-warning/15 to-warning/5", iconBg: "bg-warning/15 text-warning" },
          ].map((kpi, i) => (
            <Card key={i} className={cn("border-0 bg-linear-to-br shadow-premium overflow-hidden", kpi.color)}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", kpi.iconBg)}>
                    <kpi.icon size={20} strokeWidth={2} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-brand-text-main tracking-tight">
                  {kpi.prefix && <span className="text-sm font-semibold mr-1">{kpi.prefix}</span>}
                  {typeof kpi.value === "number" && kpi.prefix
                    ? kpi.value.toLocaleString("pt-BR")
                    : kpi.value}
                  {kpi.suffix && <span className="text-sm font-semibold ml-0.5">{kpi.suffix}</span>}
                </p>
                <p className="text-xs text-brand-text-sub mt-1 font-medium">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* ── MAIN GRID ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── PRÓXIMOS AGENDAMENTOS ── */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border border-brand-accent/10 bg-white shadow-premium h-full">
              <CardHeader className="px-6 pt-6 pb-4 border-b border-brand-accent/5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                    <Clock size={16} className="text-brand-primary" />
                  </div>
                  <CardTitle className="text-base font-serif font-bold text-brand-text-main">
                    Próximos Atendimentos
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/agenda")}
                  className="text-brand-primary text-xs font-semibold hover:bg-brand-soft/30 rounded-xl gap-1"
                >
                  Ver agenda <ChevronRight size={14} />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {recentAppointments.length > 0 ? (
                  <div>
                    {recentAppointments.map((apt, i) => {
                      const s = statusConfig[apt.status] || statusConfig.pending;
                      return (
                        <motion.div
                          key={apt.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-4 px-6 py-4 border-b border-brand-accent/5 last:border-0 hover:bg-brand-soft/10 transition-colors cursor-pointer group"
                          onClick={() => router.push("/agenda")}
                        >
                          {/* Hora */}
                          <div className="text-center min-w-[52px]">
                            <p className="text-lg font-bold text-brand-primary tabular-nums leading-none">{apt.time}</p>
                            <p className="text-[10px] font-medium text-brand-text-sub mt-0.5">
                              {apt.isToday ? "hoje" : apt.date}
                            </p>
                          </div>

                          {/* Divider */}
                          <div className="w-px h-10 bg-brand-accent/15 shrink-0" />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-brand-text-main text-sm leading-tight truncate">{apt.client}</p>
                            <p className="text-xs text-brand-text-sub mt-0.5 truncate">{apt.service}</p>
                          </div>

                          {/* Preço */}
                          {apt.price > 0 && (
                            <p className="text-sm font-semibold text-brand-text-main tabular-nums shrink-0">
                              R$ {apt.price.toLocaleString("pt-BR")}
                            </p>
                          )}

                          {/* Status */}
                          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0", s.bg, s.color)}>
                            <div className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
                            {s.label}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                    <div className="w-14 h-14 rounded-2xl bg-brand-soft/30 flex items-center justify-center mb-4">
                      <Sparkles size={24} className="text-brand-accent" />
                    </div>
                    <p className="font-serif font-bold text-brand-text-main text-lg">Agenda livre</p>
                    <p className="text-xs text-brand-text-sub mt-1 max-w-xs">Nenhum atendimento pendente. Que tal criar um novo agendamento?</p>
                    <Button
                      size="sm"
                      onClick={() => setIsDialogOpen(true)}
                      className="mt-4 rounded-xl bg-brand-primary text-white hover:bg-brand-secondary text-xs font-semibold"
                    >
                      <Plus size={14} className="mr-1.5" /> Agendar agora
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ── SIDEBAR DIREITA ── */}
          <div className="space-y-6">

            {/* Meta Mensal */}
            <motion.div variants={itemVariants}>
              <Card className="border-0 bg-linear-to-br from-brand-primary to-brand-secondary text-white overflow-hidden shadow-premium-xl relative">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
                <CardContent className="p-6 relative z-10 space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Receita do Mês</p>
                    <Target size={18} className="text-white/40" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold tracking-tight">
                      R$ {stats.monthlyRevenue.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-white/60 mt-1">Meta: R$ 15.000 &bull; {goalPct}% atingido</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-white/15 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${goalPct}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="h-full bg-white/90 rounded-full"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/50 font-medium">
                      <span>R$ 0</span>
                      <span>R$ 15.000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Serviços */}
            <motion.div variants={itemVariants}>
              <Card className="border border-brand-accent/10 bg-white shadow-premium">
                <CardHeader className="px-5 pt-5 pb-3 border-b border-brand-accent/5 flex flex-row items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-secondary/10 flex items-center justify-center">
                    <Sparkles size={14} className="text-brand-secondary" />
                  </div>
                  <CardTitle className="text-sm font-serif font-bold text-brand-text-main">Top Serviços</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {topServices.length === 0 ? (
                    <p className="text-xs text-brand-text-sub text-center py-3 opacity-60">
                      Nenhum serviço registrado ainda.
                    </p>
                  ) : (
                    topServices.map((svc, idx) => {
                      const pct = Math.round((svc.count / (topServices[0]?.count || 1)) * 100);
                      return (
                        <div key={svc.name} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-brand-text-main truncate max-w-[70%]">{svc.name}</p>
                            <span className="text-xs font-bold text-brand-text-sub">{svc.count}x</span>
                          </div>
                          <div className="h-1.5 w-full bg-brand-soft/30 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.4 + idx * 0.08, duration: 0.8, ease: "easeOut" }}
                              className="h-full rounded-full bg-linear-to-r from-brand-primary to-brand-secondary"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* ── GRÁFICO RECEITA SEMANA ── */}
        <motion.div variants={itemVariants}>
          <Card className="border border-brand-accent/10 bg-white shadow-premium">
            <CardHeader className="px-6 pt-6 pb-4 border-b border-brand-accent/5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-secondary/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-brand-secondary" />
                </div>
                <CardTitle className="text-base font-serif font-bold text-brand-text-main">Receita da Semana</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[260px] w-full">
                <RevenueChart data={revenueData} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </motion.div>

      {/* ── DIALOG NOVO AGENDAMENTO ── */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) (document.activeElement as HTMLElement)?.blur();
          setIsDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-brand-accent/20">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-brand-primary">Novo Agendamento</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            onSuccess={() => {
              setIsDialogOpen(false);
              fetchData();
              toast.success("Agendamento criado com sucesso! ✨");
            }}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
