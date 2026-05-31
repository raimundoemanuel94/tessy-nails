"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  Calendar, Clock, Sparkles, Home, CalendarDays, CheckCircle,
} from "lucide-react";

interface ConfirmedAppointment {
  id: string;
  service: { id: string; name: string; price: string; duration: string; };
  date: Date;
  time: { id: string; time: string; available: boolean; };
  clientName: string;
  observation?: string;
}

// ── Confetti particle ──────────────────────────────────────────────────────
function Particle({ delay, x, color }: { delay: number; x: number; color: string }) {
  return (
    <motion.div
      className="absolute top-0 rounded-full pointer-events-none"
      style={{ left: `${x}%`, width: 6, height: 6, backgroundColor: color }}
      initial={{ y: -10, opacity: 1, scale: 1 }}
      animate={{ y: 120, opacity: 0, scale: 0.5, x: [0, Math.random() * 40 - 20] }}
      transition={{ duration: 1.5, delay, ease: "easeOut" }}
    />
  );
}

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  x: Math.random() * 100,
  delay: i * 0.08,
  color: ["#9D7FD4", "#7C5CBF", "#C4B0E8", "#5A3F9A", "#EDE5FF", "#ffffff"][i % 6],
}));

function SucessoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const [appointment, setAppointment] = useState<ConfirmedAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!appointmentId) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/appointments/${encodeURIComponent(appointmentId)}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data = await res.json() as {
          appointment?: {
            id: string; appointmentDate: string; notes: string | null;
            client: { name: string };
            service: { id: string; name: string; price: number; durationMinutes: number };
          }
        };
        if (!data.appointment) throw new Error();
        const date = new Date(data.appointment.appointmentDate);
        const time = format(date, "HH:mm");
        setAppointment({
          id: data.appointment.id,
          date, time: { id: time, time, available: true },
          service: {
            id: data.appointment.service.id,
            name: data.appointment.service.name,
            price: `R$ ${Number(data.appointment.service.price).toFixed(2)}`,
            duration: `${data.appointment.service.durationMinutes}min`,
          },
          clientName: data.appointment.client.name || "Cliente",
          observation: data.appointment.notes || undefined,
        });
        setTimeout(() => setShowParticles(true), 300);
      } catch { setAppointment(null); }
      finally { setLoading(false); }
    };
    void load();
  }, [appointmentId]);

  if (loading) return (
    <div className="min-h-screen bg-[#1E1A2E] flex items-center justify-center">
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <motion.div key={i} className="w-2 h-2 rounded-full bg-[#9D7FD4]"
            animate={{ scale: [1,1.5,1], opacity: [0.4,1,0.4] }}
            transition={{ duration: 0.8, delay: i*0.15, repeat: Infinity }} />
        ))}
      </div>
    </div>
  );

  if (!appointment) return (
    <div className="min-h-screen bg-[#FAF8FF] flex items-center justify-center p-6 text-center">
      <div>
        <div className="h-16 w-16 rounded-2xl bg-[#F0EBFF] flex items-center justify-center mx-auto mb-4">
          <Calendar size={24} className="text-[#DDD5F5]" />
        </div>
        <p className="text-sm font-bold text-[#6B6480] mb-4">Agendamento não encontrado</p>
        <button onClick={() => router.push("/cliente")}
          className="px-6 py-2.5 rounded-full bg-[#1E1A2E] text-white text-xs font-black uppercase tracking-widest">
          Voltar ao início
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8FF]">

      {/* ── HERO DARK ─────────────────────────────────────────────── */}
      <div className="bg-[#1E1A2E] relative overflow-hidden">
        {/* Particles */}
        {showParticles && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {PARTICLES.map((p, i) => <Particle key={i} {...p} />)}
          </div>
        )}

        {/* Dot texture */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />

        {/* Gold glows */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#9D7FD4]/10 blur-3xl translate-x-20 -translate-y-20" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#9D7FD4]/8 blur-2xl" />

        <div className="relative z-10 px-6 pt-[calc(env(safe-area-inset-top)+2rem)] pb-12 max-w-lg mx-auto text-center">

          {/* Check icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[#9D7FD4] to-[#5A3F9A] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-black/20"
          >
            <CheckCircle size={36} className="text-white" strokeWidth={2.5} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <p className="text-[10px] font-black text-[#9D7FD4]/60 uppercase tracking-[0.4em] mb-2">
              Reserva confirmada
            </p>
            <h1 className="text-3xl font-black text-white leading-tight mb-3">
              Pronto,{" "}
              <span className="text-[#9D7FD4]">
                {appointment.clientName.split(" ")[0]}!
              </span>
            </h1>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs mx-auto">
              Seu horário está reservado. Nos vemos em breve para uma experiência incrível.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── SUMMARY CARD ──────────────────────────────────────────── */}
      <div className="px-5 -mt-6 mb-5 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 200, damping: 20 }}
          className="bg-white rounded-3xl border border-[#EDE5FF] shadow-xl shadow-stone-200/60 overflow-hidden"
        >
          {/* Gold accent top */}
          <div className="h-0.5 bg-gradient-to-r from-[#1E1A2E]/0 via-[#9D7FD4] to-[#1E1A2E]/0" />

          <div className="p-5 space-y-4">
            {/* Service */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-[#1E1A2E] flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-[#9D7FD4]" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-[#9B8FC0] uppercase tracking-widest">Serviço</p>
                <p className="text-sm font-black text-[#1E1A2E] truncate">{appointment.service.name}</p>
              </div>
              <p className="text-base font-black text-[#1E1A2E] shrink-0">
                {appointment.service.price}
              </p>
            </div>

            <div className="h-px bg-[#FAF8FF]" />

            {/* Date / Time / Duration */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Calendar, label: "Data",     value: format(appointment.date, "dd/MM", { locale: ptBR }) },
                { icon: Clock,    label: "Horário",  value: appointment.time.time },
                { icon: Clock,    label: "Duração",  value: appointment.service.duration },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + i * 0.08 }}
                  className="rounded-2xl bg-[#FAF8FF] p-3 text-center"
                >
                  <item.icon size={12} className="text-[#1E1A2E]/40 mx-auto mb-1.5" />
                  <p className="text-[8px] font-bold text-[#9B8FC0] uppercase tracking-widest leading-none mb-1">
                    {item.label}
                  </p>
                  <p className="text-xs font-black text-[#2A2440] tabular-nums">{item.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Full date */}
            <div className="rounded-2xl bg-[#F0EBFF] border border-[#EDE5FF] px-4 py-3 text-center">
              <p className="text-xs font-black text-[#5A3F9A] capitalize">
                {format(appointment.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>

            {/* Observation */}
            {appointment.observation && (
              <div className="rounded-2xl bg-[#FAF8FF] border border-[#EDE5FF] p-3">
                <p className="text-[9px] font-black text-[#9B8FC0] uppercase tracking-widest mb-1">Observação</p>
                <p className="text-xs text-[#6B6480] leading-relaxed">{appointment.observation}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── ACTIONS ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-5 pb-32 max-w-lg mx-auto space-y-3"
      >
        <button
          onClick={() => router.push("/cliente/agendamentos")}
          className="w-full h-14 rounded-2xl bg-[#1E1A2E] text-white flex items-center justify-center gap-3 font-black text-sm shadow-lg shadow-black/15 active:scale-[0.98] transition-all"
        >
          <CalendarDays size={18} />
          Ver meus agendamentos
        </button>

        <button
          onClick={() => router.push("/cliente")}
          className="w-full h-12 rounded-2xl border border-[#DDD5F5] text-[#6B6480] flex items-center justify-center gap-2 font-bold text-sm active:scale-[0.98] transition-all hover:bg-[#FAF8FF]"
        >
          <Home size={16} />
          Voltar ao início
        </button>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 pt-3 opacity-25">
          <Sparkles size={9} className="text-[#1E1A2E]" />
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#1E1A2E]">Nailit</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function SucessoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1E1A2E] flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <motion.div key={i} className="w-2 h-2 rounded-full bg-[#9D7FD4]"
              animate={{ scale: [1,1.5,1], opacity: [0.4,1,0.4] }}
              transition={{ duration: 0.8, delay: i*0.15, repeat: Infinity }} />
          ))}
        </div>
      </div>
    }>
      <SucessoContent />
    </Suspense>
  );
}
