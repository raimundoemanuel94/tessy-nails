"use client";

import { Clock, Calendar, DollarSign, MoreVertical, Eye, Edit, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PaymentButton } from "@/components/shared/PaymentButton";

export interface Service {
  id: string;
  name: string;
  description?: string;
  price?: string;
  duration?: string;
}

export interface TimeSlot {
  id: string;
  time: string;
}

export interface Appointment {
  id: string;
  service: Service;
  date: Date;
  time: TimeSlot;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  observation?: string;
  createdAt: Date;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onViewDetails?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
}

export function AppointmentCard({ 
  appointment, 
  onViewDetails, 
  onReschedule, 
  onCancel 
}: AppointmentCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendente',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200'
        };
      case 'confirmed':
        return {
          label: 'Confirmado',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'completed':
        return {
          label: 'Concluído',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200'
        };
      default:
        return {
          label: status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200'
        };
    }
  };

  const statusConfig = getStatusConfig(appointment.status);
  const isPast = appointment.date < new Date();
  const canReschedule = appointment.status === 'confirmed' && !isPast;
  const canCancel = appointment.status === 'confirmed' && !isPast;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {appointment.service.name}
          </h3>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              <span>{format(appointment.date, "dd 'de' MMMM", { locale: ptBR })}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              <span>{appointment.time.time}</span>
            </div>

            {appointment.service.duration && (
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                <span>{appointment.service.duration}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className={`
          rounded-full px-3 py-1 text-xs font-medium
          ${statusConfig.bgColor} ${statusConfig.textColor}
        `}>
          {statusConfig.label}
        </div>
      </div>

      {/* Service Details */}
      {appointment.service.description && (
        <p className="mb-4 text-sm text-gray-600">
          {appointment.service.description}
        </p>
      )}

      {/* Observation */}
      {appointment.observation && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">Observação:</p>
          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
            {appointment.observation}
          </p>
        </div>
      )}

      {/* Price */}
      {appointment.service.price && (
        <div className="mb-4 flex items-center justify-between">
          <span className="text-lg font-semibold text-violet-600">
            {appointment.service.price}
          </span>
          {appointment.status === 'confirmed' && (
            <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              Sinal pago
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails?.(appointment)}
          className="text-violet-600 hover:bg-violet-50"
        >
          <Eye className="mr-1 h-4 w-4" />
          Ver detalhes
        </Button>

        <div className="flex items-center space-x-2">
          {appointment.status === 'pending' && !isPast && (
            <PaymentButton
              serviceName={appointment.service.name}
              price={10}
              appointmentId={appointment.id}
              isDeposit={true}
              title="Pagar agora"
              className="h-8 text-xs py-1 px-3 bg-purple-600 hover:bg-purple-700"
            />
          )}

          {canReschedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReschedule?.(appointment)}
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Remarcar
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel?.(appointment)}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              <X className="mr-1 h-4 w-4" />
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
