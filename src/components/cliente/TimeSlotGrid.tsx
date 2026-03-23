"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className="space-y-8">
      {/* Time Slots Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
        {timeSlots.map((slot) => {
          const isSelected = selectedTime === slot.id;
          const isAvailable = slot.available;

          return (
            <button
              key={slot.id}
              onClick={() => handleTimeSelect(slot.id)}
              disabled={!isAvailable}
              className={cn(
                "relative h-12 rounded-full text-xs font-black transition-all duration-300 active:scale-95 shadow-sm",
                isSelected
                  ? 'bg-[#4B2E2B] text-white shadow-xl shadow-[#4B2E2B]/30 scale-105'
                  : isAvailable
                  ? 'bg-white text-brand-text border border-brand-soft hover:border-[#4B2E2B] hover:bg-[#4B2E2B]/5'
                  : 'bg-gray-50 text-gray-300 border border-transparent opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex flex-col items-center justify-center">
                <span>{slot.time}</span>
                {slot.label && !isSelected && (
                  <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-[#6D4C41] text-[7px] font-black text-[#A1887F] shadow-sm transform rotate-12">
                     {slot.label}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-8 py-4 px-6 rounded-3xl bg-white border border-brand-soft/50 shadow-premium-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#4B2E2B]" />
          <span className="text-[10px] font-black text-brand-text-sub uppercase tracking-widest">Livre</span>
        </div>
        <div className="flex items-center gap-2 opacity-30">
          <div className="h-2 w-2 rounded-full bg-gray-400" />
          <span className="text-[10px] font-black text-brand-text-sub uppercase tracking-widest">Ocupado</span>
        </div>
      </div>
    </div>
  );
}
