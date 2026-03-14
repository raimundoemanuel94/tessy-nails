"use client";

import { Clock, Calendar, DollarSign, User, MapPin } from "lucide-react";
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

interface FullAppointmentSummaryProps {
  service: Service;
  selectedDate: Date;
  selectedTime: TimeSlot;
  professional?: string;
  observation?: string;
}

export function FullAppointmentSummary({ 
  service, 
  selectedDate, 
  selectedTime, 
  professional, 
  observation 
}: FullAppointmentSummaryProps) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Detalhes do agendamento
        </h3>
        <div className="h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
      </div>

      {/* Service Info */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-violet-600 mb-3">
          {service.name}
        </h4>
        
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-violet-600" />
            <span className="font-medium">Duração:</span>
            <span>{service.duration}</span>
          </div>
          
          <div className="flex items-center">
            <DollarSign className="mr-2 h-4 w-4 text-violet-600" />
            <span className="font-medium">Valor:</span>
            <span>{service.price}</span>
          </div>

          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-violet-600" />
            <span className="font-medium">Data:</span>
            <span>{format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>

          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-violet-600" />
            <span className="font-medium">Horário:</span>
            <span>{selectedTime.time}</span>
          </div>

          {professional && (
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-violet-600" />
              <span className="font-medium">Profissional:</span>
              <span>{professional}</span>
            </div>
          )}
        </div>
      </div>

      {/* Service Description */}
      {service.description && (
        <div className="mb-6">
          <p className="text-sm text-gray-600 leading-relaxed">
            {service.description}
          </p>
        </div>
      )}

      {/* Observation */}
      {observation && (
        <div className="mb-6">
          <h5 className="text-sm font-semibold text-gray-700 mb-2">
            Observação:
          </h5>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {observation}
          </p>
        </div>
      )}

      {/* Location Info */}
      <div className="rounded-lg bg-violet-50 p-4">
        <div className="flex items-center text-violet-700">
          <MapPin className="mr-2 h-4 w-4" />
          <div>
            <p className="font-medium">Tessy Nails</p>
            <p className="text-sm">Av. Paulista, 1234 - São Paulo, SP</p>
          </div>
        </div>
      </div>
    </div>
  );
}
