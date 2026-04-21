"use client";

import { Calendar, Home, List, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessActionsProps {
  onMyAppointments?: () => void;
  onBackToHome?: () => void;
}

export function SuccessActions({ 
  onMyAppointments, 
  onBackToHome 
}: SuccessActionsProps) {
  return (
    <div className="space-y-6 pt-4 max-w-sm mx-auto">
      {/* Primary Action */}
      <Button 
        onClick={onMyAppointments}
        className="w-full h-16 rounded-[2rem] bg-linear-to-br from-brand-primary to-brand-secondary text-white font-black text-base shadow-2xl shadow-brand-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
      >
        <List className="mr-3 h-5 w-5" />
        Meus Agendamentos
      </Button>

      {/* Secondary Actions */}
      <div className="flex flex-col gap-3">
        <Button 
          variant="outline"
          onClick={onBackToHome}
          className="w-full h-14 rounded-2xl border-brand-border text-brand-text font-black text-[10px] uppercase tracking-[0.2em] shadow-sm hover:text-brand-primary hover:bg-brand-primary/5 transition-all"
        >
          <Home className="mr-2 h-4 w-4" />
          Voltar para o Início
        </Button>

        <p className="text-center text-[10px] font-bold text-brand-text-muted uppercase tracking-[0.2em] px-8 leading-relaxed opacity-60">
          Você pode gerenciar ou cancelar seu horário a qualquer momento
        </p>
      </div>
    </div>
  );
}
