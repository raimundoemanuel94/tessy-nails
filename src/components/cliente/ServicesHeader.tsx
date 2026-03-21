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
    <div className="flex items-center gap-4 px-2 py-4">
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-12 w-12 rounded-2xl bg-white border border-brand-soft text-brand-text-main hover:text-brand-primary shadow-sm hover:scale-110 active:scale-95 transition-all"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </Button>
      )}
      <div className="flex-1">
        <h1 className="text-2xl font-black text-brand-text-main tracking-tight uppercase">
          {title}
        </h1>
        <p className="text-[10px] font-bold text-brand-text-sub uppercase tracking-[0.2em]">Escolha o seu cuidado hoje</p>
      </div>
    </div>
  );
}
