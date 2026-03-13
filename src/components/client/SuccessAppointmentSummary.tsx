"use client";

import { Clock, Calendar, DollarSign, CheckCircle } from "lucide-react";
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

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  label?: string;
}

interface SuccessAppointmentSummaryProps {
  service: Service;
  selectedDate: Date;
  selectedTime: TimeSlot;
  observation?: string;
  status?: string;
}

export function SuccessAppointmentSummary({ 
  service, 
  selectedDate, 
  selectedTime, 
  observation,
  status = "Confirmado"
}: SuccessAppointmentSummaryProps) {
  return (
    <div className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Detalhes do seu agendamento
        </h3>
        <div className="h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
      </div>

      {/* Status Badge */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center rounded-full bg-green-100 px-4 py-2">
          <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
          <span className="font-semibold text-green-700">
            {status}
          </span>
        </div>
      </div>

      {/* Service Info */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-pink-600 mb-3">
          {service.name}
        </h4>
        
        <div className="grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-pink-600" />
            <span className="font-medium">Duração:</span>
            <span>{service.duration}</span>
          </div>
          
          <div className="flex items-center">
            <DollarSign className="mr-2 h-4 w-4 text-pink-600" />
            <span className="font-medium">Valor:</span>
            <span>{service.price}</span>
          </div>

          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-pink-600" />
            <span className="font-medium">Data:</span>
            <span>{format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}</span>
          </div>

          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-pink-600" />
            <span className="font-medium">Horário:</span>
            <span>{selectedTime.time}</span>
          </div>
        </div>
      </div>

      {/* Observation */}
      {observation && (
        <div className="mb-6">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">
            Sua observação:
          </h5>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {observation}
          </p>
        </div>
      )}

      {/* Important Info */}
      <div className="rounded-lg bg-pink-50 p-4">
        <div className="flex items-center text-pink-700">
          <CheckCircle className="mr-2 h-4 w-4" />
          <div>
            <p className="font-medium">Você receberá um e-mail de confirmação</p>
            <p className="text-sm">Cancelamento gratuito até 24h antes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
