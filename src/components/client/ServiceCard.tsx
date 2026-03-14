"use client";

import { Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  isActive: boolean;
  image?: string;
  rating?: number;
}

interface ServiceCardProps {
  service: Service;
  onSelect?: (service: Service) => void;
}

export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  const handleSelect = () => {
    if (onSelect) {
      onSelect(service);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Service Image */}
      <div className="relative h-48 bg-gradient-to-br from-violet-100 to-purple-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-white/80 flex items-center justify-center">
            <span className="text-2xl">💅</span>
          </div>
        </div>
        
        {/* Status Badge */}
        {!service.isActive && (
          <div className="absolute top-3 right-3 rounded-full bg-gray-500 px-3 py-1 text-xs font-medium text-white">
            Indisponível
          </div>
        )}

        {/* Rating Badge */}
        {service.rating && service.rating >= 4.9 && (
          <div className="absolute top-3 right-3 flex items-center rounded-full bg-violet-500 px-2 py-1 text-xs font-medium text-white">
            <Star className="mr-1 h-3 w-3 fill-current" />
            {service.rating}
          </div>
        )}
      </div>

      {/* Service Content */}
      <div className="p-5">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
          {service.name}
        </h3>
        
        <p className="mb-4 text-sm text-gray-600 line-clamp-3">
          {service.description}
        </p>

        {/* Meta Info */}
        <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            {service.duration}
          </div>
          <div className="font-semibold text-violet-600">
            {service.price}
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          className="w-full bg-linear-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSelect}
          disabled={!service.isActive}
        >
          {service.isActive ? "Selecionar" : "Indisponível"}
        </Button>
      </div>
    </div>
  );
}
