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
    <div className="relative min-h-screen overflow-x-hidden bg-linear-to-br from-violet-100 via-fuchsia-50 to-white pb-24">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute top-60 -left-40 h-80 w-80 rounded-full bg-fuchsia-300/20 blur-3xl" />
      </div>

      {/* SECTION 1 — Greeting */}
      <header className="relative bg-linear-to-br from-violet-600 via-fuchsia-600 to-violet-700 px-5 pt-8 pb-20">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-violet-100 text-sm font-medium mb-1">Olá 👋</p>
            <h1 className="text-3xl font-black text-white">
              {firstName}
            </h1>
          </div>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white transition hover:bg-white/30 ring-2 ring-white/30"
            onClick={() => router.push("/cliente/perfil")}
            aria-label="Ir para perfil"
          >
            <UserIcon size={20} />
          </button>
        </div>
        
        {/* Main CTA Card - Floating */}
        <div className="relative -mb-8">
          <Button
            className="h-20 w-full rounded-3xl bg-white text-violet-700 shadow-2xl shadow-violet-900/30 transition-all hover:shadow-2xl hover:shadow-violet-900/40 active:scale-[0.98] border-0"
            onClick={() => router.push("/cliente/agendar")}
          >
            <span className="flex items-center gap-3 text-lg font-black">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-fuchsia-500 to-violet-600">
                <Plus size={24} strokeWidth={3} className="text-white" />
              </div>
              Agendar novo horário
            </span>
          </Button>
        </div>
      </header>

      <main className="relative space-y-5 px-5 pt-12">

        {/* SECTION 3 — Next Appointment Card */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-800 px-1">Próximo agendamento</h2>

          {nextAppointment ? (
            <Card className="overflow-hidden rounded-3xl border-0 bg-linear-to-br from-violet-500 to-fuchsia-600 shadow-xl shadow-violet-500/30">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-violet-100 mb-1">Serviço</p>
                    <h3 className="text-2xl font-black text-white">{nextAppointment.service.name}</h3>
                  </div>
                  <Badge variant="outline" className="bg-white/20 backdrop-blur-sm border-white/30 text-white font-bold">
                    {nextStatus?.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-sm p-4 mb-4">
                  <div className="flex items-center gap-2 text-white">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-violet-100">Data</p>
                      <p className="text-sm font-bold">
                        {format(nextAppointment.date, "dd MMM", { locale: ptBR })} • {nextAppointment.time?.time || format(nextAppointment.date, "HH:mm")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-violet-100">Duração</p>
                      <p className="text-sm font-bold">{nextAppointment.service.durationMinutes} min</p>
                    </div>
                  </div>
                </div>

                <Button
                  className="h-12 w-full rounded-2xl bg-white text-violet-700 font-bold hover:bg-violet-50 border-0 shadow-lg"
                  onClick={() => router.push("/cliente/agendamentos")}
                >
                  Ver detalhes
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl border-0 bg-white shadow-lg shadow-slate-200/50">
              <CardContent className="space-y-5 p-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-violet-100 to-fuchsia-100 text-violet-600">
                  <Calendar size={32} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-800">Nenhum agendamento futuro</p>
                  <p className="mt-1.5 text-sm text-slate-500">Reserve seu horário e aproveite nossos serviços</p>
                </div>
                <Button
                  className="h-14 w-full rounded-2xl bg-linear-to-r from-fuchsia-600 to-violet-600 font-bold text-white shadow-lg shadow-violet-400/30 hover:shadow-xl hover:shadow-violet-400/40 border-0"
                  onClick={() => router.push("/cliente/agendar")}
                >
                  Agendar agora
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* SECTION 4 — Quick Actions */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-800 px-1">Acesso rápido</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => router.push("/cliente/agendamentos")}
              className="group flex flex-col items-center gap-3 rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/50 transition-all hover:shadow-xl hover:shadow-violet-300/30 active:scale-95"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-violet-600 text-white shadow-md shadow-violet-400/30 group-hover:scale-110 transition-transform">
                <Calendar size={24} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-slate-700">Minha Agenda</span>
            </button>
            <button
              onClick={() => router.push("/cliente/servicos")}
              className="group flex flex-col items-center gap-3 rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/50 transition-all hover:shadow-xl hover:shadow-fuchsia-300/30 active:scale-95"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-fuchsia-500 to-fuchsia-600 text-white shadow-md shadow-fuchsia-400/30 group-hover:scale-110 transition-transform">
                <Sparkles size={24} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-slate-700">Serviços</span>
            </button>
            <button
              onClick={() => router.push("/cliente/agendamentos")}
              className="group flex flex-col items-center gap-3 rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/50 transition-all hover:shadow-xl hover:shadow-indigo-300/30 active:scale-95"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-400/30 group-hover:scale-110 transition-transform">
                <History size={24} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-slate-700">Histórico</span>
            </button>
          </div>
        </section>

        {/* SECTION 5 — Popular Services */}
        <section className="space-y-3 pb-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-800">Serviços populares</h2>
            <button
              onClick={() => router.push("/cliente/servicos")}
              className="text-sm font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              Ver todos
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid gap-3">
            {services.slice(0, 3).map((service, index) => {
              const gradients = [
                "from-violet-500 to-purple-600",
                "from-fuchsia-500 to-pink-600",
                "from-indigo-500 to-blue-600"
              ];
              return (
                <button
                  key={service.id}
                  className="group flex items-center justify-between rounded-3xl bg-white p-5 text-left shadow-lg shadow-slate-200/50 transition-all hover:shadow-xl hover:shadow-violet-300/30 active:scale-[0.98]"
                  onClick={() => router.push(`/cliente/servicos?id=${service.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br ${gradients[index % 3]} text-white shadow-md group-hover:scale-110 transition-transform`}>
                      <Sparkles size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base mb-1">{service.name}</h4>
                      <p className="text-lg font-black text-violet-600">R$ {service.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 transition group-hover:text-violet-600 group-hover:translate-x-1" strokeWidth={2.5} />
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
