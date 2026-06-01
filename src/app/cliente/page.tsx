"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Calendar, Clock, User as UserIcon, Plus, Sparkles,
  ChevronRight, Bell, RefreshCw, Scissors, Heart,
  Zap, History,
} from "lucide-react";
import { appointmentService, AppointmentWithService } from "@/services/appointments";
import { AppointmentStorage } from "@/lib/appointmentStorage";
import { globalStore } from "@/store/globalStore";
import { format, isFuture, isToday, differenceInDays, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Service } from "@/types";
import { cn } from "@/lib/utils";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { ClienteHomeSkeleton } from "@/components/cliente/ClienteSkeletons";

const STATUS = {
  confirmed: { label:"Confirmado", dot:"bg-emerald-400", badge:"bg-emerald-50 text-emerald-700 border-emerald-200", glow:"rgba(52,211,153,0.2)" },
  pending:   { label:"Pendente",   dot:"bg-[#9D7FD4]",   badge:"bg-[#EDE5FF] text-[#7C5CBF] border-[#DDD5F5]",   glow:"rgba(157,127,212,0.2)" },
  completed: { label:"Concluído",  dot:"bg-[#9B8FC0]",   badge:"bg-[#F0EBFF] text-[#6B6480] border-[#EDE5FF]",   glow:"rgba(155,143,192,0.15)" },
  cancelled: { label:"Cancelado",  dot:"bg-red-400",     badge:"bg-red-50 text-red-600 border-red-200",           glow:"rgba(248,113,113,0.15)" },
  no_show:   { label:"Ausente",    dot:"bg-slate-300",   badge:"bg-slate-50 text-slate-500 border-slate-200",     glow:"rgba(148,163,184,0.1)" },
} as const;

// Emojis por serviço
function svcEmoji(name: string) {
  const n = name.toLowerCase();
  if (n.includes("ped"))       return "🦶";
  if (n.includes("gel") || n.includes("fibra") || n.includes("acr")) return "💎";
  if (n.includes("spa"))       return "🛁";
  if (n.includes("combo") || n.includes("casad")) return "✨";
  if (n.includes("especial") || n.includes("prem")) return "👑";
  return "💅";
}

function CountdownBadge({ date }: { date: Date }) {
  const days = differenceInDays(date, new Date());
  if (isToday(date))  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Hoje
    </span>
  );
  if (days === 1) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#9D7FD4]/20 border border-[#9D7FD4]/30 text-[9px] font-black text-[#C4B0E8] uppercase tracking-widest">
      Amanhã
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[9px] font-black text-white/60 uppercase tracking-widest">
      Em {days} dias
    </span>
  );
}

// Hook pull-to-refresh
function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  let startY = 0;

  const onTouchStart = (e: React.TouchEvent) => {
    startY = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const el = e.currentTarget as HTMLElement;
    if (el.scrollTop > 0) return;
    const diff = e.touches[0].clientY - startY;
    if (diff > 0) setPullY(Math.min(diff * 0.4, 70));
  };
  const onTouchEnd = async () => {
    if (pullY >= 60 && !refreshing) {
      setRefreshing(true);
      setPullY(0);
      await onRefresh();
      setRefreshing(false);
    } else {
      setPullY(0);
    }
  };

  return { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd };
}

