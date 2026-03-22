"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn, getGreeting, ensureDate } from "@/lib/utils";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { motion, Variants } from "framer-motion";
import { 
  DollarSign, 
  Clock, 
  Users,
  TrendingUp,
  Plus,
  Target,
  CalendarDays,
  Sparkles
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appointmentService } from "@/services/appointments";
import { authService } from "@/services/auth";
import { clientService } from "@/services/clients";
import { salonService } from "@/services/salon";
import { format, isToday, isPast, startOfDay, subDays, endOfDay } from "date-fns";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import nextDynamic from "next/dynamic";
import { globalStore } from "@/store/globalStore";

// ✅ Lazy load dos charts para não bloquear o First Paint no Mobile
const RevenueChart = nextDynamic(() => import("@/components/dashboard/DashboardCharts").then(m => m.RevenueChart), { 
  ssr: false, 
  loading: () => <div className="h-[350px] w-full animate-pulse bg-brand-soft/20 rounded-2xl" /> 
});
const ServicesDonut = nextDynamic(() => import("@/components/dashboard/DashboardCharts").then(m => m.ServicesDonut), { 
  ssr: false, 
  loading: () => <div className="h-64 w-full animate-pulse bg-brand-soft/20 rounded-2xl" /> 
});
import { toast } from "sonner";
import { MetricCard } from "@/components/shared/MetricCard";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    totalClients: 0,
    todayAppointments: 0,
    dailyRevenue: 0,
    monthlyRevenue: 0,
    completionRate: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const dashboardDisplayName =
    user?.name && user.name.trim() !== "" && user.name.trim().toLowerCase() !== "usuário"
      ? user.name.split(" ")[0]
      : user?.email?.split("@")[0] || "Tessy";

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (user.role !== 'admin' && user.role !== 'professional') {
        router.push("/cliente");
        return;
      }
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    if (loading || !user || (user.role !== 'admin' && user.role !== 'professional')) return;
    try {
      setDataLoading(true);
      
      // ✅ OTIMIZAÇÃO: Limitar leitura aos últimos 30 dias corridos
      const rangeStart = startOfDay(subDays(new Date(), 30));
      const rangeEnd = endOfDay(new Date());
      
      const [appointments, clients, services] = await Promise.all([
        appointmentService.getByDateRange(rangeStart, rangeEnd), // Últimos 30 dias apenas
        globalStore.fetchRecentClients(false),
        globalStore.fetchServices(false)
      ]);

      const unresolvedClientIds = appointments
        .map((apt) => apt.clientId)
        .filter((clientId, index, array) => Boolean(clientId) && array.indexOf(clientId) === index)
        .filter((clientId) => !clients.some((client) => client.id === clientId));

      const clientUsers = unresolvedClientIds.length > 0
        ? await authService.getUsersByIds(unresolvedClientIds)
        : [];

      const todayApps = appointments.filter(apt => 
        isToday(ensureDate(apt.appointmentDate)) && 
        (apt.status === 'pending' || apt.status === 'confirmed')
      );
      const completedAppsMonth = appointments.filter(apt => {
        const date = ensureDate(apt.appointmentDate);
        const now = new Date();
        return apt.status === 'completed' && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      });
      const dailyRevenue = appointments
        .filter(apt => isToday(ensureDate(apt.appointmentDate)) && apt.status === 'completed')
        .reduce((total, apt) => {
          const service = services.find(s => s.id === apt.serviceId);
          return total + (service?.price || 0);
        }, 0);
      const monthlyRevenue = completedAppsMonth.reduce((total, apt) => {
        const service = services.find(s => s.id === apt.serviceId);
        return total + (service?.price || 0);
      }, 0);
      const completionRate = appointments.length > 0 
        ? (appointments.filter(a => a.status === 'completed').length / appointments.length) * 100 
        : 0;

      setStats({
        totalClients: clients.length,
        todayAppointments: todayApps.length,
        dailyRevenue,
        monthlyRevenue,
        completionRate: Math.round(completionRate)
      });

      const next = appointments
        .filter(apt => 
          (apt.status === 'pending' || apt.status === 'confirmed') &&
          (!isPast(ensureDate(apt.appointmentDate)) || isToday(ensureDate(apt.appointmentDate)))
        )
        .sort((a, b) => ensureDate(a.appointmentDate).getTime() - ensureDate(b.appointmentDate).getTime())
        .slice(0, 5)
        .map(apt => {
          const client = clients.find(c => c.id === apt.clientId);
          const clientUser = clientUsers.find((u) => u.uid === apt.clientId);
          const clientName = client?.name || clientUser?.name || "Cliente";
          const service = services.find(s => s.id === apt.serviceId);
          return {
            id: apt.id,
            client: clientName,
            service: service?.name || "Serviço",
            time: format(ensureDate(apt.appointmentDate), 'HH:mm'),
            status: apt.status
          };
        });
      setRecentAppointments(next);

      const serviceStats = services.map(service => {
        const count = appointments.filter(apt => apt.serviceId === service.id).length;
        return { name: service.name, count };
      }).sort((a, b) => b.count - a.count).slice(0, 4);
      setTopServices(serviceStats);

      const now = new Date();
      const weekStart = startOfDay(new Date(now.setDate(now.getDate() - now.getDay())));
      const chartDataArr = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateStr = format(d, 'dd/MM');
        const dayRevenue = appointments
          .filter(apt => apt.status === 'completed' && format(ensureDate(apt.appointmentDate), 'dd/MM') === dateStr)
          .reduce((total, apt) => {
            const service = services.find(s => s.id === apt.serviceId);
            return total + (service?.price || 0);
          }, 0);
        chartDataArr.push({ date: dateStr, Revenue: dayRevenue });
      }
      setRevenueData(chartDataArr);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, loading]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  if (loading || dataLoading) {
    return (
      <AdminLayout>
        <div className="flex h-screen items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="rounded-full h-12 w-12 border-b-2 border-brand-primary"
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-4 sm:p-8 max-w-7xl mx-auto space-y-10 pb-20"
      >
        <motion.div variants={itemVariants}>
          <PageHeader 
            title={`Seu dia está pronto para acontecer, ${dashboardDisplayName} ✨`}
            description="Prepare-se para um dia produtivo e cheio de atendimentos incríveis."
          >
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/clientes')}
                className="rounded-2xl border-brand-accent/20 text-brand-primary font-bold hover:bg-brand-accent/10 transition-all active:scale-95"
              >
                <Users size={18} className="mr-2" /> Clientes
              </Button>
            </div>
          </PageHeader>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div variants={itemVariants}><MetricCard title="Clientes Ativos" value={stats.totalClients} icon={Users} variant="accent" /></motion.div>
          <motion.div variants={itemVariants}><MetricCard title="Agendamentos Hoje" value={stats.todayAppointments} icon={CalendarDays} variant="primary" /></motion.div>
          <motion.div variants={itemVariants}><MetricCard title="Receita Hoje" value={`R$ ${stats.dailyRevenue.toLocaleString('pt-BR')}`} icon={DollarSign} variant="success" trend={{ value: 8.2, isPositive: true }} /></motion.div>
          <motion.div variants={itemVariants}><MetricCard title="Ocupação %" value={`${stats.completionRate}%`} icon={Target} variant="warning" /></motion.div>
        </div>

        <motion.div variants={itemVariants} className="flex justify-center py-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="h-28 px-20 bg-linear-to-r from-brand-primary to-brand-secondary text-white font-black text-2xl rounded-full shadow-premium-xl hover:shadow-[0_40px_80px_rgba(75,46,43,0.3)] transition-all cursor-pointer flex items-center justify-center group relative overflow-hidden active:scale-95 border-none"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Plus size={40} className="mr-6 group-hover:rotate-180 transition-transform duration-500" />
              NOVO AGENDAMENTO
            </Button>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-brand-accent/20">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-brand-primary">Novo Agendamento</DialogTitle>
              </DialogHeader>
              <AppointmentForm onSuccess={() => { setIsDialogOpen(false); fetchData(); toast.success("Agendamento criado com sucesso! ✨"); }} />
            </DialogContent>
          </Dialog>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-3">
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black text-brand-primary uppercase tracking-tight flex items-center gap-2">
                <Clock className="text-brand-secondary" size={20} />
                Próximos Atendimentos
              </h3>
              <Button variant="ghost" size="sm" className="text-brand-secondary font-bold hover:bg-brand-accent/10 rounded-xl" onClick={() => router.push('/agenda')}>Agenda Completa</Button>
            </div>
            <Card className="bg-white/40 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-8">
                {recentAppointments.length > 0 ? (
                  <div className="divide-y divide-brand-accent/5">
                    {recentAppointments.map((apt) => (
                      <motion.div 
                        key={apt.id} 
                        whileHover={{ x: 10 }}
                        className="py-4 first:pt-0 last:pb-0 flex items-center justify-between group px-4 rounded-xl transition-all hover:bg-brand-soft/10 cursor-pointer"
                      >
                        <div className="flex items-center gap-10">
                          <div className="text-3xl font-black text-brand-primary tabular-nums min-w-[80px]">{apt.time}</div>
                          <div className="space-y-0.5">
                            <p className="font-bold text-brand-text-main text-lg leading-tight">{apt.client}</p>
                            <p className="text-xs font-black text-brand-text-sub uppercase tracking-widest opacity-60">{apt.service}</p>
                          </div>
                        </div>
                        <Badge variant={apt.status === 'confirmed' ? "success" : apt.status === 'pending' ? "warning" : "neutral"} size="xs" className="shadow-none border-none">
                          {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'pending' ? 'Pendente' : apt.status}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 space-y-6">
                    <Sparkles size={40} className="mx-auto mb-2 text-brand-accent" />
                    <div>
                      <p className="text-2xl font-black text-brand-primary">Agenda livre agora ✨</p>
                      <p className="text-brand-text-sub font-black uppercase tracking-widest text-[10px] opacity-40 max-w-xs mx-auto">Aproveite para organizar novos horários e preparar o seu espaço.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <motion.div variants={itemVariants}>
              <Card className="bg-white/40 backdrop-blur-sm h-full">
                <CardHeader className="p-0 mb-8 border-b border-brand-accent/5 pb-6">
                  <CardTitle className="text-lg font-black text-brand-primary uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={22} className="text-brand-secondary" />
                    Receita da Semana
                  </CardTitle>
                </CardHeader>
                <div className="h-[320px] pt-4"><RevenueChart data={revenueData} /></div>
              </Card>
            </motion.div>
          </motion.div>

          <div className="space-y-10">
            <motion.div variants={itemVariants}>
              <Card className="bg-linear-to-br from-brand-primary to-brand-secondary text-white group">
                <CardContent className="p-10 space-y-8 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                  <div className="flex items-center justify-between relative z-10">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Progresso Mensal</p>
                    <Target size={24} className="text-white/30" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-5xl font-black tracking-tighter mb-1">R$ {stats.monthlyRevenue.toLocaleString('pt-BR')}</p>
                    <div className="flex items-center gap-2 text-white/50 text-xs font-bold uppercase tracking-wider">
                      <span>Objetivo: R$ 15.000</span>
                      <span>{Math.round((stats.monthlyRevenue / 15000) * 100)}%</span>
                    </div>
                  </div>
                  <div className="space-y-3 relative z-10">
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((stats.monthlyRevenue / 15000) * 100, 100)}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-white rounded-full relative"
                      >
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="bg-white/90">
                <h4 className="text-sm font-black uppercase tracking-[0.15em] text-brand-primary mb-8 flex items-center gap-2 border-b border-brand-accent/5 pb-4">
                  <Sparkles size={16} className="text-brand-secondary" />
                  Top Serviços
                </h4>
                <div className="space-y-6">
                  {topServices.map((service, idx) => (
                    <div key={service.name} className="space-y-2 group/item">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-brand-text-main group-hover/item:text-brand-primary transition-colors">{service.name}</span>
                        <span className="text-xs font-black bg-brand-accent/10 text-brand-secondary px-3 py-1 rounded-lg tabular-nums">{service.count}</span>
                      </div>
                      <div className="h-1.5 w-full bg-brand-soft/20 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(service.count / (topServices[0]?.count || 1)) * 100}%` }}
                          transition={{ delay: 0.5 + (idx * 0.1), duration: 1 }}
                          className="h-full bg-brand-primary/30 group-hover/item:bg-brand-primary/50 transition-colors rounded-full" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AdminLayout>
  );
}
