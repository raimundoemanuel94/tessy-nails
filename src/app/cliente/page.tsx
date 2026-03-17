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
  const quickActions = [
    {
      id: "agenda",
      title: "Minha agenda",
      description: "Veja próximos horários",
      icon: Calendar,
      iconBox: "bg-[#F3EEFF] text-[#7C3AED]",
      action: () => router.push("/cliente/agendamentos"),
    },
    {
      id: "services",
      title: "Serviços",
      description: "Escolha seu cuidado",
      icon: Sparkles,
      iconBox: "bg-[#FCE7F3] text-[#F472B6]",
      action: () => router.push("/cliente/servicos"),
    },
    {
      id: "history",
      title: "Histórico",
      description: "Revise atendimentos",
      icon: History,
      iconBox: "bg-[#EEF2FF] text-[#7C3AED]",
      action: () => router.push("/cliente/agendamentos"),
    },
    {
      id: "profile",
      title: "Perfil",
      description: "Dados e preferências",
      icon: UserIcon,
      iconBox: "bg-[#FFF1F2] text-[#7C3AED]",
      action: () => router.push("/cliente/perfil"),
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FFFDFE] pb-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 right-[-80px] h-64 w-64 rounded-full bg-[#FCE7F3]/70 blur-3xl" />
        <div className="absolute top-72 -left-20 h-64 w-64 rounded-full bg-[#F3EEFF]/80 blur-3xl" />
      </div>

      <header className="relative mx-auto max-w-[1200px] px-5 pt-6 lg:px-8">
        <div className="rounded-[32px] border border-[#E9DDF7] bg-white/95 px-5 py-5 shadow-[0_20px_60px_-42px_rgba(124,58,237,0.28)] backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-sm font-medium text-[#7C3AED]">{getGreeting()}</p>
              <h1 className="text-[1.9rem] font-black leading-none tracking-tight text-[#1F172A]">{firstName}</h1>
              <p className="mt-2 max-w-[260px] text-sm leading-6 text-[#6B6280]">
                Seu espaço para agendar com leveza, praticidade e um toque premium.
              </p>
            </div>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E9DDF7] bg-[#F8F5FF] text-[#7C3AED] transition hover:bg-[#F3EEFF]"
              onClick={() => router.push("/cliente/perfil")}
              aria-label="Ir para perfil"
            >
              <UserIcon size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1200px] px-5 pt-5 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start xl:gap-8">
          <div className="space-y-6">
            <section>
              <Button
                className="h-[74px] w-full justify-between rounded-[30px] border border-[#E9DDF7] bg-linear-to-r from-[#7C3AED] to-[#F472B6] px-5 text-white shadow-[0_20px_40px_-22px_rgba(124,58,237,0.45)] transition hover:opacity-95 active:scale-[0.99] lg:h-[78px]"
                onClick={() => router.push("/cliente/agendar")}
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Plus size={22} strokeWidth={3} />
                  </span>
                  <span className="text-left">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
                      Principal
                    </span>
                    <span className="block text-base font-black">Agendar novo horário</span>
                  </span>
                </span>
                <ChevronRight size={18} />
              </Button>
            </section>

            <section className="space-y-3">
              <div className="px-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A78BFA]">Acesso rápido</p>
                <h2 className="text-lg font-black tracking-tight text-[#1F172A]">Tudo o que você mais usa</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                {quickActions.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="rounded-[28px] border border-[#E9DDF7] bg-white p-4 text-left shadow-[0_18px_45px_-36px_rgba(31,23,42,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-36px_rgba(124,58,237,0.22)] active:scale-[0.99] lg:min-h-[168px] lg:p-5"
                  >
                    <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-[18px] ${item.iconBox}`}>
                      <item.icon size={20} strokeWidth={2.4} />
                    </div>
                    <p className="text-sm font-black text-[#1F172A]">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#6B6280]">{item.description}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6 pb-4">
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A78BFA]">Agenda</p>
                  <h2 className="text-lg font-black tracking-tight text-[#1F172A]">Próximo agendamento</h2>
                </div>
                {nextAppointment ? (
                  <button
                    onClick={() => router.push("/cliente/agendamentos")}
                    className="text-sm font-bold text-[#7C3AED]"
                  >
                    Ver todos
                  </button>
                ) : null}
              </div>

              {nextAppointment ? (
                <Card className="overflow-hidden rounded-[30px] border border-[#E9DDF7] bg-white shadow-[0_20px_60px_-44px_rgba(31,23,42,0.25)]">
                  <CardContent className="p-5 lg:p-6">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#A78BFA]">Agendado</p>
                        <h3 className="text-[1.2rem] font-black leading-tight text-[#1F172A]">{nextAppointment.service.name}</h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={`rounded-full border px-3 py-1 text-[11px] font-bold shadow-none ${nextStatus?.className ?? ""}`}
                      >
                        {nextStatus?.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                      <div className="rounded-[22px] bg-[#F8F5FF] px-4 py-3">
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#7C3AED] shadow-sm">
                          <Calendar size={16} />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A78BFA]">Data</p>
                        <p className="mt-1 text-sm font-bold text-[#1F172A]">
                          {format(nextAppointment.date, "dd MMM", { locale: ptBR })}
                        </p>
                      </div>

                      <div className="rounded-[22px] bg-[#FFF7FB] px-4 py-3">
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#F472B6] shadow-sm">
                          <Clock size={16} />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F472B6]">Horário</p>
                        <p className="mt-1 text-sm font-bold text-[#1F172A]">
                          {nextAppointment.time?.time || format(nextAppointment.date, "HH:mm")}
                        </p>
                      </div>

                      <div className="rounded-[22px] bg-[#F8F5FF] px-4 py-3">
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#7C3AED] shadow-sm">
                          <Clock size={16} />
                        </div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A78BFA]">Duração</p>
                        <p className="mt-1 text-sm font-bold text-[#1F172A]">{nextAppointment.service.durationMinutes} min</p>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button
                        className="h-11 flex-1 rounded-2xl bg-[#7C3AED] font-bold text-white shadow-[0_14px_30px_-18px_rgba(124,58,237,0.5)] hover:bg-[#6D28D9]"
                        onClick={() => router.push("/cliente/agendamentos")}
                      >
                        Ver detalhes
                      </Button>
                      <Button
                        variant="outline"
                        className="h-11 rounded-2xl border-[#E9DDF7] bg-white px-4 text-[#7C3AED] hover:bg-[#F8F5FF]"
                        onClick={() => router.push("/cliente/agendar")}
                      >
                        Remarcar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-[30px] border border-[#E9DDF7] bg-white shadow-[0_20px_60px_-44px_rgba(31,23,42,0.2)]">
                  <CardContent className="p-6 lg:p-7">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#F8F5FF] text-[#7C3AED]">
                      <Calendar size={28} strokeWidth={2.2} />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black tracking-tight text-[#1F172A]">Nenhum agendamento futuro</p>
                      <p className="mt-2 text-sm leading-6 text-[#6B6280]">
                        Escolha seu próximo cuidado e reserve em poucos toques.
                      </p>
                    </div>
                    <Button
                      className="mt-5 h-12 w-full rounded-2xl bg-linear-to-r from-[#7C3AED] to-[#F472B6] font-bold text-white shadow-[0_18px_32px_-20px_rgba(124,58,237,0.45)] hover:opacity-95"
                      onClick={() => router.push("/cliente/agendar")}
                    >
                      Agendar agora
                    </Button>
                  </CardContent>
                </Card>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#A78BFA]">Descobertas</p>
                  <h2 className="text-lg font-black tracking-tight text-[#1F172A]">Serviços populares</h2>
                </div>
                <button
                  onClick={() => router.push("/cliente/servicos")}
                  className="flex items-center gap-1 text-sm font-bold text-[#7C3AED] hover:text-[#6D28D9]"
                >
                  Ver todos
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid gap-3 lg:gap-4">
                {services.slice(0, 3).map((service, index) => {
                  const gradients = [
                    "from-violet-500 to-purple-600",
                    "from-fuchsia-500 to-pink-600",
                    "from-indigo-500 to-blue-600"
                  ];

                  return (
                    <button
                      key={service.id}
                      className="group flex items-center justify-between rounded-[28px] border border-[#E9DDF7] bg-white p-4 text-left shadow-[0_18px_45px_-36px_rgba(31,23,42,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-36px_rgba(124,58,237,0.22)] active:scale-[0.99] lg:p-5"
                      onClick={() => router.push(`/cliente/servicos?id=${service.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] bg-linear-to-br ${gradients[index % 3]} text-white shadow-sm`}>
                          <Sparkles size={22} strokeWidth={2.4} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-[#1F172A]">{service.name}</h4>
                          <p className="mt-1 text-base font-black text-[#7C3AED]">R$ {service.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-[#C4B5D9] transition group-hover:text-[#7C3AED] group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
