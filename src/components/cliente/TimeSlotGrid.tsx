"use client";

import { motion } from "framer-motion";
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

function getHour(time: string) { return parseInt(time.split(":")[0], 10); }

function SlotGroup({ title, slots, selectedTime, onTimeSelect }: {
  title: string;
  slots: TimeSlot[];
  selectedTime?: string;
  onTimeSelect?: (id: string) => void;
}) {
  if (!slots.length) return null;
  return (
    <div className="space-y-2.5">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black text-[#9B8FC0] uppercase tracking-[0.25em]">{title}</span>
        <div className="flex-1 h-px bg-[#F0EBFF]" />
        <span className="text-[9px] text-[#DDD5F5]">
          {slots.filter(s => s.available).length} livre{slots.filter(s => s.available).length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {slots.map((slot, i) => {
          const isSelected = selectedTime === slot.id;
          const isAvailable = slot.available;

          return (
            <motion.button
              key={slot.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, type: "spring", stiffness: 400, damping: 25 }}
              whileTap={isAvailable ? { scale: 0.92 } : undefined}
              onClick={() => isAvailable && onTimeSelect?.(slot.id)}
              disabled={!isAvailable}
              className={cn(
                "relative h-11 rounded-2xl text-[11px] font-black transition-all duration-200",
                isSelected
                  ? "bg-[#1E1A2E] text-white shadow-lg shadow-[#1E1A2E]/30 scale-105"
                  : isAvailable
                  ? "bg-white border border-[#EDE5FF] text-[#2A2440] hover:border-[#1E1A2E]/30 hover:bg-[#FAF8FF] shadow-sm"
                  : "bg-[#FAF8FF] border border-transparent text-stone-200 cursor-not-allowed"
              )}
            >
              {slot.time}

              {/* Dot indicator */}
              {!isSelected && (
                <span className={cn(
                  "absolute top-1.5 right-1.5 w-1 h-1 rounded-full",
                  isAvailable ? "bg-emerald-400" : "bg-[#DDD5F5]"
                )} />
              )}

              {/* Popular badge */}
              {slot.label && !isSelected && isAvailable && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-px rounded-full bg-[#F0EBFF]0 text-[8px] font-black text-white whitespace-nowrap shadow-sm">
                  {slot.label}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function TimeSlotGrid({ timeSlots, selectedTime, onTimeSelect }: TimeSlotGridProps) {
  const manha = timeSlots.filter(s => getHour(s.time) < 12);
  const tarde = timeSlots.filter(s => getHour(s.time) >= 12);

  return (
    <div className="bg-white rounded-3xl border border-[#EDE5FF] shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-5 space-y-5">
        <SlotGroup title="Manhã" slots={manha} selectedTime={selectedTime} onTimeSelect={onTimeSelect} />
        <SlotGroup title="Tarde" slots={tarde} selectedTime={selectedTime} onTimeSelect={onTimeSelect} />
      </div>

      {/* Legend */}
      <div className="border-t border-[#F0EBFF] px-4 py-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[9px] font-bold text-[#9B8FC0] uppercase tracking-widest">Livre</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DDD5F5]" />
          <span className="text-[9px] font-bold text-[#9B8FC0] uppercase tracking-widest">Ocupado</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="w-3 h-1.5 rounded-full bg-[#F0EBFF]0" />
          <span className="text-[9px] font-bold text-[#9B8FC0] uppercase tracking-widest">Popular</span>
        </div>
      </div>
    </div>
  );
}
