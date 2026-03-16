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
  Loader2,
  Sparkles,
  Gem
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
      <div className="min-h-screen bg-linear-to-b from-[#f7f3ff] via-white to-[#fff4f8] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-fuchsia-600" />
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "Cliente";
  const nextStatus = nextAppointment ? (statusConfig[nextAppointment.status] || statusConfig.pending) : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-linear-to-b from-[#f7f3ff] via-[#fffefe] to-[#fff3f8] pb-24">
      <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-fuchsia-300/30 blur-3xl" />
      <div className="pointer-events-none absolute top-28 -right-20 h-72 w-72 rounded-full bg-violet-300/25 blur-3xl" />

      <header className="px-5 pt-8">
        <div className="rounded-3xl border border-white/60 bg-white/85 p-5 shadow-xl shadow-fuchsia-100/50 backdrop-blur">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-700">
                <Sparkles size={12} />
                Boas-vindas
              </p>
              <h1 className="text-2xl font-extrabold leading-tight text-slate-900">
                Bem-vindo de volta, {firstName}
              </h1>
              <p className="mt-1 text-sm text-slate-500">Seu painel premium de agendamentos</p>
            </div>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-fuchsia-100 bg-linear-to-br from-fuchsia-100 to-violet-100 text-fuchsia-700 transition hover:scale-105"
              onClick={() => router.push("/cliente/perfil")}
              aria-label="Ir para perfil"
            >
              <UserIcon size={20} />
            </button>
          </div>

          <Button
            className="h-14 w-full rounded-2xl bg-linear-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-300/50 transition hover:brightness-110"
            onClick={() => router.push("/cliente/agendar")}
          >
            <span className="flex items-center gap-2 text-base font-bold">
              <Plus size={18} />
              + Agendar novo horário
            </span>
          </Button>
        </div>
      </header>

      <main className="space-y-5 px-5 pt-5">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Próximo agendamento</h2>
            <button
              onClick={() => router.push("/cliente/agendamentos")}
              className="text-sm font-semibold text-violet-700 hover:text-violet-800"
            >
              Ver todos
            </button>
          </div>

          {nextAppointment ? (
            <Card className="overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-xl shadow-fuchsia-100/60">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Serviço</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">{nextAppointment.service.name}</h3>
                  </div>
                  <Badge variant="outline" className={nextStatus?.className}>
                    {nextStatus?.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-violet-600" />
                    <span>
                      {format(nextAppointment.date, "dd MMM", { locale: ptBR })} - {nextAppointment.time?.time || format(nextAppointment.date, "HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-violet-600" />
                    <span>{nextAppointment.service.durationMinutes} min</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="h-11 w-full rounded-2xl border-violet-200 font-semibold text-violet-700 hover:bg-violet-50"
                  onClick={() => router.push("/cliente/agendamentos")}
                >
                  Ver detalhes
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl border border-dashed border-violet-200 bg-white/85 shadow-lg shadow-fuchsia-100/40">
              <CardContent className="space-y-4 p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Calendar size={20} />
                </div>
                <p className="text-sm font-medium text-slate-700">Você não possui agendamentos futuros.</p>
                <Button
                  className="h-11 w-full rounded-2xl bg-linear-to-r from-fuchsia-600 to-violet-600 font-semibold text-white hover:brightness-110"
                  onClick={() => router.push("/cliente/agendar")}
                >
                  Agendar horário
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-20 rounded-2xl border-white/70 bg-white/85 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur hover:border-violet-200 hover:bg-white"
            onClick={() => router.push("/cliente/agendamentos")}
          >
            <span className="mb-1 text-violet-600">
              <Clock size={18} />
            </span>
            Minha Agenda
          </Button>
          <Button
            variant="outline"
            className="h-20 rounded-2xl border-white/70 bg-white/85 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur hover:border-violet-200 hover:bg-white"
            onClick={() => router.push("/cliente/servicos")}
          >
            <span className="mb-1 text-violet-600">
              <Star size={18} />
            </span>
            Serviços
          </Button>
          <Button
            variant="outline"
            className="h-20 rounded-2xl border-white/70 bg-white/85 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur hover:border-violet-200 hover:bg-white"
            onClick={() => router.push("/cliente/agendamentos")}
          >
            <span className="mb-1 text-violet-600">
              <History size={18} />
            </span>
            Histórico
          </Button>
        </section>

        <section className="space-y-3 pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Serviços populares</h2>
            <button
              onClick={() => router.push("/cliente/servicos")}
              className="text-sm font-semibold text-violet-700 hover:text-violet-800"
            >
              Ver mais
            </button>
          </div>

          <div className="grid gap-3">
            {services.slice(0, 3).map((service) => (
              <button
                key={service.id}
                className="group flex items-center justify-between rounded-2xl border border-white/70 bg-white/90 p-4 text-left shadow-sm transition hover:shadow-md"
                onClick={() => router.push(`/cliente/servicos?id=${service.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-fuchsia-500 to-violet-600 text-white shadow-md shadow-violet-200">
                    <Gem size={16} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{service.name}</h4>
                    <p className="text-sm font-medium text-slate-600">R$ {service.price.toFixed(2)}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 transition group-hover:text-violet-600" />
              </button>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
