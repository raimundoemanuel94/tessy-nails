"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export function SectionCard({ title, description, children, actions, icon: Icon, className }: SectionCardProps) {
  return (
    <Card className={cn("transition-all duration-300", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="p-3 rounded-2xl bg-linear-to-br from-brand-primary/10 to-brand-secondary/10 border border-brand-primary/20 dark:border-brand-primary/20 shadow-inner">
              <Icon size={24} className="text-brand-primary dark:text-brand-accent" />
            </div>
          )}
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black text-brand-text-main tracking-tight">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm font-bold text-brand-text-sub">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
