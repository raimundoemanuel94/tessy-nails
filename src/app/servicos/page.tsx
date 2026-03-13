"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ServicesHeader } from "@/components/client/ServicesHeader";
import { ServiceSearch } from "@/components/client/ServiceSearch";
import { ServiceList } from "@/components/client/ServiceList";
import { EmptyState } from "@/components/client/EmptyState";
import { salonService } from "@/services";
import { Service as FirestoreService } from "@/types";

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  isActive: boolean;
  image?: string;
  rating?: number;
}

function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function mapToLocalService(s: FirestoreService): Service {
  return {
    id: s.id || '',
    name: s.name,
    description: s.description ?? "",
    price: formatPrice(s.price),
    duration: formatDuration(s.durationMinutes),
    isActive: s.active,
  };
}

export default function ServicosPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  useEffect(() => {
    salonService.getAll()
      .then((data) => {
        const mapped = data.map(mapToLocalService);
        setServices(mapped);
        setFilteredServices(mapped);
      })
      .catch(() => setError("Não foi possível carregar os serviços. Tente novamente."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = services;

    if (searchQuery.trim()) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (showOnlyActive) {
      filtered = filtered.filter(service => service.isActive);
    }

    setFilteredServices(filtered);
  }, [services, searchQuery, showOnlyActive]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterActive = (activeOnly: boolean) => {
    setShowOnlyActive(activeOnly);
  };

  const handleSelectService = (service: Service) => {
    localStorage.setItem("selectedService", JSON.stringify(service));
    router.push("/agendar");
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ServicesHeader
        title="Escolha um serviço"
        onBack={handleBack}
      />

      <main className="container px-4 py-8">
        <ServiceSearch
          onSearch={handleSearch}
          onFilterActive={handleFilterActive}
        />

        {error ? (
          <div className="mt-8 rounded-lg bg-red-50 border border-red-200 p-4 text-center text-red-700 text-sm">
            {error}
          </div>
        ) : loading ? (
          <ServiceList services={[]} loading={true} />
        ) : filteredServices.length > 0 ? (
          <ServiceList
            services={filteredServices}
            onSelect={handleSelectService}
          />
        ) : (
          <EmptyState
            title="Nenhum serviço encontrado"
            message={
              searchQuery.trim()
                ? `Não encontramos resultados para "${searchQuery}". Tente buscar com outros termos.`
                : "Nenhum serviço disponível no momento."
            }
            showContact={!searchQuery.trim()}
          />
        )}
      </main>
    </div>
  );
}
