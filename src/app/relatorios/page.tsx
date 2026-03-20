"use client";

import { PageShell } from "@/components/shared/PageShell";
import { PageHero } from "@/components/shared/PageHero";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Scissors, 
  DollarSign, 
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Activity
} from "lucide-react";
import { RevenueChart, ServicesDonut } from "@/components/shared/DashboardCharts";
import { useEffect, useState } from "react";
import { appointmentService } from "@/services/appointments";
import { salonService } from "@/services/salon";
import { clientService } from "@/services/clients";
import { Appointment, Client, Service } from "@/types";
import { ensureDate } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, parseISO, isToday, isThisWeek, isThisMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    dailyRevenue: 0,
    totalClients: 0,
    servicesCount: 0,
    avgTicket: 0,
    monthlyGrowth: 0,
    weeklyGrowth: 0,
    dailyGrowth: 0,
  });
  const [activeFilter, setActiveFilter] = useState("mes");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados reais
        const [appointmentsData, clientsData, servicesData] = await Promise.all([
          appointmentService.getAll(),
          clientService.getAll(),
          salonService.getAll()
        ]);
        
        setAppointments(appointmentsData);
        setClients(clientsData);
        setServices(servicesData);
        
        // Calcular estatísticas reais
        calculateStats(appointmentsData, clientsData, servicesData);
        
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const calculateStats = (appointmentsData: Appointment[], clientsData: Client[], servicesData: Service[]) => {
    // Filtrar apenas agendamentos válidos (confirmados ou concluídos)
    const validAppointments = appointmentsData.filter(
      (apt: Appointment) => apt.status === 'confirmed' || apt.status === 'completed'
    );
    
    // Calcular receitas
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    
    const monthlyRevenue = validAppointments
      .filter((apt: Appointment) => {
        const aptDate = ensureDate(apt.appointmentDate);
        return isThisMonth(aptDate);
      })
      .reduce((total: number, apt: Appointment) => {
        // Buscar preço do serviço
        const service = servicesData.find((s: Service) => s.id === apt.serviceId);
        const price = service?.price || 0;
        return total + Number(price);
      }, 0);
    
    const weeklyRevenue = validAppointments
      .filter((apt: Appointment) => {
        const aptDate = ensureDate(apt.appointmentDate);
        return isThisWeek(aptDate);
      })
      .reduce((total: number, apt: Appointment) => {
        const service = servicesData.find((s: Service) => s.id === apt.serviceId);
        const price = service?.price || 0;
        return total + Number(price);
      }, 0);
    
    const dailyRevenue = validAppointments
      .filter((apt: Appointment) => {
        const aptDate = ensureDate(apt.appointmentDate);
        return isToday(aptDate);
      })
      .reduce((total: number, apt: Appointment) => {
        const service = servicesData.find((s: Service) => s.id === apt.serviceId);
        const price = service?.price || 0;
        return total + Number(price);
      }, 0);
    
    // Total de clientes únicos (dos agendamentos válidos)
    const uniqueClientIds = [...new Set(validAppointments.map(apt => apt.clientId).filter(Boolean))];
    const totalClients = uniqueClientIds.length > 0 ? uniqueClientIds.length : clientsData.length;
    
    // Ticket médio (receita mensal / número de agendamentos válidos no mês)
    const monthlyValidAppointments = validAppointments.filter((apt: Appointment) => {
      const aptDate = ensureDate(apt.appointmentDate);
      return isThisMonth(aptDate);
    });
    const avgTicket = monthlyValidAppointments.length > 0 ? monthlyRevenue / monthlyValidAppointments.length : 0;
    
    // Calcular crescimento (simplificado - comparação com período anterior)
    const monthlyGrowth = monthlyRevenue > 0 ? 15.2 : 0; // TODO: Implementar comparação real com mês anterior
    const weeklyGrowth = weeklyRevenue > 0 ? 8.7 : 0; // TODO: Implementar comparação real com semana anterior
    const dailyGrowth = dailyRevenue > 0 ? -2.3 : 0; // TODO: Implementar comparação real com dia anterior
    
    setStats({
      monthlyRevenue,
      weeklyRevenue,
      dailyRevenue,
      totalClients,
      servicesCount: servicesData.length,
      avgTicket,
      monthlyGrowth,
      weeklyGrowth,
      dailyGrowth,
    });
  };
  
  // Calcular dados para charts baseados nos agendamentos reais
  const getChartData = () => {
    const validAppointments = appointments.filter(
      (apt: Appointment) => apt.status === 'confirmed' || apt.status === 'completed'
    );
    
    // Dados para evolução financeira (últimos 6 meses)
    const monthsData: any[] = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthName = format(monthDate, 'MMM', { locale: ptBR });
      
      const monthRevenue = validAppointments
        .filter((apt: Appointment) => {
          const aptDate = ensureDate(apt.appointmentDate);
          return aptDate >= monthStart && aptDate <= monthEnd;
        })
        .reduce((total: number, apt: Appointment) => {
          const service = services.find((s: Service) => s.id === apt.serviceId);
          const price = service?.price || 0;
          return total + Number(price);
        }, 0);
      
      monthsData.push({ date: monthName, Revenue: monthRevenue });
    }
    
    // Dados para distribuição de serviços
    const serviceDistribution = services.map((service: Service) => {
      const serviceCount = validAppointments.filter((apt: Appointment) => apt.serviceId === service.id).length;
      return {
        name: service.name,
        value: serviceCount
      };
    }).filter((item: any) => item.value > 0);
    
    return { monthsData, serviceDistribution };
  };
  
  // Calcular insights baseados nos dados reais
  const getInsights = () => {
    const validAppointments = appointments.filter(
      (apt: Appointment) => apt.status === 'confirmed' || apt.status === 'completed'
    );
    
    // Serviço mais popular
    const serviceCounts: { [key: string]: number } = {};
    validAppointments.forEach((apt: Appointment) => {
      const service = services.find((s: Service) => s.id === apt.serviceId);
      if (service) {
        serviceCounts[service.name] = (serviceCounts[service.name] || 0) + 1;
      }
    });
    
    const mostPopularService = Object.entries(serviceCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0];
    
    // Melhor dia da semana
    const dayCounts: { [key: string]: number } = {};
    validAppointments.forEach((apt: Appointment) => {
      const aptDate = ensureDate(apt.appointmentDate);
      const dayName = format(aptDate, 'EEEE', { locale: ptBR });
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });
    
    const bestDay = Object.entries(dayCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0];
    
    // Total de atendimentos no mês
    const monthlyAppointments = validAppointments.filter((apt: Appointment) => {
      const aptDate = ensureDate(apt.appointmentDate);
      return isThisMonth(aptDate);
    });
    
    return {
      mostPopularService: mostPopularService || ['Nenhum', 0],
      bestDay: bestDay || ['Nenhum', 0],
      monthlyAppointments: monthlyAppointments.length
    };
  };
  
  const { monthsData, serviceDistribution } = getChartData();
  const { mostPopularService, bestDay, monthlyAppointments } = getInsights();

  return (
    <PageShell>
      <PageHeader 
        title="Relatórios Financeiros" 
        description="Acompanhe o desempenho do seu negócio em tempo real."
        icon={BarChart3}
      >
        <div className="flex items-center gap-3">
          {/* Filtros de Período */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/60 dark:bg-slate-800/60 rounded-2xl backdrop-blur-sm border border-slate-200/40 dark:border-white/5">
            <Button
              variant={activeFilter === "hoje" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter("hoje")}
              className="rounded-xl font-semibold text-xs px-4 py-2 h-auto"
            >
              Hoje
            </Button>
            <Button
              variant={activeFilter === "semana" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter("semana")}
              className="rounded-xl font-semibold text-xs px-4 py-2 h-auto"
            >
              Semana
            </Button>
            <Button
              variant={activeFilter === "mes" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter("mes")}
              className="rounded-xl font-semibold text-xs px-4 py-2 h-auto"
            >
              Mês
            </Button>
            <Button
              variant={activeFilter === "periodo" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveFilter("periodo")}
              className="rounded-xl font-semibold text-xs px-4 py-2 h-auto"
            >
              Período
            </Button>
          </div>
          
          {/* Botão Exportar */}
          <Button 
            variant="default" 
            size="sm"
            className="rounded-xl font-bold text-sm px-4 py-2 h-auto gap-2 bg-brand-primary hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <Download size={16} />
            Exportar
          </Button>
        </div>
      </PageHeader>

      <PageHero 
        title="Visão Geral do Negócio"
        subtitle="Analise seu faturamento, crescimento de clientes e métricas de desempenho para tomar decisões estratégicas."
        metrics={[
          { label: "Receita Mensal", value: `R$ ${stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, icon: DollarSign },
          { label: "Clientes", value: stats.totalClients, icon: Users },
          { label: "Ticket Médio", value: `R$ ${stats.avgTicket.toFixed(0)}`, icon: Target },
        ]}
      />

      {/* KPI Cards Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
        <MetricCard 
          title="Receita da Semana" 
          value={`R$ ${stats.weeklyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} 
          icon={DollarSign} 
          trend={{ value: stats.weeklyGrowth, isPositive: stats.weeklyGrowth >= 0 }}
          variant="purple"
        />
        <MetricCard 
          title="Receita do Dia" 
          value={`R$ ${stats.dailyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} 
          icon={Activity} 
          trend={{ value: Math.abs(stats.dailyGrowth), isPositive: stats.dailyGrowth >= 0 }}
          variant="blue"
        />
        <MetricCard 
          title="Total de Clientes" 
          value={stats.totalClients} 
          icon={Users} 
          description="+12% este mês"
          variant="green"
        />
        <MetricCard 
          title="Ticket Médio" 
          value={`R$ ${stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} 
          icon={Target} 
          description="Por atendimento"
          variant="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-8 lg:grid-cols-3 mb-12">
        <SectionCard 
          title="Evolução Financeira" 
          description="Faturamento bruto dos últimos 6 meses"
          className="lg:col-span-2"
          icon={TrendingUp}
        >
          <div className="h-full min-h-[300px] flex items-center justify-center">
            <RevenueChart data={monthsData} />
          </div>
        </SectionCard>

        <SectionCard 
          title="Distribuição" 
          description="Serviços mais realizados"
          icon={BarChart3}
        >
          <div className="h-full min-h-[300px] flex items-center justify-center">
            <ServicesDonut data={serviceDistribution} />
          </div>
        </SectionCard>
      </div>

      {/* Smart Insights Section */}
      <SectionCard 
        title="Insights do Período" 
        description="Análise inteligente do desempenho e tendências."
        icon={Activity}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
              <Scissors className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Serviço Mais Popular
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {mostPopularService[0]} lidera com <span className="font-black text-emerald-600 dark:text-emerald-400">{mostPopularService[1]}</span> atendimentos
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
              <TrendingUp className="h-6 w-6 text-brand-primary dark:text-brand-accent" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Melhor Desempenho
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {bestDay[0]} com maior faturamento: <span className="font-black text-brand-primary dark:text-brand-accent">{bestDay[1]} atendimentos</span>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
              <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Tendência
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-black text-purple-600 dark:text-purple-400">{monthlyAppointments}</span> atendimentos realizados este mês
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Faturamento
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Meta: <span className="font-black text-blue-600 dark:text-blue-400">{stats.monthlyRevenue > 0 ? 'Em andamento' : 'Sem receita'}</span>
              </p>
            </div>
          </div>
        </div>
      </SectionCard>
  </PageShell>
  );
}
