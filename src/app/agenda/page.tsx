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
  AlertCircle
} from "lucide-react";
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
import { appointmentService, clientService, salonService } from "@/services";
import { Appointment, Client, Service, AppointmentWithDetails } from "@/types";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AgendaPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const start = startOfDay(date);
      const end = endOfDay(date);
      
      const [apps, clients, services] = await Promise.all([
        appointmentService.getByDateRange(start, end),
        clientService.getAll(),
        salonService.getAll()
      ]);

      const enrichedApps = apps.map(app => ({
        ...app,
        client: clients.find(c => c.id === app.clientId),
        service: services.find(s => s.id === app.serviceId)
      }));

      setAppointments(enrichedApps);
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

  const nextDay = () => setDate(d => new Date(d.setDate(d.getDate() + 1)));
  const prevDay = () => setDate(d => new Date(d.setDate(d.getDate() - 1)));

  return (
    <AdminLayout>
      <PageHeader 
        title="Agenda Inteligente" 
        description="Gerencie seus horários e agendamentos de forma eficiente."
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button size="lg" className="gap-2 shadow-md hover:shadow-lg transition-shadow font-medium">
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
                setIsDialogOpen(false);
                fetchAppointments();
              }} 
              initialDate={date}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lado Esquerdo: Calendário e Resumo */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-md border border-border/80 bg-card rounded-xl overflow-hidden">
            <CardHeader className="pb-4 pt-5 px-5">
              <CardTitle className="text-base font-semibold flex items-center gap-2.5 text-foreground">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarIcon size={18} />
                </div>
                Calendário
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                className="rounded-lg border border-border/60 mx-auto p-0 bg-muted/30"
                locale={ptBR}
              />
            </CardContent>
          </Card>

          <Card className="shadow-md border border-border/80 bg-gradient-to-b from-primary/10 to-primary/5 rounded-xl overflow-hidden">
            <CardHeader className="pb-4 pt-5 px-5">
              <CardTitle className="text-base font-semibold text-foreground">Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-5 pb-5">
              <div className="flex items-center justify-between rounded-lg bg-background/60 px-4 py-3 border border-border/40">
                <span className="text-muted-foreground flex items-center gap-2.5 text-sm">
                  <Clock3 size={18} className="text-primary/80" /> Total de horas
                </span>
                <span className="font-bold text-foreground tabular-nums">
                  {appointments.reduce((acc, curr) => acc + (curr.service?.durationMinutes || 0), 0) / 60}h
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background/60 px-4 py-3 border border-border/40">
                <span className="text-muted-foreground flex items-center gap-2.5 text-sm">
                  <CheckCircle2 size={18} className="text-emerald-500" /> Concluídos
                </span>
                <span className="font-bold text-emerald-600 tabular-nums">
                  {appointments.filter(a => a.status === "completed").length}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background/60 px-4 py-3 border border-border/40">
                <span className="text-muted-foreground flex items-center gap-2.5 text-sm">
                  <AlertCircle size={18} className="text-amber-500" /> Pendentes
                </span>
                <span className="font-bold text-amber-600 tabular-nums">
                  {appointments.filter(a => a.status === "pending" || a.status === "confirmed").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Lista de Agendamentos */}
        <Card className="lg:col-span-8 shadow-md border border-border/80 min-h-[600px] rounded-xl overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 bg-muted/20 px-6 py-5">
            <div>
              <CardTitle className="text-xl font-semibold capitalize text-foreground">
                {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {appointments.length === 0 
                  ? "Nenhum agendamento para hoje." 
                  : `${appointments.length} agendamentos programados.`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={prevDay}><ChevronLeft size={18} /></Button>
              <Button variant="outline" size="icon" onClick={nextDay}><ChevronRight size={18} /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 items-center">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 min-h-[380px] px-6 py-12 bg-muted/30 rounded-b-xl">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary/70 mb-4">
                  <CalendarIcon size={44} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum agendamento neste dia</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                  Selecione outra data ou crie um novo agendamento para começar.
                </p>
                <Button onClick={() => setIsDialogOpen(true)} size="lg" className="gap-2 shadow-md font-medium">
                  <Plus size={20} /> Criar primeiro agendamento
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {appointments
                  .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime())
                  .map((app) => (
                    <div 
                      key={app.id} 
                      className="group flex items-start gap-5 px-6 py-5 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex flex-col items-center justify-center min-w-[72px] py-2.5 bg-muted/50 rounded-xl border border-border/50 group-hover:border-primary/40 group-hover:bg-primary/5 transition-colors">
                        <span className="text-sm font-bold text-primary tabular-nums">
                          {format(new Date(app.appointmentDate), "HH:mm")}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide mt-0.5">
                          {app.service?.durationMinutes} min
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="font-semibold text-foreground truncate">
                            {app.client?.name || "Cliente não encontrada"}
                          </h4>
                          <Badge variant={
                            app.status === "completed" ? "secondary" : 
                            app.status === "confirmed" ? "default" : 
                            app.status === "cancelled" ? "destructive" : "outline"
                          } className="ml-2 capitalize shrink-0">
                            {app.status === "confirmed" ? "Confirmado" : 
                             app.status === "pending" ? "Pendente" : 
                             app.status === "completed" ? "Concluído" : "Cancelado"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2 flex-wrap">
                          <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs font-medium">
                            {app.service?.name}
                          </span>
                          <span className="text-border">•</span>
                          <span className="font-medium text-foreground">R$ {app.service?.price}</span>
                        </p>
                        {app.notes && (
                          <p className="text-xs text-muted-foreground italic line-clamp-1">
                            "{app.notes}"
                          </p>
                        )}
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
