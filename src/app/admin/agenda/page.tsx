"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
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
    <AdminProtectedRoute>
      <AdminLayout>
      <PageHeader 
        title="Agenda Inteligente" 
        description="Gerencie seus horários e agendamentos de forma eficiente."
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="gap-2 shadow-sm">
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
                fetchAppointments();
              }} 
              initialDate={date}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lado Esquerdo: Calendário e Resumo */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon size={16} className="text-primary" />
                Calendário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                className="rounded-md border-none mx-auto p-0"
                locale={ptBR}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Clock3 size={14} /> Total de horas
                </span>
                <span className="font-bold">
                  {appointments.reduce((acc, curr) => acc + (curr.service?.durationMinutes || 0), 0) / 60}h
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 size={14} /> Concluídos
                </span>
                <span className="font-bold text-emerald-600">
                  {appointments.filter(a => a.status === "completed").length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
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
        <Card className="lg:col-span-8 shadow-sm border-slate-200 min-h-[600px]">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <CardTitle className="text-xl capitalize">
                {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </CardTitle>
              <CardDescription>
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
          <CardContent className="p-0">
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
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground gap-3">
                <div className="bg-slate-100 p-4 rounded-full">
                  <CalendarIcon size={40} className="opacity-20" />
                </div>
                <p>Nenhum agendamento encontrado.</p>
                <Button variant="link" onClick={() => setIsDialogOpen(true)}>
                  Criar primeiro agendamento
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments
                  .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime())
                  .map((app) => (
                    <div 
                      key={app.id} 
                      className="group flex items-start gap-4 p-5 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <div className="flex flex-col items-center justify-center min-w-[70px] py-1 bg-slate-50 rounded-lg border group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
                        <span className="text-sm font-bold text-primary">
                          {format(app.appointmentDate, "HH:mm")}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium">
                          {app.service?.durationMinutes} min
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-slate-900 truncate">
                            {app.client?.name || "Cliente não encontrada"}
                          </h4>
                          <Badge variant={
                            app.status === "completed" ? "secondary" : 
                            app.status === "confirmed" ? "default" : 
                            app.status === "cancelled" ? "destructive" : "outline"
                          } className="ml-2 capitalize">
                            {app.status === "confirmed" ? "Confirmado" : 
                             app.status === "pending" ? "Pendente" : 
                             app.status === "completed" ? "Concluído" : "Cancelado"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                            {app.service?.name}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-medium text-slate-700">R$ {app.service?.price}</span>
                        </p>
                        {app.notes && (
                          <p className="text-xs text-slate-400 italic line-clamp-1">
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
    </AdminProtectedRoute>
  );
}
