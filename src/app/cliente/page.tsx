"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User as UserIcon,
  Plus,
  Loader2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { appointmentService, AppointmentWithService } from "@/services/appointments";
import { AppointmentStorage } from "@/lib/appointmentStorage";
import { globalStore } from "@/store/globalStore";
import { format, isFuture, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Service } from "@/types";
import { getGreeting, cn } from "@/lib/utils";

export default function ClientePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [nextAppointment, setNextAppointment] = useState<AppointmentWithService | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        setDataLoading(true);
        const [appointments, allServices] = await Promise.all([
          appointmentService.getByClientIdWithServices(user.uid),
          globalStore.fetchServices(false),
        ]);
        const upcoming = appointments
          .filter(
            (apt) =>
              (isFuture(apt.date) || isToday(apt.date)) &&
              apt.status !== "cancelled"
          )
          .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
        setNextAppointment(upcoming);
        setServices(allServices.slice(0, 6));
      } catch (error) {
        console.error("Erro ao carregar dados do cliente:", error);
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (loading || dataLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary/40" />
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "Cliente";

  const hasService = !!AppointmentStorage.loadSelectedService();

  const quickActions = [
    { id: "agenda",   label: "Agenda",    sub: "Meus horários",  icon: Calendar,  href: "/cliente/agendamentos" },
    { id: "services", label: "Serviços",  sub: "Ver catálogo",   icon: Sparkles,  href: "/cliente/servicos"     },
    { id: "new",      label: "Agendar",   sub: "Novo horário",   icon: Plus,      href: "/cliente/servicos"     },
    { id: "profile",  label: "Perfil",    sub: "Minha conta",    icon: UserIcon,  href: "/cliente/perfil"       },
  ];

  const statusLabel: Record<string, string> = {
    confirmed: "Confirmado",
    pending: "Pendente",
    cancelled: "Cancelado",
  };
  const statusColor: Record<string, string> = {
    confirmed: "bg-emerald-500/10 text-emerald-600",
    pending: "bg-amber-500/10 text-amber-600",
    cancelled: "bg-red-500/10 text-red-500",
  };

  return (
    <div className="min-h-screen bg-brand-background pb-32">
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-primary px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-10">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-52 w-52 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-64 rounded-full bg-brand-secondary/30 blur-2xl" />

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* greeting row */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50 mb-0.5">
                {getGreeting()}
              </p>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">
                {firstName}
              </h1>
              <p className="text-[11px] text-white/40 mt-1 capitalize">
                {format(new Date(), "EEEE',' d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur-sm">
              <UserIcon size={22} className="text-white/80" />
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => router.push("/cliente/servicos")}
            className="w-full flex items-center justify-between bg-white rounded-2xl px-5 h-14 shadow-xl shadow-black/10 active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                <Plus size={16} className="text-brand-primary" strokeWidth={3} />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-brand-primary uppercase tracking-widest leading-none">
                  Agendar agora
                </p>
                <p className="text-[10px] text-brand-text-muted mt-0.5">Escolha seu serviço</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-brand-primary/40 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      <div className="px-5 mt-6 space-y-8 max-w-2xl mx-auto">

        {/* ── PRÓXIMO AGENDAMENTO ───────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-brand-text-main uppercase tracking-wider">
              Próximo horário
            </h2>
            {nextAppointment && (
              <button
                onClick={() => router.push("/cliente/agendamentos")}
                className="text-[11px] font-semibold text-brand-primary flex items-center gap-1"
              >
                Ver todos <ChevronRight size={12} />
              </button>
            )}
          </div>

          {nextAppointment ? (
            <div
              onClick={() => router.push("/cliente/agendamentos")}
              className="cursor-pointer rounded-2xl bg-white border border-brand-soft shadow-sm overflow-hidden active:scale-[0.99] transition-all"
            >
              {/* colored top strip */}
              <div className="h-1 w-full bg-gradient-to-r from-brand-primary to-brand-secondary" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-0.5">
                      Serviço
                    </p>
                    <h3 className="text-base font-black text-brand-text-main leading-tight">
                      {nextAppointment.service.name}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full",
                      statusColor[nextAppointment.status] ?? "bg-gray-100 text-gray-500"
                    )}
                  >
                    {statusLabel[nextAppointment.status] ?? nextAppointment.status}
                  </span>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 flex-1 rounded-xl bg-brand-background px-3 py-2.5">
                    <Calendar size={14} className="text-brand-primary shrink-0" />
                    <span className="text-xs font-bold text-brand-text-main tabular-nums">
                      {format(nextAppointment.date, "dd/MM/yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 rounded-xl bg-brand-background px-3 py-2.5">
                    <Clock size={14} className="text-brand-primary shrink-0" />
                    <span className="text-xs font-bold text-brand-text-main tabular-nums">
                      {nextAppointment.time?.time || format(nextAppointment.date, "HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-6 rounded-2xl border border-dashed border-brand-soft bg-white text-center space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-brand-background flex items-center justify-center">
                <Calendar size={24} className="text-brand-primary/40" />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-text-main">Nenhum agendamento ativo</p>
                <p className="text-[11px] text-brand-text-muted mt-0.5">Reserve seu horário em poucos segundos</p>
              </div>
              <Button
                className="h-10 px-6 rounded-full bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold shadow-md"
                onClick={() => router.push("/cliente/servicos")}
              >
                Agendar agora
              </Button>
            </div>
          )}
        </section>

        {/* ── ATALHOS ───────────────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-sm font-black text-brand-text-main uppercase tracking-wider">
            Atalhos rápidos
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => router.push(action.href)}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-brand-soft shadow-sm text-left active:scale-95 transition-all group"
              >
                <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl bg-brand-background text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all duration-200">
                  <action.icon size={18} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-brand-text-main leading-none truncate">{action.label}</p>
                  <p className="text-[10px] text-brand-text-muted mt-0.5 truncate">{action.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── SUGESTÕES ─────────────────────────────────────────── */}
        {services.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-brand-text-main uppercase tracking-wider">
                Para você
              </h2>
              <button
                onClick={() => router.push("/cliente/servicos")}
                className="text-[11px] font-semibold text-brand-primary flex items-center gap-1"
              >
                Ver todos <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    AppointmentStorage.saveSelectedService({
                      id: service.id,
                      name: service.name,
                      description: service.description,
                      price: `R$ ${service.price.toFixed(2)}`,
                      duration: `${service.durationMinutes}min`,
                    });
                    AppointmentStorage.clearAppointmentData();
                    AppointmentStorage.clearSelectedDate();
                    router.push("/cliente/agendar");
                  }}
                  className="shrink-0 w-[148px] rounded-2xl bg-white border border-brand-soft shadow-sm overflow-hidden text-left active:scale-95 transition-all group"
                >
                  <div className="h-20 w-full bg-gradient-to-br from-brand-background to-brand-soft/60 flex items-center justify-center group-hover:from-brand-primary/5 group-hover:to-brand-accent/10 transition-all">
                    <Sparkles size={24} className="text-brand-primary/30 group-hover:text-brand-primary/50 transition-colors" strokeWidth={1.5} />
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-bold text-brand-text-main line-clamp-2 leading-tight">
                      {service.name}
                    </p>
                    <p className="text-[11px] font-black text-brand-primary">
                      {`R$ ${service.price.toFixed(2)}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── FOOTER ────────────────────────────────────────────── */}
        <footer className="pt-4 pb-2 flex items-center justify-center gap-2 opacity-30">
          <Sparkles size={10} className="text-brand-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary">
            Tessy Nails
          </span>
        </footer>

      </div>
    </div>
  );
}
