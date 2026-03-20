"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "purple" | "blue" | "green" | "orange" | "pink";
  className?: string;
}

const variants = {
  default: "bg-white dark:bg-slate-900 border-slate-200/40 dark:border-white/5 shadow-slate-200/40 dark:shadow-none",
  purple: "bg-linear-to-br from-brand-primary/5 to-brand-secondary/10 border-brand-primary/20 dark:border-brand-primary/10 shadow-brand-primary/5 dark:shadow-none",
  blue: "bg-linear-to-br from-brand-accent/5 to-brand-accent/15 border-brand-accent/30 dark:border-brand-accent/10 shadow-brand-accent/5 dark:shadow-none",
  green: "bg-linear-to-br from-emerald-500/5 to-teal-500/10 border-emerald-200/40 dark:border-emerald-800/20 shadow-emerald-500/10 dark:shadow-none",
  orange: "bg-linear-to-br from-orange-500/5 to-amber-500/10 border-orange-200/40 dark:border-orange-800/20 shadow-orange-500/10 dark:shadow-none",
  pink: "bg-linear-to-br from-brand-primary/10 to-brand-secondary/5 border-brand-secondary/20 dark:border-brand-secondary/10 shadow-brand-secondary/5 dark:shadow-none",
};

const iconColors = {
  default: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800",
  purple: "text-brand-primary dark:text-brand-accent bg-brand-primary/10 dark:bg-brand-primary/40",
  blue: "text-brand-secondary dark:text-brand-accent bg-brand-secondary/10 dark:bg-brand-secondary/40",
  green: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40",
  orange: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40",
  pink: "text-brand-primary dark:text-brand-accent bg-brand-primary/10 dark:bg-brand-primary/90",
};

export function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  variant = "default",
  className 
}: MetricCardProps) {
  return (
    <Card className={cn(
      "rounded-[2rem] border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
      variants[variant],
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardDescription className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-[1.5px]">
          {title}
        </CardDescription>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner", iconColors[variant])}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
          {value}
        </div>
        {(trend || description) && (
          <div className="flex items-center gap-2 mt-3">
            {trend && (
              <Badge className={cn(
                "border-0 font-black text-[10px] px-2 py-1 rounded-lg uppercase tracking-wider",
                trend.isPositive 
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" 
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
              )}>
                <div className="flex items-center gap-1">
                  {trend.isPositive ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />}
                  {trend.value}%
                </div>
              </Badge>
            )}
            {description && (
              <p className="text-xs font-bold text-slate-500 dark:text-slate-500 truncate">
                {description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
