"use client";

import { Clock, Calendar, Eye, RotateCcw, X } from "lucide-react";
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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  observation?: string;
  createdAt: Date;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onViewDetails?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
}

export function AppointmentCard({ 
  appointment, 
  onViewDetails, 
  onReschedule, 
  onCancel 
}: AppointmentCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'Pendente', className: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'confirmed':
        return { label: 'Confirmado', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'completed':
        return { label: 'Concluído', className: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'cancelled':
        return { label: 'Cancelado', className: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: status, className: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const statusConfig = getStatusConfig(appointment.status);
  const isPast = appointment.date < new Date();
  const canReschedule = appointment.status === 'confirmed' && !isPast;
  const canCancel = appointment.status === 'confirmed' && !isPast;

  return (
    <div className="overflow-hidden rounded-[28px] border border-brand-primary/10 bg-white/95 p-5 shadow-sm shadow-brand-primary/5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-black uppercase tracking-[0.18em] text-brand-primary">Agendamento</p>
          <h3 className="truncate text-lg font-black tracking-tight text-slate-900">{appointment.service.name}</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/5 px-2.5 py-1">
              <Calendar className="h-3.5 w-3.5 text-brand-primary" />
              {format(appointment.date, "dd 'de' MMM", { locale: ptBR })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              {appointment.time.time}
            </span>
            {appointment.service.duration && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-accent/10 px-2.5 py-1 text-brand-primary">
                <Clock className="h-3.5 w-3.5" />
                {appointment.service.duration}
              </span>
            )}
          </div>
        </div>

        <div className={cn("rounded-full border px-3 py-1 text-[11px] font-bold", statusConfig.className)}>
          {statusConfig.label}
        </div>
      </div>

      {appointment.service.description && (
        <p className="mb-4 text-sm leading-6 text-slate-500">{appointment.service.description}</p>
      )}

      <div className="mb-4 flex items-center justify-between rounded-2xl bg-slate-50/80 px-4 py-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Valor</p>
          <p className="text-base font-black text-brand-primary">{appointment.service.price || "A confirmar"}</p>
        </div>
        {appointment.status === 'confirmed' && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
            Sinal pago
          </span>
        )}
      </div>

      {appointment.observation && (
        <div className="mb-4 rounded-2xl border border-brand-primary/10 bg-brand-primary/5 p-3">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary">Observação</p>
          <p className="text-sm text-slate-600">{appointment.observation}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          onClick={() => onViewDetails?.(appointment)}
          className="h-11 justify-center rounded-2xl bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10"
        >
          <Eye className="mr-2 h-4 w-4" />
          Ver detalhes
        </Button>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {appointment.status === 'pending' && !isPast && (
            <PaymentButton
              serviceName={appointment.service.name}
              price={10}
              appointmentId={appointment.id}
              isDeposit={true}
              title="Pagar agora"
              className="h-11 rounded-2xl bg-brand-primary text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20"
            />
          )}

          {canReschedule && (
            <Button
              variant="outline"
              onClick={() => onReschedule?.(appointment)}
              className="h-11 rounded-2xl border-brand-primary/20 text-brand-primary hover:bg-brand-primary/5"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Remarcar
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              onClick={() => onCancel?.(appointment)}
              className="h-11 rounded-2xl border-red-200 text-red-700 hover:bg-red-50"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
