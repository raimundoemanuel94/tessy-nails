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
        {/* Icon */}
        <div className="mb-6 h-24 w-24 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mx-auto">
          <span className="text-4xl">💅</span>
        </div>

        {/* Content */}
        <h3 className="mb-4 text-2xl font-bold text-gray-900">
          {title}
        </h3>
        
        <p className="mb-6 text-gray-600 leading-relaxed">
          {message}
        </p>

        {/* Contact Options */}
        {showContact && (
          <div className="space-y-4">
            <div className="rounded-lg bg-violet-50 p-4">
              <p className="mb-3 font-medium text-violet-900">
                Precisa de ajuda? Entre em contato:
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center text-gray-700">
                  <Phone className="mr-2 h-4 w-4" />
                  <span>(11) 98765-4321</span>
                </div>
                
                <div className="flex items-center justify-center text-gray-700">
                  <Mail className="mr-2 h-4 w-4" />
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
