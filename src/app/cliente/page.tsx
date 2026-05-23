"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, User as UserIcon, Plus, Sparkles,
  ChevronRight, ArrowRight, Star, Scissors,
} from "lucide-react";
import { appointmentService, AppointmentWithService } from "@/services/appointments";
import { AppointmentStorage } from "@/lib/appointmentStorage";
import { globalStore } from "@/store/globalStore";
import { format, isFuture, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Service } from "@/types";
import { getGreeting, cn } from "@/lib/utils";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { ClienteHomeSkeleton } from "@/components/cliente/ClienteSkeletons";

// ── Status config ──────────────────────────────────────────────────────────
const STATUS = {
  confirmed: { label: "Confirmado", dot: "bg-emerald-400", text: "text-emerald-700", bg: "bg-emerald-50" },
  pending:   { label: "Pendente",   dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50"   },
  completed: { label: "Concluído",  dot: "bg-stone-400",   text: "text-stone-600",   bg: "bg-stone-50"   },
  cancelled: { label: "Cancelado",  dot: "bg-red-400",     text: "text-red-600",     bg: "bg-red-50"     },
  no_show:   { label: "Ausente",    dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-50"   },
} as const;

// ── Countdown chip ─────────────────────────────────────────────────────────
function CountdownChip({ date }: { date: Date }) {
  const days = differenceInDays(date, new Date());
  if (isToday(date)) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#3D2315] text-[10px] font-black text-amber-300 uppercase tracking-widest">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
      Hoje
    </span>
  );
  if (days === 1) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-[10px] font-black text-amber-700 uppercase tracking-widest">
      Amanhã
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-[10px] font-black text-stone-500 uppercase tracking-widest">
      Em {days} dias
    </span>
  );
}

