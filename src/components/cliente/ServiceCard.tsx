"use client";

import { Clock, Star } from "lucide-react";
import { useState } from "react";
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
  imageUrl?: string;
  rating?: number;
}

interface ServiceCardProps {
  service: Service;
  onSelect?: (service: Service) => void;
}

export function ServiceCard({ service, onSelect }: ServiceCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleSelect = () => {
    if (onSelect) {
      onSelect(service);
    }
  };

  const isHighlyRated = service.rating && service.rating >= 4.9;

  return (
    <div 
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[2rem] border border-brand-soft bg-white p-3 shadow-xl shadow-brand-primary/5 transition-all duration-500 hover:shadow-2xl hover:shadow-brand-primary/10 hover:-translate-y-1 active:scale-[0.98] cursor-pointer",
        !service.isActive && "opacity-75 grayscale-[0.5]"
      )}
      onClick={handleSelect}
    >
      {/* Service Image / Banner Section */}
      <div className="relative h-40 w-full overflow-hidden rounded-[1.5rem] bg-brand-soft/20 mb-4 group-hover:shadow-md transition-all duration-500">
        {(service.imageUrl || service.image) && !imageError ? (
          <img 
            src={service.imageUrl || service.image} 
            alt={service.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-soft/30">
            <div className="h-16 w-16 rounded-2xl bg-white/70 backdrop-blur-sm shadow-[0_4px_20px_-4px_rgba(238,66,143,0.08)] flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
               💅
            </div>
          </div>
        )}
        
        {/* Overlay gradient for better typography contrast if needed, subtle */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />

        {/* Top-Left Badge: Only show if popular/promo to avoid clutter */}
        {isHighlyRated ? (
          <div className="absolute top-3 left-3 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-primary shadow-sm z-10 flex items-center gap-1">
             <Star className="h-3 w-3 fill-brand-secondary text-brand-secondary" />
             Mais Pedido
          </div>
        ) : service.name.toLowerCase().includes('combo') ? (
          <div className="absolute top-3 left-3 rounded-full bg-brand-secondary/95 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-widest text-brand-primary shadow-sm z-10">
             Promo
          </div>
        ) : null}

        {/* Status Badge Overwrites Top-Left if inactive */}
        {!service.isActive && (
          <div className="absolute top-3 left-3 rounded-full bg-brand-text-main/90 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm z-20">
            Indisponível
          </div>
        )}
      </div>

      {/* Service Content */}
      <div className="p-3.5 flex flex-col flex-1 h-full">
        
        {/* Title Area: min-height to ensure consistency even if 1 or 2 lines */}
        <div className="min-h-[3.2rem] flex items-start mb-1">
          <h3 className="text-[1.15rem] font-bold text-brand-text-main leading-snug tracking-tight group-hover:text-brand-primary transition-colors line-clamp-2">
            {service.name}
          </h3>
        </div>

        {/* Price Area: Separated for emphasis and breathing room */}
        <div className="mb-2">
          <span className="text-[1.25rem] font-black text-brand-primary tracking-tight">
            {service.price}
          </span>
        </div>
        
        {/* Description Area */}
        <p className="text-[13px] text-brand-text-sub/90 font-medium leading-relaxed line-clamp-2 mb-4 pr-1">
          {service.description}
        </p>

        {/* Spacer to push Footer rigidly to the bottom */}
        <div className="flex-1" />

        {/* Footer: Meta & CTA */}
        <div className="pt-3 flex items-center justify-between border-t border-brand-soft/40 mt-auto">
          
          {/* Duration Badge */}
          <div className="flex items-center gap-1.5 bg-brand-soft/20 px-3 py-1.5 rounded-full border border-brand-soft/40">
            <Clock size={13} className="text-brand-primary" />
            <span className="text-[10px] font-bold text-brand-text-sub uppercase tracking-widest">{service.duration}</span>
          </div>

          <Button 
            className="rounded-full h-10 px-6 bg-brand-primary hover:bg-[#D43B7B] text-white font-bold text-[11px] uppercase tracking-[0.15em] shadow-md shadow-brand-primary/20 hover:shadow-lg hover:shadow-brand-primary/30 transition-all hover:scale-105 active:scale-95"
            disabled={!service.isActive}
          >
            {service.isActive ? "Reservar" : "Pausado"}
          </Button>
        </div>
      </div>
    </div>
  );
}
