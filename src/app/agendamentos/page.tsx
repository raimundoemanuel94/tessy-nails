"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from "react";
import { appointmentService, authService, clientService, salonService } from "@/services";
import { format, startOfDay, endOfDay, isSameDay, addDays, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment, Client, Service } from "@/types";

import { PageShell } from "@/components/shared/PageShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { Search, Plus, CalendarIcon, Clock, MoreHorizontal, User, Scissors, Loader2, UserPlus, Trash2, CheckCircle2, TrendingUp, Users, DollarSign, CalendarCheck, CalendarDays } from "lucide-react";
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
import { cn, ensureDate } from "@/lib/utils";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { CalendarX2 } from "lucide-react";

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
  specialist: string;
};

export default function AgendamentosPage() {
  const [rawAppointments, setRawAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clientUsers, setClientUsers] = useState<any[]>([]);
  const [specialists, setSpecialists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [remarcarAppointment, setRemarcarAppointment] = useState<Appointment | null>(null);
  const [remarcarDate, setRemarcarDate] = useState<Date>(new Date());
  const [remarcarTime, setRemarcarTime] = useState<string>("09:00");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Carregar dados individualmente para identificar qual falha nas permissões
      let apps: Appointment[] = [];
      let clientsData: Client[] = [];
      let servicesData: Service[] = [];
      let specialistsData: any[] = [];
      let clientUsersData: any[] = [];

      try {
        apps = await appointmentService.getAll();
      } catch (e) {
        console.error("❌ Erro ao buscar APPOINTMENTS:", e);
      }

      try {
        clientsData = await clientService.getAll();
      } catch (e) {
        console.error("❌ Erro ao buscar CLIENTS:", e);
      }

      try {
        servicesData = await salonService.getAllWithInactive(); // Buscar todos para garantir nomes em registros antigos
      } catch (e) {
        console.error("❌ Erro ao buscar SERVICES:", e);
      }

      try {
        specialistsData = await (appointmentService.getSpecialists ? appointmentService.getSpecialists() : Promise.resolve([]));
      } catch (e) {
        console.error("❌ Erro ao buscar SPECIALISTS (users):", e);
      }

      try {
        const unresolvedClientIds = apps
          .map((app) => app.clientId)
          .filter((clientId, index, array) => Boolean(clientId) && array.indexOf(clientId) === index)
          .filter((clientId) => !clientsData.some((client) => client.id === clientId));
        clientUsersData = unresolvedClientIds.length > 0 ? await authService.getUsersByIds(unresolvedClientIds) : [];
      } catch (e) {
        console.error("❌ Erro ao buscar fallback de USERS para clientes:", e);
      }

      setRawAppointments(apps);
      setClients(clientsData);
      setServices(servicesData);
      setClientUsers(clientUsersData);
      setSpecialists(specialistsData);

      if (apps.length === 0 && (clientsData.length > 0 || servicesData.length > 0)) {
        console.warn("⚠️ Nenhum agendamento retornado ou erro de permissão silencioso.");
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Erro ao carregar alguns dados. Verifique o console.");
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
      const clientUser = clientUsers.find((u) => u.uid === app.clientId);
      const service = services.find(s => s.id === app.serviceId);
      const specialist = specialists.find(s => s.uid === app.specialistId);
      
      const appDate = ensureDate(app.appointmentDate);
      
      // ⚡ HARDCORE FIX: Corrigir horários zerados (00:00)
      let timeString = appDate ? format(appDate, "HH:mm") : "--:--";
      if (timeString === '00:00' && appDate.getHours() === 0) {
        timeString = '09:00'; // Horário comercial padrão
      }
      
      return {
        id: app.id!,
        client: client?.name || clientUser?.name || `Cliente ${app.clientId?.slice(0, 8) || 'Desconhecido'}`,
        service: service ? service.name : `Serviço ${app.serviceId?.slice(0, 8) || 'Desconhecido'}`,
        specialist: specialist ? specialist.name : "Qualquer profissional",
        date: appDate ? format(appDate, "dd/MM/yyyy") : "--/--/----",
        time: timeString,
        status: app.status,
        price: service ? `R$ ${Number(service.price).toFixed(2)}` : "R$ 0,00"
      };
    });
  }, [rawAppointments, clients, clientUsers, services, specialists]);

  const filteredAppointments = useMemo(() => {
    let filtered = enrichedAppointments.filter(app =>
      app.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.service.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Aplicar filtros rápidos
    if (activeFilter !== "all") {
      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);
      const weekEnd = addDays(today, 7);

      filtered = filtered.filter(app => {
        // Converter data do formato DD/MM/YYYY para Date
        const [day, month, year] = app.date.split('/').map(Number);
        const appDate = new Date(year, month - 1, day);
        
        switch (activeFilter) {
          case "today":
            return isSameDay(appDate, today);
          case "tomorrow":
            return isSameDay(appDate, tomorrow);
          case "week":
            return appDate >= today && appDate <= weekEnd;
          case "pending":
            return app.status === "pending";
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [enrichedAppointments, searchTerm, activeFilter]);
  
  // Calcular estatísticas para cards de resumo
  const stats = useMemo(() => {
    const total = enrichedAppointments.length;
    const pending = enrichedAppointments.filter(app => app.status === 'pending').length;
    const confirmed = enrichedAppointments.filter(app => app.status === 'confirmed').length;
    const completed = enrichedAppointments.filter(app => app.status === 'completed').length;
    
    // Calcular receita prevista (soma de confirmados + pendentes)
    const revenue = enrichedAppointments
      .filter(app => app.status === 'confirmed' || app.status === 'pending')
      .reduce((total, app) => {
        const price = parseFloat(app.price.replace('R$ ', '').replace(',', '.')) || 0;
        return total + price;
      }, 0);
    
    return { total, pending, confirmed, completed, revenue };
  }, [enrichedAppointments]);

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

  const handleConcluir = async (id: string) => {
    setActionLoading(id);
    try {
      await appointmentService.complete(id);
      toast.success("Atendimento concluído com sucesso!");
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao concluir atendimento.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFalta = async (id: string) => {
    setActionLoading(id);
    try {
      await appointmentService.noShow(id);
      toast.success("Falta registrada.");
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao registrar falta.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelar = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;
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

  const handleExcluir = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este agendamento? Esta ação não pode ser desfeita.")) return;
    setActionLoading(id);
    try {
      await appointmentService.delete(id);
      toast.success("Agendamento excluído com sucesso.");
      await loadData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir agendamento.");
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
    <PageShell>
      <PageHeader 
        title="Controle de Agendamentos" 
        description="Visualize todo o histórico e próximos agendamentos."
        icon={CalendarDays}
      >
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2 bg-brand-primary hover:opacity-90 text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all rounded-xl font-bold text-sm px-8 py-3">
                <Plus size={20} /> Novo Agendamento
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

      {/* Management Toolbar */}
      <div className="mb-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            title="Total"
            value={stats.total}
            icon={CalendarCheck}
            variant="purple"
          />
          
          <MetricCard
            title="Pendentes"
            value={stats.pending}
            icon={Clock}
            variant="orange"
          />
          
          <MetricCard
            title="Confirmados"
            value={stats.confirmed}
            icon={CheckCircle2}
            variant="blue"
          />
          
          <MetricCard
            title="Concluídos"
            value={stats.completed}
            icon={Users}
            variant="green"
          />
          
          <MetricCard
            title="Receita"
            value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            variant="pink"
          />
        </div>
        
        {/* Content Card with Filters and Table */}
        <SectionCard
          title="Histórico de Agendamentos"
          description="Gerencie e filtre todos os registros do sistema."
          className="overflow-hidden"
        >
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col gap-6">
              {/* Search Input */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={20} />
                <Input 
                  id="search-appointments"
                  name="search-appointments"
                  placeholder="Pesquisar por cliente ou serviço..." 
                  className="pl-12 h-12 rounded-xl border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Filters Section */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Filter Chips */}
                <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl border border-slate-200/40 dark:border-white/5 w-fit">
                  {["all", "today", "tomorrow", "week", "pending"].map((filter) => (
                    <Button
                      key={filter}
                      variant={activeFilter === filter ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveFilter(filter)}
                      className={cn(
                        "rounded-lg font-bold text-xs px-4 py-2 h-auto",
                        activeFilter === filter ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"
                      )}
                    >
                      {filter === "all" ? "Todos" : 
                       filter === "today" ? "Hoje" : 
                       filter === "tomorrow" ? "Amanhã" : 
                       filter === "week" ? "Semana" : "Pendentes"}
                    </Button>
                  ))}
                </div>
                
                {/* Results Count */}
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Exibindo <span className="text-slate-900 dark:text-white">{filteredAppointments.length}</span> resultados
                </div>
              </div>
            </div>

            {/* Enhanced Table */}
            <div className="rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden bg-slate-50/30 dark:bg-transparent">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-brand-primary/50" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-100/50 dark:bg-white/5">
                    <TableRow className="hover:bg-transparent border-b border-slate-200/40 dark:border-white/5">
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Data & Horário</TableHead>
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Cliente</TableHead>
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Serviço</TableHead>
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-wider">Status</TableHead>
                      <TableHead className="px-6 py-4 text-right text-[10px] font-black uppercase text-slate-500 tracking-wider">Valor</TableHead>
                      <TableHead className="px-6 py-4 text-center text-[10px] font-black uppercase text-slate-500 tracking-wider">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.length > 0 ? (
                      filteredAppointments.map((app) => (
                        <TableRow key={app.id} className="group hover:bg-white dark:hover:bg-white/5 border-b border-slate-100 dark:border-white/5 transition-all">
                          <TableCell className="px-6 py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{app.date}</span>
                              <span className="text-[10px] font-bold text-slate-500">{app.time}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{app.client}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge variant="outline" className="bg-brand-primary/5 dark:bg-brand-primary/10 text-brand-primary dark:text-brand-accent border-brand-primary/20 dark:border-brand-primary/20 text-[10px] font-bold px-2 py-0">
                              {app.service}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge className={cn(
                              "text-[10px] font-black uppercase px-2 py-0.5 rounded-md border-0",
                              app.status === "confirmed" && "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
                              app.status === "pending" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
                              app.status === "completed" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
                              app.status === "cancelled" && "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
                              app.status === "no_show" && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                            )}>
                              {app.status === "confirmed" ? "Confirmado" : 
                               app.status === "pending" ? "Pendente" : 
                               app.status === "completed" ? "Concluído" : 
                               app.status === "no_show" ? "Falta" : "Cancelado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <span className="text-sm font-black text-slate-900 dark:text-white">{app.price}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10" disabled={actionLoading === app.id}>
                                    {actionLoading === app.id ? <Loader2 size={14} className="animate-spin" /> : <MoreHorizontal size={14} />}
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
                                <DropdownMenuItem className="rounded-lg font-bold text-xs" disabled={app.status !== "pending"} onClick={() => handleConfirmar(app.id)}>
                                  <CheckCircle2 size={14} className="mr-2" /> Confirmar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg font-bold text-xs text-emerald-600" disabled={app.status === "completed" || app.status === "cancelled"} onClick={() => handleConcluir(app.id)}>
                                  <CheckCircle2 size={14} className="mr-2" /> Concluir
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg font-bold text-xs" onClick={() => openRemarcar(app)}>
                                  <Clock size={14} className="mr-2" /> Remarcar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg font-bold text-xs text-amber-600" onClick={() => handleFalta(app.id)}>
                                  <CalendarX2 size={14} className="mr-2" /> Marcar Falta
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg font-bold text-xs text-purple-600" onClick={() => handleCancelar(app.id)}>
                                  <CalendarX2 size={14} className="mr-2" /> Cancelar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg font-bold text-xs text-red-600" onClick={() => handleExcluir(app.id)}>
                                  <Trash2 size={14} className="mr-2" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="py-20 text-center text-slate-400 font-bold">
                          Nenhum registro encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </SectionCard>
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
      </PageShell>
  );
}
