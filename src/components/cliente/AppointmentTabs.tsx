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

export function AppointmentTabs({ activeTab, onTabChange, counts }: AppointmentTabsProps) {
  const tabs = [
    { id: "upcoming", label: "Próximos", short: "Próx." },
    { id: "history", label: "Histórico", short: "Hist." },
    { id: "all", label: "Todos", short: "Todos" },
  ];

  return (
    <div className="mb-5 rounded-[26px] border border-brand-accent/20 bg-white/90 p-2 shadow-sm">
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts?.[tab.id as keyof typeof counts] || 0;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "rounded-[20px] px-3 py-3 text-center transition-all",
                isActive
                  ? "bg-linear-to-r from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/20"
                  : "bg-transparent text-brand-text-sub hover:bg-brand-soft/30"
              )}
            >
              <div className="text-xs font-black uppercase tracking-[0.16em] md:hidden">{tab.short}</div>
              <div className="hidden text-xs font-black uppercase tracking-[0.16em] md:block">{tab.label}</div>
              <div className={cn("mt-1 text-lg font-black", isActive ? "text-white" : "text-slate-900")}>{count}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
