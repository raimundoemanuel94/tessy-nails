"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from "react";
import { appointmentService, clientService, salonService } from "@/services";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment, Client, Service } from "@/types";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Search, Plus, CalendarIcon, Clock, MoreHorizontal, User, Scissors, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00"
];

type EnrichedAppointment = {
  id: string;
  client: string;
  service: string;
  date: string;
  time: string;
  status: string;
  price: string;
};

export default function AgendamentosPage() {
  const [rawAppointments, setRawAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [remarcarAppointment, setRemarcarAppointment] = useState<Appointment | null>(null);
  const [remarcarDate, setRemarcarDate] = useState<Date>(new Date());
  const [remarcarTime, setRemarcarTime] = useState<string>("09:00");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [apps, clientsData, servicesData] = await Promise.all([
        appointmentService.getAll(),
        clientService.getAll(),
        salonService.getAll()
      ]);
      setRawAppointments(apps);
      setClients(clientsData);
      setServices(servicesData);
    } catch (error) {
      console.error("Error loading appointments:", error);
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const enrichedAppointments = useMemo<EnrichedAppointment[]>(() => {
    return rawAppointments.map(app => {
      const client = clients.find(c => c.id === app.clientId);
      const service = services.find(s => s.id === app.serviceId);
      return {
        id: app.id!,
        client: client ? client.name : `Cliente ${app.clientId.slice(0, 8)}`,
        service: service ? service.name : `Serviço ${app.serviceId.slice(0, 8)}`,
        date: format(app.appointmentDate, "dd/MM/yyyy"),
        time: format(app.appointmentDate, "HH:mm"),
        status: app.status,
        price: service ? `R$ ${service.price.toFixed(2)}` : "R$ 0,00"
      };
    });
  }, [rawAppointments, clients, services]);

  const filteredAppointments = useMemo(() => {
    return enrichedAppointments.filter(app =>
      app.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.service.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [enrichedAppointments, searchTerm]);

  const handleConfirmar = async (id: string) => {
    setActionLoading(id);
    try {
      await appointmentService.confirm(id);
      toast.success("Agendamento confirmado.");
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao confirmar.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelar = async (id: string) => {
    setActionLoading(id);
    try {
      await appointmentService.cancel(id);
      toast.success("Agendamento cancelado.");
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao cancelar.");
    } finally {
      setActionLoading(null);
    }
  };

  const openRemarcar = (app: EnrichedAppointment) => {
    const raw = rawAppointments.find(r => r.id === app.id);
    if (raw) {
      setRemarcarDate(new Date(raw.appointmentDate));
      setRemarcarTime(format(new Date(raw.appointmentDate), "HH:mm"));
      setRemarcarAppointment(raw);
    }
  };

  const handleRemarcarSubmit = async () => {
    if (!remarcarAppointment?.id) return;
    setActionLoading(remarcarAppointment.id);
    try {
      const [hours, minutes] = remarcarTime.split(":").map(Number);
      const newDate = new Date(remarcarDate);
      newDate.setHours(hours, minutes, 0, 0);
      await appointmentService.update(remarcarAppointment.id, { appointmentDate: newDate });
      toast.success("Agendamento remarcado.");
      setRemarcarAppointment(null);
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao remarcar.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Controle de Agendamentos" 
        description="Visualize todo o histórico e próximos agendamentos."
      >
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2">
                <Plus size={18} /> Novo Agendamento
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
            </DialogHeader>
            <AppointmentForm
              onSuccess={() => {
                setIsNewDialogOpen(false);
                loadData();
              }}
              initialDate={new Date()}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por cliente ou serviço..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
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
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CalendarIcon size={14} className="text-muted-foreground" />
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
                        {app.client}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Scissors size={16} className="text-muted-foreground" />
                        {app.service}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        app.status === "confirmed" ? "default" : 
                        app.status === "pending" ? "outline" : 
                        app.status === "completed" ? "secondary" : "destructive"
                      }>
                        {app.status === "confirmed" ? "Confirmado" : 
                         app.status === "pending" ? "Pendente" : 
                         app.status === "completed" ? "Concluído" : "Cancelado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{app.price}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" disabled={actionLoading === app.id}>
                              {actionLoading === app.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <MoreHorizontal size={18} />
                              )}
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            disabled={app.status === "confirmed" || app.status === "completed" || app.status === "cancelled"}
                            onClick={() => handleConfirmar(app.id)}
                          >
                            Confirmar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            disabled={app.status === "completed" || app.status === "cancelled"}
                            onClick={() => openRemarcar(app)}
                          >
                            Remarcar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive"
                            disabled={app.status === "cancelled"}
                            onClick={() => handleCancelar(app.id)}
                          >
                            Cancelar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum agendamento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog Remarcar */}
      <Dialog open={!!remarcarAppointment} onOpenChange={(open) => !open && setRemarcarAppointment(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Remarcar agendamento</DialogTitle>
          </DialogHeader>
          {remarcarAppointment && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nova data</label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !remarcarDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {remarcarDate ? format(remarcarDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    }
                  />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={remarcarDate}
                      onSelect={(d) => d && setRemarcarDate(d)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Novo horário</label>
                <select
                  className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={remarcarTime}
                  onChange={(e) => setRemarcarTime(e.target.value)}
                >
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setRemarcarAppointment(null)}>
                  Voltar
                </Button>
                <Button
                  onClick={handleRemarcarSubmit}
                  disabled={actionLoading === remarcarAppointment.id}
                >
                  {actionLoading === remarcarAppointment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Remarcar"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
