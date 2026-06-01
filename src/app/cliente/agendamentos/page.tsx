"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { isPast } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useClientAppointments, RealtimeAppointment } from "@/hooks/useClientAppointments";
import { AppointmentCard, Appointment as ApptCard } from "@/components/cliente/AppointmentCard";
import { appointmentService } from "@/services/appointments";
import { ErrorState } from "@/components/shared/ErrorState";
import { AgendamentosSkeleton } from "@/components/cliente/ClienteSkeletons";
import { toast } from "sonner";
import { ArrowLeft, Plus, Calendar, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key:"upcoming", label:"Próximos"  },
  { key:"history",  label:"Histórico" },
  { key:"all",      label:"Todos"     },
] as const;

function toCardAppt(a: RealtimeAppointment): ApptCard {
  return {
    id: a.id,
    service: {
      id: a.service.id,
      name: a.service.name,
      price: a.service.priceFormatted,
      duration: a.service.durationFormatted,
    },
    date: a.date,
    time: a.time,
    status: a.status,
    observation: a.observation,
    createdAt: a.createdAt,
  };
}

export default function AgendamentosPage() {
  const router  = useRouter();
  const { user } = useAuth();
  const { appointments, loading, error } = useClientAppointments(user?.uid);
  const [tab, setTab] = useState<"upcoming"|"history"|"all">("upcoming");

  const shown = appointments.filter(a => {
    const past = isPast(new Date(a.date));
    if (tab === "upcoming") return !past && a.status !== "cancelled";
    if (tab === "history")  return past || ["completed","cancelled"].includes(a.status);
    return true;
  });

  const counts = {
    upcoming: appointments.filter(a => !isPast(new Date(a.date)) && a.status !== "cancelled").length,
    history:  appointments.filter(a => isPast(new Date(a.date)) || ["completed","cancelled"].includes(a.status)).length,
    all:      appointments.length,
  };

  const cancel = (a: ApptCard) => {
    appointmentService.cancel(a.id)
      .then(() => toast.success("Agendamento cancelado."))
      .catch(() => toast.error("Não foi possível cancelar."));
  };

  if (loading) return <AgendamentosSkeleton />;

  return (
    <div className="min-h-screen bg-[#FAF8FF]">
      <div style={{
        background: "linear-gradient(160deg, #0F0C1E 0%, #1E1A2E 50%, #2A1A4E 100%)",
        paddingTop: "env(safe-area-inset-top)",
      }}>
        <div className="px-5 pt-4 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <motion.button whileTap={{ scale:0.9 }} onClick={() => router.push("/cliente")}
              className="h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
              <ArrowLeft size={15} className="text-white/80" />
            </motion.button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white leading-none">Agendamentos</h1>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20">
                  <Wifi size={8} className="text-emerald-400" />
                  <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">ao vivo</span>
                </div>
              </div>
              <p className="text-[10px] text-white/40 mt-0.5">{counts.all} no total</p>
            </div>
            <motion.button whileTap={{ scale:0.9 }} onClick={() => router.push("/cliente/servicos")}
              className="h-9 w-9 rounded-xl bg-[#9D7FD4] flex items-center justify-center shrink-0">
              <Plus size={16} className="text-white" strokeWidth={2.5} />
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/8 rounded-2xl p-1">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1",
                  tab === t.key ? "bg-white text-[#1E1A2E]" : "text-white/40"
                )}>
                {t.label}
                {counts[t.key] > 0 && (
                  <span className={cn(
                    "text-[8px] px-1.5 py-0.5 rounded-full font-black",
                    tab === t.key ? "bg-[#EDE5FF] text-[#7C5CBF]" : "bg-white/10 text-white/30"
                  )}>{counts[t.key]}</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="h-3" />
        <div className="relative h-5 -mb-px" style={{ background: "linear-gradient(160deg, #0F0C1E, #2A1A4E)" }}>
          <div className="absolute bottom-0 inset-x-0 h-5 bg-[#FAF8FF] rounded-t-[28px]" />
        </div>
      </div>

      <div className="px-5 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] max-w-lg mx-auto space-y-3">
        {error && <ErrorState title="Erro" message={error} onRetry={() => window.location.reload()} size="sm" />}
        <AnimatePresence mode="popLayout">
          {shown.length === 0 ? (
            <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="flex flex-col items-center py-16 text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[#EDE5FF] flex items-center justify-center">
                <Calendar size={26} className="text-[#9D7FD4]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-black text-[#2A2440] mb-1">Nenhum agendamento aqui</p>
                <p className="text-xs text-[#9B8FC0]">
                  {tab === "upcoming" ? "Que tal reservar um horário?" : "Nenhum registro neste período."}
                </p>
              </div>
              {tab === "upcoming" && (
                <button onClick={() => router.push("/cliente/servicos")}
                  className="px-5 py-2 rounded-full text-xs font-black text-white uppercase tracking-widest"
                  style={{ background:"linear-gradient(135deg,#7C5CBF,#9D7FD4)" }}>
                  Agendar agora
                </button>
              )}
            </motion.div>
          ) : shown.map((a, i) => (
            <motion.div key={a.id} layout
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, scale:0.97 }}
              transition={{ delay: i * 0.05, type:"spring", stiffness:300, damping:28 }}>
              <AppointmentCard
                appointment={toCardAppt(a)}
                onReschedule={() => router.push("/cliente/agendar")}
                onCancel={cancel}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
