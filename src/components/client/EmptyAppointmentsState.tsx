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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-6 h-20 w-20 rounded-full bg-pink-100 flex items-center justify-center mx-auto">
          <Calendar className="h-8 w-8 text-pink-600" />
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h3 className="mb-4 text-xl font-bold text-gray-900">
            {title}
          </h3>
          
          <p className="mb-6 text-gray-600 leading-relaxed">
            {subtitle || "Que tal agendar um horário para cuidar de você? Nossos profissionais estão prontos para receber você com todo carinho e atenção."}
          </p>

          {/* Action Button */}
          <div className="space-y-3">
            <Button 
              onClick={onScheduleNew}
              className="w-full bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agendar agora
            </Button>

            {onBack && (
              <Button 
                variant="outline"
                onClick={onBack}
                className="w-full border-pink-200 text-pink-700 hover:bg-pink-50"
              >
                Voltar
              </Button>
            )}
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
