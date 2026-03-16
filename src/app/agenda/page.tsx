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
  Loader2
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
import { format, startOfDay, endOfDay, isSameDay } from "date-fns";
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

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const start = startOfDay(date);
      const end = endOfDay(date);
      
      const [apps, clients, services] = await Promise.all([
        appointmentService.getByDateRange(start, end),
        clientService.getAll(),
        salonService.getAllWithInactive() // Buscar todos para garantir que agendamentos antigos mostrem o nome
      ]);

      const unresolvedClientIds = apps
        .map((app) => app.clientId)
        .filter((clientId, index, array) => Boolean(clientId) && array.indexOf(clientId) === index)
        .filter((clientId) => !clients.some((client) => client.id === clientId));

      const resolvedClientUsers = unresolvedClientIds.length > 0
        ? await authService.getUsersByIds(unresolvedClientIds)
        : [];

      const enrichedApps = apps.map(app => ({
        ...app,
        client: clients.find(c => c.id === app.clientId),
        service: services.find(s => s.id === app.serviceId)
      }));

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
    if (newDate) setDate(newDate);
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
      <PageHeader 
        title="Agenda Inteligente" 
        description="Gerencie seus horários e agendamentos de forma eficiente."
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2 bg-linear-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
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
                setIsDialogOpen(false);
                setEditingAppointment(null);
                fetchAppointments();
              }} 
              initialDate={date}
              appointment={editingAppointment}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Calendário e Resumo */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-sm border-slate-200/60 overflow-hidden">
            <CardHeader className="pb-3 bg-slate-50/50 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                <CalendarIcon size={16} className="text-violet-500" />
                Calendário
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                className="rounded-md border-none mx-auto p-0"
                locale={ptBR}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-violet-100 bg-violet-50/30 overflow-hidden">
            <CardHeader className="pb-3 border-b border-violet-100/50">
              <CardTitle className="text-sm font-semibold text-violet-900">Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-white/50 border border-white">
                <span className="text-slate-600 flex items-center gap-2">
                  <Clock3 size={14} className="text-slate-400" /> Total de horas
                </span>
                <span className="font-bold text-slate-900">
                  {appointments.reduce((acc, curr) => acc + (curr.service?.durationMinutes || 0), 0) / 60}h
                </span>
              </div>
              <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/50">
                <span className="text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Concluídos
                </span>
                <span className="font-bold text-emerald-600">
                  {appointments.filter(a => a.status === "completed").length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-amber-50/50 border border-amber-100/50">
                <span className="text-amber-700 flex items-center gap-2">
                  <AlertCircle size={14} /> Pendentes
                </span>
                <span className="font-bold text-amber-600">
                  {appointments.filter(a => a.status === "pending" || a.status === "confirmed").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Lista de Agendamentos */}
        <Card className="lg:col-span-8 shadow-sm border-slate-200/60 min-h-[600px] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4 bg-slate-50/30">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900 capitalize">
                {format(ensureDate(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </CardTitle>
              <CardDescription className="text-slate-500">
                {appointments.length === 0 
                  ? "Nenhum compromisso agendado para esta data." 
                  : `${appointments.length} ${appointments.length === 1 ? 'compromisso encontrado' : 'compromissos agendados'}.`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={prevDay} className="h-9 w-9 border-slate-200 text-slate-600 hover:text-violet-600 hover:border-violet-200 transition-colors">
                <ChevronLeft size={18} />
              </Button>
              <Button variant="outline" size="icon" onClick={nextDay} className="h-9 w-9 border-slate-200 text-slate-600 hover:text-violet-600 hover:border-violet-200 transition-colors">
                <ChevronRight size={18} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex gap-4 items-center">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-[180px]" />
                      <Skeleton className="h-4 w-[120px]" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <EmptyState 
                icon={CalendarDays}
                title="Dia livre por enquanto!"
                description="Não há agendamentos para esta data. Que tal aproveitar para organizar seu espaço?"
                actionLabel="Novo Agendamento"
                onAction={() => setIsDialogOpen(true)}
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments
                  .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime())
                  .map((app) => (
                    <div 
                      key={app.id} 
                      className="group flex items-center gap-4 p-5 hover:bg-slate-50/80 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-violet-500"
                    >
                      <div 
                        className="flex flex-col items-center justify-center min-w-[70px] py-2 bg-slate-50 rounded-xl border border-slate-100 group-hover:border-violet-100 group-hover:bg-violet-50/50 transition-all"
                        onClick={() => {
                          setEditingAppointment(app);
                          setIsDialogOpen(true);
                        }}
                      >
                        <span className="text-sm font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                          {format(ensureDate(app.appointmentDate), "HH:mm")}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {app.service?.durationMinutes} min
                        </span>
                      </div>
                      
                      <div 
                        className="flex-1 min-w-0"
                        onClick={() => {
                          setEditingAppointment(app);
                          setIsDialogOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-bold text-slate-900 truncate group-hover:text-violet-600 transition-colors pr-2">
                            {app.client?.name || clientUsers.find((user) => user.uid === app.clientId)?.name || "Cliente não encontrada"}
                          </h4>
                          <Badge variant={
                            app.status === "completed" ? "secondary" : 
                            app.status === "confirmed" ? "default" : 
                            app.status === "cancelled" ? "destructive" : "outline"
                          } className={cn(
                            "capitalize font-semibold text-[11px] h-6 px-2.5",
                            app.status === "confirmed" && "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100",
                            app.status === "pending" && "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100",
                            app.status === "completed" && "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100",
                            app.status === "cancelled" && "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-100",
                            app.status === "no_show" && "bg-red-50 text-red-700 hover:bg-red-100 border-red-100"
                          )}>
                            {app.status === "confirmed" ? "Confirmado" : 
                             app.status === "pending" ? "Pendente" : 
                             app.status === "completed" ? "Concluído" : 
                             app.status === "no_show" ? "Não Compareceu" : "Cancelado"}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100/50">
                            {app.service?.name}
                          </span>
                          <span className="text-slate-300 text-xs">•</span>
                          <span className="text-xs font-bold text-slate-700">R$ {app.service?.price}</span>
                          {app.notes && (
                            <>
                              <span className="text-slate-300 text-xs">•</span>
                              <p className="text-xs text-slate-400 italic truncate max-w-[200px]">
                                "{app.notes}"
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all shadow-sm group-hover:bg-white" disabled={actionLoading === app.id}>
                                {actionLoading === app.id ? (
                                  <Loader2 size={18} className="animate-spin text-violet-600" />
                                ) : (
                                  <MoreVertical size={18} className="text-slate-400 group-hover:text-violet-600 transition-colors" />
                                )}
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-200 shadow-2xl">
                            <DropdownMenuItem
                              className="p-3 cursor-pointer rounded-xl font-bold text-slate-600 hover:text-violet-600 transition-all"
                              disabled={app.status !== "pending"}
                              onClick={() => handleConfirmar(app.id!)}
                            >
                              <CheckCircle2 size={16} className="mr-2" /> Confirmar
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              className="p-3 cursor-pointer rounded-xl font-bold text-emerald-600 hover:bg-emerald-50 transition-all"
                              disabled={app.status === "completed" || app.status === "cancelled"}
                              onClick={() => handleConcluir(app.id!)}
                            >
                              <CheckCircle2 size={16} className="mr-2" /> Concluir
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="p-3 cursor-pointer rounded-xl font-bold text-slate-600 hover:text-violet-600 transition-all"
                              disabled={app.status === "completed" || app.status === "cancelled"}
                              onClick={() => {
                                setEditingAppointment(app);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Clock size={16} className="mr-2" /> Editar
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                              className="p-3 cursor-pointer rounded-xl font-bold text-amber-600 hover:bg-amber-50 transition-all"
                              disabled={app.status === "completed" || app.status === "cancelled" || app.status === "no_show"}
                              onClick={() => handleFalta(app.id!)}
                            >
                              <CalendarX2 size={16} className="mr-2" /> Marcar Falta
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              className="p-3 cursor-pointer rounded-xl font-black text-purple-600 hover:bg-purple-50 transition-all"
                              onClick={() => handleCancelar(app.id!)}
                              disabled={app.status === "cancelled"}
                            >
                              <CalendarX2 size={16} className="mr-2" /> Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
