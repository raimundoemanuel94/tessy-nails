"use client";

import { ArrowLeft, Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ServicesHeaderProps {
  title?: string;
  onBack?: () => void;
}

export function ServicesHeader({ title = "Nossos Serviços", onBack }: ServicesHeaderProps) {
  return (
    <header className="sticky top-0 pt-[env(safe-area-inset-top)] z-50 w-full bg-brand-primary text-white shadow-md">
      <div className="container flex h-16 items-center gap-4 px-4 md:px-6">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10 text-white hover:bg-white/10"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight uppercase leading-none">
            {title}
          </h1>
          <p className="text-[9px] font-medium text-white/70 uppercase tracking-[0.2em] mt-0.5">Escolha o seu cuidado hoje</p>
        </div>
      </div>
    </header>
  );
}
