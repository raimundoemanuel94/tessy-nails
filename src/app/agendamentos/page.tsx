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
              <Button size="lg" className="gap-2 shadow-xl hover:shadow-2xl font-bold">
                <Plus size={20} /> Novo Agendamento
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[500px] rounded-3xl border-brand-accent/10 shadow-premium-xl bg-white p-0 overflow-hidden">
            <DialogHeader className="px-8 pt-8 pb-6 border-b border-brand-accent/5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-6 w-6 text-brand-primary" strokeWidth={3} />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black text-brand-text-main tracking-tight uppercase">Novo Agendamento</DialogTitle>
                  <p className="text-xs font-bold text-brand-text-sub opacity-50 mt-1">Cadastre um novo horário no sistema</p>
                </div>
              </div>
            </DialogHeader>
            <div className="p-8">
              <AppointmentForm
                onSuccess={() => {
                  setIsNewDialogOpen(false);
                  loadData();
                }}
                initialDate={new Date()}
              />
            </div>
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
            variant="primary"
          />
          
          <MetricCard
            title="Pendentes"
            value={stats.pending}
            icon={Clock}
            variant="warning"
          />
          
          <MetricCard
            title="Confirmados"
            value={stats.confirmed}
            icon={CheckCircle2}
            variant="accent"
          />
          
          <MetricCard
            title="Concluídos"
            value={stats.completed}
            icon={Users}
            variant="success"
          />
          
          <MetricCard
            title="Receita"
            value={`R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
            icon={DollarSign}
            variant="primary"
            className="bg-brand-primary/5 border-brand-primary/10"
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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-sub opacity-40 group-focus-within:text-brand-primary transition-colors" size={20} />
                <Input 
                  id="search-appointments"
                  name="search-appointments"
                  placeholder="Pesquisar por cliente ou serviço..." 
                  className="pl-12 h-12 rounded-2xl border-brand-accent/10 bg-brand-soft/5 focus:ring-brand-primary/10 focus:border-brand-primary transition-all font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Filters Section */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 p-1.5 bg-white/40 rounded-2xl border border-brand-accent/5 shadow-sm backdrop-blur-md">
                  {["all", "today", "tomorrow", "week", "pending"].map((filter) => (
                    <Button
                      key={filter}
                      variant={activeFilter === filter ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setActiveFilter(filter)}
                      className={cn(
                        "rounded-xl font-black text-[10px] uppercase tracking-wider px-4 h-9 transition-all",
                        activeFilter === filter ? "bg-brand-primary text-white shadow-premium" : "text-brand-text-sub opacity-50 hover:opacity-100"
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
                <div className="text-[10px] font-black uppercase tracking-widest text-brand-text-sub opacity-40">
                  <span className="text-brand-primary">{filteredAppointments.length}</span> agendamentos encontrados
                </div>
              </div>
            </div>

            {/* Enhanced Table */}
            <div className="rounded-2xl border border-brand-soft overflow-hidden bg-brand-soft/5">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-brand-primary/30" />
                  <p className="text-[10px] font-black text-brand-text-sub opacity-40 uppercase tracking-widest">Sincronizando...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-brand-soft/20">
                    <TableRow className="hover:bg-transparent border-b border-brand-accent/5">
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-brand-text-sub opacity-50 tracking-widest">Data & Horário</TableHead>
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-brand-text-sub opacity-50 tracking-widest">Cliente</TableHead>
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-brand-text-sub opacity-50 tracking-widest">Serviço</TableHead>
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase text-brand-text-sub opacity-50 tracking-widest">Status</TableHead>
                      <TableHead className="px-6 py-4 text-right text-[10px] font-black uppercase text-brand-text-sub opacity-50 tracking-widest">Valor</TableHead>
                      <TableHead className="px-6 py-4 text-center text-[10px] font-black uppercase text-brand-text-sub opacity-50 tracking-widest">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.length > 0 ? (
                      filteredAppointments.map((app) => (
                        <TableRow key={app.id} className="group hover:bg-white border-b border-brand-accent/5 transition-all">
                          <TableCell className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-brand-text-main tabular-nums">{app.date}</span>
                              <span className="text-[10px] font-black text-brand-text-sub opacity-50 uppercase tracking-tight">{app.time}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-5">
                            <span className="font-bold text-brand-text-main text-sm">{app.client}</span>
                          </TableCell>
                          <TableCell className="px-6 py-5">
                            <Badge variant="outline" className="bg-brand-primary/5 text-brand-primary border-brand-primary/10 text-[10px] font-black uppercase px-2 py-0">
                              {app.service}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-5">
                            <Badge variant={
                              app.status === "confirmed" ? "success" :
                              app.status === "pending" ? "warning" :
                              app.status === "cancelled" || app.status === "no_show" ? "destructive" : "default"
                            } className="text-[9px] font-bold uppercase px-2 py-0.5 border-0 shadow-sm">
                              {app.status === "confirmed" && "Confirmado"}
                              {app.status === "pending" && "Pendente"}
                              {app.status === "completed" && "Concluído"}
                              {app.status === "no_show" && "Falta"}
                              {app.status === "cancelled" && "Cancelado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-5 text-right">
                            <span className="text-sm font-black text-brand-text-main tabular-nums">{app.price}</span>
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
                                <DropdownMenuItem className="rounded-lg font-bold text-xs text-success" disabled={app.status === "completed" || app.status === "cancelled"} onClick={() => handleConcluir(app.id)}>
                                  <CheckCircle2 size={14} className="mr-2" /> Concluir
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg font-bold text-xs" onClick={() => openRemarcar(app)}>
                                  <Clock size={14} className="mr-2" /> Remarcar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg font-bold text-xs text-warning" onClick={() => handleFalta(app.id)}>
                                  <CalendarX2 size={14} className="mr-2" /> Marcar Falta
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg font-bold text-xs text-brand-primary" onClick={() => handleCancelar(app.id)}>
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
