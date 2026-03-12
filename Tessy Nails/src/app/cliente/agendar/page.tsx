"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AgendarHeader } from "@/components/client/AgendarHeader";
import { ServiceSummary } from "@/components/client/ServiceSummary";
import { CalendarView } from "@/components/client/CalendarView";
import { NoServiceState } from "@/components/client/NoServiceState";
import { Button } from "@/components/ui/button";
import { Clock, Calendar as CalendarIcon } from "lucide-react";

// Interface Service local
interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  duration: string;
  image?: string;
  rating?: number;
}

export default function AgendarPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Carregar serviço selecionado do localStorage
  useEffect(() => {
    const savedService = localStorage.getItem('selectedService');
    if (savedService) {
      try {
        const service = JSON.parse(savedService);
        setSelectedService(service);
      } catch (error) {
        console.error('Error parsing saved service:', error);
      }
    }
  }, []);

  // Carregar data selecionada do localStorage
  useEffect(() => {
    const savedDate = localStorage.getItem('selectedDate');
    if (savedDate) {
      try {
        const date = new Date(savedDate);
        setSelectedDate(date);
        setCurrentMonth(date);
      } catch (error) {
        console.error('Error parsing saved date:', error);
      }
    }
  }, []);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    localStorage.setItem('selectedDate', date.toISOString());
  };

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
  };

  const handleContinue = () => {
    if (selectedDate) {
      // Salvar dados para próxima etapa
      const appointmentData = {
        service: selectedService,
        date: selectedDate,
        month: currentMonth
      };
      localStorage.setItem('appointmentData', JSON.stringify(appointmentData));
      
      // Navegar para página de horários
      router.push('/cliente/agendar/horarios');
    }
  };

  const handleBack = () => {
    router.push('/cliente/servicos');
  };

  const handleBackToServices = () => {
    router.push('/cliente/servicos');
  };

  // Se não houver serviço selecionado, mostrar estado de erro
  if (!selectedService) {
    return <NoServiceState onBack={handleBackToServices} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AgendarHeader 
        title="Escolha a data"
        onBack={handleBack}
      />

      <main className="container px-4 py-8">
        {/* Service Summary */}
        <div className="mb-8">
          <ServiceSummary service={selectedService} />
        </div>

        {/* Calendar Section */}
        <div className="mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Selecione uma data
            </h2>
            <p className="text-gray-600">
              Escolha o dia desejado para realizar o agendamento
            </p>
          </div>

          <CalendarView 
            selectedDate={selectedDate || undefined}
            onDateSelect={handleDateSelect}
            onMonthChange={handleMonthChange}
          />
        </div>

        {/* Selected Date Summary */}
        {selectedDate && (
          <div className="mb-8 rounded-xl bg-pink-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-pink-700">
                <CalendarIcon className="mr-2 h-5 w-5" />
                <span className="font-medium">
                  Data selecionada: {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              
              <div className="flex items-center text-pink-700">
                <Clock className="mr-2 h-5 w-5" />
                <span className="font-medium">
                  Próximo passo: Escolher horário
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="text-center">
          <Button 
            onClick={handleContinue}
            disabled={!selectedDate}
            className="bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ver horários disponíveis
          </Button>
          
          {!selectedDate && (
            <p className="mt-3 text-sm text-gray-500">
              Selecione uma data para continuar
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
