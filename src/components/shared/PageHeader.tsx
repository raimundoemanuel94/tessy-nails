import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8 pb-6 border-b border-brand-soft relative group">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shadow-inner transition-transform duration-500">
            <Icon size={24} strokeWidth={2.5} />
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-brand-text-main capitalize">
            {title}
          </h1>
          {description && (
            <p className="text-sm font-medium text-brand-text-sub max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {children}
      </div>
    </div>
  );
}
