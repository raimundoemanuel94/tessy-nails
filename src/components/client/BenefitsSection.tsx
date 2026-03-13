"use client";

import { CheckCircle, Clock, Shield, Heart } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Atendimento com horário marcado",
    description: "Respeitamos seu tempo com horários precisos e sem esperas desnecessárias."
  },
  {
    icon: Shield,
    title: "Praticidade no agendamento",
    description: "Agende online em poucos cliques e receba confirmação imediata."
  },
  {
    icon: CheckCircle,
    title: "Confirmação rápida",
    description: "Receba lembretes automáticos e confirmeções via WhatsApp."
  },
  {
    icon: Heart,
    title: "Experiência premium",
    description: "Atendimento exclusivo com produtos de alta qualidade e profissionais qualificados."
  }
];

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-16 bg-gradient-to-br from-pink-50 to-rose-50">
      <div className="container px-4">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Por que escolher <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Tessy Nails</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Uma experiência completa pensada para sua comodidade e satisfação
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                {/* Icon */}
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-pink-100 text-pink-600 transition-colors group-hover:bg-pink-200">
                  <Icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <h3 className="mb-3 text-lg font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                  {benefit.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-lg">
            <h3 className="mb-4 text-2xl font-bold text-gray-900">
              Pronta para transformar suas unhas?
            </h3>
            <p className="mb-6 text-gray-600">
              Junte-se a centenas de clientes satisfeitos e descubra o poder de um atendimento de qualidade.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <a 
                href="#agendar"
                className="bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-3 font-medium rounded-lg inline-flex items-center justify-center transition-colors"
              >
                Agendar agora
              </a>
              <a 
                href="#servicos"
                className="border border-pink-200 text-pink-700 hover:bg-pink-50 px-8 py-3 font-medium rounded-lg inline-flex items-center justify-center transition-colors"
              >
                Conhecer mais
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
