"use client";

import { User, ArrowLeft, Calendar, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoProfileDataStateProps {
  title?: string;
  subtitle?: string;
  onBackToHome?: () => void;
  onGoToAppointments?: () => void;
}

export function NoProfileDataState({ 
  title = "Dados não encontrados",
  subtitle,
  onBackToHome,
  onGoToAppointments
}: NoProfileDataStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-6 h-20 w-20 rounded-full bg-pink-100 flex items-center justify-center mx-auto">
          <User className="h-8 w-8 text-pink-600" />
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h3 className="mb-4 text-xl font-bold text-gray-900">
            {title}
          </h3>
          
          <p className="mb-6 text-gray-600 leading-relaxed">
            {subtitle || "Não conseguimos carregar seus dados de perfil. Isso pode ser um problema temporário. Tente novamente mais tarde ou entre em contato com nosso suporte."}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onGoToAppointments}
              className="w-full bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Ir para agendamentos
            </Button>

            <Button 
              variant="outline"
              onClick={onBackToHome}
              className="w-full border-pink-200 text-pink-700 hover:bg-pink-50"
            >
              <Home className="mr-2 h-4 w-4" />
              Voltar ao início
            </Button>

            <Button 
              variant="ghost"
              onClick={() => window.history.back()}
              className="w-full text-gray-600 hover:bg-gray-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
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