export default function ClientePage() {
  const { user, loading: authLoading } = useProtectedRoute("client");
  const router = useRouter();

  const [nextAppt, setNextAppt] = useState<AppointmentWithService | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);
  const [notifCount, setNotifCount] = useState(0);

  const loadData = useCallback(async (force = false) => {
    if (!user) return;
    const cached = globalStore.getState().services;
    if (cached?.length && !force) {
      setServices(cached.slice(0, 8));
      setLoading(false);
    }
    const [a, s] = await Promise.allSettled([
      appointmentService.getByClientIdWithServices(user.uid, 20),
      globalStore.fetchServices(force),
    ]);
    if (a.status === "fulfilled") {
      const upcoming = a.value
        .filter(x => (isFuture(x.date) || isToday(x.date)) && x.status !== "cancelled" && x.status !== "no_show")
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      setNextAppt(upcoming[0] ?? null);
      // Pendentes = notificações
      const pending = a.value.filter(x => x.status === "confirmed" && isFuture(x.date)).length;
      setNotifCount(pending);
    }
    if (s.status === "fulfilled") setServices(s.value.slice(0, 8));
    setLoading(false);
  }, [user]);

  useEffect(() => { void loadData(); }, [loadData]);

  const { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd } =
    usePullToRefresh(() => loadData(true));

  if (authLoading || (loading && services.length === 0)) return <ClienteHomeSkeleton />;
  if (!user) return null;

  const name   = user.name?.split(" ")[0] || "Olá";
  const hour   = new Date().getHours();
  const greet  = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const st     = nextAppt ? STATUS[nextAppt.status as keyof typeof STATUS] : null;
  const days   = nextAppt ? differenceInDays(nextAppt.date, new Date()) : null;

  const quickActions = [
    { icon: Sparkles,  label: "Agendar",   href: "/cliente/servicos",     emoji: "💅" },
    { icon: Calendar,  label: "Agenda",    href: "/cliente/agendamentos", emoji: "📅" },
    { icon: History,   label: "Histórico", href: "/cliente/agendamentos", emoji: "🕐" },
    { icon: UserIcon,  label: "Perfil",    href: "/cliente/perfil",       emoji: "👤" },
  ];

  return (
    <div
      className="min-h-dvh"
      style={{ background: "#FAF8FF" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {(pullY > 10 || refreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 inset-x-0 z-[100] flex justify-center"
            style={{ paddingTop: `calc(env(safe-area-inset-top) + 8px)` }}
          >
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E1A2E] border border-[#9D7FD4]/20 shadow-lg">
              <motion.div animate={{ rotate: refreshing ? 360 : pullY * 3 }}
                transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}>
                <RefreshCw size={12} className="text-[#9D7FD4]" />
              </motion.div>
              <span className="text-[9px] font-black text-[#9D7FD4] uppercase tracking-widest">
                {refreshing ? "Atualizando..." : pullY >= 60 ? "Solte para atualizar" : "Puxe para atualizar"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ESCURO ──────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0F0C1E 0%, #1E1A2E 45%, #2A1A4E 100%)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        {/* Elementos decorativos */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #9D7FD4, transparent)" }} />
          <div className="absolute top-1/2 left-0 w-48 h-48 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #7C5CBF, transparent)" }} />
          {/* Grade pontilhada */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #9D7FD4 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        </div>

        <div className="relative z-10 px-5 pt-5 max-w-lg mx-auto">

          {/* Row topo: greeting + notif + avatar */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[9px] font-bold text-[#9D7FD4]/60 uppercase tracking-[0.4em] mb-1">{greet}</p>
              <h1 className="text-[26px] font-black text-white leading-none tracking-tight">
                {name} <span className="text-[22px]">💜</span>
              </h1>
              <p className="text-[9px] text-white/25 mt-1 capitalize">
                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Notificações */}
              <motion.button whileTap={{ scale: 0.88 }}
                onClick={() => router.push("/cliente/agendamentos")}
                className="relative h-10 w-10 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center">
                <Bell size={16} className="text-white/60" />
                {notifCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-[8px] font-black text-white flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #7C5CBF, #9D7FD4)" }}>
                    {notifCount}
                  </motion.span>
                )}
              </motion.button>
              {/* Avatar */}
              <motion.button whileTap={{ scale: 0.88 }}
                onClick={() => router.push("/cliente/perfil")}
                className="h-10 w-10 rounded-2xl border border-white/15 flex items-center justify-center text-sm font-black text-white overflow-hidden"
                style={{ background: "linear-gradient(135deg, #7C5CBF, #9D7FD4)" }}>
                {user.photoURL
                  ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  : <span>{name.charAt(0).toUpperCase()}</span>
                }
              </motion.button>
            </div>
          </div>

          {/* ── PRÓXIMO AGENDAMENTO (dentro do hero) ─────────────── */}
          <AnimatePresence mode="wait">
            {nextAppt ? (
              <motion.button
                key="appt"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/cliente/agendamentos")}
                className="w-full text-left rounded-2xl overflow-hidden mb-5"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(157,127,212,0.25)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* Barra gradiente top */}
                <div className="h-0.5" style={{ background: "linear-gradient(90deg, transparent, #9D7FD4, #C4B0E8, transparent)" }} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[8px] font-bold text-[#9D7FD4]/60 uppercase tracking-[0.3em] mb-1">
                        ✦ Próximo agendamento
                      </p>
                      <h3 className="text-[15px] font-black text-white leading-tight">
                        {nextAppt.service.name}
                      </h3>
                    </div>
                    {st && (
                      <span className={cn("shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border", st.badge)}>
                        <span className={cn("h-1 w-1 rounded-full", st.dot)} />{st.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10">
                      <Calendar size={10} className="text-[#C4B0E8]" />
                      <span className="text-[9px] font-black text-white/80 tabular-nums">
                        {format(nextAppt.date, "dd/MM")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10">
                      <Clock size={10} className="text-[#C4B0E8]" />
                      <span className="text-[9px] font-black text-white/80 tabular-nums">
                        {nextAppt.time?.time || format(nextAppt.date, "HH:mm")}
                      </span>
                    </div>
                    <CountdownBadge date={nextAppt.date} />
                    <div className="flex-1 flex justify-end">
                      <ChevronRight size={14} className="text-white/30" />
                    </div>
                  </div>
                </div>
              </motion.button>
            ) : (
              <motion.button
                key="no-appt"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/cliente/servicos")}
                className="w-full text-left rounded-2xl p-4 mb-5 flex items-center gap-3"
                style={{
                  background: "rgba(157,127,212,0.12)",
                  border: "1.5px dashed rgba(157,127,212,0.3)",
                }}
              >
                <div className="h-10 w-10 rounded-xl bg-[#9D7FD4]/20 flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-[#C4B0E8]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-white/80">Sem horário agendado</p>
                  <p className="text-[9px] text-white/40 mt-0.5">Toque para reservar seu momento</p>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[#9D7FD4]/20 border border-[#9D7FD4]/30">
                  <span className="text-[9px] font-black text-[#C4B0E8] uppercase tracking-widest">Agendar</span>
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* ── QUICK ACTIONS (dentro do hero) ───────────────────── */}
          <div className="grid grid-cols-4 gap-2 pb-6">
            {quickActions.map((a, i) => (
              <motion.button key={a.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileTap={{ scale: 0.88 }}
                onClick={() => router.push(a.href)}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(157,127,212,0.2)",
                  }}>
                  {a.emoji}
                </div>
                <span className="text-[8px] font-bold text-white/40">{a.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Curva de transição hero → body */}
        <div className="relative h-5 -mb-px"
          style={{ background: "linear-gradient(160deg, #0F0C1E 0%, #2A1A4E 100%)" }}>
          <div className="absolute bottom-0 inset-x-0 h-5 bg-[#FAF8FF] rounded-t-[28px]" />
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-[calc(7rem+env(safe-area-inset-bottom))] max-w-lg mx-auto space-y-6">

        {/* Serviços em grid 2x2 */}
        {services.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black text-[#9B8FC0] uppercase tracking-[0.28em]">
                ✦ Serviços
              </p>
              <button onClick={() => router.push("/cliente/servicos")}
                className="text-[9px] font-bold text-[#9D7FD4] flex items-center gap-0.5">
                Ver todos <ChevronRight size={10} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {services.slice(0, 3).map((svc, i) => (
                <motion.button key={svc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + i * 0.06 }}
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
                  className="text-left rounded-2xl bg-white border border-[#EDE5FF] p-4 shadow-sm hover:border-[#C4B0E8] transition-all group"
                >
                  <div className="text-2xl mb-2">{svcEmoji(svc.name)}</div>
                  <p className="text-[12px] font-black text-[#1E1A2E] leading-tight mb-1 line-clamp-2">{svc.name}</p>
                  <p className="text-[12px] font-black text-[#7C5CBF]">R$ {svc.price.toFixed(2)}</p>
                  <p className="text-[9px] text-[#9B8FC0] mt-0.5">{svc.durationMinutes}min</p>
                </motion.button>
              ))}

              {/* Card "Ver todos" */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => router.push("/cliente/servicos")}
                className="text-left rounded-2xl border-2 border-dashed border-[#DDD5F5] p-4 flex flex-col items-center justify-center gap-2 group hover:border-[#9D7FD4]/50 transition-all"
              >
                <div className="h-8 w-8 rounded-xl bg-[#EDE5FF] flex items-center justify-center">
                  <Plus size={16} className="text-[#9D7FD4]" />
                </div>
                <p className="text-[9px] font-black text-[#9B8FC0] uppercase tracking-widest text-center">
                  Ver todos
                </p>
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* Rodapé */}
        <div className="flex items-center gap-3 pt-1 pb-2 opacity-20">
          <div className="h-px flex-1 bg-[#DDD5F5]" />
          <span className="text-[8px] font-black uppercase tracking-[0.5em] text-[#9D7FD4]" style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>
            nailit
          </span>
          <div className="h-px flex-1 bg-[#DDD5F5]" />
        </div>
      </div>
    </div>
  );
}
