"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  Clock3,
  AlertCircle,
  CalendarDays,
  MoreVertical,
  CalendarX2,
  Trash2,
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
  Sparkles,
  Target,
  Lightbulb,
  Coffee,
  Award,
  BarChart3,
  Scissors
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { format, startOfDay, endOfDay, isSameDay, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { appointmentService, authService, clientService, salonService } from "@/services";
import { Appointment, Client, Service, AppointmentWithDetails } from "@/types";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, ensureDate } from "@/lib/utils";

import { toast } from "sonner";

export default function AgendaPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [clientUsers, setClientUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [appointmentsByDate, setAppointmentsByDate] = useState<Map<string, number>>(new Map());

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const start = startOfDay(date);
      const end = endOfDay(date);
      
      const [apps, clients, services] = await Promise.all([
        appointmentService.getByDateRange(start, end),
        clientService.getAll(),
        salonService.getAllWithInactive()
      ]);

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const monthApps = await appointmentService.getByDateRange(monthStart, monthEnd);
      
      const dateMap = new Map<string, number>();
      monthApps.forEach(app => {
        const aptDate = ensureDate(app.appointmentDate);
        if (isValid(aptDate)) {
          const dateKey = format(aptDate, 'yyyy-MM-dd');
          dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
        }
      });
      setAppointmentsByDate(dateMap);

      const unresolvedClientIds = apps
        .map((app) => app.clientId)
        .filter((clientId, index, array) => Boolean(clientId) && array.indexOf(clientId) === index)
        .filter((clientId) => !clients.some((client) => client.id === clientId));

      const resolvedClientUsers = unresolvedClientIds.length > 0
        ? await authService.getUsersByIds(unresolvedClientIds)
        : [];

      const enrichedApps = apps.map(app => {
        const aptDate = ensureDate(app.appointmentDate);
        return {
          ...app,
          appointmentDate: isValid(aptDate) ? aptDate : new Date(),
          client: clients.find(c => c.id === app.clientId),
          service: services.find(s => s.id === app.serviceId)
        };
      });

      setAppointments(enrichedApps);
      setClientUsers(resolvedClientUsers);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate && isValid(newDate)) {
      setDate(newDate);
    }
  };

  const nextDay = () => setDate(d => {
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return next;
  });
  
  const prevDay = () => setDate(d => {
    const prev = new Date(d);
    prev.setDate(prev.getDate() - 1);
    return prev;
  });

  const handleConfirmar = async (id: string) => {
    setActionLoading(id);
    try {
      await appointmentService.confirm(id);
      toast.success("Agendamento confirmado.");
      await fetchAppointments();
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
      await fetchAppointments();
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
      await fetchAppointments();
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
      await fetchAppointments();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao cancelar.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      {/* ROW 1: HERO GREETING + SUMMARY CONTROLS */}
      <div className="mb-6">
        <div className="rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-10 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-4xl font-black mb-3">
                {format(ensureDate(date), "'Olá, Tessy!' - EEEE", { locale: ptBR })}
              </h1>
              <p className="text-violet-100 text-xl font-semibold mb-4">
                {appointments.length === 0 
                  ? "Dia livre para organizar e planejar" 
                  : appointments.length === 1 
                    ? "1 agendamento hoje" 
                    : `${appointments.length} agendamentos hoje`}
              </p>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-violet-200" />
                  <div>
                    <span className="text-2xl font-bold">
                      R$ {appointments.reduce((acc, curr) => acc + (curr.service?.price || 0), 0).toFixed(0)}
                    </span>
                    <span className="text-violet-200 text-sm ml-2">receita prevista</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-6 w-6 text-violet-200" />
                  <div>
                    <span className="text-2xl font-bold">
                      {appointments.filter(a => a.status === "confirmed").length}
                    </span>
                    <span className="text-violet-200 text-sm ml-2">confirmados</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger
                  render={
                    <Button className="h-16 px-10 bg-white text-violet-600 hover:bg-violet-50 font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-1">
                      <Plus size={28} className="mr-4" />
                      Novo Agendamento
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Novo Agendamento</DialogTitle>
                  </DialogHeader>
                  <AppointmentForm 
                    onSuccess={() => {
                      setIsDialogOpen(false);
                      setEditingAppointment(null);
                      fetchAppointments();
                    }} 
                    initialDate={date}
                    appointment={editingAppointment}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: 4 STRONG KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-2xl border-slate-200/40 bg-white/95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
          <CardContent className="p-10">
            <div className="flex items-center justify-between mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl">
                <DollarSign className="h-10 w-10 text-white" />
              </div>
              <div className="text-emerald-600 text-lg font-bold uppercase tracking-wider">
                +12.5%
              </div>
            </div>
            <div>
              <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Receita do Mês</p>
              <p className="text-5xl font-black text-slate-900 tabular-nums">
                R$ {(appointments.reduce((acc, curr) => acc + (curr.service?.price || 0), 0) * 30).toLocaleString('pt-BR')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-slate-200/40 bg-white/95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
          <CardContent className="p-10">
            <div className="flex items-center justify-between mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-xl">
                <CalendarDays className="h-10 w-10 text-white" />
              </div>
              <div className="text-violet-600 text-lg font-bold uppercase tracking-wider">
                Hoje
              </div>
            </div>
            <div>
              <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Agendamentos</p>
              <p className="text-5xl font-black text-slate-900 tabular-nums">
                {appointments.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-slate-200/40 bg-white/95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
          <CardContent className="p-10">
            <div className="flex items-center justify-between mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-xl">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <div className="text-amber-600 text-lg font-bold uppercase tracking-wider">
                Pendentes
              </div>
            </div>
            <div>
              <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">A Confirmar</p>
              <p className="text-5xl font-black text-slate-900 tabular-nums">
                {appointments.filter(a => a.status === "pending").length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-2xl border-slate-200/40 bg-white/95 backdrop-blur-md overflow-hidden group hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
          <CardContent className="p-10">
            <div className="flex items-center justify-between mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-xl">
                <Users className="h-10 w-10 text-white" />
              </div>
              <div className="text-blue-600 text-lg font-bold uppercase tracking-wider">
                +8
              </div>
            </div>
            <div>
              <p className="text-slate-600 text-base font-semibold uppercase tracking-wider mb-3">Clientes Atendidos</p>
              <p className="text-5xl font-black text-slate-900 tabular-nums">
                {appointments.filter(a => a.status === "completed").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROW 3: MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        {/* LEFT (LARGER): UPCOMING APPOINTMENT AS MAIN FOCUS */}
        <div className="xl:col-span-2">
          <Card className="shadow-2xl border-slate-200/40 bg-white/95 backdrop-blur-md min-h-[700px]">
            <CardHeader className="pb-8 bg-gradient-to-r from-slate-50 to-violet-50 border-b border-slate-200/40">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl font-black text-slate-900 mb-3">
                    Próximos Atendimentos
                  </CardTitle>
                  <CardDescription className="text-xl font-semibold text-slate-600">
                    {format(ensureDate(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={prevDay} className="h-14 w-14 rounded-2xl border-slate-200 text-slate-600 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all shadow-md">
                    <ChevronLeft size={24} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextDay} className="h-14 w-14 rounded-2xl border-slate-200 text-slate-600 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-all shadow-md">
                    <ChevronRight size={24} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-10 space-y-8">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-8 items-center">
                      <Skeleton className="h-24 w-24 rounded-2xl" />
                      <div className="space-y-6 flex-1">
                        <Skeleton className="h-10 w-[300px]" />
                        <Skeleton className="h-8 w-[250px]" />
                      </div>
                      <Skeleton className="h-16 w-40 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 px-12 text-center">
                  <div className="relative mb-12">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="relative flex items-center justify-center w-40 h-40 rounded-3xl bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 border-2 border-violet-200/60 shadow-2xl shadow-violet-500/10">
                      <Coffee size={72} className="text-violet-600" strokeWidth={1.5} />
                    </div>
                  </div>
                  <h3 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">
                    Dia Livre!
                  </h3>
                  <p className="text-2xl font-bold text-slate-400 max-w-lg mb-12 leading-relaxed">
                    Aproveite para organizar seu espaço ou descansar
                  </p>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger
                      render={
                        <Button 
                          onClick={() => setIsDialogOpen(true)}
                          className="h-20 px-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-black uppercase tracking-wider shadow-2xl shadow-violet-500/20 transition-all hover:-translate-y-2 active:scale-95 text-2xl"
                        >
                          <Plus size={32} className="mr-6" />
                          Agendar Cliente
                        </Button>
                      }
                    />
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Novo Agendamento</DialogTitle>
                      </DialogHeader>
                      <AppointmentForm 
                        onSuccess={() => {
                          setIsDialogOpen(false);
                          setEditingAppointment(null);
                          fetchAppointments();
                        }} 
                        initialDate={date}
                        appointment={editingAppointment}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="divide-y divide-slate-100/60">
                  {appointments
                    .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime())
                    .map((app, index) => (
                      <div 
                        key={app.id} 
                        className={cn(
                          "group flex items-center gap-8 p-8 hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-violet-50/40 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-violet-500",
                          index === 0 && "border-t-0"
                        )}
                      >
                        <div 
                          className="flex flex-col items-center justify-center min-w-[120px] py-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-200/60 group-hover:border-violet-300/60 group-hover:from-violet-50/80 group-hover:to-purple-50/80 transition-all shadow-md group-hover:shadow-xl"
                          onClick={() => {
                            setEditingAppointment(app);
                            setIsDialogOpen(true);
                          }}
                        >
                          <span className="text-2xl font-black text-slate-900 group-hover:text-violet-600 transition-colors">
                            {(() => {
                              const aptDate = ensureDate(app.appointmentDate);
                              if (!isValid(aptDate)) {
                                return '09:00';
                              }
                              const timeStr = format(aptDate, "HH:mm");
                              return (timeStr === '00:00' && aptDate.getHours() === 0) ? '09:00' : timeStr;
                            })()}
                          </span>
                          <div className="w-full h-px bg-slate-300 my-3" />
                          <span className="text-sm font-bold text-slate-500 uppercase">
                            {app.service?.durationMinutes}min
                          </span>
                        </div>
                        
                        <div 
                          className="flex-1 min-w-0"
                          onClick={() => {
                            setEditingAppointment(app);
                            setIsDialogOpen(true);
                          }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-2xl font-black text-slate-900 truncate group-hover:text-violet-600 transition-colors pr-6">
                              {app.client?.name || clientUsers.find((user) => user.uid === app.clientId)?.name || "Cliente não encontrada"}
                            </h4>
                            <Badge variant={
                              app.status === "completed" ? "secondary" : 
                              app.status === "confirmed" ? "default" : 
                              app.status === "cancelled" ? "destructive" : "outline"
                            } className={cn(
                              "capitalize font-black text-base h-10 px-6 rounded-full",
                              app.status === "confirmed" && "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200",
                              app.status === "pending" && "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200",
                              app.status === "completed" && "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200",
                              app.status === "cancelled" && "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200",
                              app.status === "no_show" && "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200"
                            )}>
                              {app.status === "confirmed" ? "Confirmado" : 
                               app.status === "pending" ? "Pendente" : 
                               app.status === "completed" ? "Concluído" : 
                               app.status === "no_show" ? "Não Compareceu" : "Cancelado"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="px-6 py-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-100/50 dark:border-violet-900/50 rounded-xl">
                              <Scissors className="h-5 w-5 text-violet-600 mr-3" />
                              <span className="text-base font-bold text-violet-700 dark:text-violet-400">{app.service?.name || "Serviço não encontrado"} - R${app.service?.price || 0}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="text-3xl font-black text-slate-900">
                            R$ {(app.service?.price || 0).toFixed(2)}
                          </span>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all shadow-md group-hover:bg-slate-50 dark:group-hover:bg-white/5">
                                <MoreVertical size={20} className="text-slate-400 group-hover:text-violet-600 transition-colors" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-64 p-3 rounded-2xl border-slate-200 shadow-2xl">
                            <DropdownMenuItem
                              className="p-4 cursor-pointer rounded-xl font-bold text-slate-600 hover:text-violet-600 hover:bg-violet-50 transition-all"
                              disabled={app.status !== "pending"}
                              onClick={() => handleConfirmar(app.id!)}
                            >
                              <CheckCircle2 size={18} className="mr-4" /> Confirmar
                            </DropdownMenuItem>
                              
                            <DropdownMenuItem
                              className="p-4 cursor-pointer rounded-xl font-bold text-emerald-600 hover:bg-emerald-50 transition-all"
                              disabled={app.status === "completed" || app.status === "cancelled"}
                              onClick={() => handleConcluir(app.id!)}
                            >
                              <CheckCircle2 size={18} className="mr-4" /> Concluir
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="p-4 cursor-pointer rounded-xl font-bold text-slate-600 hover:text-violet-600 hover:bg-violet-50 transition-all"
                              disabled={app.status === "completed" || app.status === "cancelled"}
                              onClick={() => {
                                setEditingAppointment(app);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Clock size={18} className="mr-4" /> Editar
                            </DropdownMenuItem>
                              
                            <DropdownMenuItem
                              className="p-4 cursor-pointer rounded-xl font-bold text-amber-600 hover:bg-amber-50 transition-all"
                              disabled={app.status === "completed" || app.status === "cancelled" || app.status === "no_show"}
                              onClick={() => handleFalta(app.id!)}
                            >
                              <CalendarX2 size={18} className="mr-4" /> Marcar Falta
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="p-4 cursor-pointer rounded-xl font-black text-purple-600 hover:bg-purple-50 transition-all"
                              onClick={() => handleCancelar(app.id!)}
                              disabled={app.status === "cancelled"}
                            >
                              <CalendarX2 size={18} className="mr-4" /> Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Floating Action Button for Mobile */}
          <div className="xl:hidden fixed bottom-8 right-8 z-50">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger
                render={
                  <Button className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-2xl shadow-violet-500/30 transition-all hover:scale-110 group">
                    <Plus size={28} className="text-white group-hover:rotate-90 transition-transform duration-300" />
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Novo Agendamento</DialogTitle>
                </DialogHeader>
                <AppointmentForm 
                  onSuccess={() => {
                    setIsDialogOpen(false);
                    setEditingAppointment(null);
                    fetchAppointments();
                  }} 
                  initialDate={date}
                  appointment={editingAppointment}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* RIGHT (STACKED): FINANCIAL CHART + PERFORMANCE + GOAL */}
        <div className="space-y-8">
          {/* Financial Chart Card */}
          <Card className="shadow-2xl border-slate-200/40 bg-white/95 backdrop-blur-md">
            <CardHeader className="pb-6 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100/40">
              <CardTitle className="text-xl font-bold flex items-center gap-3 text-emerald-900">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
                  <BarChart3 size={20} className="text-white" />
                </div>
                Desempenho Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-slate-600 text-sm font-semibold uppercase tracking-wider mb-2">Hoje</p>
                    <p className="text-3xl font-black text-emerald-600">
                      R$ {appointments.reduce((acc, curr) => acc + (curr.service?.price || 0), 0).toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm font-semibold uppercase tracking-wider mb-2">Mês</p>
                    <p className="text-3xl font-black text-emerald-600">
                      R$ {(appointments.reduce((acc, curr) => acc + (curr.service?.price || 0), 0) * 30).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="h-32 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200/60 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                    <p className="text-emerald-700 font-semibold">Gráfico de Receita</p>
                    <p className="text-emerald-600 text-sm">Visualização em desenvolvimento</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Card */}
          <Card className="shadow-2xl border-slate-200/40 bg-white/95 backdrop-blur-md">
            <CardHeader className="pb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100/40">
              <CardTitle className="text-xl font-bold flex items-center gap-3 text-blue-900">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                  <Award size={20} className="text-white" />
                </div>
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-2xl font-black text-slate-900">
                      {appointments.filter(a => a.status === "completed").length}
                    </p>
                    <p className="text-slate-600 text-sm font-semibold">Atendidos</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <Clock className="h-8 w-8 text-amber-600" />
                    </div>
                    <p className="text-2xl font-black text-slate-900">
                      {appointments.filter(a => a.status === "pending").length}
                    </p>
                    <p className="text-slate-600 text-sm font-semibold">Pendentes</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-semibold">Taxa de Confirmação</span>
                    <span className="text-xl font-bold text-blue-600">
                      {appointments.length > 0 
                        ? Math.round((appointments.filter(a => a.status === "confirmed").length / appointments.length) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goal Card */}
          <Card className="shadow-2xl border-slate-200/40 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <CardContent className="p-10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold">Meta do Mês</h3>
                <Target className="h-10 w-10 text-violet-400" />
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-300 text-base font-semibold">Progresso</span>
                    <span className="text-3xl font-bold">68%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-6">
                    <div className="bg-gradient-to-br from-violet-500 to-purple-600 h-6 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-lg">R$ 8.500</span>
                    <span className="text-2xl font-bold text-white">R$ 12.500</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <AppointmentForm 
            onSuccess={() => {
              setIsDialogOpen(false);
              setEditingAppointment(null);
              fetchAppointments();
            }} 
            initialDate={date}
            appointment={editingAppointment}
          />
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
