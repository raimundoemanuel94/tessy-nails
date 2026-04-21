"use client";

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

function getHour(time: string): number {
  return parseInt(time.split(":")[0], 10);
}

export function TimeSlotGrid({ timeSlots, selectedTime, onTimeSelect }: TimeSlotGridProps) {
  const handleTimeSelect = (timeId: string) => {
    if (onTimeSelect) onTimeSelect(timeId);
  };

  const manha = timeSlots.filter((s) => getHour(s.time) < 12);
  const tarde = timeSlots.filter((s) => getHour(s.time) >= 12);

  const renderSlots = (slots: TimeSlot[]) => (
    <div className="grid grid-cols-4 gap-2.5">
      {slots.map((slot) => {
        const isSelected = selectedTime === slot.id;
        const isAvailable = slot.available;
        return (
          <button
            key={slot.id}
            onClick={() => isAvailable && handleTimeSelect(slot.id)}
            disabled={!isAvailable}
            className={cn(
              "relative h-12 rounded-full text-xs font-black transition-all duration-200 active:scale-95",
              isSelected
                ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/30 scale-105"
                : isAvailable
                ? "bg-white text-brand-text-main border border-brand-soft hover:border-brand-primary hover:bg-brand-primary/5 shadow-sm"
                : "bg-gray-50 text-gray-300 border border-transparent opacity-40 cursor-not-allowed"
            )}
          >
            {slot.time}
            {slot.label && !isSelected && isAvailable && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-brand-secondary/90 text-[7px] font-black text-white shadow-sm whitespace-nowrap">
                {slot.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {manha.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.2em]">
              Manhã
            </span>
            <div className="flex-1 h-px bg-brand-soft/60" />
          </div>
          {renderSlots(manha)}
        </div>
      )}

      {tarde.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.2em]">
              Tarde
            </span>
            <div className="flex-1 h-px bg-brand-soft/60" />
          </div>
          {renderSlots(tarde)}
        </div>
      )}

      <div className="flex items-center justify-center gap-6 py-3 px-5 rounded-2xl bg-white border border-brand-soft/50">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-primary" />
          <span className="text-[10px] font-bold text-brand-text-sub uppercase tracking-widest">Livre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gray-300" />
          <span className="text-[10px] font-bold text-brand-text-sub uppercase tracking-widest">Ocupado</span>
        </div>
      </div>
    </div>
  );
}
