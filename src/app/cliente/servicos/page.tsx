"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Search, 
  Filter 
} from "lucide-react";
import { ServicesHeader } from "@/components/cliente/ServicesHeader";
import { ServiceSearch } from "@/components/cliente/ServiceSearch";
import { ServiceList } from "@/components/cliente/ServiceList";
import { EmptyState } from "@/components/cliente/EmptyState";
import { salonService } from "@/services/salon";
import { Service as ServiceType } from "@/types";
import { AppointmentStorage } from "@/lib/appointmentStorage";

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

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!navigator.onLine) {
          setError('Sem conexão com a internet. Verifique sua conexão.');
          return;
        }
        
        const servicesData = await salonService.getAll();
        
        if (!servicesData || servicesData.length === 0) {
          setError('Nenhum serviço disponível no momento.');
          return;
        }
        
        const validServices = servicesData.filter(service => 
          service.id && 
          service.name && 
          service.price && 
          service.durationMinutes
        );
        
        const getServiceImage = (serviceName: string) => {
          const name = serviceName.toLowerCase();

          // Detecção Automática "SaaS Level" - 1 segundo de compreensão
          if (name.includes('combo') || name.includes('casadinha') || (name.includes('mão') && name.includes('pé'))) return '/images/services/mock_combo.png';
          if (name.includes('gel') || name.includes('fibra') || name.includes('acrílico')) return '/images/services/mock_gel.png';
          if (name.includes('pedicure') || name.includes('pé') || name.includes('spa dos pés')) return '/images/services/mock_pedicure.png';
          if (name.includes('cutilagem') || name.includes('cutícula') || name.includes('spa') || name.includes('hidratação')) return '/images/services/mock_cutilagem.png';
          if (name.includes('postiça') || name.includes('tips') || name.includes('press')) return '/images/services/mock_postica.png';
          if (name.includes('manicure') || name.includes('esmaltação')) return '/images/services/mock_esmaltacao.png';

          return '/images/services/mock_esmaltacao.png';
        };
        
        const transformedServices = validServices.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description || "",
          price: `R$ ${service.price.toFixed(2)}`,
          duration: `${service.durationMinutes}min`,
          isActive: service.isActive !== false,
          imageUrl: (service as any).imageUrl || (service as any).image || getServiceImage(service.name),
          rating: undefined
        }));
        
        setServices(transformedServices);
        setFilteredServices(transformedServices);
      } catch (error: any) {
        console.error('Error loading services:', error);
        setError('Não foi possível carregar os serviços.');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    let filtered = services;
    if (searchQuery.trim()) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    if (showOnlyActive) {
      filtered = filtered.filter(service => service.isActive);
    }
    setFilteredServices(filtered);
  }, [services, searchQuery, showOnlyActive]);

  const handleSelectService = (service: Service) => {
    const success = AppointmentStorage.saveSelectedService(service);
    if (!success) {
      localStorage.setItem('selectedService', JSON.stringify(service));
    }
    AppointmentStorage.clearAppointmentData();
    AppointmentStorage.clearSelectedDate();
    router.push('/cliente/agendar');
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-4 max-w-2xl mx-auto space-y-4">
      <ServicesHeader 
        title="Nossos Serviços"
        onBack={() => router.push('/cliente')}
      />

      <ServiceSearch 
        onSearch={setSearchQuery}
        onFilterActive={setShowOnlyActive}
      />

      <main className="pb-10">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-bold uppercase tracking-wider">
            {error}
          </div>
        )}

        {filteredServices.length > 0 ? (
          <ServiceList 
            services={filteredServices}
            onSelect={handleSelectService}
          />
        ) : (
          <EmptyState 
            title="Nenhum serviço encontrado"
            message={searchQuery.trim() 
              ? `Não encontramos resultados para "${searchQuery}".`
              : "Nenhum serviço disponível no momento."
            }
            showContact={!searchQuery.trim()}
          />
        )}
      </main>
    </div>
  );
}
