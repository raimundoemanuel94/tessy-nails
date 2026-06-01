"use client";

import { Mail } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  showContact?: boolean;
}

export function EmptyState({
  title = "Nenhum serviço disponível",
  message = "No momento, não há serviços disponíveis para agendamento.",
  showContact = true,
}: EmptyStateProps) {
  return (
    <div className="py-16 text-center px-6">
      <div className="mx-auto max-w-xs">
        <div className="mb-5 h-20 w-20 rounded-3xl bg-[#EDE5FF] flex items-center justify-center mx-auto">
          <span className="text-4xl">💅</span>
        </div>
        <h3 className="mb-3 text-[17px] font-black text-[#1E1A2E]">{title}</h3>
        <p className="mb-5 text-[12px] text-[#9B8FC0] leading-relaxed">{message}</p>
        {showContact && (
          <div className="rounded-2xl bg-[#EDE5FF] border border-[#DDD5F5] p-4">
            <p className="mb-2 text-[10px] font-black text-[#7C5CBF] uppercase tracking-widest">
              Precisa de ajuda?
            </p>
            <div className="flex items-center justify-center gap-2 text-[11px] text-[#9B8FC0]">
              <Mail size={12} className="text-[#9D7FD4]" />
              <span>contato@nailit.com.br</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
