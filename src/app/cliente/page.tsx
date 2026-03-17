"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  History,
  User as UserIcon, 
  Plus, 
  ChevronRight,
  Loader2,
  Sparkles
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
import { getGreeting } from "@/lib/utils";

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
    <div className="relative min-h-screen overflow-x-hidden bg-[#fcf8ff] pb-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-fuchsia-200/45 blur-3xl" />
        <div className="absolute top-56 -left-20 h-72 w-72 rounded-full bg-violet-200/35 blur-3xl" />
      </div>

      <header className="relative px-5 pt-6">
        <div className="rounded-[34px] bg-linear-to-br from-[#6d28d9] via-[#c026d3] to-[#7c3aed] px-5 pb-6 pt-5 shadow-[0_30px_80px_-28px_rgba(168,85,247,0.65)]">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-violet-100">{getGreeting()} ✨</p>
              <h1 className="text-[2rem] font-black leading-none text-white">{firstName}</h1>
              <p className="mt-3 max-w-[220px] text-sm leading-5 text-violet-100/90">
                Seu espaço para cuidar da beleza com praticidade e elegância.
              </p>
            </div>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/18 text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/28"
              onClick={() => router.push("/cliente/perfil")}
              aria-label="Ir para perfil"
            >
              <UserIcon size={18} />
            </button>
          </div>

          <div className="grid gap-3">
            <Button
              className="h-16 w-full justify-between rounded-[28px] border-0 bg-white px-5 text-violet-700 shadow-lg shadow-violet-950/20 hover:bg-white"
              onClick={() => router.push("/cliente/agendar")}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-fuchsia-500 to-violet-600 text-white shadow-md">
                  <Plus size={22} strokeWidth={3} />
                </span>
                <span className="text-left">
                  <span className="block text-[11px] font-black uppercase tracking-[0.18em] text-violet-400">
                    Principal
                  </span>
                  <span className="block text-base font-black">Agendar novo horário</span>
                </span>
              </span>
              <ChevronRight size={18} />
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/cliente/agendamentos")}
                className="rounded-[24px] bg-white/14 px-4 py-4 text-left text-white ring-1 ring-white/15 backdrop-blur-sm transition hover:bg-white/20"
              >
                <Calendar className="mb-3 h-5 w-5" />
                <p className="text-sm font-black">Minha agenda</p>
                <p className="mt-1 text-xs text-violet-100">Próximos e histórico</p>
              </button>
              <button
                onClick={() => router.push("/cliente/servicos")}
                className="rounded-[24px] bg-white/14 px-4 py-4 text-left text-white ring-1 ring-white/15 backdrop-blur-sm transition hover:bg-white/20"
              >
                <Sparkles className="mb-3 h-5 w-5" />
                <p className="text-sm font-black">Explorar serviços</p>
                <p className="mt-1 text-xs text-violet-100">Escolha seu cuidado</p>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative space-y-6 px-5 pt-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-500">Próximo passo</p>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Seu próximo agendamento</h2>
            </div>
            {nextAppointment ? (
              <button
                onClick={() => router.push("/cliente/agendamentos")}
                className="text-sm font-bold text-violet-600"
              >
                Ver todos
              </button>
            ) : null}
          </div>

          {nextAppointment ? (
            <Card className="overflow-hidden rounded-[32px] border border-violet-100/70 bg-white/95 shadow-[0_24px_70px_-30px_rgba(139,92,246,0.55)]">
              <CardContent className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-violet-500">Confirmado</p>
                    <h3 className="text-[1.45rem] font-black leading-tight text-slate-900">{nextAppointment.service.name}</h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={`rounded-full border px-3 py-1 text-[11px] font-bold ${nextStatus?.className ?? ""}`}
                  >
                    {nextStatus?.label}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] bg-violet-50 px-4 py-3">
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                      <Calendar size={16} />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-400">Data</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {format(nextAppointment.date, "dd MMM", { locale: ptBR })} • {nextAppointment.time?.time || format(nextAppointment.date, "HH:mm")}
                    </p>
                  </div>

                  <div className="rounded-[24px] bg-fuchsia-50 px-4 py-3">
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-fuchsia-600 shadow-sm">
                      <Clock size={16} />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-400">Duração</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">{nextAppointment.service.durationMinutes} min</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    className="h-11 flex-1 rounded-2xl bg-linear-to-r from-violet-600 to-fuchsia-600 font-bold text-white hover:from-violet-700 hover:to-fuchsia-700"
                    onClick={() => router.push("/cliente/agendamentos")}
                  >
                    Ver detalhes
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-2xl border-violet-200 px-4 text-violet-700 hover:bg-violet-50"
                    onClick={() => router.push("/cliente/agendar")}
                  >
                    Remarcar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[32px] border border-violet-100/70 bg-white/95 shadow-[0_24px_70px_-30px_rgba(139,92,246,0.45)]">
              <CardContent className="p-6">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[24px] bg-linear-to-br from-violet-100 to-fuchsia-100 text-violet-600">
                  <Calendar size={28} strokeWidth={2.2} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-black tracking-tight text-slate-900">Nenhum agendamento futuro</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Escolha seu próximo cuidado e reserve em poucos toques.
                  </p>
                </div>
                <Button
                  className="mt-5 h-12 w-full rounded-2xl bg-linear-to-r from-fuchsia-600 to-violet-600 font-bold text-white hover:from-fuchsia-700 hover:to-violet-700"
                  onClick={() => router.push("/cliente/agendar")}
                >
                  Agendar agora
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <div className="px-1">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-500">Acesso rápido</p>
            <h2 className="text-lg font-black tracking-tight text-slate-900">Atalhos da sua rotina</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push("/cliente/agendamentos")}
              className="rounded-[30px] bg-white p-5 text-left shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] ring-1 ring-violet-100/70 transition hover:-translate-y-0.5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[18px] bg-violet-100 text-violet-700">
                <Calendar size={22} strokeWidth={2.4} />
              </div>
              <p className="text-sm font-black text-slate-900">Minha agenda</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Acompanhe próximos horários</p>
            </button>

            <button
              onClick={() => router.push("/cliente/servicos")}
              className="rounded-[30px] bg-white p-5 text-left shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] ring-1 ring-violet-100/70 transition hover:-translate-y-0.5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[18px] bg-fuchsia-100 text-fuchsia-700">
                <Sparkles size={22} strokeWidth={2.4} />
              </div>
              <p className="text-sm font-black text-slate-900">Serviços</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Veja opções e valores</p>
            </button>

            <button
              onClick={() => router.push("/cliente/agendamentos")}
              className="rounded-[30px] bg-white p-5 text-left shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] ring-1 ring-violet-100/70 transition hover:-translate-y-0.5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[18px] bg-indigo-100 text-indigo-700">
                <History size={22} strokeWidth={2.4} />
              </div>
              <p className="text-sm font-black text-slate-900">Histórico</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Revise atendimentos anteriores</p>
            </button>

            <button
              onClick={() => router.push("/cliente/perfil")}
              className="rounded-[30px] bg-white p-5 text-left shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] ring-1 ring-violet-100/70 transition hover:-translate-y-0.5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[18px] bg-amber-100 text-amber-700">
                <UserIcon size={22} strokeWidth={2.4} />
              </div>
              <p className="text-sm font-black text-slate-900">Perfil</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Dados e preferências</p>
            </button>
          </div>
        </section>

        <section className="space-y-3 pb-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-500">Descubra</p>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Serviços populares</h2>
            </div>
            <button
              onClick={() => router.push("/cliente/servicos")}
              className="flex items-center gap-1 text-sm font-bold text-violet-600 hover:text-violet-700"
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
                  className="group flex items-center justify-between rounded-[30px] bg-white p-4 text-left shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] ring-1 ring-violet-100/70 transition hover:-translate-y-0.5"
                  onClick={() => router.push(`/cliente/servicos?id=${service.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-[20px] bg-linear-to-br ${gradients[index % 3]} text-white shadow-md`}>
                      <Sparkles size={22} strokeWidth={2.4} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{service.name}</h4>
                      <p className="mt-1 text-base font-black text-violet-600">R$ {service.price.toFixed(2)}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 transition group-hover:text-violet-600 group-hover:translate-x-0.5" />
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
