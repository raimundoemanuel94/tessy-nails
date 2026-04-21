"use client";

import { Calendar, Phone, Mail } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  showContact?: boolean;
}

export function EmptyState({
  title = "Nenhum serviço disponível",
  message = "No momento, não temos serviços disponíveis para agendamento.",
  showContact = true
}: EmptyStateProps) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto max-w-md">
        <div className="mb-6 h-24 w-24 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto">
          <span className="text-4xl">💅</span>
        </div>

        <h3 className="mb-4 text-2xl font-serif font-bold text-brand-text-main">
          {title}
        </h3>

        <p className="mb-6 text-brand-text-sub leading-relaxed">
          {message}
        </p>

        {showContact && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-brand-soft/30 border border-brand-accent/20 p-4">
              <p className="mb-3 font-medium text-brand-text-main">
                Precisa de ajuda? Entre em contato:
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center text-brand-text-sub">
                  <Phone className="mr-2 h-4 w-4 text-brand-primary" />
                  <span>(11) 98765-4321</span>
                </div>

                <div className="flex items-center justify-center text-brand-text-sub">
                  <Mail className="mr-2 h-4 w-4 text-brand-primary" />
                  <span>contato@tessynails.com.br</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
