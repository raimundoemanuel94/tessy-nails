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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-6 h-20 w-20 rounded-full bg-violet-100 flex items-center justify-center mx-auto">
          <Calendar className="h-8 w-8 text-brand-primary" />
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h3 className="mb-4 text-xl font-bold text-gray-900">
            Nenhum agendamento recente
          </h3>
          
          <p className="mb-6 text-gray-600 leading-relaxed">
            Não encontramos nenhum agendamento confirmado recentemente.
            Verifique se o agendamento foi concluído ou tente agendar um novo horário.
          </p>

          {/* Action Buttons */}
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
              className="w-full border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              <Home className="mr-2 h-4 w-4" />
              Voltar para o início
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-sm text-gray-500">
          Precisa de ajuda? Entre em contato conosco.
        </p>
      </div>
    </div>
  );
}
