import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
}

export function DashboardCard({ title, value, description, icon: Icon, trend, className }: DashboardCardProps) {
  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-brand-primary/10 hover:-translate-y-2 border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl", 
      className
    )}>
      {/* Premium Shine Effect */}
      <div className="absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/15 transition-all duration-700" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
        <CardTitle className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</CardTitle>
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-3 shadow-sm border border-slate-100 dark:border-white/5 transition-all group-hover:scale-110 group-hover:rotate-6 duration-500">
          <Icon className="h-5 w-5 text-brand-primary" strokeWidth={2.5} />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-1.5 mt-2">
            {trend && (
              <span className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter",
                trend.isUp ? "bg-success/10 text-success dark:bg-success/20 dark:text-success/80" : "bg-brand-primary/10 text-brand-primary dark:bg-brand-primary/20"
              )}>
                {trend.isUp ? "↑" : "↓"} {trend.value}%
              </span>
            )}
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
              {description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
