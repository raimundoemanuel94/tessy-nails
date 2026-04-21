"use client";

import { ServiceCard, Service } from "./ServiceCard";

interface ServiceListProps {
  services: Service[];
  onSelect?: (service: Service) => void;
  loading?: boolean;
}

export function ServiceList({ services, onSelect, loading = false }: ServiceListProps) {
  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-[2.5rem] bg-brand-soft/20" />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto max-w-md">
          <div className="mb-4 h-20 w-20 rounded-full bg-brand-soft/10 flex items-center justify-center mx-auto shadow-inner">
            <span className="text-3xl text-brand-text-sub/50">💅</span>
          </div>
          <h3 className="mb-4 text-xl font-black text-brand-text-main tracking-tight">
            Nenhum serviço disponível
          </h3>
          <p className="text-sm font-bold text-brand-text-sub leading-relaxed opacity-70">
            No momento, não temos serviços disponíveis para agendamento.
            Por favor, tente novamente mais tarde ou entre em contato conosco.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <ServiceCard 
          key={service.id} 
          service={service}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
