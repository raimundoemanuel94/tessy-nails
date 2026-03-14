"use client";

import { AlertTriangle, ArrowLeft, Edit, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IncompleteAppointmentStateProps {
  onBack?: () => void;
  onEdit?: () => void;
  onChangeDate?: () => void;
  missingFields?: string[];
}

export function IncompleteAppointmentState({ 
  onBack, 
  onEdit, 
  onChangeDate,
  missingFields = []
}: IncompleteAppointmentStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mb-6 h-20 w-20 rounded-full bg-violet-100 flex items-center justify-center mx-auto">
          <AlertTriangle className="h-8 w-8 text-violet-600" />
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h3 className="mb-4 text-xl font-bold text-gray-900">
            Agendamento incompleto
          </h3>
          
          <p className="mb-6 text-gray-600 leading-relaxed">
            Para confirmar seu agendamento, precisamos que você complete as informações abaixo:
          </p>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-left">
              <h4 className="text-sm font-semibold text-red-700 mb-2">
                Informações faltantes:
              </h4>
              <ul className="space-y-1 text-sm text-red-600">
                {missingFields.map((field, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onEdit}
              className="w-full bg-linear-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-medium"
            >
              <Edit className="mr-2 h-4 w-4" />
              Voltar e editar
            </Button>

            <Button 
              variant="outline"
              onClick={onChangeDate}
              className="w-full border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Escolher outra data
            </Button>

            <Button 
              variant="ghost"
              onClick={onBack}
              className="w-full text-gray-600 hover:bg-gray-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para início
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
