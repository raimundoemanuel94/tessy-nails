"use client";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Scissors, DollarSign } from "lucide-react";
import { RevenueChart, ServicesDonut } from "@/components/shared/DashboardCharts";
import { useEffect, useState } from "react";
import { appointmentService } from "@/services/appointments";
import { salonService } from "@/services/salon";
import { clientService } from "@/services/clients";

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    revenue: 4200,
    clients: 0,
    services: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [clients, services] = await Promise.all([
          clientService.getAll(),
          salonService.getAll()
        ]);
        setStats(prev => ({
          ...prev,
          clients: clients.length,
          services: services.length
        }));
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <AdminLayout>
      <PageHeader 
        title="Relatórios e Estatísticas" 
        description="Analise o desempenho do seu salão com dados detalhados."
      />

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="rounded-3xl border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
            <p className="text-xs text-slate-400 mt-1">+12% desde o último mês</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-3xl border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Serviços Ativos</CardTitle>
            <Scissors className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.services}</div>
            <p className="text-xs text-slate-400 mt-1">Variedade do catálogo</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Receita Estimada</CardTitle>
            <DollarSign className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.revenue.toFixed(2)}</div>
            <p className="text-xs text-violet-600 mt-1">Meta mensal: 85%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-slate-200/60 shadow-sm p-6">
          <CardHeader className="px-0">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-600" />
              Crescimento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <RevenueChart 
              data={[
                { date: "Out", Revenue: 2100 },
                { date: "Nov", Revenue: 2800 },
                { date: "Dez", Revenue: 3500 },
                { date: "Jan", Revenue: 2900 },
                { date: "Fev", Revenue: 3800 },
                { date: "Mar", Revenue: stats.revenue },
              ]} 
            />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200/60 shadow-sm p-6">
          <CardHeader className="px-0">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-violet-600" />
              Distribuição de Serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <ServicesDonut 
              data={[
                { name: "Manicure", value: 45 },
                { name: "Pedicure", value: 30 },
                { name: "Gel", value: 25 },
              ]} 
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
