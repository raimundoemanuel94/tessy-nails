"use client";

import { ClientHeader } from "@/components/client/ClientHeader";
import { HeroSection } from "@/components/client/HeroSection";
import { ServicesSection } from "@/components/client/ServicesSection";
import { BenefitsSection } from "@/components/client/BenefitsSection";
import { ClientFooter } from "@/components/client/ClientFooter";

export default function ClientePage() {
  return (
    <div className="min-h-screen bg-white">
      <ClientHeader />
      
      <main>
        <HeroSection />
        <ServicesSection />
        <BenefitsSection />
      </main>
      
      <ClientFooter />
    </div>
  );
}
