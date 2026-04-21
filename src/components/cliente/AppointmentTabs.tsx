"use client";

import { cn } from "@/lib/utils";

interface AppointmentTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  counts?: {
    upcoming: number;
    history: number;
    all: number;
  };
}

const TABS = [
  { id: "upcoming", label: "Próximos" },
  { id: "history",  label: "Histórico" },
  { id: "all",      label: "Todos" },
];

export function AppointmentTabs({ activeTab, onTabChange, counts }: AppointmentTabsProps) {
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts?.[tab.id as keyof typeof counts] ?? 0;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "shrink-0 flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200",
              isActive
                ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                : "bg-white border border-brand-soft text-brand-text-muted hover:border-brand-primary/30 hover:text-brand-primary"
            )}
          >
            {tab.label}
            {count > 0 && (
              <span
                className={cn(
                  "flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-black",
                  isActive ? "bg-white/20 text-white" : "bg-brand-primary/10 text-brand-primary"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
