"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, User as UserIcon, Plus, Sparkles, ChevronRight, Heart, Scissors } from "lucide-react";
import { appointmentService, AppointmentWithService } from "@/services/appointments";
import { AppointmentStorage } from "@/lib/appointmentStorage";
import { globalStore } from "@/store/globalStore";
import { format, isFuture, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Service } from "@/types";
import { cn } from "@/lib/utils";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { ClienteHomeSkeleton } from "@/components/cliente/ClienteSkeletons";

const C = {
  dark:   "#1E1A2E",
  accent: "#9D7FD4",
  deep:   "#7C5CBF",
  bg:     "#FAF8FF",
  soft:   "#EDE5FF",
  muted:  "#9B8FC0",
  ink:    "#2A2440",
} as const;

const STATUS = {
  confirmed: { label: "Confirmado", dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700" },
  pending:   { label: "Pendente",   dot: "bg-[#9D7FD4]",   badge: "bg-[#EDE5FF] text-[#7C5CBF]"  },
  completed: { label: "Concluído",  dot: "bg-[#9B8FC0]",   badge: "bg-[#F0EBFF] text-[#6B6480]"  },
  cancelled: { label: "Cancelado",  dot: "bg-red-400",     badge: "bg-red-50 text-red-600"        },
  no_show:   { label: "Ausente",    dot: "bg-slate-300",   badge: "bg-slate-50 text-slate-500"    },
} as const;

function DaysChip({ date }: { date: Date }) {
  const days = differenceInDays(date, new Date());
  if (isToday(date)) return (
    <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-[#9D7FD4] uppercase tracking-widest">
      <span className="h-1.5 w-1.5 rounded-full bg-[#9D7FD4] animate-pulse" />
      Hoje
    </span>
  );
  if (days === 1) return <span className="text-[9px] font-black text-[#9B8FC0] uppercase tracking-widest">Amanhã</span>;
  return <span className="text-[9px] font-black text-[#9B8FC0] uppercase tracking-widest">Em {days}d</span>;
}

export default function ClientePage() {
  const { user, loading: authLoading } = useProtectedRoute("client");
  const router = useRouter();
  const [nextAppt, setNextAppt]     = useState<AppointmentWithService | null>(null);
  const [services, setServices]     = useState<Service[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.allSettled([
      appointmentService.getByClientIdWithServices(user.uid),
      globalStore.fetchServices(false),
    ]).then(([a, s]) => {
      if (a.status === "fulfilled") {
        const up = a.value
          .filter(x => (isFuture(x.date) || isToday(x.date)) && x.status !== "cancelled" && x.status !== "no_show")
          .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
        setNextAppt(up ?? null);
      }
      if (s.status === "fulfilled") setServices(s.value.slice(0, 8));
    }).finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) return <ClienteHomeSkeleton />;
  if (!user) return null;

  const name  = user.name?.split(" ")[0] || "Olá";
  const hour  = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const st    = nextAppt ? STATUS[nextAppt.status as keyof typeof STATUS] : null;

  const actions = [
    { id:"agenda",   icon: Calendar,  label: "Agenda",   sub: "Meus horários", href: "/cliente/agendamentos" },
    { id:"servicos", icon: Scissors,  label: "Serviços", sub: "Ver catálogo",  href: "/cliente/servicos"     },
    { id:"perfil",   icon: UserIcon,  label: "Perfil",   sub: "Minha conta",   href: "/cliente/perfil"       },
    { id:"novo",     icon: Heart,     label: "Favoritos",sub: "Em breve",       href: "/cliente"              },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8FF]">

      {/* ── HERO ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(145deg, #1E1A2E 0%, #2A2044 60%, #1A1830 100%)" }}>
        <div className="absolute inset-0 tn-dot-pattern opacity-30" />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#9D7FD4]/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-[#7C5CBF]/25 blur-2xl" />

        <div className="relative z-10 px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-7 max-w-lg mx-auto">
          {/* Row topo */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold text-[#9D7FD4]/70 uppercase tracking-[0.35em] mb-1">{greet}</p>
              <h1 className="text-2xl font-black text-white leading-none tracking-tight">{name} ✨</h1>
              <p className="text-[10px] text-white/30 mt-1.5 capitalize">
                {format(new Date(), "EEEE',' d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => router.push("/cliente/perfil")}
              className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <UserIcon size={16} className="text-white/70" />
            </motion.button>
          </div>

          {/* CTA principal */}
          <motion.button whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/cliente/servicos")}
            className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-2xl shadow-black/30 group"
          >
            <div className="h-9 w-9 rounded-xl bg-[#EDE5FF] flex items-center justify-center shrink-0">
              <Plus size={17} className="text-[#7C5CBF]" strokeWidth={2.5} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[11px] font-black text-[#1E1A2E] uppercase tracking-[0.18em] leading-none">Agendar agora</p>
              <p className="text-[10px] text-[#9B8FC0] mt-0.5">Escolha seu serviço</p>
            </div>
            <div className="h-7 w-7 rounded-lg bg-[#EDE5FF] flex items-center justify-center group-hover:bg-[#9D7FD4] transition-colors">
              <ChevronRight size={14} className="text-[#7C5CBF] group-hover:text-white transition-colors" />
            </div>
          </motion.button>
        </div>
      </div>

      <div className="px-5 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))] max-w-lg mx-auto space-y-6">

        {/* ── PRÓXIMO AGENDAMENTO ──────────────────────────────── */}
        <motion.section initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[9px] font-black text-[#9B8FC0] uppercase tracking-[0.28em]">Próximo horário</p>
            {nextAppt && (
              <button onClick={() => router.push("/cliente/agendamentos")}
                className="text-[9px] font-bold text-[#9D7FD4] flex items-center gap-0.5">
                Ver todos <ChevronRight size={10} />
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {nextAppt ? (
              <motion.div key="appt"
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                onClick={() => router.push("/cliente/agendamentos")}
                className="rounded-2xl bg-white border border-[#EDE5FF] shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-all"
              >
                {/* Faixa accent */}
                <div className="h-1" style={{ background: "linear-gradient(90deg, #7C5CBF, #9D7FD4, #C4B0E8)" }} />
                <div className="p-4">
                  {/* Header do card */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-2 min-w-0">
                      <p className="text-[8px] font-bold text-[#9B8FC0] uppercase tracking-widest mb-0.5">Serviço</p>
                      <h3 className="text-[15px] font-black text-[#1E1A2E] leading-tight truncate">
                        {nextAppt.service.name}
                      </h3>
                    </div>
                    {st && (
                      <span className={cn("shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest", st.badge)}>
                        <span className={cn("h-1 w-1 rounded-full", st.dot)} />
                        {st.label}
                      </span>
                    )}
                  </div>
                  {/* Info row */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-1.5 bg-[#FAF8FF] rounded-xl px-3 py-2">
                      <Calendar size={11} className="text-[#9D7FD4] shrink-0" />
                      <span className="text-[10px] font-black text-[#2A2440] tabular-nums">
                        {format(nextAppt.date, "dd/MM")}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center gap-1.5 bg-[#FAF8FF] rounded-xl px-3 py-2">
                      <Clock size={11} className="text-[#9D7FD4] shrink-0" />
                      <span className="text-[10px] font-black text-[#2A2440] tabular-nums">
                        {nextAppt.time?.time || format(nextAppt.date, "HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center px-3 py-2 bg-[#FAF8FF] rounded-xl">
                      <DaysChip date={nextAppt.date} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="rounded-2xl bg-white border border-dashed border-[#DDD5F5] p-7 flex flex-col items-center text-center gap-3"
              >
                <div className="h-12 w-12 rounded-2xl bg-[#EDE5FF] flex items-center justify-center">
                  <Calendar size={20} className="text-[#9D7FD4]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-black text-[#2A2440] mb-0.5">Sem horário agendado</p>
                  <p className="text-xs text-[#9B8FC0]">Reserve seu momento de autocuidado ✨</p>
                </div>
                <button onClick={() => router.push("/cliente/servicos")}
                  className="mt-1 px-5 py-2 rounded-full text-xs font-black text-white uppercase tracking-widest"
                  style={{ background: "linear-gradient(135deg, #7C5CBF, #9D7FD4)" }}>
                  Agendar agora
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ── ATALHOS ─────────────────────────────────────────── */}
        <motion.section initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
          <p className="text-[9px] font-black text-[#9B8FC0] uppercase tracking-[0.28em] mb-2.5">Acesso rápido</p>
          <div className="grid grid-cols-4 gap-2">
            {actions.map((a, i) => (
              <motion.button key={a.id}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: 0.12 + i * 0.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => router.push(a.href)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="h-14 w-14 rounded-2xl bg-white border border-[#EDE5FF] flex items-center justify-center shadow-sm group-hover:border-[#9D7FD4]/40 group-hover:bg-[#EDE5FF] transition-all duration-200">
                  <a.icon size={20} strokeWidth={1.6} className="text-[#7C5CBF] group-hover:text-[#5A3F9A] transition-colors" />
                </div>
                <span className="text-[9px] font-bold text-[#9B8FC0] leading-tight text-center">{a.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* ── SERVIÇOS ─────────────────────────────────────────── */}
        {services.length > 0 && (
          <motion.section initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[9px] font-black text-[#9B8FC0] uppercase tracking-[0.28em]">Para você</p>
              <button onClick={() => router.push("/cliente/servicos")}
                className="text-[9px] font-bold text-[#9D7FD4] flex items-center gap-0.5">
                Ver todos <ChevronRight size={10} />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory">
              {services.map((svc, i) => (
                <motion.button key={svc.id}
                  initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: 0.18 + i * 0.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    AppointmentStorage.saveSelectedService({
                      id: svc.id, name: svc.name, description: svc.description,
                      price: `R$ ${svc.price.toFixed(2)}`, duration: `${svc.durationMinutes}min`,
                    });
                    AppointmentStorage.clearAppointmentData();
                    AppointmentStorage.clearSelectedDate();
                    router.push("/cliente/agendar");
                  }}
                  className="shrink-0 snap-start w-[136px] rounded-2xl bg-white border border-[#EDE5FF] overflow-hidden text-left shadow-sm group"
                >
                  {/* Área de imagem */}
                  <div className="h-[68px] flex items-center justify-center relative overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #FAF8FF 0%, #EDE5FF 100%)" }}>
                    <Sparkles size={24} className="text-[#9D7FD4]/40 group-hover:text-[#7C5CBF]/60 transition-colors" strokeWidth={1.2} />
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] font-black text-[#1E1A2E] line-clamp-1 mb-1">{svc.name}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black text-[#7C5CBF]">R$ {svc.price.toFixed(2)}</p>
                      <p className="text-[9px] text-[#9B8FC0]">{svc.durationMinutes}min</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 pt-1 pb-2 opacity-30">
          <div className="h-px flex-1 bg-[#DDD5F5]" />
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#9B8FC0]">Tessy Nails</span>
          <div className="h-px flex-1 bg-[#DDD5F5]" />
        </div>

      </div>
    </div>
  );
}
