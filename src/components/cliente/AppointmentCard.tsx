"use client";

import { useState } from "react";
import { Clock, Calendar, RotateCcw, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PaymentButton } from "@/components/shared/PaymentButton";
import { cn } from "@/lib/utils";

export interface Service {
  id: string;
  name: string;
  description?: string;
  price?: string;
  duration?: string;
}

export interface TimeSlot {
  id: string;
  time: string;
}

export interface Appointment {
  id: string;
  service: Service;
  date: Date;
  time: TimeSlot;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  observation?: string;
  createdAt: Date;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onViewDetails?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:   { label: "Pendente",   className: "bg-amber-50 text-amber-700 border-amber-200"   },
  confirmed: { label: "Confirmado", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed: { label: "Concluído",  className: "bg-sky-50 text-sky-700 border-sky-200"         },
  cancelled: { label: "Cancelado",  className: "bg-rose-50 text-rose-700 border-rose-200"      },
};

export function AppointmentCard({
  appointment,
  onViewDetails,
  onReschedule,
  onCancel,
}: AppointmentCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);

  const statusConfig = STATUS_CONFIG[appointment.status] ?? {
    label: appointment.status,
    className: "bg-slate-50 text-slate-700 border-slate-200",
  };

  const isPast = appointment.date < new Date();
  const canReschedule = appointment.status === "confirmed" && !isPast;
  const canCancel = (appointment.status === "confirmed" || appointment.status === "pending") && !isPast;

  const handleConfirmCancel = () => {
    setShowCancelModal(false);
    onCancel?.(appointment);
  };

  return (
    <>
      {/* ── Modal de confirmação de cancelamento ─────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-brand-text-main mb-1">
                  Cancelar agendamento?
                </h3>
                <p className="text-xs text-brand-text-muted leading-relaxed">
                  Você está cancelando{" "}
                  <span className="font-bold text-brand-text-main">
                    {appointment.service.name}
                  </span>{" "}
                  do dia{" "}
                  <span className="font-bold text-brand-text-main">
                    {format(appointment.date, "dd/MM")}
                  </span>{" "}
                  às{" "}
                  <span className="font-bold text-brand-text-main">
                    {appointment.time.time}
                  </span>
                  . Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 h-11 rounded-2xl border-brand-soft text-brand-text-main font-bold"
                >
                  Manter
                </Button>
                <Button
                  onClick={handleConfirmCancel}
                  className="flex-1 h-11 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-md"
                >
                  Cancelar sim
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Card ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-[24px] border border-brand-soft bg-white shadow-sm">
        {/* top color strip */}
        <div
          className={cn(
            "h-1 w-full",
            appointment.status === "confirmed" ? "bg-gradient-to-r from-brand-primary to-brand-secondary" :
            appointment.status === "pending"   ? "bg-amber-400" :
            appointment.status === "completed" ? "bg-sky-400" :
            "bg-rose-400"
          )}
        />
        <div className="p-5">
          {/* header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-0.5">
                Serviço
              </p>
              <h3 className="text-base font-black text-brand-text-main leading-tight pr-2 line-clamp-2">
                {appointment.service.name}
              </h3>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide",
                statusConfig.className
              )}
            >
              {statusConfig.label}
            </span>
          </div>

          {/* date/time chips */}
          <div className="flex gap-2 mb-4">
            <div className="flex items-center gap-1.5 rounded-xl bg-brand-background px-3 py-2 flex-1">
              <Calendar size={13} className="text-brand-primary shrink-0" />
              <span className="text-xs font-bold text-brand-text-main tabular-nums">
                {format(appointment.date, "dd 'de' MMM", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl bg-brand-background px-3 py-2 flex-1">
              <Clock size={13} className="text-brand-primary shrink-0" />
              <span className="text-xs font-bold text-brand-text-main tabular-nums">
                {appointment.time.time}
              </span>
            </div>
            {appointment.service.duration && (
              <div className="flex items-center gap-1.5 rounded-xl bg-brand-background px-3 py-2">
                <Clock size={13} className="text-brand-primary/50 shrink-0" />
                <span className="text-xs font-bold text-brand-text-muted">
                  {appointment.service.duration}
                </span>
              </div>
            )}
          </div>

          {/* price row */}
          <div className="flex items-center justify-between rounded-2xl bg-brand-background px-4 py-3 mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">Valor</p>
              <p className="text-base font-black text-brand-primary">
                {appointment.service.price || "A confirmar"}
              </p>
            </div>
            {appointment.status === "confirmed" && (
              <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-700">
                Sinal pago ✓
              </span>
            )}
          </div>

          {/* observation */}
          {appointment.observation && (
            <div className="mb-4 rounded-2xl border border-brand-soft bg-brand-background p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary mb-1">
                Observação
              </p>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                {appointment.observation}
              </p>
            </div>
          )}

          {/* actions */}
          <div className="flex flex-col gap-2">
            {appointment.status === "pending" && !isPast && (
              <PaymentButton
                serviceName={appointment.service.name}
                price={10}
                appointmentId={appointment.id}
                isDeposit={true}
                title="Pagar sinal agora"
                className="h-11 rounded-2xl bg-brand-primary text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20"
              />
            )}

            <div className={cn("grid gap-2", canReschedule && canCancel ? "grid-cols-2" : "grid-cols-1")}>
              {canReschedule && (
                <Button
                  variant="outline"
                  onClick={() => onReschedule?.(appointment)}
                  className="h-11 rounded-2xl border-brand-soft text-brand-primary hover:bg-brand-primary/5 font-bold text-xs"
                >
                  <RotateCcw size={14} className="mr-1.5" />
                  Remarcar
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(true)}
                  className="h-11 rounded-2xl border-red-100 text-red-500 hover:bg-red-50 font-bold text-xs"
                >
                  <X size={14} className="mr-1.5" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
