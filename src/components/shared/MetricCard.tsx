"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; isPositive: boolean };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

const V = {
  default: { card:"bg-white border-slate-100",        icon:"bg-slate-50 text-slate-500",       val:"text-slate-800" },
  primary: { card:"bg-white border-[#EDE5FF]",         icon:"bg-[#EDE5FF] text-[#7C5CBF]",     val:"text-[#1E1A2E]" },
  success: { card:"bg-white border-emerald-100",       icon:"bg-emerald-50 text-emerald-600",   val:"text-slate-800" },
  warning: { card:"bg-white border-amber-100",         icon:"bg-amber-50 text-amber-600",       val:"text-slate-800" },
  danger:  { card:"bg-white border-red-100",           icon:"bg-red-50 text-red-500",           val:"text-slate-800" },
};

export function MetricCard({ title, value, icon: Icon, description, trend, variant = "default", className }: MetricCardProps) {
  const v = V[variant];
  return (
    <div className={cn(
      "rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md",
      v.card, className
    )}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", v.icon)}>
          <Icon size={17} strokeWidth={2} />
        </div>
      </div>

      <p className={cn("text-3xl font-black tracking-tight leading-none", v.val)}>{value}</p>

      {(trend || description) && (
        <div className="flex items-center gap-2 mt-3">
          {trend && (
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black",
              trend.isPositive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-500"
            )}>
              {trend.isPositive ? <TrendingUp size={10} strokeWidth={2.5} /> : <TrendingDown size={10} strokeWidth={2.5} />}
              {trend.value}%
            </span>
          )}
          {description && (
            <p className="text-[11px] font-bold text-slate-400 truncate">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
