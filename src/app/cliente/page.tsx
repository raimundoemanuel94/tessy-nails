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
    <div className="relative min-h-screen overflow-x-hidden bg-linear-to-b from-violet-50 via-white to-fuchsia-50/30 pb-24">
      {/* SECTION 1 — Greeting */}
      <header className="bg-white border-b border-violet-100/50 px-5 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Bem-vindo de volta, {firstName}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">Seu painel de agendamentos</p>
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition hover:bg-violet-200"
            onClick={() => router.push("/cliente/perfil")}
            aria-label="Ir para perfil"
          >
            <UserIcon size={20} />
          </button>
        </div>
      </header>

      <main className="space-y-6 px-5 py-6">
        {/* SECTION 2 — Main Booking Button */}
        <section>
          <Button
            className="h-16 w-full rounded-2xl bg-linear-to-r from-fuchsia-600 via-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-300/40 transition-all hover:shadow-xl hover:shadow-violet-400/50 active:scale-[0.98]"
            onClick={() => router.push("/cliente/agendar")}
          >
            <span className="flex items-center gap-2.5 text-base font-bold">
              <Plus size={20} strokeWidth={2.5} />
              + Agendar novo horário
            </span>
          </Button>
        </section>

        {/* SECTION 3 — Next Appointment Card */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Próximo agendamento</h2>
            <button
              onClick={() => router.push("/cliente/agendamentos")}
              className="text-sm font-semibold text-violet-600 hover:text-violet-700"
            >
              Ver todos
            </button>
          </div>

          {nextAppointment ? (
            <Card className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-md">
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

                <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-violet-600" />
                    <span className="font-medium">
                      {format(nextAppointment.date, "dd MMM", { locale: ptBR })} — {nextAppointment.time?.time || format(nextAppointment.date, "HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-violet-600" />
                    <span className="font-medium">{nextAppointment.service.durationMinutes} min</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="h-11 w-full rounded-xl border-violet-200 font-semibold text-violet-700 hover:bg-violet-50"
                  onClick={() => router.push("/cliente/agendamentos")}
                >
                  Ver detalhes
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-dashed border-violet-200 bg-white">
              <CardContent className="space-y-4 p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <Calendar size={28} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Você ainda não possui agendamentos futuros.</p>
                  <p className="mt-1 text-xs text-slate-500">Reserve seu horário agora mesmo</p>
                </div>
                <Button
                  className="h-12 w-full rounded-xl bg-linear-to-r from-fuchsia-600 to-violet-600 font-semibold text-white hover:brightness-110"
                  onClick={() => router.push("/cliente/agendar")}
                >
                  Agendar horário
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* SECTION 4 — Quick Actions */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">Acesso rápido</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => router.push("/cliente/agendamentos")}
              className="flex flex-col items-center gap-2 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-violet-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Calendar size={20} />
              </div>
              <span className="text-xs font-semibold text-slate-700">Minha Agenda</span>
            </button>
            <button
              onClick={() => router.push("/cliente/servicos")}
              className="flex flex-col items-center gap-2 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-violet-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Sparkles size={20} />
              </div>
              <span className="text-xs font-semibold text-slate-700">Serviços</span>
            </button>
            <button
              onClick={() => router.push("/cliente/agendamentos")}
              className="flex flex-col items-center gap-2 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-violet-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <History size={20} />
              </div>
              <span className="text-xs font-semibold text-slate-700">Histórico</span>
            </button>
          </div>
        </section>

        {/* SECTION 5 — Popular Services */}
        <section className="space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Serviços populares</h2>
            <button
              onClick={() => router.push("/cliente/servicos")}
              className="text-sm font-semibold text-violet-600 hover:text-violet-700"
            >
              Ver mais
            </button>
          </div>

          <div className="grid gap-3">
            {services.slice(0, 3).map((service) => (
              <button
                key={service.id}
                className="group flex items-center justify-between rounded-2xl border border-violet-100 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md hover:border-violet-200"
                onClick={() => router.push(`/cliente/servicos?id=${service.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-fuchsia-500 to-violet-600 text-white shadow-sm">
                    <Gem size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{service.name}</h4>
                    <p className="text-sm font-medium text-violet-600">R$ {service.price.toFixed(2)}</p>
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
