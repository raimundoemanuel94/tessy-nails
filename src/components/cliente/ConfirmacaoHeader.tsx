"use client";

import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmacaoHeaderProps {
  title?: string;
  onBack?: () => void;
}

export function ConfirmacaoHeader({ title = "Confirmar agendamento", onBack }: ConfirmacaoHeaderProps) {
  return (
    <header className="sticky top-0 pt-[env(safe-area-inset-top)] z-50 w-full bg-brand-primary text-white shadow-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Back Button */}
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Title */}
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold text-white md:text-2xl flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-white/90" />
            {title}
          </h1>
        </div>

        {/* Spacer */}
        <div className="w-20 md:w-24" />
      </div>
    </header>
  );
}
