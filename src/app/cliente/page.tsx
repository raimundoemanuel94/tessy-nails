"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Bell, RefreshCw, Sparkles,
  Calendar, Clock, Plus, History, User as UserIcon,
} from "lucide-react";
import { appointmentService, AppointmentWithService } from "@/services/appointments";
import { AppointmentStorage } from "@/lib/appointmentStorage";
import { globalStore } from "@/store/globalStore";
import { format, isFuture, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Service } from "@/types";
import { cn } from "@/lib/utils";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { ClienteHomeSkeleton } from "@/components/cliente/ClienteSkeletons";

const STATUS = {
  confirmed: { label:"Confirmado", color:"#34D399", bg:"rgba(52,211,153,0.15)" },
  pending:   { label:"Pendente",   color:"#9D7FD4", bg:"rgba(157,127,212,0.15)" },
  completed: { label:"Concluído",  color:"#9B8FC0", bg:"rgba(155,143,192,0.12)" },
  cancelled: { label:"Cancelado",  color:"#F87171", bg:"rgba(248,113,113,0.12)" },
  no_show:   { label:"Ausente",    color:"#94A3B8", bg:"rgba(148,163,184,0.1)"  },
} as const;

function svcEmoji(n: string) {
  const l = n.toLowerCase();
  if (l.includes("ped"))                               return "🦶";
  if (l.includes("gel")||l.includes("fibra")||l.includes("acr")) return "💎";
  if (l.includes("spa"))                               return "🛁";
  if (l.includes("combo")||l.includes("casad"))        return "✨";
  if (l.includes("especial")||l.includes("prem"))      return "👑";
  return "💅";
}

function CountdownPill({ date }: { date: Date }) {
  const days = differenceInDays(date, new Date());
  if (isToday(date)) return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest"
      style={{ background:"rgba(52,211,153,0.15)", color:"#34D399" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />Hoje
    </span>
  );
  if (days === 1) return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest"
      style={{ background:"rgba(157,127,212,0.15)", color:"#C4A8E8" }}>Amanhã</span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest"
      style={{ background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)" }}>
      Em {days}d
    </span>
  );
}

function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  let startY = 0;
  const onTouchStart = (e: React.TouchEvent) => { startY = e.touches[0].clientY; };
  const onTouchMove  = (e: React.TouchEvent) => {
    const el = e.currentTarget as HTMLElement;
    if (el.scrollTop > 0) return;
    const d = e.touches[0].clientY - startY;
    if (d > 0) setPullY(Math.min(d * 0.4, 70));
  };
  const onTouchEnd = async () => {
    if (pullY >= 60 && !refreshing) {
      setRefreshing(true); setPullY(0);
      await onRefresh();
      setRefreshing(false);
    } else setPullY(0);
  };
  return { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd };
}

