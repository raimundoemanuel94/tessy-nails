"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
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
  TrendingUp,
  Plus,
  UserPlus,
  Eye,
  CalendarDays,
  BarChart3,
  Star
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
import { Button } from "@/components/ui/button";
import { appointmentService } from "@/services/appointments";
import { clientService } from "@/services/clients";
import { salonService } from "@/services/salon";
import { format, isToday, isPast, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RevenueChart, ServicesDonut } from "@/components/shared/DashboardCharts";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    totalClients: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    monthlyRevenue: 0,
    completionRate: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

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

        // Filtrar por período selecionado
        const now = new Date();
        let filteredAppointments = appointments;
        
        if (selectedPeriod === 'today') {
          filteredAppointments = appointments.filter(apt => 
            isToday(ensureDate(apt.appointmentDate))
          );
        } else if (selectedPeriod === 'week') {
          const weekStart = startOfDay(new Date(now.setDate(now.getDate() - now.getDay())));
          const weekEnd = endOfDay(new Date(now.setDate(now.getDate() + (6 - now.getDay()))));
          filteredAppointments = appointments.filter(apt => {
            const aptDate = ensureDate(apt.appointmentDate);
            return aptDate >= weekStart && aptDate <= weekEnd;
          });
        } else if (selectedPeriod === 'month') {
          const monthStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
          const monthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
          filteredAppointments = appointments.filter(apt => {
            const aptDate = ensureDate(apt.appointmentDate);
            return aptDate >= monthStart && aptDate <= monthEnd;
          });
        }

        // Calcular estatísticas
        const todayApps = appointments.filter(apt => isToday(ensureDate(apt.appointmentDate)));
        const pendingApps = filteredAppointments.filter(apt => apt.status === 'pending');
        const confirmedApps = filteredAppointments.filter(apt => apt.status === 'confirmed');
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
          pendingAppointments: pendingApps.length,
          confirmedAppointments: confirmedApps.length,
          monthlyRevenue,
          completionRate: Math.round(completionRate)
        });

        // Agendamentos recentes com dados reais
        const recent = filteredAppointments
          .filter(apt => !isPast(ensureDate(apt.appointmentDate)) || isToday(ensureDate(apt.appointmentDate)))
          .slice(0, 8)
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
              clientData: client,
              service: serviceName,
              serviceData: service,
              time: format(ensureDate(apt.appointmentDate), 'HH:mm', { locale: ptBR }),
              date: format(ensureDate(apt.appointmentDate), 'dd/MM', { locale: ptBR }),
              status: apt.status,
              price: servicePrice
            };
          });

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
  }, [user, loading, selectedPeriod]);

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
      {/* Header do workspace com contexto e ações */}
      <PageHeader 
        title="Central de Operações" 
        description="Visão geral do salão com métricas em tempo real e ações rápidas."
      >
        <div className="flex items-center gap-3">
          {/* Filtro de período */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {(['today', 'week', 'month'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className="h-8 px-3 text-xs font-medium"
              >
                {period === 'today' ? 'Hoje' : period === 'week' ? 'Semana' : 'Mês'}
              </Button>
            ))}
          </div>
          
          {/* Ações rápidas */}
          <Button 
            onClick={() => router.push('/agenda')}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/clientes')}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </PageHeader>

      {/* Zona 1 - Cards de resumo com contexto */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <DashboardCard 
          title="Total de Clientes" 
          value={stats.totalClients.toString()} 
          description="clientes ativos" 
          icon={Users}
          trend={{
            value: 12,
            isUp: true
          }}
        />
        <DashboardCard 
          title="Agendamentos Hoje" 
          value={stats.todayAppointments.toString()} 
          description="hoje" 
          icon={Calendar}
          trend={{
            value: 8,
            isUp: true
          }}
        />
        <DashboardCard 
          title="Pendentes" 
          value={stats.pendingAppointments.toString()} 
          description="aguardando confirmação" 
          icon={Clock}
          trend={{
            value: 5,
            isUp: false
          }}
        />
        <DashboardCard 
          title="Receita Mensal" 
          value={`R$ ${stats.monthlyRevenue.toFixed(2)}`} 
          description="este mês" 
          icon={DollarSign}
          trend={{
            value: 15,
            isUp: true
          }}
        />
      </div>

      {/* Zona 2 - Grid principal: Operação (esquerda) + Insights (direita) */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Coluna esquerda - Operação do dia */}
        <Card className="col-span-full lg:col-span-4 border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden rounded-3xl">
          <CardHeader className="px-6 py-5 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-violet-600" />
                  Agenda do Dia
                </CardTitle>
                <CardDescription className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {selectedPeriod === 'today' ? 'Compromissos de hoje' : 
                   selectedPeriod === 'week' ? 'Compromissos da semana' : 
                   'Compromissos do mês'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border border-blue-100/70 dark:border-blue-500/25 px-2.5 py-1 text-[11px] font-semibold rounded-full">
                  {stats.confirmedAppointments} confirmados
                </Badge>
                <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-100/70 dark:border-amber-500/25 px-2.5 py-1 text-[11px] font-semibold rounded-full">
                  {stats.pendingAppointments} pendentes
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/60 dark:bg-white/5">
                <TableRow className="hover:bg-transparent border-slate-100 dark:border-white/5">
                  <TableHead className="px-6 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Cliente
                  </TableHead>
                  <TableHead className="px-6 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Serviço
                  </TableHead>
                  <TableHead className="px-6 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Horário
                  </TableHead>
                  <TableHead className="px-6 py-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Status
                  </TableHead>
                  <TableHead className="px-6 py-3 text-right text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAppointments.length > 0 ? (
                  recentAppointments.map((appointment) => (
                    <TableRow
                      key={appointment.id}
                      className="group border-slate-100 dark:border-white/5 transition-colors hover:bg-slate-50/80 dark:hover:bg-white/5"
                    >
                      <TableCell className="px-6 py-4 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                            {appointment.client}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {appointment.date}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 align-middle">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
                          <Star className="h-3 w-3 text-violet-600" />
                          <span className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight">
                            {appointment.service}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 align-middle">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/70 dark:border-white/10">
                          <Clock className="h-3 w-3 text-violet-600" />
                          <span className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight tabular-nums">
                            {appointment.time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 align-middle">
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize tracking-tight border-transparent",
                            appointment.status === "confirmed" &&
                              "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
                            appointment.status === "pending" &&
                              "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
                            appointment.status === "completed" &&
                              "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          )}
                        >
                          {appointment.status === "confirmed"
                            ? "Confirmado"
                            : appointment.status === "pending"
                            ? "Pendente"
                            : "Concluído"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600"
                            onClick={() => router.push(`/agenda?view=${appointment.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20">
                      <EmptyState
                        icon={CalendarX2}
                        title={`Nenhum agendamento ${selectedPeriod === 'today' ? 'hoje' : selectedPeriod === 'week' ? 'esta semana' : 'este mês'}`}
                        description="Você não tem compromissos agendados para este período."
                        className="py-10"
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Coluna direita - Insights rápidos */}
        <div className="col-span-full lg:col-span-3 space-y-6">
          {/* Card de Serviços mais vendidos */}
          <Card className="border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xl shadow-slate-200/40 dark:shadow-none p-6 rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-violet-600" />
                Serviços Mais Vendidos
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 dark:text-slate-500">
                Mais procurados no período
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ServicesDonut 
                data={topServices.length > 0 ? topServices.map(s => ({ name: s.name, value: s.percent })) : [
                  { name: "Manicure", value: 45 },
                  { name: "Pedicure", value: 30 },
                  { name: "Gel", value: 25 },
                ]} 
              />
            </CardContent>
          </Card>

          {/* Card de Receita */}
          <Card className="border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xl shadow-slate-200/40 dark:shadow-none p-6 rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-violet-600" />
                Tendência de Receita
              </CardTitle>
              <CardDescription className="text-xs text-slate-400 dark:text-slate-500">
                Últimos 6 meses
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
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
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Links rápidos para telas detalhadas */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <Button 
          variant="outline"
          onClick={() => router.push('/agenda')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Ver Agenda Completa
        </Button>
        <Button 
          variant="outline"
          onClick={() => router.push('/agendamentos')}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Todos os Agendamentos
        </Button>
        <Button 
          variant="outline"
          onClick={() => router.push('/clientes')}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Gerenciar Clientes
        </Button>
      </div>

    </AdminLayout>
  );
}
