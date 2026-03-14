"use client";

import { Calendar, Home, List, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessActionsProps {
  onMyAppointments?: () => void;
  onBackToHome?: () => void;
}

export function SuccessActions({ 
  onMyAppointments, 
  onBackToHome 
}: SuccessActionsProps) {
  return (
    <div className="space-y-4">
      {/* Primary Action */}
      <div className="text-center">
        <Button 
          onClick={onMyAppointments}
          className="bg-linear-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-medium px-8 py-3 text-lg shadow-lg"
        >
          <List className="mr-2 h-5 w-5" />
          Ver meus agendamentos
        </Button>
      </div>

      {/* Secondary Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button 
          variant="outline"
          onClick={onBackToHome}
          className="border-violet-200 text-violet-700 hover:bg-violet-50 px-6 py-3"
        >
          <Home className="mr-2 h-4 w-4" />
          Voltar para o início
        </Button>

        <Button 
          variant="ghost"
          onClick={() => window.history.back()}
          className="text-gray-600 hover:bg-gray-50 px-6 py-3"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      {/* Additional Info */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Você pode gerenciar seus agendamentos a qualquer momento
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Precisa de ajuda? Entre em contato conosco
        </p>
      </div>
    </div>
  );
}
