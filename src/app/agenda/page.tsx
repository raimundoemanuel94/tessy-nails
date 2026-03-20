"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { PageShell } from "@/components/shared/PageShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageHero } from "@/components/shared/PageHero";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionCard } from "@/components/shared/SectionCard";
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
    <PageShell>
      <div className="space-y-8 pb-20">
        <PageHeader 
          title="Agenda" 
          description="Gerencie seus compromissos e organize seu dia de trabalho."
          icon={CalendarDays}
        />

        <PageHero 
          title={format(ensureDate(date), "'Olá, Tessy!' - EEEE", { locale: ptBR })}
          subtitle={appointments.length === 0 
            ? "Dia livre para organizar e planejar" 
            : appointments.length === 1 
              ? "1 agendamento hoje" 
              : `${appointments.length} agendamentos hoje`}
          actions={
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger
                render={
                  <Button className="h-16 px-10 bg-white text-brand-primary hover:bg-brand-primary/5 font-black text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all hover:-translate-y-1">
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
          }
        />

        {/* ROW 2: 4 STRONG KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Receita do Mês"
            value={`R$ ${(appointments.reduce((acc, curr) => acc + (curr.service?.price || 0), 0) * 30).toLocaleString('pt-BR')}`}
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
            variant="green"
          />

          <MetricCard
            title="Agendamentos"
            value={appointments.length}
            icon={CalendarDays}
            variant="purple"
          />

          <MetricCard
            title="A Confirmar"
            value={appointments.filter(a => a.status === "pending").length}
            icon={Clock}
            variant="orange"
          />

          <MetricCard
            title="Clientes Atendidos"
            value={appointments.filter(a => a.status === "completed").length}
            icon={Users}
            variant="blue"
          />
        </div>

        {/* ROW 3: MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* LEFT (LARGER): UPCOMING APPOINTMENT AS MAIN FOCUS */}
          <div className="xl:col-span-2">
            <SectionCard
              title="Próximos Atendimentos"
              description={format(ensureDate(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
              actions={
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prevDay} className="h-10 w-10 rounded-xl border-slate-200">
                    <ChevronLeft size={18} />
                  </Button>
                  <Button variant="outline" size="icon" onClick={nextDay} className="h-10 w-10 rounded-xl border-slate-200">
                    <ChevronRight size={18} />
                  </Button>
                </div>
              }
            >
              <div className="p-0">
                {loading ? (
                  <div className="p-6 space-y-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-6 items-center">
                        <Skeleton className="h-16 w-16 rounded-xl" />
                        <div className="space-y-3 flex-1">
                          <Skeleton className="h-6 w-[200px]" />
                          <Skeleton className="h-4 w-[150px]" />
                        </div>
                        <Skeleton className="h-10 w-24 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-linear-to-r from-violet-500/10 to-purple-500/10 rounded-full blur-2xl animate-pulse" />
                      <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 shadow-xl">
                        <Coffee size={40} className="text-brand-primary" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                      Dia Livre!
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8">
                      Aproveite para organizar seu espaço ou descansar um pouco.
                    </p>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger
                        render={
                          <Button 
                            onClick={() => setIsDialogOpen(true)}
                            className="h-14 px-8 rounded-xl bg-brand-primary hover:opacity-90 text-white font-bold shadow-lg shadow-brand-primary/20"
                          >
                            <Plus size={20} className="mr-2" />
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
                  <div className="divide-y divide-slate-100/50 dark:divide-white/5">
                    {appointments
                      .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime())
                      .map((app, index) => (
                        <div 
                          key={app.id} 
                          className="group flex items-center gap-6 p-6 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all cursor-pointer"
                        >
                          <div 
                            className="flex flex-col items-center justify-center min-w-[80px] py-4 bg-slate-100/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 group-hover:border-brand-primary/30 dark:group-hover:border-brand-primary/20 transition-all shadow-sm"
                            onClick={() => {
                              setEditingAppointment(app);
                              setIsDialogOpen(true);
                            }}
                          >
                            <span className="text-lg font-black text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">
                              {(() => {
                                const aptDate = ensureDate(app.appointmentDate);
                                if (!isValid(aptDate)) return '09:00';
                                const timeStr = format(aptDate, "HH:mm");
                                return (timeStr === '00:00' && aptDate.getHours() === 0) ? '09:00' : timeStr;
                              })()}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                              {app.service?.durationMinutes}m
                            </span>
                          </div>
                          
                          <div 
                            className="flex-1 min-w-0"
                            onClick={() => {
                              setEditingAppointment(app);
                              setIsDialogOpen(true);
                            }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-lg font-black text-slate-900 dark:text-white truncate group-hover:text-brand-primary transition-colors pr-2">
                                {app.client?.name || clientUsers.find((user) => user.uid === app.clientId)?.name || "Cliente não encontrada"}
                              </h4>
                              <Badge variant={
                                app.status === "completed" ? "secondary" : 
                                app.status === "confirmed" ? "default" : 
                                app.status === "cancelled" ? "destructive" : "outline"
                              } className={cn(
                                "capitalize font-black text-[10px] px-3 h-6 rounded-lg",
                                app.status === "confirmed" && "bg-brand-secondary/10 text-brand-secondary dark:bg-brand-secondary/20 dark:text-brand-accent border-0",
                                app.status === "pending" && "bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning/80 border-0",
                                app.status === "completed" && "bg-success/10 text-success dark:bg-success/20 dark:text-success/80 border-0",
                                app.status === "cancelled" && "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20 dark:text-brand-accent border-0",
                                app.status === "no_show" && "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive/80 border-0"
                              )}>
                                {app.status === "confirmed" ? "Confirmado" : 
                                 app.status === "pending" ? "Pendente" : 
                                 app.status === "completed" ? "Concluído" : 
                                 app.status === "no_show" ? "Não Compareceu" : "Cancelado"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-500 truncate">{app.service?.name || "Serviço"}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-sm font-black text-slate-900 dark:text-white">R$ {app.service?.price || 0}</span>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                                  <MoreVertical size={18} className="text-slate-400" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-200 shadow-xl">
                              <DropdownMenuItem
                                className="p-3 cursor-pointer rounded-xl font-bold text-slate-600 hover:text-brand-primary hover:bg-brand-primary/5 transition-all"
                                disabled={app.status !== "pending"}
                                onClick={() => handleConfirmar(app.id!)}
                              >
                                <CheckCircle2 size={16} className="mr-3" /> Confirmar
                              </DropdownMenuItem>
                                
                              <DropdownMenuItem
                                className="p-3 cursor-pointer rounded-xl font-bold text-success hover:bg-success/5 transition-all"
                                disabled={app.status === "completed" || app.status === "cancelled"}
                                onClick={() => handleConcluir(app.id!)}
                              >
                                <CheckCircle2 size={16} className="mr-3" /> Concluir
                              </DropdownMenuItem>
  
                              <DropdownMenuItem
                                className="p-3 cursor-pointer rounded-xl font-bold text-slate-600 hover:text-brand-primary hover:bg-brand-primary/5 transition-all"
                                disabled={app.status === "completed" || app.status === "cancelled"}
                                onClick={() => {
                                  setEditingAppointment(app);
                                  setIsDialogOpen(true);
                                }}
                              >
                                <Clock size={16} className="mr-3" /> Editar
                              </DropdownMenuItem>
                                
                              <DropdownMenuItem
                                className="p-3 cursor-pointer rounded-xl font-bold text-warning hover:bg-warning/5 transition-all"
                                disabled={app.status === "completed" || app.status === "cancelled" || app.status === "no_show"}
                                onClick={() => handleFalta(app.id!)}
                              >
                                <CalendarX2 size={16} className="mr-3" /> Marcar Falta
                              </DropdownMenuItem>
  
                              <DropdownMenuItem
                                className="p-3 cursor-pointer rounded-xl font-black text-brand-primary hover:bg-brand-primary/5 transition-all"
                                onClick={() => handleCancelar(app.id!)}
                                disabled={app.status === "cancelled"}
                              >
                                <CalendarX2 size={16} className="mr-3" /> Cancelar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
  
          {/* RIGHT (STACKED): FINANCIAL CHART + PERFORMANCE + GOAL */}
          <div className="space-y-8">
            <SectionCard
              title="Desempenho Financeiro"
              icon={BarChart3}
              className="border-success/20 bg-linear-to-r from-success/5 to-transparent"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Hoje</p>
                    <p className="text-2xl font-black text-success">
                      R$ {appointments.reduce((acc, curr) => acc + (curr.service?.price || 0), 0).toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Mês</p>
                    <p className="text-2xl font-black text-success">
                      R$ {(appointments.reduce((acc, curr) => acc + (curr.service?.price || 0), 0) * 30).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="h-24 bg-linear-to-r from-success/5 to-transparent rounded-2xl border border-success/20 flex flex-col items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-success/60 mb-1" />
                  <p className="text-success dark:text-success/80 text-[10px] font-black uppercase tracking-wider">Crescendo 12%</p>
                </div>
              </div>
            </SectionCard>
  
            <SectionCard
              title="Performance"
              icon={Award}
              className="border-brand-accent/20 bg-linear-to-r from-brand-accent/5 to-transparent"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-2xl bg-brand-accent/10 dark:bg-brand-accent/20">
                    <p className="text-2xl font-black text-brand-secondary">
                      {appointments.filter(a => a.status === "completed").length}
                    </p>
                    <p className="text-slate-500 text-[10px] font-black uppercase">Atendidos</p>
                  </div>
                  <div className="text-center p-3 rounded-2xl bg-warning/10 dark:bg-warning/20">
                    <p className="text-2xl font-black text-warning">
                      {appointments.filter(a => a.status === "pending").length}
                    </p>
                    <p className="text-slate-500 text-[10px] font-black uppercase">Pendentes</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Taxa de Confirmação</span>
                    <span className="text-lg font-black text-brand-secondary">
                      {appointments.length > 0 
                        ? Math.round((appointments.filter(a => a.status === "confirmed").length / appointments.length) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>
  
            <div className="rounded-[2rem] bg-slate-900 p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-brand-primary/20" />
              <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black uppercase tracking-[2px] text-slate-400">Meta do Mês</h3>
                  <Target size={24} className="text-brand-primary" />
                </div>
                <div>
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-4xl font-black tracking-tighter">68%</span>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">R$ 12.500</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                    <div className="bg-linear-to-r from-brand-primary to-brand-secondary h-full rounded-full transition-all duration-1000" style={{ width: '68%' }}></div>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Faltam R$ 3.800 para bater a meta</p>
              </div>
            </div>
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
      </div>
    </PageShell>
  );
}
