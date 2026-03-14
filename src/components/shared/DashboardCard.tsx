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
      "group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-pink-500/10 hover:-translate-y-1 border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md", 
      className
    )}>
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-all duration-500" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</CardTitle>
        <div className="rounded-xl bg-linear-to-br from-pink-500/10 to-rose-500/10 p-2.5 transition-transform group-hover:scale-110 duration-500">
          <Icon className="h-5 w-5 text-pink-600" strokeWidth={2.5} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-1.5 mt-2">
            {trend && (
              <span className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter",
                trend.isUp ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
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
