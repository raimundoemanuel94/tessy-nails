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
    <div className="space-y-6">
      {/* Time Slots Grid */}
      <div className="grid grid-cols-3 gap-3">
        {timeSlots.map((slot) => {
          const isSelected = selectedTime === slot.id;
          const isAvailable = slot.available;

          return (
            <button
              key={slot.id}
              onClick={() => handleTimeSelect(slot.id)}
              disabled={!isAvailable}
              className={cn(
                "relative h-16 rounded-2xl text-sm font-black transition-all duration-300 active:scale-95 shadow-sm border",
                isSelected
                  ? 'bg-linear-to-br from-brand-primary to-brand-secondary text-white border-transparent shadow-xl shadow-brand-primary/30 scale-105'
                  : isAvailable
                  ? 'bg-white text-brand-text border-brand-border hover:border-brand-primary hover:bg-brand-primary/5'
                  : 'bg-brand-background text-brand-text-muted border-brand-border/50 opacity-40 cursor-not-allowed'
              )}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <span>{slot.time}</span>
                {slot.label && !isSelected && (
                  <span className="text-[8px] uppercase tracking-tighter text-brand-primary">{slot.label}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 px-4 py-4 rounded-3xl bg-white border border-brand-border shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-primary" />
          <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Livre</span>
        </div>
        <div className="flex items-center gap-2 opacity-40">
          <div className="h-2 w-2 rounded-full bg-brand-text-muted" />
          <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest">Ocupado</span>
        </div>
      </div>
    </div>
  );
}
