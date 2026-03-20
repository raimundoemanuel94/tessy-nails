"use client";

import { Clock, Star, DollarSign } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  duration: string;
  image?: string;
  rating?: number;
}

interface ServiceSummaryProps {
  service: Service;
}

export function ServiceSummary({ service }: ServiceSummaryProps) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
      {/* Service Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {service.name}
          </h3>
          {service.rating && (
            <div className="flex items-center mt-1 text-sm">
              <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-gray-600">{service.rating}</span>
            </div>
          )}
        </div>
        
        {/* Price Badge */}
        <div className="rounded-full bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">
          {service.price}
        </div>
      </div>

      {/* Service Description */}
      {service.description && (
        <p className="mb-6 text-gray-600 leading-relaxed">
          {service.description}
        </p>
      )}

      {/* Service Details */}
      <div className="space-y-3 text-sm text-gray-700">
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-brand-primary" />
          <span className="font-medium">Duração:</span>
          <span>{service.duration}</span>
        </div>
        
        <div className="flex items-center">
          <DollarSign className="mr-2 h-4 w-4 text-brand-primary" />
          <span className="font-medium">Valor:</span>
          <span>{service.price}</span>
        </div>
      </div>

      {/* Visual Separator */}
      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-violet-200 to-transparent" />
      
      {/* Additional Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Agendamento realizado por profissionais qualificados
        </p>
      </div>
    </div>
  );
}
