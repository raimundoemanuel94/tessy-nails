"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Calendar, RotateCcw, X, AlertTriangle, Sparkles } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PaymentButton } from "@/components/shared/PaymentButton";
import { cn } from "@/lib/utils";

export interface Service {
  id: string; name: string; description?: string;
  price?: string; duration?: string;
}
export interface TimeSlot { id: string; time: string; }
export interface Appointment {
  id: string; service: Service; date: Date; time: TimeSlot;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  observation?: string; createdAt: Date;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
}

const STATUS = {
  pending:   { label: "Pendente",         dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",  strip: "#F59E0B" },
  confirmed: { label: "Confirmado",       dot: "bg-emerald-400", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200",strip: "#10B981" },
  completed: { label: "Concluído",        dot: "bg-stone-400",   text: "text-stone-600",   bg: "bg-stone-100",  border: "border-stone-200",  strip: "#78716C" },
  cancelled: { label: "Cancelado",        dot: "bg-red-400",     text: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",    strip: "#EF4444" },
  no_show:   { label: "Não Compareceu",   dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200",  strip: "#94A3B8" },
} as const;

function dateLabel(date: Date) {
  if (isToday(date))    return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  return format(date, "EEE", { locale: ptBR });
}

export function AppointmentCard({ appointment, onReschedule, onCancel }: AppointmentCardProps) {
  const [showModal, setShowModal] = useState(false);
  const st = STATUS[appointment.status] ?? STATUS.cancelled;
  const isPast      = appointment.date < new Date();
  const canCancel   = (appointment.status === "confirmed" || appointment.status === "pending") && !isPast;
  const canReschedule = appointment.status === "confirmed" && !isPast;
  const isActive    = appointment.status === "confirmed" || appointment.status === "pending";

  return (
    <>
      {/* ── MODAL CANCELAR ────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          >
            <div className="absolute inset-0" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-800 mb-2">Cancelar agendamento?</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Você está cancelando{" "}
                    <span className="font-bold text-stone-700">{appointment.service.name}</span>{" "}
                    do dia{" "}
                    <span className="font-bold text-stone-700">{format(appointment.date, "dd/MM")}</span>{" "}
                    às <span className="font-bold text-stone-700">{appointment.time.time}</span>.
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 h-11 rounded-2xl border border-stone-200 text-stone-600 text-sm font-bold active:scale-95 transition-all"
                  >
                    Manter
                  </button>
                  <button
                    onClick={() => { setShowModal(false); onCancel?.(appointment); }}
                    className="flex-1 h-11 rounded-2xl bg-red-500 text-white text-sm font-bold shadow-md active:scale-95 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CARD ──────────────────────────────────────────────────── */}
      <div className={cn(
        "rounded-3xl overflow-hidden border bg-white shadow-sm",
        isActive ? "border-stone-100" : "border-stone-100 opacity-80"
      )}>
        {/* Top accent strip */}
        <div className="h-0.5 w-full" style={{ backgroundColor: st.strip }} />

        <div className="p-4 space-y-4">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div className={cn(
                "h-10 w-10 rounded-2xl shrink-0 flex items-center justify-center",
                isActive ? "bg-[#2C1810]" : "bg-stone-100"
              )}>
                <Sparkles size={16} className={isActive ? "text-amber-400" : "text-stone-400"} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Serviço</p>
                <h3 className="text-sm font-black text-stone-800 leading-tight line-clamp-2">
                  {appointment.service.name}
                </h3>
              </div>
            </div>

            {/* Status badge */}
            <span className={cn(
              "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
              st.bg, st.text, st.border
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
              {st.label}
            </span>
          </div>

          {/* ── Data / Hora / Duração ── */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-[#F5F0EA] p-3 text-center">
              <Calendar size={12} className="text-[#2C1810]/40 mx-auto mb-1" />
              <p className="text-[8px] text-stone-400 font-bold uppercase tracking-widest leading-none mb-0.5">
                {dateLabel(appointment.date)}
              </p>
              <p className="text-xs font-black text-stone-700 tabular-nums">
                {format(appointment.date, "dd/MM")}
              </p>
            </div>
            <div className="rounded-2xl bg-[#F5F0EA] p-3 text-center">
              <Clock size={12} className="text-[#2C1810]/40 mx-auto mb-1" />
              <p className="text-[8px] text-stone-400 font-bold uppercase tracking-widest leading-none mb-0.5">Hora</p>
              <p className="text-xs font-black text-stone-700 tabular-nums">
                {appointment.time.time}
              </p>
            </div>
            <div className="rounded-2xl bg-[#F5F0EA] p-3 text-center">
              <div className="h-3 w-3 rounded-full border-2 border-[#2C1810]/30 mx-auto mb-1" />
              <p className="text-[8px] text-stone-400 font-bold uppercase tracking-widest leading-none mb-0.5">Duração</p>
              <p className="text-xs font-black text-stone-700">
                {appointment.service.duration || "—"}
              </p>
            </div>
          </div>

          {/* ── Valor ── */}
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#F5F0EA]">
            <div>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Valor</p>
              <p className="text-base font-black text-[#2C1810]">
                {appointment.service.price || "A confirmar"}
              </p>
            </div>
            {appointment.status === "completed" && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                ✓ Concluído
              </span>
            )}
            {appointment.status === "confirmed" && !isPast && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                ✓ Confirmado
              </span>
            )}
          </div>

          {/* ── Observação ── */}
          {appointment.observation && (
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Observação</p>
              <p className="text-xs text-stone-600 leading-relaxed">{appointment.observation}</p>
            </div>
          )}

          {/* ── Ações ── */}
          {(canCancel || canReschedule || appointment.status === "pending") && (
            <div className="space-y-2 pt-1">
              {appointment.status === "pending" && !isPast && (
                <PaymentButton
                  serviceName={appointment.service.name}
                  price={10}
                  appointmentId={appointment.id}
                  isDeposit={true}
                  title="Pagar sinal agora"
                  className="w-full h-11 rounded-2xl bg-[#2C1810] text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[#2C1810]/20"
                />
              )}

              <div className={cn("grid gap-2", canReschedule && canCancel ? "grid-cols-2" : "grid-cols-1")}>
                {canReschedule && (
                  <button
                    onClick={() => onReschedule?.(appointment)}
                    className="h-11 rounded-2xl border border-stone-200 text-stone-600 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-stone-50"
                  >
                    <RotateCcw size={13} />
                    Remarcar
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="h-11 rounded-2xl border border-red-100 text-red-500 text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-red-50"
                  >
                    <X size={13} />
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
