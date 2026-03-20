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
  default: "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-white/5 shadow-sm dark:shadow-none hover:shadow-md transition-shadow duration-300",
  purple: "bg-brand-primary/10 dark:bg-brand-primary/20 border-brand-primary/20 dark:border-brand-primary/10 hover:bg-brand-primary/15 transition-colors duration-300",
  blue: "bg-brand-accent/15 dark:bg-brand-accent/25 border-brand-accent/30 dark:border-brand-accent/10 hover:bg-brand-accent/20 transition-colors duration-300",
  green: "bg-success/15 dark:bg-success/25 border-success/30 dark:border-success/20 hover:bg-success/20 transition-colors duration-300",
  orange: "bg-warning/15 dark:bg-warning/25 border-warning/30 dark:border-warning/20 hover:bg-warning/20 transition-colors duration-300",
  pink: "bg-brand-primary/15 dark:bg-brand-secondary/10 border-brand-secondary/20 dark:border-brand-secondary/10 hover:bg-brand-primary/20 transition-colors duration-300",
};

const iconColors = {
  default: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800",
  purple: "text-brand-primary dark:text-brand-accent bg-brand-primary/10 dark:bg-brand-primary/40",
  blue: "text-brand-secondary dark:text-brand-accent bg-brand-secondary/10 dark:bg-brand-secondary/40",
  green: "text-success dark:text-success/80 bg-success/10 dark:bg-success/20",
  orange: "text-warning dark:text-warning/80 bg-warning/10 dark:bg-warning/20",
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
                   ? "bg-success/10 text-success dark:bg-success/20 dark:text-success/80" 
                   : "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive/80"
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
