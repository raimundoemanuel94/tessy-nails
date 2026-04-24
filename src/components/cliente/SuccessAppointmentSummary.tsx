"use client";

import { Clock, Calendar, CheckCircle, Sparkles, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  duration: string;
  image?: string;
  rating?: number;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  label?: string;
}

interface SuccessAppointmentSummaryProps {
  service: Service;
  selectedDate: Date;
  selectedTime: TimeSlot;
  clientName: string;
  observation?: string;
  status?: string;
}

export function SuccessAppointmentSummary({ 
  service, 
  selectedDate, 
  selectedTime, 
  clientName,
  observation,
  status = "Confirmado"
}: SuccessAppointmentSummaryProps) {
  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-brand-border bg-white p-8 shadow-xl shadow-brand-primary/5 space-y-8 max-w-2xl mx-auto">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-bl-[5rem] -mr-8 -mt-8" />
      
      <div className="relative flex items-center justify-between border-b border-brand-border pb-6">
        <div>
          <h3 className="text-lg font-black text-brand-text uppercase tracking-tight">
            Detalhes da Reserva
          </h3>
          <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-[0.2em]">Resumo do que foi agendado</p>
        </div>
        <div className="rounded-full bg-green-500/10 px-4 py-1.5 border border-green-500/20">
          <span className="text-[10px] font-black text-green-600 uppercase tracking-widest leading-none">
            {status}
          </span>
        </div>
      </div>

      <div className="relative space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
             <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest leading-none">Procedimento</p>
             <h4 className="text-xl font-black text-brand-text tracking-tight leading-none">{service.name}</h4>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest leading-none">Valor Total</p>
             <p className="text-lg font-black text-brand-text">{service.price}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                <Calendar size={18} />
             </div>
             <div>
                <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest leading-none mb-1">Data</p>
                <p className="text-[11px] font-black text-brand-text capitalize">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                <Clock size={18} />
             </div>
             <div>
                <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest leading-none mb-1">Horário</p>
                <p className="text-[11px] font-black text-brand-text uppercase">{selectedTime.time}</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-brand-border bg-brand-background/40 px-4 py-3">
          <div className="h-10 w-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
            <User size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest leading-none mb-1">
              Cliente
            </p>
            <p className="text-[11px] font-black text-brand-text">{clientName}</p>
          </div>
        </div>
      </div>

      {observation && (
        <div className="relative pt-6 border-t border-brand-border space-y-3">
           <div className="flex items-center gap-2">
              <CheckCircle className="text-brand-primary" size={16} />
              <p className="text-[10px] font-black text-brand-text uppercase tracking-widest">Sua Observação</p>
           </div>
           <p className="text-xs font-bold text-brand-text-muted bg-brand-background/50 p-4 rounded-2xl italic">
              {'"'}{observation}{'"'}
           </p>
        </div>
      )}

      <div className="relative rounded-2xl bg-brand-primary/5 p-4 border border-brand-primary/10 flex items-start gap-4">
         <div className="h-10 w-10 rounded-xl bg-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
            <Sparkles size={18} />
         </div>
         <div>
            <p className="text-[10px] text-brand-primary font-black uppercase tracking-[0.2em] leading-relaxed mb-0.5">
              Tudo pronto para você!
            </p>
            <p className="text-[10px] font-bold text-brand-text-muted leading-tight uppercase opacity-60">
              Você receberá uma confirmação no WhatsApp em breve.
            </p>
         </div>
      </div>
    </div>
  );
}
