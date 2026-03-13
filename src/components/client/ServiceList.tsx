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
          <div key={index} className="h-64 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto max-w-md">
          <div className="mb-4 h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <span className="text-3xl text-gray-400">💅</span>
          </div>
          <h3 className="mb-4 text-xl font-semibold text-gray-900">
            Nenhum serviço disponível
          </h3>
          <p className="text-gray-600">
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
