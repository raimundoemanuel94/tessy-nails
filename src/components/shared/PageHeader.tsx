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
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-10 pb-10 border-b border-brand-accent/10 relative group">
      <div className="flex items-start gap-5">
        {Icon && (
          <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-brand-primary/10 to-brand-secondary/10 dark:from-brand-primary/30 dark:to-brand-secondary/20 flex items-center justify-center text-brand-primary dark:text-brand-accent shadow-inner group-hover:scale-110 transition-transform duration-500">
            <Icon size={28} strokeWidth={2.5} />
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-3xl lg:text-5xl font-black tracking-tighter text-brand-text-main capitalize">
            {title}
          </h1>
          {description && (
            <p className="text-sm lg:text-lg font-bold text-brand-text-sub/80 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {children}
      </div>
      {/* Premium Gradient Underline */}
      <div className="absolute -bottom-px left-0 w-32 h-[3px] bg-linear-to-r from-brand-primary to-brand-secondary rounded-full shadow-lg shadow-brand-primary/20" />
    </div>
  );
}
