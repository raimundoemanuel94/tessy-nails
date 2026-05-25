"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({ title, description, children, actions, icon: Icon, className, noPadding }: SectionCardProps) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="h-8 w-8 rounded-xl bg-[#EDE5FF] flex items-center justify-center shrink-0">
              <Icon size={15} className="text-[#7C5CBF]" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-[14px] font-black text-slate-800 leading-none truncate">{title}</h3>
            {description && (
              <p className="text-[11px] font-bold text-slate-400 mt-0.5 truncate">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0 ml-3">{actions}</div>}
      </div>

      {/* Body */}
      <div className={noPadding ? "" : "p-6"}>
        {children}
      </div>
    </div>
  );
}
