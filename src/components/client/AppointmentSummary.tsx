"use client";

import { Clock, Calendar, DollarSign, User } from "lucide-react";
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

interface AppointmentSummaryProps {
  service: Service;
  selectedDate: Date;
  professional?: string;
}

export function AppointmentSummary({ service, selectedDate, professional }: AppointmentSummaryProps) {
  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-brand-border bg-white p-6 shadow-xl shadow-brand-primary/5">
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-bl-[5rem] -mr-8 -mt-8" />
      
      {/* Header */}
      <div className="relative mb-6">
        <h3 className="text-lg font-black text-brand-text uppercase tracking-tight">
          Resumo do Agendamento
        </h3>
        <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-[0.2em]">Confira os detalhes escolhidos</p>
      </div>

      {/* Content Grid */}
      <div className="relative space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
             <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Procedimento</p>
             <h4 className="text-xl font-black text-brand-text leading-tight">{service.name}</h4>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Valor</p>
             <p className="text-lg font-black text-brand-text">{service.price}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
                <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest leading-none mb-1">Tempo</p>
                <p className="text-[11px] font-black text-brand-text uppercase">{service.duration}</p>
             </div>
          </div>
        </div>

        {professional && (
          <div className="flex items-center gap-3 pt-2 border-t border-brand-border">
             <div className="h-10 w-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                <User size={18} />
             </div>
             <div>
                <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest leading-none mb-1">Especialista</p>
                <p className="text-[11px] font-black text-brand-text">{professional}</p>
             </div>
          </div>
        )}
      </div>

      {/* Info Badge */}
      <div className="mt-8 rounded-2xl bg-brand-primary/5 p-4 text-center border border-brand-primary/10">
        <p className="text-[10px] text-brand-primary font-black uppercase tracking-[0.2em]">
          Próximo passo: Reservar seu Horário
        </p>
      </div>
    </div>
  );
}
