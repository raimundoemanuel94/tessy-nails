"use client";

import { AdminLayout } from "../layout/AdminLayout";
import { cn } from "@/lib/utils";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

export function PageShell({ children, className, maxWidth = "max-w-[1600px]" }: PageShellProps) {
  return (
    <AdminLayout>
      <div className={cn(maxWidth, "mx-auto pb-20 space-y-10 animate-in fade-in duration-700", className)}>
        {children}
      </div>
    </AdminLayout>
  );
}
