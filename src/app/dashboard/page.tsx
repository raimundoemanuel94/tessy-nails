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

const recentAppointments = [
  { 
    id: "1", 
    client: "Maria Silva", 
    service: "Manicure + Pedicure", 
    time: "14:00", 
    status: "confirmed", 
    price: "R$ 120,00" 
  },
  { 
    id: "2", 
    client: "Ana Oliveira", 
    service: "Alongamento em Gel", 
    time: "15:30", 
    status: "pending", 
    price: "R$ 180,00" 
  },
  { 
    id: "3", 
    client: "Carla Santos", 
    service: "Esmaltação em Gel", 
    time: "17:00", 
    status: "completed", 
    price: "R$ 80,00" 
  },
];

export default function DashboardPage() {
  return (
    <AdminLayout>
      <PageHeader 
        title="Dashboard" 
        description="Bem-vinda de volta, Tessy! Veja o resumo de hoje." 
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <DashboardCard 
          title="Total de Clientes" 
          value="124" 
          description="novos este mês" 
          icon={Users} 
          trend={{ value: 12, isUp: true }} 
        />
        <DashboardCard 
          title="Agendamentos Hoje" 
          value="8" 
          description="2 pendentes" 
          icon={Calendar} 
        />
        <DashboardCard 
          title="Receita Mensal" 
          value="R$ 4.250,00" 
          description="vs. mês passado" 
          icon={DollarSign} 
          trend={{ value: 8.5, isUp: true }} 
        />
        <DashboardCard 
          title="Taxa de Conclusão" 
          value="94%" 
          description="agendamentos finalizados" 
          icon={CheckCircle2} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>
              Você tem 3 agendamentos restantes para hoje.
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
                {recentAppointments.map((appointment) => (
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
                ))}
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
              {[
                { name: "Manicure Simples", count: 45, percent: 75 },
                { name: "Alongamento em Gel", count: 32, percent: 60 },
                { name: "Pedicure", count: 28, percent: 45 },
                { name: "Esmaltação em Gel", count: 15, percent: 25 },
              ].map((service) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
