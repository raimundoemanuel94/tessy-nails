"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from "react";
import { appointmentService, authService, clientService, salonService } from "@/services";
import { format, startOfDay, endOfDay, isSameDay, addDays, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment, Client, Service } from "@/types";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Search, Plus, CalendarIcon, Clock, MoreHorizontal, User, Scissors, Loader2, UserPlus, Trash2, CheckCircle2, TrendingUp, Users, DollarSign, CalendarCheck } from "lucide-react";
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
    <AdminLayout>
      <PageHeader 
        title="Controle de Agendamentos" 
        description="Visualize todo o histórico e próximos agendamentos."
      >
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all rounded-xl font-bold text-sm px-8 py-3">
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
      <div className="mb-8">
        {/* Summary Cards */}
        <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200/40 dark:border-white/5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg shadow-slate-200/30 dark:shadow-none p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <CalendarCheck className="h-7 w-7 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Total</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-slate-200/40 dark:border-white/5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg shadow-slate-200/30 dark:shadow-none p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Clock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Pendentes</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-slate-200/40 dark:border-white/5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg shadow-slate-200/30 dark:shadow-none p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Confirmados</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.confirmed}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-slate-200/40 dark:border-white/5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg shadow-slate-200/30 dark:shadow-none p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Users className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Concluídos</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.completed}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-slate-200/40 dark:border-white/5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg shadow-slate-200/30 dark:shadow-none p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <DollarSign className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Receita</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative max-w-2xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={22} />
            <Input 
              id="search-appointments"
              name="search-appointments"
              placeholder="Pesquisar por cliente, serviço ou data..." 
              className="pl-16 h-16 rounded-2xl border-slate-200/60 dark:border-white/5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium text-lg w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filters Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Filter Chips */}
            <div className="flex items-center gap-3 p-2 bg-slate-100/60 dark:bg-slate-800/60 rounded-2xl backdrop-blur-sm border border-slate-200/40 dark:border-white/5">
              <Button
                variant={activeFilter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter("all")}
                className="rounded-xl font-bold text-sm px-5 py-3 h-auto"
              >
                Todos
              </Button>
              <Button
                variant={activeFilter === "today" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter("today")}
                className="rounded-xl font-bold text-sm px-5 py-3 h-auto"
              >
                Hoje
              </Button>
              <Button
                variant={activeFilter === "tomorrow" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter("tomorrow")}
                className="rounded-xl font-bold text-sm px-5 py-3 h-auto"
              >
                Amanhã
              </Button>
              <Button
                variant={activeFilter === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter("week")}
                className="rounded-xl font-bold text-sm px-5 py-3 h-auto"
              >
                Semana
              </Button>
              <Button
                variant={activeFilter === "pending" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter("pending")}
                className="rounded-xl font-bold text-sm px-5 py-3 h-auto"
              >
                Pendentes
              </Button>
            </div>
            
            {/* Results Count */}
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              <span className="text-violet-600 dark:text-violet-400 font-black text-lg">{filteredAppointments.length}</span> de <span className="text-slate-900 dark:text-white font-black text-lg">{enrichedAppointments.length}</span> resultados
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Table - No Horizontal Scroll */}
      <div className="rounded-3xl border border-slate-200/40 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-32 gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-2xl animate-pulse" />
              <Loader2 className="h-12 w-12 animate-spin text-violet-600 relative z-10" />
            </div>
            <p className="text-base font-black text-slate-400 dark:text-slate-500 tracking-widest uppercase">Sincronizando agendamentos...</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/60 dark:bg-white/5 border-b border-slate-200/40 dark:border-white/5">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 py-5 text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Data & Horário</TableHead>
                <TableHead className="px-6 py-5 text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Cliente</TableHead>
                <TableHead className="px-6 py-5 text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Serviço</TableHead>
                <TableHead className="px-6 py-5 text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Profissional</TableHead>
                <TableHead className="px-6 py-5 text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Status</TableHead>
                <TableHead className="px-6 py-5 text-right text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Valor</TableHead>
                <TableHead className="px-6 py-5 text-center text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => (
                  <TableRow key={app.id} className="group hover:bg-slate-50/80 dark:hover:bg-white/5 border-b border-slate-100/40 dark:border-white/5 transition-all">
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                          <CalendarIcon size={14} className="text-violet-600" />
                          {app.date}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <Clock size={12} />
                          {app.time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                          {String(app.client || "").substring(0, 2).toUpperCase() || "CN"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white text-base block">{String(app.client || "")}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Cliente</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-950/20 border border-violet-100/50 dark:border-violet-900/50 rounded-lg w-fit">
                        <Scissors size={14} className="text-violet-600" />
                        <span className="text-sm font-bold text-violet-700 dark:text-violet-400">{app.service}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-lg w-fit">
                        <User size={12} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">{app.specialist}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <Badge variant="outline" className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter shadow-md border-2",
                        app.status === "confirmed" && "bg-blue-100/70 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-700/50",
                        app.status === "pending" && "bg-amber-100/70 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-700/50",
                        app.status === "completed" && "bg-emerald-100/70 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-700/50",
                        app.status === "cancelled" && "bg-purple-100/70 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-700/50",
                        app.status === "no_show" && "bg-red-100/70 text-red-800 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-700/50"
                      )}>
                        {app.status === "confirmed" ? "Confirmado" : 
                         app.status === "pending" ? "Pendente" : 
                         app.status === "completed" ? "Concluído" : 
                         app.status === "no_show" ? "Não Compareceu" : "Cancelado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xl font-black text-slate-900 dark:text-white">{app.price}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Valor</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/20 transition-all shadow-sm group-hover:bg-slate-50 dark:group-hover:bg-white/5" disabled={actionLoading === app.id}>
                              {actionLoading === app.id ? (
                                <Loader2 size={18} className="animate-spin text-violet-600" />
                              ) : (
                                <MoreHorizontal size={18} className="text-slate-400 group-hover:text-violet-600 transition-colors" />
                              )}
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-200/60 dark:border-white/5 shadow-2xl">
                          <DropdownMenuItem
                            className="p-3 cursor-pointer rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:text-violet-600 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                            disabled={app.status !== "pending"}
                            onClick={() => handleConfirmar(app.id)}
                          >
                            <CheckCircle2 size={16} className="mr-3" /> Confirmar Agendamento
                          </DropdownMenuItem>
                             
                          <DropdownMenuItem
                            className="p-3 cursor-pointer rounded-xl font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
                            disabled={app.status === "completed" || app.status === "cancelled"}
                            onClick={() => handleConcluir(app.id)}
                          >
                            <CheckCircle2 size={16} className="mr-3" /> Concluir Atendimento
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="p-3 cursor-pointer rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:text-violet-600 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                            disabled={app.status === "completed" || app.status === "cancelled"}
                            onClick={() => openRemarcar(app)}
                          >
                            <Clock size={16} className="mr-3" /> Remarcar / Editar
                          </DropdownMenuItem>
                             
                          <DropdownMenuItem
                            className="p-3 cursor-pointer rounded-xl font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all"
                            disabled={app.status === "completed" || app.status === "cancelled" || app.status === "no_show"}
                            onClick={() => handleFalta(app.id)}
                          >
                            <CalendarX2 size={16} className="mr-3" /> Marcar Falta
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="p-3 cursor-pointer rounded-xl font-black text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all"
                            onClick={() => handleCancelar(app.id)}
                            disabled={app.status === "cancelled"}
                          >
                            <CalendarX2 size={16} className="mr-3" /> Cancelar Agendamento
                          </DropdownMenuItem>
                             
                          <DropdownMenuItem
                            className="p-3 cursor-pointer rounded-xl font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                            onClick={() => handleExcluir(app.id)}
                          >
                            <Trash2 size={16} className="mr-3" /> Excluir Registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-24">
                    <EmptyState 
                      icon={CalendarX2}
                      title="Nenhum registro"
                      description="Não encontramos agendamentos com os filtros aplicados."
                      className="py-12"
                    />
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
