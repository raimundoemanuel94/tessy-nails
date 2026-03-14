"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ServicesHeader } from "@/components/client/ServicesHeader";
import { ServiceSearch } from "@/components/client/ServiceSearch";
import { ServiceList } from "@/components/client/ServiceList";
import { EmptyState } from "@/components/client/EmptyState";
import { salonService } from "@/services/salon";
import { Service as ServiceType } from "@/types";
import { AppointmentStorage } from "@/lib/appointmentStorage";
import { BottomNav } from "@/components/client/BottomNav";

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
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  // Carregar serviços reais do Firestore
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ✅ Validar conexão
        if (!navigator.onLine) {
          setError('Sem conexão com a internet. Verifique sua conexão.');
          return;
        }
        
        const servicesData = await salonService.getAll();
        console.log('Services loaded from Firestore:', servicesData);
        
        // ✅ Validar se há serviços
        if (!servicesData || servicesData.length === 0) {
          console.warn('No services found in Firestore');
          setError('Nenhum serviço disponível no momento. Contate o administrador para cadastrar serviços.');
          return;
        }
        
        // ✅ Validar estrutura dos dados
        const validServices = servicesData.filter(service => 
          service.id && 
          service.name && 
          service.price && 
          service.durationMinutes
        );
        
        if (validServices.length === 0) {
          setError('Serviços disponíveis mas com dados incompletos. Contate o administrador.');
          return;
        }
        
        // Transformar dados para o formato esperado pelo componente
        const transformedServices = validServices.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description || "",
          price: `R$ ${service.price.toFixed(2)}`,
          duration: `${service.durationMinutes}min`,
          isActive: service.isActive !== false, // Default true se não especificado
          image: undefined,
          rating: undefined
        }));
        
        setServices(transformedServices);
        setFilteredServices(transformedServices);
      } catch (error: any) {
        console.error('Error loading services:', error);
        
        // ✅ Tratamento específico de erros
        if (error.code === 'permission-denied') {
          setError('Sem permissão para acessar os serviços. Contate o administrador.');
        } else if (error.code === 'unavailable') {
          setError('Serviço temporariamente indisponível. Tente novamente em alguns minutos.');
        } else {
          setError('Não foi possível carregar os serviços. Verifique sua conexão e tente novamente.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  // Busca e filtro
  useEffect(() => {
    let filtered = services;

    // Aplicar busca
    if (searchQuery.trim()) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
    // Validar serviço antes de prosseguir
    if (!service || !service.id || !service.name) {
      console.error('Invalid service selected:', service);
      return;
    }

    // Salvar serviço selecionado com validação
    const success = AppointmentStorage.saveSelectedService(service);
    if (!success) {
      console.error('Failed to save selected service');
      // Fallback: tentar localStorage direto
      try {
        localStorage.setItem('selectedService', JSON.stringify(service));
      } catch (error) {
        console.error('Fallback save failed:', error);
        return;
      }
    }

    // Limpar dados antigos de agendamento
    AppointmentStorage.clearAppointmentData();
    AppointmentStorage.clearSelectedDate();

    // Navegar para próxima etapa
    router.push('/cliente/agendar');
  };

  const handleBack = () => {
    router.push('/cliente');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <ServicesHeader 
        title="Escolha um serviço"
        onBack={handleBack}
      />

      <main className="container px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

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
      <BottomNav />
    </div>
  );
}
