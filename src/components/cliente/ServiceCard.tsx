"use client";

import { Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  const isHighlyRated = service.rating && service.rating >= 4.9;

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-[2.5rem] border border-brand-border bg-white p-4 shadow-xl shadow-brand-primary/5 transition-all duration-500 hover:shadow-2xl hover:shadow-brand-primary/10 hover:-translate-y-1 active:scale-95 cursor-pointer",
        !service.isActive && "opacity-75 grayscale-[0.5]"
      )}
      onClick={handleSelect}
    >
      {/* Service Image / Icon Section */}
      <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-linear-to-br from-brand-primary/10 to-brand-secondary/5 mb-4 group-hover:scale-105 transition-transform duration-500">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-20 w-20 rounded-3xl bg-white shadow-xl flex items-center justify-center text-4xl group-hover:rotate-12 transition-transform duration-500">
            💅
          </div>
        </div>
        
        {/* Status Badge */}
        {!service.isActive && (
          <div className="absolute top-4 left-4 rounded-full bg-brand-text-muted/80 backdrop-blur-md px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">
            Indisponível
          </div>
        )}

        {/* Rating Badge */}
        {isHighlyRated && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-brand-primary shadow-sm">
            <Star className="h-3 w-3 fill-brand-primary" />
            Popuolar
          </div>
        )}
      </div>

      {/* Service Content */}
      <div className="px-2 pb-2 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-black text-brand-text tracking-tight group-hover:text-brand-primary transition-colors">
            {service.name}
          </h3>
          <span className="text-lg font-black text-brand-primary whitespace-nowrap">
            {service.price}
          </span>
        </div>
        
        <p className="text-xs font-medium text-brand-text-muted leading-relaxed line-clamp-2">
          {service.description}
        </p>

        {/* Meta & CTA */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-text-muted">
            <div className="h-8 w-8 rounded-xl bg-brand-background flex items-center justify-center text-brand-primary">
               <Clock size={16} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest">{service.duration}</span>
          </div>

          <Button 
            className="rounded-xl h-10 px-6 bg-brand-primary hover:bg-brand-secondary text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
            disabled={!service.isActive}
          >
            {service.isActive ? "Reservar" : "Pausado"}
          </Button>
        </div>
      </div>
    </div>
  );
}
