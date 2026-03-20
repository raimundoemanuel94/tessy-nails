"use client";

import { Button } from "@/components/ui/button";
import { Clock, DollarSign, ArrowRight, Star } from "lucide-react";
import Link from "next/link";

// Mock data para serviços
const featuredServices = [
  {
    id: 1,
    name: "Manicure Completa",
    description: "Tratamento completo com esmaltação e cuidados especiais",
    price: "R$ 89,90",
    duration: "1h 30min",
    rating: 4.9,
    image: "/services/manicure.jpg"
  },
  {
    id: 2,
    name: "Pedicure Spa",
    description: "Relaxante tratamento com esfoliação e hidratação",
    price: "R$ 119,90",
    duration: "2h",
    rating: 4.8,
    image: "/services/pedicure.jpg"
  },
  {
    id: 3,
    name: "Nails em Gel",
    description: "Aplicação duradoura com acabamento perfeito",
    price: "R$ 149,90",
    duration: "2h 30min",
    rating: 5.0,
    image: "/services/gel.jpg"
  },
  {
    id: 4,
    name: "Alongamento Fibra",
    description: "Alongamento com fibra de vidro ou seda",
    price: "R$ 179,90",
    duration: "3h",
    rating: 4.9,
    image: "/services/alongamento.jpg"
  }
];

export function ServicesSection() {
  return (
    <section id="servicos" className="py-16 bg-white">
      <div className="container px-4">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Nossos <span className="bg-linear-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">Serviços</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Tratamentos especializados para deixar suas unhas ainda mais bonitas e saudáveis
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredServices.map((service) => (
            <div
              key={service.id}
              className="group relative overflow-hidden rounded-2xl border border-brand-primary/10 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Service Image */}
              <div className="relative h-48 bg-linear-to-br from-brand-primary/10 to-brand-secondary/10">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-white/80 flex items-center justify-center">
                    <span className="text-2xl">💅</span>
                  </div>
                </div>
                
                {/* Badge */}
                {service.rating >= 4.9 && (
                  <div className="absolute top-3 right-3 flex items-center rounded-full bg-brand-primary px-2 py-1 text-xs font-medium text-white">
                    <Star className="mr-1 h-3 w-3 fill-current" />
                    {service.rating}
                  </div>
                )}
              </div>

              {/* Service Content */}
              <div className="p-5">
                <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-brand-primary transition-colors block">
                  {service.name}
                </h3>
                
                <p className="mb-4 text-sm text-gray-600 line-clamp-2">
                  {service.description}
                </p>

                {/* Meta Info */}
                <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    {service.duration}
                  </div>
                  <div className="font-semibold text-brand-primary">
                    {service.price}
                  </div>
                </div>

                {/* CTA Button */}
                <Link 
                  href={`/cliente/servicos/${service.id}`}
                  className="bg-linear-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-medium w-full inline-flex items-center justify-center px-4 py-2 rounded-lg transition-all"
                >
                  Selecionar
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* View All Services */}
        <div className="mt-12 text-center">
          <Link 
            href="/cliente/servicos"
            className="border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/5 px-8 py-3 text-lg font-medium rounded-lg inline-flex items-center justify-center transition-colors"
          >
            Ver todos os serviços
          </Link>
        </div>
      </div>
    </section>
  );
}
