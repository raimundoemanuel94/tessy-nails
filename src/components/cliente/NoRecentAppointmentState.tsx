"use client";

import { Calendar, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoRecentAppointmentStateProps {
  onBackToHome?: () => void;
  onSearchAppointments?: () => void;
}

export function NoRecentAppointmentState({
  onBackToHome,
  onSearchAppointments
}: NoRecentAppointmentStateProps) {
  return (
    <div className="min-h-screen bg-brand-background flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 h-20 w-20 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto">
          <Calendar className="h-8 w-8 text-brand-primary" />
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-premium border border-brand-accent/10">
          <h3 className="mb-4 text-xl font-serif font-bold text-brand-text-main">
            Nenhum agendamento recente
          </h3>

          <p className="mb-6 text-brand-text-sub leading-relaxed">
            Não encontramos nenhum agendamento confirmado recentemente.
            Verifique se o agendamento foi concluído ou tente agendar um novo horário.
          </p>

          <div className="space-y-3">
            <Button
              onClick={onSearchAppointments}
              className="w-full bg-linear-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-medium"
            >
              <Search className="mr-2 h-4 w-4" />
              Buscar agendamentos
            </Button>

            <Button
              variant="outline"
              onClick={onBackToHome}
              className="w-full border-brand-accent/30 text-brand-primary hover:bg-brand-soft/30"
            >
              <Home className="mr-2 h-4 w-4" />
              Voltar para o início
            </Button>
          </div>
        </div>

        <p className="mt-6 text-sm text-brand-text-sub opacity-70">
          Precisa de ajuda? Entre em contato conosco.
        </p>
      </div>
    </div>
  );
}
