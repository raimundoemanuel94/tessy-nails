"use client";

import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyAppointmentsStateProps {
  title?: string;
  subtitle?: string;
  onScheduleNew?: () => void;
  onBack?: () => void;
}

export function EmptyAppointmentsState({
  title = "Você ainda não possui agendamentos",
  subtitle,
  onScheduleNew,
  onBack
}: EmptyAppointmentsStateProps) {
  return (
    <div className="min-h-screen bg-brand-background flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 h-20 w-20 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto">
          <Calendar className="h-8 w-8 text-brand-primary" />
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-premium border border-brand-accent/10">
          <h3 className="mb-4 text-xl font-serif font-bold text-brand-text-main">
            {title}
          </h3>

          <p className="mb-6 text-brand-text-sub leading-relaxed">
            {subtitle || "Que tal agendar um horário para cuidar de você? Nossos profissionais estão prontos para receber você com todo carinho e atenção."}
          </p>

          <div className="space-y-3">
            <Button
              onClick={onScheduleNew}
              className="w-full bg-linear-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-medium"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agendar agora
            </Button>

            {onBack && (
              <Button
                variant="outline"
                onClick={onBack}
                className="w-full border-brand-accent/30 text-brand-primary hover:bg-brand-soft/30"
              >
                Voltar
              </Button>
            )}
          </div>
        </div>

        <p className="mt-6 text-sm text-brand-text-sub opacity-70">
          Precisa de ajuda? Entre em contato conosco.
        </p>
      </div>
    </div>
  );
}
