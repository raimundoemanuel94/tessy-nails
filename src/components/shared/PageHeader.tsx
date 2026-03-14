interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8 pb-8 border-b border-slate-200/60 dark:border-white/5 relative">
      <div className="space-y-1.5 self-start">
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white capitalize">
          {title}
        </h1>
        {description && (
          <p className="text-sm lg:text-base font-medium text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {children}
      </div>
      {/* Subtle accent underline */}
      <div className="absolute bottom-0 left-0 w-24 h-1 bg-linear-to-r from-pink-500 to-rose-600 rounded-t-full" />
    </div>

  );
}
