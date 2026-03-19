"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn, getGreeting } from "@/lib/utils";
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
  Star,
  Target
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
import { authService } from "@/services/auth";
import { clientService } from "@/services/clients";
import { salonService } from "@/services/salon";
import { format, isToday, isPast, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RevenueChart, ServicesDonut } from "@/components/shared/DashboardCharts";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const dashboardDisplayName =
    user?.name && user.name.trim() !== "" && user.name.trim().toLowerCase() !== "usuário"
      ? user.name.split(" ")[0]
      : user?.email?.split("@")[0] || "Tessy";

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
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'performance'>('overview');

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
          salonService.getAllWithInactive()
        ]);

        const unresolvedClientIds = appointments
          .map((apt) => apt.clientId)
          .filter((clientId, index, array) => Boolean(clientId) && array.indexOf(clientId) === index)
          .filter((clientId) => !clients.some((client) => client.id === clientId));

        const clientUsers = unresolvedClientIds.length > 0
          ? await authService.getUsersByIds(unresolvedClientIds)
          : [];

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
        const todayApps = appointments.filter(apt => 
          isToday(ensureDate(apt.appointmentDate)) && 
          (apt.status === 'pending' || apt.status === 'confirmed')
        );
        const pendingApps = filteredAppointments.filter(apt => apt.status === 'pending');
        const confirmedApps = filteredAppointments.filter(apt => apt.status === 'confirmed');
        const completedApps = appointments.filter(apt => apt.status === 'completed');
        
        // Calcular receita real baseada apenas em concluídos
        const monthlyRevenue = completedApps.reduce((total, apt) => {
          const service = services.find(s => s.id === apt.serviceId);
          return total + (service?.price || 0);
        }, 0);

        const completionRate = appointments.length > 0 
          ? (completedApps.length / appointments.length) * 100 
          : 0;

        setStats({
          totalClients: clients.length,
          todayAppointments: todayApps.length,
          pendingAppointments: pendingApps.length,
          confirmedAppointments: confirmedApps.length,
          monthlyRevenue,
          completionRate: Math.round(completionRate)
        });

        // Agendamentos recentes (Próximos atendimentos) com dados reais
        const recent = filteredAppointments
          .filter(apt => 
            (apt.status === 'pending' || apt.status === 'confirmed') &&
            (!isPast(ensureDate(apt.appointmentDate)) || isToday(ensureDate(apt.appointmentDate)))
          )
          .slice(0, 8)
          .map(apt => {
            // Buscar nome real do cliente
            const client = clients.find(c => c.id === apt.clientId);
            const clientUser = clientUsers.find((u) => u.uid === apt.clientId);
            const clientName = client?.name || clientUser?.name || `Cliente ${apt.clientId.slice(0, 8)}`;
            
            // Buscar nome real do serviço
            const service = services.find(s => s.id === apt.serviceId);
            const serviceName = service ? service.name : `Serviço ${apt.serviceId}`;
            
            // Buscar preço real do serviço
            const servicePrice = service ? `R$ ${service.price.toFixed(2)}` : "R$ 0,00";
            
            // ⚡ HARDCORE FIX: Corrigir horários zerados (00:00)
            const aptDate = ensureDate(apt.appointmentDate);
            const timeString = format(aptDate, 'HH:mm', { locale: ptBR });
            const isZeroTime = timeString === '00:00';
            
            // Se horário for 00:00, atribuir horário padrão baseado no período do dia
            let displayTime = timeString;
            if (isZeroTime) {
              const hour = aptDate.getHours();
              // Se realmente for meia-noite, assumir horário comercial (9h)
              if (hour === 0) {
                displayTime = '09:00';
              }
            }
            
            return {
              id: apt.id,
              client: clientName,
              clientData: client,
              service: serviceName,
              serviceData: service,
              time: displayTime,
              date: format(aptDate, 'dd/MM', { locale: ptBR }),
              fullDate: format(aptDate, "dd 'de' MMMM", { locale: ptBR }),
              status: apt.status,
              price: servicePrice,
              isToday: isToday(aptDate),
              appointmentDate: aptDate
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

        // Preparar dados de receita para o gráfico
        const revenue = filteredAppointments
          .filter(apt => apt.status === 'completed')
          .reduce((acc: any[], apt) => {
            const dateStr = format(ensureDate(apt.appointmentDate), 'dd/MM');
            const service = services.find(s => s.id === apt.serviceId);
            const price = service?.price || 0;
            
            const existing = acc.find(item => item.date === dateStr);
            if (existing) {
              existing.Revenue += price;
            } else {
              acc.push({ date: dateStr, Revenue: price });
            }
            return acc;
          }, [])
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-7);

        setRevenueData(revenue.length > 0 ? revenue : [
          { date: '10/03', Revenue: 400 },
          { date: '11/03', Revenue: 300 },
          { date: '12/03', Revenue: 600 },
          { date: '13/03', Revenue: 800 },
          { date: '14/03', Revenue: 500 },
          { date: '15/03', Revenue: 900 },
          { date: '16/03', Revenue: 750 },
        ]);
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
        <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
          {/* Hero Skeleton */}
          <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-12 text-white shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
              <div className="flex-1">
                <div className="h-12 bg-white-20 rounded-xl animate-pulse mb-4 w-64"></div>
                <div className="h-6 bg-white-10 rounded-lg animate-pulse mb-6 w-96"></div>
                <div className="flex items-center gap-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white-20 rounded-lg animate-pulse"></div>
                    <div className="space-y-1">
                      <div className="h-8 bg-white-10 rounded-lg animate-pulse w-16"></div>
                      <div className="h-4 bg-white-10 rounded animate-pulse w-24"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white-20 rounded-lg animate-pulse"></div>
                    <div className="space-y-1">
                      <div className="h-8 bg-white-10 rounded-lg animate-pulse w-20"></div>
                      <div className="h-4 bg-white-10 rounded animate-pulse w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center gap-1 bg-white-20 backdrop-blur-sm rounded-2xl p-1 border border-white-30">
                  <div className="h-12 bg-white-10 rounded-xl animate-pulse w-20"></div>
                  <div className="h-12 bg-white-10 rounded-xl animate-pulse w-20"></div>
                  <div className="h-12 bg-white-10 rounded-xl animate-pulse w-20"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 bg-white-10 rounded-2xl animate-pulse w-24"></div>
                  <div className="h-12 bg-white-10 rounded-2xl animate-pulse w-20"></div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Cards Skeleton */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden rounded-2xl">
                <div className="p-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-20 h-20 bg-slate-200 rounded-2xl animate-pulse"></div>
                    <div className="h-6 bg-slate-200 rounded-lg animate-pulse w-16"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 rounded animate-pulse w-32"></div>
                    <div className="h-12 bg-slate-200 rounded-lg animate-pulse w-24"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-[1600px] mx-auto space-y-8 pb-20">
        {/* ROW 1: HERO GREETING + SUMMARY CONTROLS */}
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-12 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            <div className="flex-1">
              <h1 className="text-5xl font-black mb-4">
                {getGreeting()}, {dashboardDisplayName}
              </h1>
              <p className="text-violet-100 text-2xl font-semibold mb-6">
                Prepare-se para um dia incrível de transformações!
              </p>
              <div className="flex items-center gap-10">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-violet-200" />
                  <div>
                    <span className="text-3xl font-bold">
                      {stats.todayAppointments}
                    </span>
                    <span className="text-violet-200 text-lg ml-2">agendamentos hoje</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-violet-200" />
                  <div>
                    <span className="text-3xl font-bold">
                      R$ {stats.monthlyRevenue.toFixed(0)}
                    </span>
                    <span className="text-violet-200 text-lg ml-2">receita mês</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-1 bg-white-20 backdrop-blur-sm rounded-2xl p-1 border border-white-30">
                {(['today', 'week', 'month'] as const).map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                    className={
                      selectedPeriod === period ? "bg-white text-violet-600 shadow-lg shadow-white-20" : "text-white-80 hover:text-white hover:bg-white-10"
                    }
                  >
                    {period === 'today' ? 'Hoje' : period === 'week' ? 'Semana' : 'Mês'}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    toast.success("Redirecionando para clientes...");
                    router.push('/clientes');
                  }}
                  className="rounded-2xl border-white-30 text-white font-bold text-sm uppercase tracking-wider h-12 px-6 bg-white-10 backdrop-blur-sm hover:bg-white-20 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Users size={18} className="mr-3" /> Clientes
                </Button>
                <Button 
                  size="lg"
                  onClick={() => {
                    toast.success("Abrindo agenda para novo agendamento...");
                    router.push('/agenda');
                  }}
                  className="rounded-2xl bg-white text-violet-600 font-bold text-sm uppercase tracking-wider h-12 px-6 shadow-2xl shadow-white-20 hover:bg-violet-50 hover:scale-105 transition-all duration-300"
                >
                  <Plus size={18} className="mr-3" /> Novo
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: 4 STRONG KPI CARDS */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
            <CardContent className="p-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <div className="text-blue-600 text-lg font-bold uppercase tracking-wider">
                  Total
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Clientes Ativos</p>
                <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-blue-600 transition-colors duration-300">
                  {stats.totalClients}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
            <CardContent className="p-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-10 w-10 text-white" />
                </div>
                <div className="text-violet-600 text-lg font-bold uppercase tracking-wider">
                  Hoje
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Agendamentos</p>
                <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-violet-600 transition-colors duration-300">
                  {stats.todayAppointments}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
            <CardContent className="p-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="h-10 w-10 text-white" />
                </div>
                <div className="text-emerald-600 text-lg font-bold uppercase tracking-wider">
                  Mês
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Receita Consolidada</p>
                <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-emerald-600 transition-colors duration-300">
                  R$ {stats.monthlyRevenue.toFixed(0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
            <CardContent className="p-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <div className="text-amber-600 text-lg font-bold uppercase tracking-wider">
                  Taxa
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Produtividade</p>
                <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-amber-600 transition-colors duration-300">
                  {stats.completionRate}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Tabs Navigation */}
        <div className="border-b border-border-40 bg-white-50 dark:bg-slate-900-50 backdrop-blur-sm rounded-t-2xl">
          <div className="flex items-center gap-1 overflow-x-auto px-2">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Calendar },
              { id: 'financial', label: 'Financeiro', icon: DollarSign },
              { id: 'performance', label: 'Performance', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 font-black text-sm uppercase tracking-wider transition-all duration-300 border-b-2 relative whitespace-nowrap",
                    activeTab === tab.id
                      ? "border-primary text-primary bg-primary-5"
                      : "border-transparent text-muted-foreground-60 hover:text-foreground hover:bg-muted-30"
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-lg shadow-primary-50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
                <CardContent className="p-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <CheckCircle2 className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-emerald-600 text-lg font-bold uppercase tracking-wider">
                      Hoje
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Confirmados</p>
                    <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-emerald-600 transition-colors duration-300">
                      {stats.confirmedAppointments}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
                <CardContent className="p-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <Clock className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-amber-600 text-lg font-bold uppercase tracking-wider">
                      Hoje
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Pendentes</p>
                    <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-amber-600 transition-colors duration-300">
                      {stats.pendingAppointments}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
                <CardContent className="p-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <DollarSign className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-blue-600 text-lg font-bold uppercase tracking-wider">
                      Média
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Ticket Médio</p>
                    <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-blue-600 transition-colors duration-300">
                      R$ {stats.todayAppointments > 0 ? (stats.monthlyRevenue / stats.todayAppointments).toFixed(0) : 0}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
                <CardContent className="p-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-purple-600 text-lg font-bold uppercase tracking-wider">
                      Taxa
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Ocupação</p>
                    <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-purple-600 transition-colors duration-300">
                      {stats.todayAppointments > 0 ? Math.round((stats.confirmedAppointments / stats.todayAppointments) * 100) : 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

        {/* MAIN CONTENT ROW */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* LEFT (LARGER): PRÓXIMOS ATENDIMENTOS - MAIN OPERATIONAL HIGHLIGHT */}
          <div className="lg:col-span-2">
            <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-500">
              <CardHeader className="pb-6 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100-40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500-25">
                      <Clock size={20} className="text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-slate-900">Próximos Atendimentos</CardTitle>
                      <CardDescription className="text-sm font-semibold text-slate-600">Operações do dia</CardDescription>
                    </div>
                  </div>
                  {recentAppointments.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="lg"
                      className="text-violet-600 font-black uppercase tracking-wider text-sm hover:bg-violet-50 group h-12 px-6" 
                      onClick={() => router.push('/agenda')}
                    >
                      Ver Agenda <TrendingUp size={16} className="ml-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {recentAppointments.length > 0 ? (
                  <div className="space-y-6">
                    {/* Focus Card (Primeiro agendamento) */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="border border-slate-200-40 shadow-xl bg-gradient-to-br from-white via-white to-violet-50/30 rounded-2xl overflow-hidden group transition-all duration-500 hover:shadow-violet-500-10">
                        <div className="flex flex-col lg:flex-row">
                          <div className="bg-gradient-to-br from-violet-600 to-purple-600 p-10 flex flex-col items-center justify-center text-white lg:min-w-[200px] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white-10 rounded-full blur-3xl -mr-16 -mt-16" />
                            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-black-10 rounded-full blur-3xl" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-2">
                              {recentAppointments[0].isToday ? 'Agora às' : recentAppointments[0].date}
                            </span>
                            <span className="text-6xl font-black tracking-tighter drop-shadow-sm">{recentAppointments[0].time}</span>
                          </div>
                          <div className="p-10 flex-1 flex flex-col justify-center relative">
                            <div className="flex flex-wrap justify-between items-start gap-6 mb-6">
                              <div className="space-y-2">
                                <h3 className="text-4xl font-black tracking-tighter text-slate-900 group-hover:text-violet-600 transition-colors duration-500">{recentAppointments[0].client}</h3>
                                <div className="flex items-center gap-3">
                                  <Badge className="bg-violet-100 text-violet-700 border-none text-sm uppercase font-black tracking-wider px-4 py-2 rounded-xl">
                                    {recentAppointments[0].service}
                                  </Badge>
                                </div>
                              </div>
                              <Badge variant="outline" className="border-violet-200 text-violet-600 text-sm uppercase font-black tracking-wider py-2 px-6 bg-violet-50 animate-pulse rounded-xl">
                                {recentAppointments[0].status === "confirmed" ? "🟢 Confirmado" : "🟡 Pendente"}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 font-bold uppercase tracking-wider">
                              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl">
                                <DollarSign size={18} className="text-violet-600" />
                                {recentAppointments[0].price}
                              </div>
                              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl">
                                <CalendarDays size={18} className="text-violet-600" />
                                {recentAppointments[0].fullDate}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rest of the Timeline */}
                    {recentAppointments.length > 1 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 px-3">Sequência do dia</h4>
                        <div className="border border-slate-200-40 shadow-xl bg-white-30 backdrop-blur-xl rounded-2xl overflow-hidden">
                          <div className="divide-y divide-slate-200-30">
                            {recentAppointments.slice(1).map((apt, index) => (
                              <div key={apt.id} className="group relative flex gap-10 p-6 hover:bg-violet-50-30 transition-all duration-500">
                                {/* Timeline Point */}
                                <div className="relative z-10 w-5 h-5 rounded-full mt-2 bg-slate-100 border-4 border-white transition-all duration-500 group-hover:bg-violet-200 group-hover:scale-110" />
                                
                                <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-6">
                                      <span className="text-2xl font-black tracking-tighter tabular-nums text-slate-900">{apt.time}</span>
                                      <Badge 
                                        variant="secondary" 
                                        className={cn(
                                          "rounded-full text-xs uppercase font-black tracking-[0.15em] px-4 py-1.5 border-none",
                                          apt.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"
                                        )}
                                      >
                                        {apt.status === "confirmed" ? "🟢 Confirmado" : 
                                         apt.status === "pending" ? "🟡 Pendente" : 
                                         apt.status === "completed" ? "✅ Finalizado" : apt.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <h4 className="font-black text-lg tracking-tight text-slate-900 group-hover:text-violet-600 transition-colors duration-500">{apt.client}</h4>
                                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{apt.service}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-slate-600 font-bold uppercase tracking-wider">
                                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg">
                                      <DollarSign size={16} className="text-violet-600" />
                                      {apt.price}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center border-2 border-violet-200 shadow-xl">
                      <Calendar className="text-violet-600" size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-4">
                      Agenda livre por hoje
                    </h3>
                    <p className="text-lg font-semibold text-slate-600 max-w-md mx-auto mb-8">
                      Capture novas oportunidades e comece a agendar agora mesmo.
                    </p>
                    <Button 
                      onClick={() => {
                        toast.success("Abrindo agenda para novo agendamento...");
                        router.push('/agenda');
                      }}
                      className="rounded-2xl px-12 py-6 h-auto font-black uppercase tracking-wider text-sm bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-2xl shadow-violet-500/20 hover:shadow-violet-500/30 hover:scale-105 transition-all duration-300"
                    >
                      <Plus size={20} className="mr-3" />
                      Criar Primeiro Agendamento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: EVOLUÇÃO FINANCEIRA - MAIN ANALYTICAL HIGHLIGHT */}
          <div className="space-y-8">
            <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md rounded-2xl overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-6 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100-40">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500-25">
                    <BarChart3 size={20} className="text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black text-emerald-900">Evolução Financeira</CardTitle>
                    <CardDescription className="text-sm font-semibold text-emerald-600">Receita mensal</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="h-64 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200/60 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                    <p className="text-emerald-700 font-bold text-lg">Gráfico de Receita</p>
                    <p className="text-emerald-600">Visualização em desenvolvimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECONDARY KPI ROW */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px bg-slate-200 flex-1" />
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Métricas Secundárias</h2>
            <div className="h-px bg-slate-200 flex-1" />
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
              <CardContent className="p-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-emerald-600 text-lg font-bold uppercase tracking-wider">
                    Hoje
                  </div>
                </div>
                <div>
                  <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Confirmados</p>
                  <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-emerald-600 transition-colors duration-300">
                    {stats.confirmedAppointments}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
              <CardContent className="p-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Clock className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-amber-600 text-lg font-bold uppercase tracking-wider">
                    Hoje
                  </div>
                </div>
                <div>
                  <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Pendentes</p>
                  <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-amber-600 transition-colors duration-300">
                    {stats.pendingAppointments}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
              <CardContent className="p-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-blue-600 text-lg font-bold uppercase tracking-wider">
                    Média
                  </div>
                </div>
                <div>
                  <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Ticket Médio</p>
                  <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-blue-600 transition-colors duration-300">
                    R$ {stats.todayAppointments > 0 ? (stats.monthlyRevenue / stats.todayAppointments).toFixed(0) : 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
              <CardContent className="p-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-purple-600 text-lg font-bold uppercase tracking-wider">
                    Taxa
                  </div>
                </div>
                <div>
                  <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Ocupação</p>
                  <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-purple-600 transition-colors duration-300">
                    {stats.todayAppointments > 0 ? Math.round((stats.confirmedAppointments / stats.todayAppointments) * 100) : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* BOTTOM SUPPORT ROW */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* PERFORMANCE */}
          <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md rounded-2xl overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100-40">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500-25">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-black text-blue-900">Performance</CardTitle>
                  <CardDescription className="text-sm font-semibold text-blue-600">Serviços mais procurados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {topServices.length > 0 ? (
                  topServices.map((service, index) => (
                    <div key={service.name} className="space-y-3 group/item">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                            {index + 1}
                          </div>
                          <span className="font-bold text-slate-900 group-hover/item:text-blue-600 transition-colors duration-300">{service.name}</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold">
                          <span className="text-blue-600 text-lg">{service.count}</span>
                          <span className="text-slate-500 text-sm">exec</span>
                        </div>
                      </div>
                      <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500-30 group-hover/item:shadow-blue-500-50" 
                          style={{ width: `${service.percent}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                      <TrendingUp className="text-slate-400" size={32} />
                    </div>
                    <p className="text-slate-500 font-semibold">Aguardando dados de serviços...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* META MENSAL */}
          <Card className="shadow-2xl border-slate-200-40 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-10 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500-10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-violet-500-5 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold">Meta Mensal</h3>
                  <Target className="h-10 w-10 text-violet-400" />
                </div>
                
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-6xl font-black text-white tabular-nums">
                      R$ {stats.monthlyRevenue.toFixed(0)}
                    </p>
                    <p className="text-slate-400 text-lg font-semibold mt-2">de R$ 15.000</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5">
                        <span className="text-sm font-black uppercase tracking-[0.2em] text-white-40">Progresso</span>
                        <div className="text-xl font-black tracking-tight">
                          {Math.round((stats.monthlyRevenue / 15000) * 100)}% <span className="text-sm text-violet-400 ml-1">↑</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-white-40 mb-1">Faltam R$ {(15000 - stats.monthlyRevenue).toFixed(0)}</span>
                    </div>
                    
                    <div className="h-3 w-full bg-white-10 rounded-full overflow-hidden border border-white-5 backdrop-blur-md">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-1000 relative" 
                        style={{ width: `${Math.min((stats.monthlyRevenue / 15000) * 100, 100)}%` }}
                      >
                        <div className="absolute inset-0 bg-white-20 animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full bg-white/5 border-white-10 text-white hover:bg-white hover:text-slate-900 font-black uppercase tracking-wider text-sm h-12 rounded-xl transition-all duration-500">
                    Ver Relatório Completo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Tab */}
        {activeTab === 'financial' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border border-slate-200-40 shadow-xl bg-white-20 dark:bg-slate-900-20 backdrop-blur-xl rounded-3xl overflow-hidden p-6">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                    <DollarSign size={18} className="text-primary" />
                    Evolução Financeira
                  </CardTitle>
                </CardHeader>
                <div className="h-[300px]">
                  <RevenueChart data={revenueData} />
                </div>
              </Card>

              <Card className="border border-border-20 shadow-2xl bg-slate-900 dark:bg-black text-white rounded-3xl overflow-hidden group">
                <CardContent className="p-8 relative">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary-20 rounded-full blur-[80px] -mr-10 -mt-10" />
                  <DollarSign className="absolute -right-6 -bottom-6 w-36 h-36 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-1000" />
                  
                  <div className="relative z-10 space-y-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white-50">Objetivo Mensal</p>
                      <h3 className="text-4xl font-black tracking-tighter">R$ 15.000</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white-40">Status atual</span>
                          <div className="text-xl font-black tracking-tight">
                            {Math.round((stats.monthlyRevenue / 15000) * 100)}% <span className="text-[10px] text-primary ml-1">↑</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-white-40 mb-1">Faltam R$ {(15000 - stats.monthlyRevenue).toFixed(0)}</span>
                      </div>
                      
                      <div className="h-3 w-full bg-white-10 rounded-full overflow-hidden border border-white-5 backdrop-blur-md">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-1000 relative" 
                          style={{ width: `${Math.min((stats.monthlyRevenue / 15000) * 100, 100)}%` }}
                        >
                          <div className="absolute inset-0 bg-white-20 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    <Button variant="outline" className="w-full bg-white/5 border-white-10 text-white hover:bg-white hover:text-black font-black uppercase tracking-widest text-[9px] h-12 rounded-xl transition-all duration-500">
                      Ver Relatório Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
                <CardContent className="p-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-violet-600 text-lg font-bold uppercase tracking-wider">
                      Total
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Agendamentos Mês</p>
                    <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-violet-600 transition-colors duration-300">
                      {stats.todayAppointments + stats.pendingAppointments + stats.confirmedAppointments}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
                <CardContent className="p-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-emerald-600 text-lg font-bold uppercase tracking-wider">
                      Ativos
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Clientes Únicos</p>
                    <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-emerald-600 transition-colors duration-300">
                      {stats.totalClients}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-2xl border-slate-200-40 bg-white-95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] cursor-pointer">
                <CardContent className="p-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-blue-600 text-lg font-bold uppercase tracking-wider">
                      Meta
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Progresso Mensal</p>
                    <p className="text-5xl font-black text-slate-900 tabular-nums group-hover:text-blue-600 transition-colors duration-300">
                      {Math.round((stats.monthlyRevenue / 15000) * 100)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border border-border-40 shadow-xl bg-white-20 dark:bg-slate-900-20 backdrop-blur-xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-6 border-b border-border-20">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-primary-10 rounded-lg">
                      <TrendingUp size={16} className="text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">Performance</CardTitle>
                      <CardDescription className="text-xs font-bold text-muted-foreground">Serviços mais procurados</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="space-y-8">
                    {topServices.length > 0 ? (
                      topServices.map((service) => (
                        <div key={service.name} className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black tracking-tight text-foreground-80">{service.name}</span>
                            <div className="flex items-center gap-1.5 font-black uppercase text-[10px]">
                              <span className="text-primary">{service.count}</span>
                              <span className="text-muted-foreground/40 tracking-widest">Exec</span>
                            </div>
                          </div>
                          <div className="h-2 w-full bg-muted-40 rounded-full overflow-hidden p-px">
                            <div 
                              className="h-full bg-linear-to-r from-primary to-pink-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(236,72,153,0.3)]" 
                              style={{ width: `${service.percent}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Aguardando dados...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <DashboardCard 
                  title="Produtividade" 
                  value={`${stats.completionRate}%`} 
                  description="taxa de finalização" 
                  icon={CheckCircle2} 
                />
                <DashboardCard 
                  title="Total de Clientes" 
                  value={stats.totalClients} 
                  description="clientes ativos" 
                  icon={Users} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
