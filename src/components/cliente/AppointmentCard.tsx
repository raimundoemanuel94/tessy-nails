"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Calendar, RotateCcw, X, AlertTriangle, Sparkles } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface Service  { id:string; name:string; description?:string; price?:string; duration?:string; }
export interface TimeSlot { id:string; time:string; }
export interface Appointment {
  id:string; service:Service; date:Date; time:TimeSlot;
  status:"pending"|"confirmed"|"completed"|"cancelled"|"no_show";
  observation?:string; createdAt:Date;
}
interface AppointmentCardProps {
  appointment: Appointment;
  onReschedule?: (a: Appointment) => void;
  onCancel?: (a: Appointment) => void;
}

const ST = {
  pending:   { label:"Pendente",       strip:"#9D7FD4", dot:"bg-[#9D7FD4]", badge:"bg-[#EDE5FF] text-[#7C5CBF] border-[#DDD5F5]" },
  confirmed: { label:"Confirmado",     strip:"#34D399", dot:"bg-emerald-400",badge:"bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed: { label:"Concluído",      strip:"#9B8FC0", dot:"bg-[#9B8FC0]", badge:"bg-[#F0EBFF] text-[#6B6480] border-[#DDD5F5]" },
  cancelled: { label:"Cancelado",      strip:"#F87171", dot:"bg-red-400",   badge:"bg-red-50 text-red-600 border-red-200" },
  no_show:   { label:"Não Compareceu", strip:"#94A3B8", dot:"bg-slate-300", badge:"bg-slate-50 text-slate-500 border-slate-200" },
} as const;

function dateLabel(d: Date) {
  if (isToday(d))    return "Hoje";
  if (isTomorrow(d)) return "Amanhã";
  return format(d, "EEE", { locale: ptBR });
}

export function AppointmentCard({ appointment: a, onReschedule, onCancel }: AppointmentCardProps) {
  const [modal, setModal] = useState(false);
  const st       = ST[a.status] ?? ST.cancelled;
  const past     = isPast(a.date);
  const active   = a.status === "confirmed" || a.status === "pending";
  const canCancel    = active && !past;
  const canReschedule = a.status === "confirmed" && !past;

  return (
    <>
      {/* Modal cancelar */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-[calc(6rem+env(safe-area-inset-bottom))]"
            style={{ backgroundColor:"rgba(30,26,46,0.65)", backdropFilter:"blur(8px)" }}>
            <div className="absolute inset-0" onClick={() => setModal(false)} />
            <motion.div
              initial={{ y:60, opacity:0 }} animate={{ y:0, opacity:1 }}
              exit={{ y:60, opacity:0 }}
              transition={{ type:"spring", stiffness:400, damping:35 }}
              className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={22} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-[#1E1A2E] mb-1.5">Cancelar agendamento?</h3>
                  <p className="text-xs text-[#9B8FC0] leading-relaxed">
                    <span className="font-bold text-[#2A2440]">{a.service.name}</span>{" "}
                    em <span className="font-bold text-[#2A2440]">{format(a.date,"dd/MM")}</span>{" "}
                    às <span className="font-bold text-[#2A2440]">{a.time.time}</span>. Esta ação não pode ser desfeita.
                  </p>
                </div>
                <div className="flex gap-2.5 w-full">
                  <button onClick={() => setModal(false)}
                    className="flex-1 h-11 rounded-2xl border border-[#DDD5F5] text-[#6B6480] text-sm font-bold">
                    Manter
                  </button>
                  <button onClick={() => { setModal(false); onCancel?.(a); }}
                    className="flex-1 h-11 rounded-2xl bg-red-500 text-white text-sm font-bold shadow-md">
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <div className={cn(
        "rounded-2xl bg-white border overflow-hidden shadow-sm transition-all",
        active ? "border-[#EDE5FF]" : "border-[#F0EBFF] opacity-80"
      )}>
        {/* Faixa colorida top — 3px, lavanda para pending, verde para confirmed */}
        <div className="h-[3px] w-full" style={{ backgroundColor: st.strip }} />

        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn(
                "h-10 w-10 rounded-xl shrink-0 flex items-center justify-center",
                active ? "bg-[#EDE5FF]" : "bg-[#F0EBFF]"
              )}>
                <Sparkles size={15} className={active ? "text-[#7C5CBF]" : "text-[#9B8FC0]"} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[8px] font-bold text-[#9B8FC0] uppercase tracking-widest mb-0.5">Serviço</p>
                <h3 className="text-[13px] font-black text-[#1E1A2E] leading-tight line-clamp-2">{a.service.name}</h3>
              </div>
            </div>
            <span className={cn(
              "shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest",
              st.badge
            )}>
              <span className={cn("h-1 w-1 rounded-full", st.dot)} />
              {st.label}
            </span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Calendar, label: dateLabel(a.date), sub: format(a.date,"dd/MM") },
              { icon: Clock,    label: "Hora",            sub: a.time.time             },
              { icon: Clock,    label: "Duração",         sub: a.service.duration||"—" },
            ].map((row, i) => (
              <div key={i} className="rounded-xl bg-[#FAF8FF] p-2.5 text-center">
                <row.icon size={11} className="text-[#9D7FD4] mx-auto mb-1" />
                <p className="text-[8px] text-[#9B8FC0] font-bold uppercase tracking-widest leading-none mb-0.5">{row.label}</p>
                <p className="text-[10px] font-black text-[#1E1A2E] tabular-nums">{row.sub}</p>
              </div>
            ))}
          </div>

          {/* Valor */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#FAF8FF]">
            <div>
              <p className="text-[8px] font-bold text-[#9B8FC0] uppercase tracking-widest mb-0.5">Valor</p>
              <p className="text-[15px] font-black text-[#7C5CBF]">{a.service.price || "A confirmar"}</p>
            </div>
            {a.status === "completed" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[8px] font-black text-emerald-700 uppercase tracking-widest">
                ✓ Concluído
              </span>
            )}
            {a.status === "confirmed" && !past && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[8px] font-black text-emerald-700 uppercase tracking-widest">
                ✓ Confirmado
              </span>
            )}
          </div>

          {/* Observação */}
          {a.observation && (
            <div className="rounded-xl border border-[#EDE5FF] bg-[#FAF8FF] p-3">
              <p className="text-[8px] font-black text-[#9B8FC0] uppercase tracking-widest mb-1">Observação</p>
              <p className="text-[10px] text-[#6B6480] leading-relaxed">{a.observation}</p>
            </div>
          )}

          {/* Ações — só quando necessário */}
          {(canCancel || canReschedule) && (
            <div className={cn("grid gap-2 pt-0.5", canReschedule && canCancel ? "grid-cols-2" : "grid-cols-1")}>
              {canReschedule && (
                <button onClick={() => onReschedule?.(a)}
                  className="h-10 rounded-2xl border border-[#DDD5F5] text-[#6B6480] text-xs font-black flex items-center justify-center gap-1.5 hover:bg-[#FAF8FF] transition-colors">
                  <RotateCcw size={12} /> Remarcar
                </button>
              )}
              {canCancel && (
                <button onClick={() => setModal(true)}
                  className="h-10 rounded-2xl border border-red-100 text-red-500 text-xs font-black flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors">
                  <X size={12} /> Cancelar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
