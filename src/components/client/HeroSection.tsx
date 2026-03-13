"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_theme(pink,0.3),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,_theme(rose,0.3),transparent_70%)]" />
      </div>

      <div className="relative container px-4 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center rounded-full bg-pink-100 px-4 py-2 text-sm font-medium text-pink-700">
            <Sparkles className="mr-2 h-4 w-4" />
            Experiência Premium em Unhas
          </div>

          {/* Main Title */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Agende seu horário</span>
            <span className="block bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              com praticidade
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-lg text-gray-600 md:text-xl max-w-2xl mx-auto">
            Transforme suas unhas com cuidado profissional. Horários flexíveis, 
            atendimento exclusivo e resultados que encantam.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a 
              href="/agendar"
              className="bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-3 text-lg font-medium shadow-lg inline-flex items-center rounded-lg transition-colors"
            >
              Agendar agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>

            <a 
              href="#meus-agendamentos"
              className="border border-pink-200 text-pink-700 hover:bg-pink-50 px-8 py-3 text-lg font-medium rounded-lg inline-flex items-center transition-colors"
            >
              <Calendar className="mr-2 h-5 w-5" />
              Meus agendamentos
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
              Horários disponíveis
            </div>
            <div className="flex items-center">
              <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
              Confirmação rápida
            </div>
            <div className="flex items-center">
              <div className="mr-2 h-2 w-2 rounded-full bg-green-500" />
              Atendimento premium
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
