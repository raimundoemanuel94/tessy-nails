"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  Star,
  History,
  User as UserIcon, 
  Plus, 
  ChevronRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BottomNav } from "@/components/client/BottomNav";
import { appointmentService } from "@/services/appointments";
import { salonService } from "@/services/salon";
import { format, isFuture, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Service } from "@/types";
import { Badge } from "@/components/ui/badge";

export default function ClientePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setDataLoading(true);
        const [appointments, allServices] = await Promise.all([
          appointmentService.getByClientIdWithServices(user.uid),
          salonService.getAll()
        ]);

        // Encontrar o próximo agendamento (futuro ou hoje)
        const upcoming = appointments
          .filter(apt => (isFuture(apt.date) || isToday(apt.date)) && apt.status !== 'cancelled')
          .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
        
        setNextAppointment(upcoming);
        setServices(allServices.slice(0, 4)); // Mostrar apenas os 4 primeiros no dashboard
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user]);

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-amber-100 text-amber-700 border-amber-200" },
    confirmed: { label: "Confirmado", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    completed: { label: "Concluído", className: "bg-sky-100 text-sky-700 border-sky-200" },
    cancelled: { label: "Cancelado", className: "bg-rose-100 text-rose-700 border-rose-200" },
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "Cliente";
  const nextStatus = nextAppointment ? (statusConfig[nextAppointment.status] || statusConfig.pending) : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white px-5 pt-10 pb-5 border-b border-slate-100">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-500 text-sm font-medium">Dashboard de agendamentos</p>
            <h1 className="text-2xl font-bold text-slate-900">Bem-vindo de volta, {firstName}</h1>
          </div>
          <div 
            className="h-11 w-11 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600 cursor-pointer"
            onClick={() => router.push("/cliente/perfil")}
          >
            <UserIcon size={20} />
          </div>
        </div>
      </header>

      <main className="p-5 space-y-5">
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Próximo agendamento</h2>
            <button 
              onClick={() => router.push("/cliente/agendamentos")}
              className="text-violet-600 text-sm font-semibold"
            >
              Ver todos
            </button>
          </div>

          {nextAppointment ? (
            <Card className="border border-violet-100 shadow-sm bg-white rounded-3xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Serviço</p>
                    <h3 className="text-xl font-bold text-slate-900">{nextAppointment.service.name}</h3>
                  </div>
                  <Badge variant="outline" className={nextStatus?.className}>
                    {nextStatus?.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-violet-500" />
                    <span>
                      {format(nextAppointment.date, "dd MMM", { locale: ptBR })} - {nextAppointment.time?.time || format(nextAppointment.date, "HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-violet-500" />
                    <span>{nextAppointment.service.durationMinutes} min</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full rounded-2xl border-violet-200 text-violet-700 hover:bg-violet-50 hover:text-violet-800"
                  onClick={() => router.push("/cliente/agendamentos")}
                >
                  Ver detalhes
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-dashed border-slate-300 bg-white rounded-3xl">
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-sm font-medium text-slate-600">Você não possui agendamentos futuros.</p>
                <Button
                  className="w-full rounded-2xl bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={() => router.push("/cliente/agendar")}
                >
                  Agendar horário
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <Button 
            className="w-full h-16 bg-violet-600 hover:bg-violet-700 text-white rounded-3xl flex items-center justify-between px-5 shadow-lg shadow-violet-200/60 group transition-all"
            onClick={() => router.push("/cliente/agendar")}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl group-hover:scale-110 transition-transform">
                <Plus size={20} />
              </div>
              <div className="text-left">
                <span className="block text-base font-bold">+ Agendar novo horário</span>
                <span className="text-violet-100 text-xs">Reserve seu próximo atendimento</span>
              </div>
            </div>
            <ChevronRight size={18} className="text-violet-200" />
          </Button>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <Button 
            variant="outline" 
            className="h-20 rounded-2xl bg-white border-slate-200 flex-col gap-1.5 hover:bg-slate-50 hover:border-violet-200 transition-all font-semibold text-xs"
            onClick={() => router.push("/cliente/agendamentos")}
          >
            <div className="text-violet-600">
              <Clock size={18} />
            </div>
            Minha Agenda
          </Button>
          <Button 
            variant="outline" 
            className="h-20 rounded-2xl bg-white border-slate-200 flex-col gap-1.5 hover:bg-slate-50 hover:border-violet-200 transition-all font-semibold text-xs"
            onClick={() => router.push("/cliente/servicos")}
          >
            <div className="text-violet-600">
              <Star size={18} />
            </div>
            Serviços
          </Button>
          <Button 
            variant="outline" 
            className="h-20 rounded-2xl bg-white border-slate-200 flex-col gap-1.5 hover:bg-slate-50 hover:border-violet-200 transition-all font-semibold text-xs"
            onClick={() => router.push("/cliente/agendamentos")}
          >
            <div className="text-violet-600">
              <History size={18} />
            </div>
            Histórico
          </Button>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Serviços populares</h2>
            <button 
              onClick={() => router.push("/cliente/servicos")}
              className="text-violet-600 text-sm font-semibold"
            >
              Ver mais
            </button>
          </div>

          <div className="grid gap-4">
            {services.slice(0, 3).map((service) => (
              <div 
                key={service.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-violet-100 transition-colors cursor-pointer group"
                onClick={() => router.push(`/cliente/servicos?id=${service.id}`)}
              >
                <div>
                  <h4 className="font-bold text-slate-800">{service.name}</h4>
                  <p className="text-sm text-slate-500">R$ {service.price.toFixed(2)}</p>
                </div>
                <div className="h-9 w-9 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-violet-600 group-hover:border-violet-200 transition-all">
                  <ChevronRight size={18} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Navegação Inferior */}
      <BottomNav />
    </div>
  );
}