export default function ClientePage() {
  const { user, loading: authLoading } = useProtectedRoute("client");
  const router = useRouter();

  const [nextAppointment, setNextAppointment] = useState<AppointmentWithService | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        setDataLoading(true);
        setError(null);
        const [apptResult, svcResult] = await Promise.allSettled([
          appointmentService.getByClientIdWithServices(user.uid),
          globalStore.fetchServices(false),
        ]);
        if (apptResult.status === "fulfilled") {
          const upcoming = apptResult.value
            .filter(a => (isFuture(a.date) || isToday(a.date)) && a.status !== "cancelled" && a.status !== "no_show")
            .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
          setNextAppointment(upcoming ?? null);
        }
        if (svcResult.status === "fulfilled") setServices(svcResult.value.slice(0, 8));
        if (apptResult.status === "rejected" && svcResult.status === "rejected")
          setError("Erro ao carregar dados. Verifique sua conexão.");
      } catch { setError("Erro inesperado. Tente novamente."); }
      finally { setDataLoading(false); }
    };
    load();
  }, [user]);

  if (authLoading || dataLoading) return <ClienteHomeSkeleton />;
  if (!user) return null;

  const firstName = user.name?.split(" ")[0] || "Cliente";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const quickActions = [
    { id: "agenda",   icon: Calendar,  label: "Agenda",   sub: "Meus horários", href: "/cliente/agendamentos", accent: false },
    { id: "servicos", icon: Scissors,  label: "Serviços", sub: "Ver catálogo",  href: "/cliente/servicos",     accent: false },
    { id: "agendar",  icon: Plus,      label: "Agendar",  sub: "Novo horário",  href: "/cliente/servicos",     accent: true  },
    { id: "perfil",   icon: UserIcon,  label: "Perfil",   sub: "Minha conta",   href: "/cliente/perfil",       accent: false },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0EA] pb-36">

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#2C1810]">
        {/* Texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        {/* Gold glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-amber-400/10 blur-3xl translate-x-20 -translate-y-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-amber-600/10 blur-2xl -translate-x-10 translate-y-10" />

        <div className="relative z-10 px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-8 max-w-lg mx-auto">

          {/* Top row */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-[10px] font-semibold text-amber-400/60 uppercase tracking-[0.3em] mb-0.5">
                {greeting}
              </p>
              <h1 className="text-[28px] font-black tracking-tight text-white leading-none">
                {firstName}
              </h1>
              <p className="text-[11px] text-white/30 mt-1.5 capitalize">
                {format(new Date(), "EEEE',' d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <button
              onClick={() => router.push("/cliente/perfil")}
              className="h-11 w-11 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center backdrop-blur-sm active:scale-95 transition-all"
            >
              <UserIcon size={18} className="text-white/70" />
            </button>
          </div>

          {/* CTA pill */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/cliente/servicos")}
            className="w-full flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-2xl shadow-black/30 active:scale-[0.99] transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-[#2C1810] flex items-center justify-center shrink-0">
              <Plus size={18} className="text-amber-400" strokeWidth={2.5} />
            </div>
            <div className="text-left flex-1">
              <p className="text-[11px] font-black text-[#2C1810] uppercase tracking-[0.2em] leading-none">
                Agendar agora
              </p>
              <p className="text-[10px] text-stone-400 mt-0.5">Escolha seu serviço preferido</p>
            </div>
            <div className="h-8 w-8 rounded-xl bg-[#F5F0EA] flex items-center justify-center shrink-0 group-hover:bg-[#2C1810] group-hover:text-amber-400 transition-all">
              <ArrowRight size={15} className="text-[#2C1810] group-hover:text-amber-400 transition-colors" />
            </div>
          </motion.button>

          {/* Tessy Nails wordmark */}
          <div className="flex items-center justify-center gap-2 mt-6 opacity-20">
            <div className="h-px flex-1 bg-white/40" />
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white">Tessy Nails</span>
            <div className="h-px flex-1 bg-white/40" />
          </div>
        </div>
      </div>

      {/* ── BODY ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 space-y-7 max-w-lg mx-auto">

        {/* ── PRÓXIMO AGENDAMENTO ─────────────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.2em]">Próximo horário</h2>
            {nextAppointment && (
              <button onClick={() => router.push("/cliente/agendamentos")}
                className="text-[10px] font-bold text-[#2C1810] flex items-center gap-0.5 hover:opacity-70 transition-opacity">
                Ver todos <ChevronRight size={11} />
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {nextAppointment ? (
              <motion.div
                key="appt"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                onClick={() => router.push("/cliente/agendamentos")}
                className="relative overflow-hidden rounded-3xl bg-[#2C1810] cursor-pointer active:scale-[0.99] transition-all shadow-xl shadow-[#2C1810]/20"
              >
                {/* Gold accent bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-600/0 via-amber-400 to-amber-600/0" />
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-[0.04]"
                  style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />

                <div className="relative z-10 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mb-1">Serviço</p>
                      <h3 className="text-lg font-black text-white leading-tight truncate">
                        {nextAppointment.service.name}
                      </h3>
                    </div>
                    <div className="shrink-0">
                      {STATUS[nextAppointment.status as keyof typeof STATUS] && (
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                          STATUS[nextAppointment.status as keyof typeof STATUS].bg,
                          STATUS[nextAppointment.status as keyof typeof STATUS].text,
                        )}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS[nextAppointment.status as keyof typeof STATUS].dot)} />
                          {STATUS[nextAppointment.status as keyof typeof STATUS].label}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Data */}
                    <div className="col-span-1 rounded-2xl bg-white/8 border border-white/8 p-3">
                      <Calendar size={12} className="text-amber-400 mb-1.5" />
                      <p className="text-[9px] text-white/40 leading-none mb-0.5">Data</p>
                      <p className="text-xs font-black text-white tabular-nums">
                        {format(nextAppointment.date, "dd/MM")}
                      </p>
                    </div>
                    {/* Hora */}
                    <div className="col-span-1 rounded-2xl bg-white/8 border border-white/8 p-3">
                      <Clock size={12} className="text-amber-400 mb-1.5" />
                      <p className="text-[9px] text-white/40 leading-none mb-0.5">Hora</p>
                      <p className="text-xs font-black text-white tabular-nums">
                        {nextAppointment.time?.time || format(nextAppointment.date, "HH:mm")}
                      </p>
                    </div>
                    {/* Countdown */}
                    <div className="col-span-1 rounded-2xl bg-white/8 border border-white/8 p-3 flex flex-col justify-between">
                      <Star size={12} className="text-amber-400 mb-1.5" />
                      <CountdownChip date={nextAppointment.date} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-3xl border-2 border-dashed border-stone-200 bg-white/60 backdrop-blur-sm p-8 text-center"
              >
                <div className="h-14 w-14 rounded-2xl bg-[#F5F0EA] mx-auto mb-4 flex items-center justify-center">
                  <Calendar size={22} className="text-stone-300" />
                </div>
                <p className="text-sm font-black text-stone-700 mb-1">Nenhum horário agendado</p>
                <p className="text-xs text-stone-400 mb-5">Reserve seu momento de cuidado</p>
                <button
                  onClick={() => router.push("/cliente/servicos")}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2C1810] text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  <Plus size={13} strokeWidth={3} /> Agendar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ── ATALHOS ─────────────────────────────────────────────────── */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.2em] mb-3">Acesso rápido</h2>
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.05 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => router.push(action.href)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm",
                  action.accent
                    ? "bg-[#2C1810] shadow-[#2C1810]/20 group-active:bg-[#1a0e08]"
                    : "bg-white border border-stone-100 group-active:bg-stone-50"
                )}>
                  <action.icon
                    size={20}
                    strokeWidth={action.accent ? 2.5 : 2}
                    className={action.accent ? "text-amber-400" : "text-stone-600"}
                  />
                </div>
                <span className="text-[10px] font-bold text-stone-500 text-center leading-tight">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* ── SERVIÇOS ────────────────────────────────────────────────── */}
        {services.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-black text-stone-400 uppercase tracking-[0.2em]">Serviços</h2>
              <button
                onClick={() => router.push("/cliente/servicos")}
                className="text-[10px] font-bold text-[#2C1810] flex items-center gap-0.5 hover:opacity-70 transition-opacity"
              >
                Ver todos <ChevronRight size={11} />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory">
              {services.map((service, i) => (
                <motion.button
                  key={service.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.18 + i * 0.04 }}
                  whileTap={{ scale: 0.96 }}
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
                  className="shrink-0 snap-start w-[140px] rounded-2xl bg-white border border-stone-100 overflow-hidden text-left shadow-sm hover:shadow-md transition-all group"
                >
                  {/* Colored top */}
                  <div className="h-1 bg-gradient-to-r from-[#2C1810] via-amber-700 to-[#2C1810]" />
                  {/* Icon area */}
                  <div className="h-20 bg-gradient-to-br from-[#F5F0EA] to-stone-100 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.06]"
                      style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #2C1810 1px, transparent 0)", backgroundSize: "12px 12px" }} />
                    <Sparkles size={22} className="text-[#2C1810]/20 group-hover:text-[#2C1810]/40 transition-colors relative z-10" strokeWidth={1.5} />
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <p className="text-[11px] font-bold text-stone-800 line-clamp-2 leading-tight mb-1.5">
                      {service.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black text-[#2C1810]">
                        R$ {service.price.toFixed(2)}
                      </p>
                      <p className="text-[9px] text-stone-400 font-medium">
                        {service.durationMinutes}min
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 pt-2 pb-4">
          <div className="h-px flex-1 bg-stone-200" />
          <div className="flex items-center gap-1.5 opacity-40">
            <Sparkles size={9} className="text-[#2C1810]" />
            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#2C1810]">
              Tessy Nails
            </span>
          </div>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

      </div>
    </div>
  );
}
