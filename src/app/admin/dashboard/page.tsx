"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { Users, Calendar, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { appointmentService, clientService, salonService } from "@/services";
import { Service } from "@/types";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";

interface TableRow {
  id: string;
  clientName: string;
  serviceName: string;
  time: string;
  status: string;
  price: string;
}

interface TopService {
  name: string;
  count: number;
}

interface DashboardData {
  totalClients: number;
  todayCount: number;
  todayPending: number;
  monthlyRevenue: number;
  completionRate: number;
  todayAppointments: TableRow[];
  topServices: TopService[];
}

function statusBadge(status: string): { label: string; variant: "default" | "outline" | "secondary" | "destructive" } {
  if (status === "confirmed") return { label: "Confirmado", variant: "default" };
  if (status === "pending") return { label: "Pendente", variant: "outline" };
  if (status === "completed") return { label: "Concluído", variant: "secondary" };
  return { label: "Cancelado", variant: "destructive" };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();

    Promise.all([
      clientService.getAll(),
      appointmentService.getByDateRange(startOfDay(today), endOfDay(today)),
      appointmentService.getByDateRange(startOfMonth(today), endOfMonth(today)),
      salonService.getAll(),
      getDocs(collection(db, "users")),
    ])
      .then(([clients, todayAppts, monthAppts, services, usersSnap]) => {
        const serviceMap = new Map<string, Service>(services.filter((s) => s.id).map((s) => [s.id!, s]));
        const userMap = new Map<string, string>();
        usersSnap.docs.forEach((d) => {
          userMap.set(d.id, (d.data().name as string) ?? "—");
        });

        const monthlyRevenue = monthAppts
          .filter((a) => a.status === "completed")
          .reduce((sum, a) => sum + (serviceMap.get(a.serviceId)?.price ?? 0), 0);

        const nonCancelled = monthAppts.filter((a) => a.status !== "cancelled");
        const completed = monthAppts.filter((a) => a.status === "completed");
        const completionRate =
          nonCancelled.length > 0
            ? Math.round((completed.length / nonCancelled.length) * 100)
            : 0;

        const todayAppointments: TableRow[] = todayAppts.map((a) => {
          const svc = serviceMap.get(a.serviceId);
          const d = new Date(a.appointmentDate);
          return {
            id: a.id ?? "",
            clientName: userMap.get(a.clientId) ?? "—",
            serviceName: svc?.name ?? "—",
            time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
            status: a.status,
            price: svc
              ? svc.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              : "—",
          };
        });

        const serviceCount = new Map<string, number>();
        monthAppts.forEach((a) =>
          serviceCount.set(a.serviceId, (serviceCount.get(a.serviceId) ?? 0) + 1)
        );
        const topServices: TopService[] = [...serviceCount.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([id, count]) => ({ name: serviceMap.get(id)?.name ?? id, count }));

        setData({
          totalClients: clients.length,
          todayCount: todayAppts.length,
          todayPending: todayAppts.filter((a) => a.status === "pending").length,
          monthlyRevenue,
          completionRate,
          todayAppointments,
          topServices,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <PageHeader title="Dashboard" description="Carregando dados..." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-slate-200" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  const maxCount = Math.max(...(data?.topServices.map((s) => s.count) ?? [1]), 1);

  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <PageHeader
          title="Dashboard"
          description="Bem-vinda de volta, Tessy! Veja o resumo de hoje."
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <DashboardCard
            title="Total de Clientes"
            value={data?.totalClients ?? 0}
            description="cadastrados"
            icon={Users}
          />
          <DashboardCard
            title="Agendamentos Hoje"
            value={data?.todayCount ?? 0}
            description={`${data?.todayPending ?? 0} pendente(s)`}
            icon={Calendar}
          />
          <DashboardCard
            title="Receita Mensal"
            value={(data?.monthlyRevenue ?? 0).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
            description="agendamentos concluídos"
            icon={DollarSign}
          />
          <DashboardCard
            title="Taxa de Conclusão"
            value={`${data?.completionRate ?? 0}%`}
            description="agendamentos este mês"
            icon={CheckCircle2}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-full lg:col-span-4">
            <CardHeader>
              <CardTitle>Agendamentos de Hoje</CardTitle>
              <CardDescription>
                {data?.todayCount
                  ? `${data.todayCount} agendamento(s) para hoje.`
                  : "Nenhum agendamento para hoje."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.todayAppointments.length ? (
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
                    {data.todayAppointments.map((row) => {
                      const badge = statusBadge(row.status);
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.clientName}</TableCell>
                          <TableCell>{row.serviceName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock size={14} className="text-muted-foreground" />
                              {row.time}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{row.price}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum agendamento para hoje.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-full lg:col-span-3">
            <CardHeader>
              <CardTitle>Serviços mais procurados</CardTitle>
              <CardDescription>Performance por serviço este mês.</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.topServices.length ? (
                <div className="space-y-4">
                  {data.topServices.map((service) => (
                    <div key={service.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{service.name}</span>
                        <span className="text-muted-foreground">
                          {service.count} agendamento(s)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${Math.round((service.count / maxCount) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sem dados este mês.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
