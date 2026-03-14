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

      <div className="flex items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={20} />
          <Input 
            id="search-appointments"
            name="search-appointments"
            placeholder="Pesquisar por cliente, serviço ou data..." 
            className="pl-12 h-12 rounded-2xl border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-pink-500/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="h-10 w-10 animate-spin text-pink-600 relative z-10" />
            </div>
            <p className="text-sm font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">Sincronizando agendamentos...</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-white/5">
              <TableRow className="hover:bg-transparent border-slate-100 dark:border-white/5">
                <TableHead className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Data & Horário</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Cliente</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Serviço</TableHead>
                <TableHead className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Status</TableHead>
                <TableHead className="px-6 py-5 text-right text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Valor</TableHead>
                <TableHead className="px-6 py-5 text-right text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Gestão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => (
                  <TableRow key={app.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 border-slate-100 dark:border-white/5 transition-all">
                    <TableCell className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                          <CalendarIcon size={14} className="text-pink-600" />
                          {app.date}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          <Clock size={12} />
                          {app.time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400">
                          {String(app.client || "").substring(0, 2).toUpperCase() || "CN"}
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{String(app.client || "")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2 px-3 py-1 bg-pink-50 dark:bg-pink-950/20 border border-pink-100/50 dark:border-pink-900/50 rounded-xl w-fit">
                        <Scissors size={14} className="text-pink-600" />
                        <span className="text-xs font-bold text-pink-700 dark:text-pink-400">{app.service}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant="outline" className={cn(
                        "px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm",
                        app.status === "confirmed" && "bg-blue-100/50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-900/30",
                        app.status === "pending" && "bg-amber-100/50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/30",
                        app.status === "completed" && "bg-emerald-100/50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/30",
                        app.status === "cancelled" && "bg-rose-100/50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/30"
                      )}>
                        {app.status === "confirmed" ? "Confirmado" : 
                         app.status === "pending" ? "Pendente" : 
                         app.status === "completed" ? "Concluído" : "Cancelado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white">{app.price}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all shadow-sm group-hover:bg-white dark:group-hover:bg-white/5" disabled={actionLoading === app.id}>
                              {actionLoading === app.id ? (
                                <Loader2 size={18} className="animate-spin text-pink-600" />
                              ) : (
                                <MoreHorizontal size={18} className="text-slate-400 group-hover:text-pink-600 transition-colors" />
                              )}
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl border-slate-200/60 dark:border-white/5 shadow-2xl">
                          <DropdownMenuItem
                            className="p-3 cursor-pointer rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:text-pink-600 transition-all"
                            disabled={app.status === "confirmed" || app.status === "completed" || app.status === "cancelled"}
                            onClick={() => handleConfirmar(app.id)}
                          >
                            Confirmar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="p-3 cursor-pointer rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:text-pink-600 transition-all"
                            disabled={app.status === "completed" || app.status === "cancelled"}
                            onClick={() => openRemarcar(app)}
                          >
                            Remarcar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="p-3 cursor-pointer rounded-xl font-black text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
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
                  <TableCell colSpan={6} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3 opacity-30 grayscale">
                      <Search size={48} className="text-slate-400" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nenhum agendamento encontrado.</p>
                    </div>
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
