"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar as CalendarIcon, Clock } from "lucide-react";
import { AppointmentStorage } from "@/lib/appointmentStorage";

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

// Interface TimeSlot local
interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  label?: string;
}

export default function AgendarPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Carregar serviço e data selecionados do localStorage
  useEffect(() => {
    // ✅ Carregar serviço selecionado com validação
    const selectedService = AppointmentStorage.loadSelectedService();
    if (!selectedService) {
      console.error('No service selected, redirecting...');
      router.push('/cliente/servicos');
      return;
    }
    setSelectedService(selectedService);

    // ✅ Carregar data selecionada com validação
    const savedDate = AppointmentStorage.loadSelectedDate();
    if (savedDate) {
      setSelectedDate(savedDate);
      setCurrentMonth(savedDate);
    }
  }, [router]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // ✅ Salvar data com validação
    const success = AppointmentStorage.saveSelectedDate(date);
    if (!success) {
      console.error('Failed to save selected date');
      // Fallback: localStorage direto
      try {
        localStorage.setItem('selectedDate', date.toISOString());
      } catch (error) {
        console.error('Fallback save failed:', error);
      }
    }
  };

  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedService) {
      console.error('Missing required data for appointment');
      return;
    }

    // ✅ Criar dados completos do agendamento
    const appointmentData = {
      service: selectedService,
      date: selectedDate,
      time: { id: 'temp', time: '00:00', available: true }, // Temporário para validação
      timeSlots: [], // Será preenchido na próxima etapa
      observation: undefined
    };

    // ✅ Salvar dados completos com validação
    const success = AppointmentStorage.saveAppointmentData(appointmentData);
    if (!success) {
      console.error('Failed to save appointment data');
      // Fallback: localStorage direto
      try {
        localStorage.setItem('appointmentData', JSON.stringify(appointmentData));
      } catch (error) {
        console.error('Fallback save failed:', error);
        return;
      }
    }

    // ✅ Navegar para próxima etapa
    router.push('/cliente/agendar/horarios');
  };

  const handleBack = () => {
    router.push('/cliente/servicos');
  };

  const handleBackToServices = () => {
    router.push('/cliente/servicos');
  };

  // Se não houver serviço selecionado, mostrar estado de erro
  if (!selectedService) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Nenhum serviço selecionado</h2>
          <p className="text-gray-600 mb-6">Por favor, selecione um serviço para continuar.</p>
          <Button onClick={handleBackToServices}>
            Voltar para Serviços
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Escolha a data</h1>
            <div></div>
          </div>
        </div>
      </div>

      <main className="container px-4 py-8">
        {/* Service Summary */}
        <div className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{selectedService.name}</h3>
                  <p className="text-sm text-gray-500">{selectedService.duration}</p>
                </div>
                <Badge variant="secondary">{selectedService.price}</Badge>
              </div>
            </CardContent>
          </Card>
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

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthChange(subMonths(currentMonth, 1))}
              >
                ←
              </Button>
              <h3 className="font-medium text-gray-900">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthChange(addMonths(currentMonth, 1))}
              >
                →
              </Button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {eachDayOfInterval({
                start: startOfMonth(currentMonth),
                end: endOfMonth(currentMonth)
              }).map(day => (
                <button
                  key={day.toString()}
                  onClick={() => handleDateSelect(day)}
                  className={`
                    p-2 rounded-lg text-sm transition-colors
                    ${!isSameMonth(day, currentMonth) ? 'text-gray-400' : ''}
                    ${isToday(day) ? 'bg-blue-100 text-blue-600' : ''}
                    ${selectedDate && isSameDay(day, selectedDate) ? 'bg-pink-500 text-white' : ''}
                    ${!isToday(day) && (!selectedDate || !isSameDay(day, selectedDate)) ? 'hover:bg-gray-100' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              ))}
            </div>
          </div>
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
            </div>
          </div>
        )}

        {/* Continue Button */}
        {selectedDate && (
          <div className="flex justify-center">
            <Button 
              onClick={handleContinue}
              size="lg"
              className="px-8"
            >
              Continuar para escolher horário
            </Button>
          </div>
        )}

        {/* No Date Selected Message */}
        {!selectedDate && (
          <div className="text-center text-gray-500">
            <p>Selecione uma data para continuar</p>
          </div>
        )}
      </main>
    </div>
  );
}
