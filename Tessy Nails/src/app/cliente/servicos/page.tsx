"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ServicesHeader } from "@/components/client/ServicesHeader";
import { ServiceSearch } from "@/components/client/ServiceSearch";
import { ServiceList } from "@/components/client/ServiceList";
import { EmptyState } from "@/components/client/EmptyState";

// Interface Service local para evitar erro de importação
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

// Mock data - pode ser substituído por dados reais do Firestore
const mockServices: Service[] = [
  {
    id: "1",
    name: "Manicure Simples",
    description: "Limpeza, corte e esmaltação clássica para unhas bem cuidadas",
    price: "R$ 69,90",
    duration: "1h",
    isActive: true,
    rating: 4.8
  },
  {
    id: "2",
    name: "Pedicure Completa",
    description: "Tratamento completo dos pés com esfoliação e hidratação",
    price: "R$ 89,90",
    duration: "1h 30min",
    isActive: true,
    rating: 4.9
  },
  {
    id: "3",
    name: "Esmaltação em Gel",
    description: "Aplicação de esmalte em gel com maior durabilidade e brilho",
    price: "R$ 99,90",
    duration: "2h",
    isActive: true,
    rating: 5.0
  },
  {
    id: "4",
    name: "Alongamento Fibra",
    description: "Alongamento com fibra de vidro para unhas mais longas e resistentes",
    price: "R$ 149,90",
    duration: "2h 30min",
    isActive: true,
    rating: 4.7
  },
  {
    id: "5",
    name: "Nail Art",
    description: "Arte e decoração especializada em unhas",
    price: "R$ 119,90",
    duration: "2h",
    isActive: false, // Exemplo de serviço indisponível
    rating: 4.9
  },
  {
    id: "6",
    name: "Manutenção Alongamento",
    description: "Manutenção semanal de alongamento para durabilidade",
    price: "R$ 79,90",
    duration: "1h",
    isActive: true,
    rating: 4.6
  }
];

export default function ServicosPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  // Simular carregamento
  useEffect(() => {
    setTimeout(() => {
      setServices(mockServices);
      setFilteredServices(mockServices);
      setLoading(false);
    }, 1000);
  }, []);

  // Busca e filtro
  useEffect(() => {
    let filtered = services;

    // Aplicar busca
    if (searchQuery.trim()) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Aplicar filtro de ativos
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
    // Salvar serviço selecionado no localStorage ou state global
    localStorage.setItem('selectedService', JSON.stringify(service));
    
    // Navegar para página de agendamento (próxima etapa)
    router.push('/cliente/agendar');
  };

  const handleBack = () => {
    router.push('/cliente');
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

        {loading ? (
          <ServiceList services={[]} loading={true} />
        ) : filteredServices.length > 0 ? (
          <ServiceList 
            services={filteredServices}
            onSelect={handleSelectService}
          />
        ) : (
          <EmptyState 
            title="Nenhum serviço encontrado"
            message={searchQuery.trim() 
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
