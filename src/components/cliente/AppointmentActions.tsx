"use client";

import { MoreVertical, Eye, Edit, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Appointment } from "./AppointmentCard";

interface AppointmentActionsProps {
  appointment: Appointment;
  onViewDetails?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  variant?: 'buttons' | 'dropdown';
}

export function AppointmentActions({ 
  appointment, 
  onViewDetails, 
  onReschedule, 
  onCancel,
  variant = 'buttons'
}: AppointmentActionsProps) {
  const isPast = appointment.date < new Date();
  const canReschedule = appointment.status === 'confirmed' && !isPast;
  const canCancel = appointment.status === 'confirmed' && !isPast;

  if (variant === 'buttons') {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails?.(appointment)}
          className="text-brand-primary hover:bg-brand-primary/5"
        >
          <Eye className="mr-1 h-4 w-4" />
          Ver detalhes
        </Button>

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
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {/* Dropdown Menu */}
      <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-10">
        <div className="py-1">
          <button
            onClick={() => onViewDetails?.(appointment)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <Eye className="mr-2 h-4 w-4" />
            Ver detalhes
          </button>

          {canReschedule && (
            <button
              onClick={() => onReschedule?.(appointment)}
              className="w-full px-4 py-2 text-left text-sm text-violet-700 hover:bg-violet-50 flex items-center"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Remarcar
            </button>
          )}

          {canCancel && (
            <button
              onClick={() => onCancel?.(appointment)}
              className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center"
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
