"use client";

export const dynamic = 'force-dynamic';

import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle2 
} from "lucide-react";
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
import { useState, useEffect } from "react";
import { appointmentService } from "@/services/appointments";
import { clientService } from "@/services/clients";
import { salonService } from "@/services/salon";
import { format, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalClients: 0,
    todayAppointments: 0,
    monthlyRevenue: 0,
    completionRate: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Carregar dados reais
        const [appointments, clients, services] = await Promise.all([
          appointmentService.getAll(),
          clientService.getAll(),
          salonService.getAll()
        ]);

        // Calcular estatísticas
        const todayApps = appointments.filter(apt => isToday(apt.appointmentDate));
        const completedApps = appointments.filter(apt => apt.status === 'completed');
        const completionRate = appointments.length > 0 
          ? (completedApps.length / appointments.length) * 100 
          : 0;

        // ✅ Calcular receita real
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

        // ✅ Agendamentos recentes com dados reais
        const recent = appointments
          .filter(apt => !isPast(apt.appointmentDate) || isToday(apt.appointmentDate))
          .slice(0, 5)
          .map(apt => {
            // ✅ Buscar nome real do cliente
            const client = clients.find(c => c.id === apt.clientId);
            const clientName = client ? client.name : `Cliente ${apt.clientId.slice(0, 8)}`;
            
            // ✅ Buscar nome real do serviço
            const service = services.find(s => s.id === apt.serviceId);
            const serviceName = service ? service.name : `Serviço ${apt.serviceId}`;
            
            // ✅ Buscar preço real do serviço
            const servicePrice = service ? `R$ ${service.price.toFixed(2)}` : "R$ 0,00";
            
            return {
              id: apt.id,
              client: clientName,
              service: serviceName,
              time: format(apt.appointmentDate, 'HH:mm', { locale: ptBR }),
              status: apt.status,
              price: servicePrice
            };
          });

        setRecentAppointments(recent);

        // ✅ Serviços mais procurados com dados reais
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
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>
              {recentAppointments.length} agendamentos próximos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAppointments.length > 0 ? (
                  recentAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-medium">{appointment.client}</TableCell>
                      <TableCell>{appointment.service}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock size={14} className="text-muted-foreground" />
                          {appointment.time}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          appointment.status === "confirmed" ? "default" : 
                          appointment.status === "pending" ? "outline" : "secondary"
                        }>
                          {appointment.status === "confirmed" ? "Confirmado" : 
                           appointment.status === "pending" ? "Pendente" : "Concluído"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{appointment.price}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Nenhum agendamento próximo encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>Serviços mais procurados</CardTitle>
            <CardDescription>
              Performance por categoria este mês.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topServices.length > 0 ? (
                topServices.map((service) => (
                  <div key={service.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-muted-foreground">{service.count} agendamentos</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${service.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum serviço encontrado.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
