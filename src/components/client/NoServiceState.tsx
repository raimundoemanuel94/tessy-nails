"use client";

import { ArrowLeft, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoServiceStateProps {
  onBack?: () => void;
}

export function NoServiceState({ onBack }: NoServiceStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-6 h-20 w-20 rounded-full bg-pink-100 flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-pink-600" />
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h3 className="mb-4 text-xl font-bold text-gray-900">
            Nenhum serviço selecionado
          </h3>
          
          <p className="mb-6 text-gray-600 leading-relaxed">
            Para agendar um horário, você precisa primeiro escolher um serviço.
          </p>

          <p className="text-sm text-gray-500 mb-6">
            Por favor, volte para a lista de serviços e selecione o tratamento desejado.
          </p>

          {/* Action Button */}
          <Button 
            onClick={onBack}
            className="w-full bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para serviços
          </Button>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-sm text-gray-500">
          Precisa de ajuda? Entre em contato conosco.
        </p>
      </div>
    </div>
  );
}
