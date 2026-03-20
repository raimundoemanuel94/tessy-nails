"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Metric {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "accent" | "success" | "warning";
}

interface PageHeroProps {
  title: string;
  subtitle: string;
  metrics?: Metric[];
  actions?: React.ReactNode;
  gradientClassName?: string;
}

export function PageHero({ 
  title, 
  subtitle, 
  metrics, 
  actions, 
  gradientClassName = "from-brand-primary/10 via-transparent to-brand-secondary/5" 
}: PageHeroProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-8 lg:p-12 border border-brand-accent/10 bg-white shadow-premium",
      "before:absolute before:inset-0 before:bg-linear-to-br before:opacity-10 dark:before:opacity-20",
      gradientClassName
    )}>
      {/* Background Decorative Blurs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 dark:bg-brand-primary/10 rounded-full blur-[100px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-secondary/10 dark:bg-brand-secondary/10 rounded-full blur-[80px] -ml-32 -mb-32" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4 max-w-3xl">
          <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-brand-text-main leading-[1.1]">
            {title}
          </h2>
          <p className="text-lg lg:text-xl font-bold text-brand-text-sub opacity-60 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
          {actions && <div className="pt-4 flex items-center gap-4">{actions}</div>}
        </div>

        {metrics && metrics.length > 0 && (
          <div className="flex flex-wrap items-center gap-6 lg:gap-12 bg-brand-soft/10 backdrop-blur-md p-6 lg:p-8 rounded-[2rem] border border-brand-accent/5 shadow-inner">
            {metrics.map((metric, i) => (
              <div key={i} className="flex flex-col gap-1.5 min-w-[100px]">
                <div className={cn(
                  "flex items-center gap-2",
                  metric.variant === "primary" && "text-brand-primary",
                  metric.variant === "secondary" && "text-brand-secondary",
                  metric.variant === "accent" && "text-brand-accent",
                  metric.variant === "success" && "text-brand-success",
                  metric.variant === "warning" && "text-brand-warning",
                  !metric.variant && "text-brand-text-sub opacity-50"
                )}>
                  {metric.icon && <metric.icon size={14} strokeWidth={3} />}
                  <span className="text-[10px] font-black uppercase tracking-[2px]">{metric.label}</span>
                </div>
                <span className="text-2xl lg:text-3xl font-black text-brand-text-main tracking-tighter tabular-nums">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
