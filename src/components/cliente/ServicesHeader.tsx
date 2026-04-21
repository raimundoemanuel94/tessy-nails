"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServicesHeaderProps {
  title?: string;
  onBack?: () => void;
}

export function ServicesHeader({ title = "Nossos Serviços", onBack }: ServicesHeaderProps) {
  return (
    <header className="sticky top-0 pt-[env(safe-area-inset-top)] z-50 w-full bg-brand-primary text-white shadow-md">
      <div className="flex h-16 items-center gap-3 px-5 max-w-2xl mx-auto">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 rounded-xl text-white hover:bg-white/10 active:scale-95 transition-all shrink-0"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </Button>
        )}
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-5 w-5 text-white/80 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white leading-none truncate uppercase tracking-tight">
              {title}
            </h1>
            <p className="text-[9px] font-medium text-white/70 uppercase tracking-[0.15em] mt-0.5">
              Escolha o seu cuidado hoje
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
