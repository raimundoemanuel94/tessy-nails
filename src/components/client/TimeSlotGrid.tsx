"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  label?: string;
}

interface TimeSlotGridProps {
  timeSlots: TimeSlot[];
  selectedTime?: string;
  onTimeSelect?: (timeId: string) => void;
}

export function TimeSlotGrid({ timeSlots, selectedTime, onTimeSelect }: TimeSlotGridProps) {
  const handleTimeSelect = (timeId: string) => {
    if (onTimeSelect) {
      onTimeSelect(timeId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Time Slots Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {timeSlots.map((slot) => {
          const isSelected = selectedTime === slot.id;
          const isAvailable = slot.available;

          return (
            <Button
              key={slot.id}
              onClick={() => handleTimeSelect(slot.id)}
              disabled={!isAvailable}
              className={`
                relative h-16 p-4 text-sm font-medium transition-all
                ${isSelected
                  ? 'bg-pink-500 text-white border-pink-500 shadow-lg transform scale-105'
                  : isAvailable
                  ? 'bg-white text-gray-900 border-pink-200 hover:bg-pink-50 hover:border-pink-300 hover:shadow-md'
                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-center justify-center">
                {isSelected && (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {!isAvailable && !isSelected && (
                  <X className="mr-2 h-4 w-4" />
                )}
                <span className={isSelected ? 'font-semibold' : ''}>
                  {slot.time}
                </span>
              </div>

              {/* Slot Label */}
              {slot.label && (
                <div className="absolute -top-2 -right-2 rounded-full bg-pink-500 px-2 py-1 text-xs text-white">
                  {slot.label}
                </div>
              )}
            </Button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center">
          <div className="h-3 w-3 rounded-full bg-pink-500 mr-2" />
          <span>Selecionado</span>
        </div>
        <div className="flex items-center">
          <div className="h-3 w-3 rounded-full bg-green-500 mr-2" />
          <span>Disponível</span>
        </div>
        <div className="flex items-center">
          <div className="h-3 w-3 rounded-full bg-gray-300 mr-2" />
          <span>Indisponível</span>
        </div>
      </div>
    </div>
  );
}