export default function ClientePage() {
  const { user, loading: authLoading } = useProtectedRoute("client");
  const router = useRouter();
  const [nextAppt, setNextAppt] = useState<AppointmentWithService | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [notifCount, setNotifCount] = useState(0);

  const loadData = useCallback(async (force = false) => {
    if (!user) return;
    const cached = globalStore.getState().services;
    if (cached?.length && !force) { setServices(cached.slice(0,8)); setLoading(false); }
    const [a, s] = await Promise.allSettled([
      appointmentService.getByClientIdWithServices(user.uid, 20),
      globalStore.fetchServices(force),
    ]);
    if (a.status === "fulfilled") {
      const up = a.value
        .filter(x => (isFuture(x.date)||isToday(x.date)) && x.status !== "cancelled" && x.status !== "no_show")
        .sort((a,b) => a.date.getTime()-b.date.getTime());
      setNextAppt(up[0]??null);
      setNotifCount(a.value.filter(x => x.status==="confirmed" && isFuture(x.date)).length);
    }
    if (s.status === "fulfilled") setServices(s.value.slice(0,8));
    setLoading(false);
  }, [user]);

  useEffect(() => { void loadData(); }, [loadData]);

  const { pullY, refreshing, onTouchStart, onTouchMove, onTouchEnd } =
    usePullToRefresh(() => loadData(true));

  if (authLoading || (loading && services.length === 0)) return <ClienteHomeSkeleton />;
  if (!user) return null;

  const name  = user.name?.split(" ")[0] || "Olá";
  const hour  = new Date().getHours();
  const greet = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const st    = nextAppt ? STATUS[nextAppt.status as keyof typeof STATUS] : null;

  const quickActions = [
    { emoji:"💅", label:"Agendar",   href:"/cliente/servicos"     },
    { emoji:"📅", label:"Agenda",    href:"/cliente/agendamentos" },
    { emoji:"🕐", label:"Histórico", href:"/cliente/agendamentos" },
    { emoji:"👤", label:"Perfil",    href:"/cliente/perfil"       },
  ];

  return (
    <div className="min-h-dvh" style={{ background:"#F7F4FF" }}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

      {/* Pull indicator */}
      <AnimatePresence>
        {(pullY > 10 || refreshing) && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed top-0 inset-x-0 z-[100] flex justify-center"
            style={{ paddingTop:"calc(env(safe-area-inset-top) + 8px)" }}>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ background:"#1E1A2E", border:"1px solid rgba(157,127,212,0.2)" }}>
              <motion.div animate={{ rotate: refreshing ? 360 : pullY*3 }}
                transition={refreshing ? { duration:0.8, repeat:Infinity, ease:"linear" } : {}}>
                <RefreshCw size={11} className="text-[#9D7FD4]" />
              </motion.div>
              <span className="text-[8px] font-black text-[#9D7FD4] uppercase tracking-widest">
                {refreshing ? "Atualizando..." : pullY>=60 ? "Solte" : "Puxe para atualizar"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #080518 0%, #100C24 40%, #1A1038 100%)",
          paddingTop: "env(safe-area-inset-top)",
        }}>
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background:"radial-gradient(circle, rgba(157,127,212,0.18) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 -left-16 w-48 h-48 rounded-full pointer-events-none"
          style={{ background:"radial-gradient(circle, rgba(124,92,191,0.1) 0%, transparent 70%)" }} />
        {/* Dots grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage:"radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize:"18px 18px" }} />

        <div className="relative z-10 px-5 pt-5 max-w-lg mx-auto">
          {/* Row topo */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[8px] font-semibold uppercase tracking-[0.4em] mb-1"
                style={{ color:"rgba(157,127,212,0.55)" }}>{greet}</p>
              <h1 className="text-[26px] font-bold text-white leading-none"
                style={{ fontFamily:"var(--font-display)" }}>
                {name} <span className="not-italic text-[22px]">✨</span>
              </h1>
              <p className="text-[8px] mt-1 capitalize"
                style={{ color:"rgba(255,255,255,0.2)" }}>
                {format(new Date(), "EEEE, d 'de' MMMM", { locale:ptBR })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.button whileTap={{ scale:0.88 }}
                onClick={() => router.push("/cliente/agendamentos")}
                className="relative h-9 w-9 rounded-[13px] flex items-center justify-center"
                style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.08)" }}>
                <Bell size={15} style={{ color:"rgba(255,255,255,0.5)" }} />
                {notifCount > 0 && (
                  <motion.span initial={{ scale:0 }} animate={{ scale:1 }}
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-[8px] font-black text-white flex items-center justify-center"
                    style={{ background:"linear-gradient(135deg,#7C5CBF,#9D7FD4)" }}>
                    {notifCount}
                  </motion.span>
                )}
              </motion.button>
              <motion.button whileTap={{ scale:0.88 }}
                onClick={() => router.push("/cliente/perfil")}
                className="h-9 w-9 rounded-[13px] flex items-center justify-center text-[13px] font-bold text-white overflow-hidden"
                style={{ background:"linear-gradient(135deg,#5A3F9A,#9D7FD4)" }}>
                {user.photoURL
                  ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  : name.charAt(0).toUpperCase()
                }
              </motion.button>
            </div>
          </div>

          {/* Próximo agendamento */}
          <AnimatePresence mode="wait">
            {nextAppt ? (
              <motion.button key="appt"
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                whileTap={{ scale:0.98 }}
                onClick={() => router.push("/cliente/agendamentos")}
                className="w-full text-left rounded-2xl overflow-hidden mb-5"
                style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(157,127,212,0.2)", backdropFilter:"blur(20px)" }}>
                {/* linha topo */}
                <div className="h-[2px]" style={{ background:"linear-gradient(90deg, transparent, #9D7FD4, #C4A8E8, transparent)" }} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[7px] font-bold uppercase tracking-[0.3em] mb-1"
                        style={{ color:"rgba(157,127,212,0.5)" }}>✦ próximo agendamento</p>
                      <h3 className="text-[15px] font-bold text-white leading-tight"
                        style={{ fontFamily:"var(--font-display)", fontStyle:"italic" }}>
                        {nextAppt.service.name}
                      </h3>
                    </div>
                    {st && (
                      <span className="shrink-0 text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-full"
                        style={{ background:st.bg, color:st.color }}>
                        {st.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                      style={{ background:"rgba(255,255,255,0.08)" }}>
                      <Calendar size={9} style={{ color:"rgba(196,168,232,0.7)" }} />
                      <span className="text-[8px] font-bold tabular-nums"
                        style={{ color:"rgba(255,255,255,0.7)" }}>
                        {format(nextAppt.date,"dd/MM")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                      style={{ background:"rgba(255,255,255,0.08)" }}>
                      <Clock size={9} style={{ color:"rgba(196,168,232,0.7)" }} />
                      <span className="text-[8px] font-bold tabular-nums"
                        style={{ color:"rgba(255,255,255,0.7)" }}>
                        {nextAppt.time?.time || format(nextAppt.date,"HH:mm")}
                      </span>
                    </div>
                    <CountdownPill date={nextAppt.date} />
                    <div className="flex-1 flex justify-end">
                      <ChevronRight size={13} style={{ color:"rgba(255,255,255,0.2)" }} />
                    </div>
                  </div>
                </div>
              </motion.button>
            ) : (
              <motion.button key="no-appt"
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                whileTap={{ scale:0.98 }}
                onClick={() => router.push("/cliente/servicos")}
                className="w-full text-left rounded-2xl p-4 mb-5 flex items-center gap-3"
                style={{ background:"rgba(157,127,212,0.1)", border:"1.5px dashed rgba(157,127,212,0.25)" }}>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background:"rgba(157,127,212,0.15)" }}>
                  <Sparkles size={16} style={{ color:"#C4A8E8" }} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold" style={{ color:"rgba(255,255,255,0.75)" }}>Sem horário agendado</p>
                  <p className="text-[8px] mt-0.5" style={{ color:"rgba(255,255,255,0.3)" }}>Toque para reservar seu momento</p>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl"
                  style={{ background:"rgba(157,127,212,0.2)", color:"#C4A8E8", border:"1px solid rgba(157,127,212,0.3)" }}>
                  Agendar
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-2 pb-6">
            {quickActions.map((a, i) => (
              <motion.button key={a.label}
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.08 + i*0.04 }} whileTap={{ scale:0.88 }}
                onClick={() => router.push(a.href)}
                className="flex flex-col items-center gap-1.5">
                <div className="h-12 w-12 rounded-[14px] flex items-center justify-center text-xl"
                  style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(157,127,212,0.15)" }}>
                  {a.emoji}
                </div>
                <span className="text-[7px] font-semibold" style={{ color:"rgba(255,255,255,0.35)" }}>{a.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Curva */}
        <div className="relative h-6 -mb-px"
          style={{ background:"linear-gradient(160deg, #080518, #1A1038)" }}>
          <div className="absolute bottom-0 inset-x-0 h-6 bg-[#F7F4FF] rounded-t-[28px]" />
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))] max-w-lg mx-auto space-y-5">

        {services.length > 0 && (
          <motion.section initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-[#9B8FC0]">
                ✦ Serviços
              </p>
              <button onClick={() => router.push("/cliente/servicos")}
                className="text-[9px] font-semibold text-[#9D7FD4] flex items-center gap-0.5">
                Ver todos <ChevronRight size={10} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {services.slice(0,3).map((svc, i) => (
                <motion.button key={svc.id}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:0.14 + i*0.05 }} whileTap={{ scale:0.97 }}
                  onClick={() => {
                    AppointmentStorage.saveSelectedService({
                      id:svc.id, name:svc.name, description:svc.description,
                      price:`R$ ${svc.price.toFixed(2)}`, duration:`${svc.durationMinutes}min`,
                    });
                    AppointmentStorage.clearAppointmentData();
                    AppointmentStorage.clearSelectedDate();
                    router.push("/cliente/agendar");
                  }}
                  className="text-left rounded-2xl bg-white p-4 group transition-all"
                  style={{ border:"1px solid #EDE5FF", boxShadow:"0 2px 16px rgba(157,127,212,0.06)" }}>
                  <div className="text-2xl mb-2.5">{svcEmoji(svc.name)}</div>
                  <p className="text-[11px] font-bold text-[#1E1A2E] leading-tight mb-1 line-clamp-2">{svc.name}</p>
                  <p className="text-[13px] font-bold" style={{ color:"#7C5CBF", fontFamily:"var(--font-display)" }}>
                    R$ {svc.price.toFixed(2)}
                  </p>
                  <p className="text-[8px] text-[#9B8FC0] mt-0.5">{svc.durationMinutes}min</p>
                </motion.button>
              ))}

              {/* Ver todos */}
              <motion.button
                initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.29 }} whileTap={{ scale:0.97 }}
                onClick={() => router.push("/cliente/servicos")}
                className="rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all"
                style={{ border:"1.5px dashed #DDD5F5" }}>
                <div className="h-8 w-8 rounded-[10px] flex items-center justify-center"
                  style={{ background:"#EDE5FF" }}>
                  <Plus size={15} className="text-[#9D7FD4]" />
                </div>
                <p className="text-[8px] font-black uppercase tracking-widest text-[#9B8FC0]">Ver todos</p>
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* Rodapé */}
        <div className="flex items-center gap-2 py-1 opacity-20">
          <div className="h-px flex-1 bg-[#DDD5F5]" />
          <span className="text-[8px] font-bold italic tracking-[0.5em] text-[#9D7FD4]"
            style={{ fontFamily:"var(--font-display)" }}>nailit</span>
          <div className="h-px flex-1 bg-[#DDD5F5]" />
        </div>
      </div>
    </div>
  );
}
