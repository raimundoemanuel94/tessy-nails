"use client";

import { Calendar, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgendamentosHeader } from "@/components/cliente/AgendamentosHeader";

interface EmptyAppointmentsStateProps {
  title?: string;
  subtitle?: string;
  onScheduleNew?: () => void;
  onBack?: () => void;
}

export function EmptyAppointmentsState({
  title = "Nenhum agendamento ainda",
  subtitle,
  onScheduleNew,
  onBack,
}: EmptyAppointmentsStateProps) {
  return (
    <div className="min-h-screen bg-brand-background pb-28">
      <AgendamentosHeader
        title="Meus agendamentos"
        subtitle="Gerencie seus horários"
        onBack={onBack}
      />
      <div className="flex flex-col items-center justify-center px-6 pt-16 text-center">
        <div className="mb-6 h-20 w-20 rounded-3xl bg-white border border-brand-soft shadow-sm flex items-center justify-center">
          <Calendar size={32} className="text-brand-primary/40" />
        </div>
        <h3 className="text-lg font-black text-brand-text-main mb-2">{title}</h3>
        <p className="text-sm text-brand-text-muted leading-relaxed max-w-xs mb-8">
          {subtitle ||
            "Que tal agendar um horário? Nossos profissionais estão prontos para te receber com carinho."}
        </p>
        <Button
          onClick={onScheduleNew}
          className="h-12 px-8 rounded-full bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
        >
          <Plus size={16} className="mr-2" strokeWidth={3} />
          Agendar agora
        </Button>
      </div>
    </div>
  );
}
