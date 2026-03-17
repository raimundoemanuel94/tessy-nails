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
    <div className="mb-5 rounded-[26px] border border-violet-100/70 bg-white/90 p-2 shadow-sm">
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
                  ? "bg-linear-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-300/30"
                  : "bg-transparent text-slate-500 hover:bg-violet-50"
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
