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
  variant?: "default" | "primary" | "secondary" | "accent" | "success" | "warning";
  className?: string;
}

const variants = {
  default: "bg-white border-brand-accent/10 shadow-premium",
  primary: "bg-brand-primary/10 border-brand-primary/20 hover:bg-brand-primary/15",
  secondary: "bg-brand-secondary/10 border-brand-secondary/20 hover:bg-brand-secondary/15",
  accent: "bg-brand-accent/10 border-brand-accent/20 hover:bg-brand-accent/15",
  success: "bg-success/10 border-success/20 hover:bg-success/15",
  warning: "bg-warning/10 border-warning/20 hover:bg-warning/15",
};

const iconColors = {
  default: "text-brand-text-sub bg-brand-soft/20",
  primary: "text-brand-primary bg-brand-primary/10",
  secondary: "text-brand-secondary bg-brand-secondary/10",
  accent: "text-brand-accent bg-brand-accent/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
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
      "border transition-all duration-300",
      variants[variant],
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-6">
        <CardDescription className="text-[10px] font-black text-brand-text-sub uppercase tracking-[2px]">
          {title}
        </CardDescription>
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm", iconColors[variant])}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="text-3xl lg:text-4xl font-black text-brand-text-main tracking-tighter">
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
              <p className="text-xs font-bold text-brand-text-sub/70 truncate">
                {description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
