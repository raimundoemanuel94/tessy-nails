"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import {
  Search,
  Calendar,
  Clock,
  MoreHorizontal,
  User,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appointmentService, salonService } from "@/services";
import { Appointment, AppointmentStatus, Service } from "@/types";
import { toast } from "sonner";

interface DisplayAppointment {
  id: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  price: string;
}

function statusBadge(status: string): { label: string; variant: "default" | "outline" | "secondary" | "destructive" } {
  if (status === "confirmed") return { label: "Confirmado", variant: "default" };
  if (status === "pending") return { label: "Pendente", variant: "outline" };
  if (status === "completed") return { label: "Concluído", variant: "secondary" };
  return { label: "Cancelado", variant: "destructive" };
}

export default function AgendamentosPage() {
  const [appointments, setAppointments] = useState<DisplayAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      appointmentService.getAll(),
      salonService.getAll(),
      getDocs(collection(db, "users")),
    ])
      .then(([firestoreAppointments, services, usersSnap]) => {
        const serviceMap = new Map<string, Service>(services.filter((s) => s.id).map((s) => [s.id!, s]));
        const userMap = new Map<string, string>();
        usersSnap.docs.forEach((d) => {
          userMap.set(d.id, (d.data().name as string) ?? "—");
        });

        const mapped: DisplayAppointment[] = firestoreAppointments.map((a) => {
          const svc = serviceMap.get(a.serviceId);
          const d = new Date(a.appointmentDate);
          return {
            id: a.id ?? "",
            clientName: userMap.get(a.clientId) ?? "—",
            serviceName: svc?.name ?? "—",
            date: d.toLocaleDateString("pt-BR"),
            time: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
            status: a.status,
            price: svc
              ? svc.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              : "—",
          };
        });
        setAppointments(mapped);
      })
      .catch(() => toast.error("Erro ao carregar agendamentos."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    if (!id) return;
    setUpdating(id);
    try {
      await appointmentService.updateStatus(id, status);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      const labels: Record<string, string> = {
        confirmed: "Confirmado",
        completed: "Concluído",
        cancelled: "Cancelado",
      };
      toast.success(`Agendamento ${labels[status] ?? status} com sucesso.`);
    } catch {
      toast.error("Erro ao atualizar agendamento.");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = appointments.filter((a) => {
    const matchSearch =
      a.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.serviceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <AdminProtectedRoute>
      <AdminLayout>
      <PageHeader
        title="Controle de Agendamentos"
        description="Visualize todo o histórico e próximos agendamentos."
      />

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Buscar por cliente ou serviço..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || 'all')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-card">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            Nenhum agendamento encontrado.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((app) => {
                const badge = statusBadge(app.status);
                const isBusy = updating === app.id;
                return (
                  <TableRow key={app.id} className={isBusy ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar size={14} className="text-muted-foreground" />
                          {app.date}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={12} />
                          {app.time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-muted-foreground" />
                        {app.clientName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Scissors size={16} className="text-muted-foreground" />
                        {app.serviceName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {app.price}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" disabled={isBusy}>
                              <MoreHorizontal size={18} />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          {app.status !== "confirmed" && app.status !== "completed" && app.status !== "cancelled" && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleUpdateStatus(app.id, "confirmed")}
                            >
                              Confirmar
                            </DropdownMenuItem>
                          )}
                          {app.status !== "completed" && app.status !== "cancelled" && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleUpdateStatus(app.id, "completed")}
                            >
                              Concluir
                            </DropdownMenuItem>
                          )}
                          {app.status !== "cancelled" && (
                            <DropdownMenuItem
                              className="cursor-pointer text-destructive"
                              onClick={() => handleUpdateStatus(app.id, "cancelled")}
                            >
                              Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </AdminLayout>
    </AdminProtectedRoute>
  );
}
