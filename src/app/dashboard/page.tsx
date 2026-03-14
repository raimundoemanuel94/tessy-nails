"use client";

export const dynamic = 'force-dynamic';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { ensureDate } from "@/lib/utils";
import { 
  DollarSign, 
  Clock, 
  CheckCircle2,
  CalendarX2,
  Users,
  Calendar,
  TrendingUp
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { appointmentService } from "@/services/appointments";
import { clientService } from "@/services/clients";
import { salonService } from "@/services/salon";
import { format, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RevenueChart, ServicesDonut } from "@/components/shared/DashboardCharts";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    totalClients: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    completionRate: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Proteger dashboard - apenas admin/profissional
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

  // Carregar dados só quando usuário autorizado
  useEffect(() => {
    if (loading || !user || (user.role !== 'admin' && user.role !== 'professional')) return;
    const loadDashboardData = async () => {
      try {
        setDataLoading(true);
        
        // Carregar dados reais
        const [appointments, clients, services] = await Promise.all([
          appointmentService.getAll(),
          clientService.getAll(),
          salonService.getAll()
        ]);

        // Calcular estatísticas
        const todayApps = appointments.filter(apt => isToday(ensureDate(apt.appointmentDate)));
        const completedApps = appointments.filter(apt => apt.status === 'completed');
        const completionRate = appointments.length > 0 
          ? (completedApps.length / appointments.length) * 100 
          : 0;

        // Calcular receita real
        const monthlyRevenue = completedApps.reduce((total, apt) => {
          const service = services.find(s => s.id === apt.serviceId);
          return total + (service?.price || 0);
        }, 0);

        setStats({
          totalClients: clients.length,
          todayAppointments: todayApps.length,
          monthlyRevenue,
          completionRate: Math.round(completionRate)
        });

        // Agendamentos recentes com dados reais
        const recent = appointments
          .filter(apt => !isPast(ensureDate(apt.appointmentDate)) || isToday(ensureDate(apt.appointmentDate)))
          .slice(0, 5)
          .map(apt => {
            // Buscar nome real do cliente
            const client = clients.find(c => c.id === apt.clientId);
            const clientName = client ? client.name : `Cliente ${apt.clientId.slice(0, 8)}`;
            
            // Buscar nome real do serviço
            const service = services.find(s => s.id === apt.serviceId);
            const serviceName = service ? service.name : `Serviço ${apt.serviceId}`;
            
            // Buscar preço real do serviço
            const servicePrice = service ? `R$ ${service.price.toFixed(2)}` : "R$ 0,00";
            
            return {
              id: apt.id,
              client: clientName,
              service: serviceName,
              time: format(ensureDate(apt.appointmentDate), 'HH:mm', { locale: ptBR }),
              status: apt.status,
              price: servicePrice
            };
          });

        setRecentAppointments(recent);

        // Serviços mais procurados com dados reais
        const serviceStats = services.map(service => {
          const serviceAppointments = appointments.filter(apt => apt.serviceId === service.id);
          return {
            name: service.name,
            count: serviceAppointments.length,
            percent: appointments.length > 0 
              ? Math.round((serviceAppointments.length / appointments.length) * 100)
              : 0
          };
        }).filter(stat => stat.count > 0).slice(0, 4);

        setTopServices(serviceStats);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadDashboardData();
  }, [user, loading]);

  if (dataLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader 
        title="Dashboard" 
        description="Bem-vinda de volta, Tessy! Veja o resumo de hoje." 
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <DashboardCard 
          title="Total de Clientes" 
          value={stats.totalClients.toString()} 
          description="clientes cadastrados" 
          icon={Users} 
        />
        <DashboardCard 
          title="Agendamentos Hoje" 
          value={stats.todayAppointments.toString()} 
          description="hoje" 
          icon={Calendar} 
        />
        <DashboardCard 
          title="Receita Mensal" 
          value={`R$ ${stats.monthlyRevenue.toFixed(2)}`} 
          description="este mês" 
          icon={DollarSign} 
        />
        <DashboardCard 
          title="Taxa de Conclusão" 
          value={`${stats.completionRate}%`} 
          description="concluídos" 
          icon={CheckCircle2} 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4 border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden rounded-3xl">
          <CardHeader className="p-6 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Próximos Agendamentos</CardTitle>
                <CardDescription className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                  Resumo das próximas sessões agendadas.
                </CardDescription>
              </div>
              <Badge className="bg-pink-100/50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400 border-none px-3 py-1 font-bold">
                {recentAppointments.length} Total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-white/5">
                <TableRow className="hover:bg-transparent border-slate-100 dark:border-white/5">
                  <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Cliente</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Serviço</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Horário</TableHead>
                  <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Status</TableHead>
                  <TableHead className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAppointments.length > 0 ? (
                  recentAppointments.map((appointment) => (
                    <TableRow key={appointment.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 border-slate-100 dark:border-white/5 transition-all">
                      <TableCell className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">{String(appointment.client || "")}</TableCell>
                      <TableCell className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">{String(appointment.service || "")}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-lg w-fit">
                          <Clock size={12} className="text-pink-600" />
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{appointment.time}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all tracking-tighter",
                          appointment.status === "confirmed" && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400",
                          appointment.status === "pending" && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400",
                          appointment.status === "completed" && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400"
                        )}>
                          {appointment.status === "confirmed" ? "Confirmado" : 
                           appointment.status === "pending" ? "Pendente" : "Concluído"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-white">{appointment.price}</span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20">
                      <EmptyState 
                        icon={CalendarX2}
                        title="Nenhum agendamento hoje"
                        description="Você não tem compromissos agendados para este período. Que tal revisar seus serviços?"
                        className="py-10"
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3 border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xl shadow-slate-200/40 dark:shadow-none p-6 rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl" />
          <ServicesDonut 
            data={topServices.length > 0 ? topServices.map(s => ({ name: s.name, value: s.percent })) : [
              { name: "Manicure", value: 45 },
              { name: "Pedicure", value: 30 },
              { name: "Gel", value: 25 },
            ]} 
          />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 grid-cols-1">
        <Card className="border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xl shadow-slate-200/40 dark:shadow-none p-8 rounded-3xl overflow-hidden relative">
          <RevenueChart 
            data={[
              { date: "Out", Revenue: 2100 },
              { date: "Nov", Revenue: 2800 },
              { date: "Dez", Revenue: 3500 },
              { date: "Jan", Revenue: 2900 },
              { date: "Fev", Revenue: 3800 },
              { date: "Mar", Revenue: stats.monthlyRevenue || 4200 },
            ]} 
          />
        </Card>
      </div>

    </AdminLayout>
  );
}
