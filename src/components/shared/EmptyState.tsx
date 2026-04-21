"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in duration-700",
      className
    )}>
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-brand-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 border border-brand-accent/20 shadow-premium transition-transform hover:scale-110 duration-500">
          <Icon size={40} className="text-brand-primary" strokeWidth={1.5} />
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white border border-brand-accent/10 flex items-center justify-center shadow-lg">
          <div className="w-4 h-4 rounded-full bg-brand-primary/20 animate-ping" />
          <div className="absolute w-2 h-2 rounded-full bg-brand-primary" />
        </div>
      </div>
      
      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
        {title}
      </h3>
      <p className="text-sm font-bold text-slate-400 dark:text-slate-500 max-w-sm mb-10 leading-relaxed uppercase tracking-widest">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="h-12 px-8 rounded-2xl bg-linear-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 transition-all hover:-translate-y-1 active:scale-95"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
