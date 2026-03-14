"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, isToday, isBefore, isAfter, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, CheckCircle } from "lucide-react";
import { AppointmentStorage } from "@/lib/appointmentStorage";
import { HorariosHeader } from "@/components/client/HorariosHeader";
import { AppointmentSummary } from "@/components/client/AppointmentSummary";
import { TimeSlotGrid, TimeSlot } from "@/components/client/TimeSlotGrid";
import { NoTimeSlotsState } from "@/components/client/NoTimeSlotsState";

// Interfaces locais
interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  duration: string;
  image?: string;
  rating?: number;
}

interface AppointmentData {
  service: Service;
  date: Date;
  month: Date;
}

// Mock data para horários disponíveis
const generateMockTimeSlots = (): TimeSlot[] => {
  return [
    { id: "1", time: "08:00", available: true },
    { id: "2", time: "08:30", available: false }, // Indisponível
    { id: "3", time: "09:00", available: true },
    { id: "4", time: "09:30", available: true },
    { id: "5", time: "10:00", available: true, label: "Popular" },
    { id: "6", time: "10:30", available: false }, // Indisponível
    { id: "7", time: "11:00", available: true },
    { id: "8", time: "13:00", available: true },
    { id: "9", time: "13:30", available: true },
    { id: "10", time: "14:00", available: true, label: "Popular" },
    { id: "11", time: "14:30", available: false }, // Indisponível
    { id: "12", time: "15:00", available: true },
    { id: "13", time: "15:30", available: true },
    { id: "14", time: "16:00", available: true },
    { id: "15", time: "16:30", available: true },
    { id: "16", time: "17:00", available: true },
    { id: "17", time: "17:30", available: false }, // Indisponível
    { id: "18", time: "18:00", available: false }, // Indisponível
  ];
};

export default function HorariosPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar dados do localStorage com validação
  useEffect(() => {
    // ✅ Carregar dados completos do agendamento
    const appointmentData = AppointmentStorage.loadAppointmentData();
    if (!appointmentData) {
      console.error('No appointment data found, redirecting...');
      router.push('/cliente/agendar');
      return;
    }

    // ✅ Validar dados essenciais
    if (!appointmentData.service || !appointmentData.date) {
      console.error('Invalid appointment data:', appointmentData);
      router.push('/cliente/agendar');
      return;
    }

    setSelectedService(appointmentData.service);
    setSelectedDate(appointmentData.date);
    setTimeSlots(generateMockTimeSlots());
    setLoading(false);
  }, [router]);

  const handleTimeSelect = (timeId: string) => {
    setSelectedTime(timeId);
  };

  const handleContinue = () => {
    if (!selectedTime || !selectedService || !selectedDate) {
      console.error('Missing required data for appointment');
      return;
    }

    // ✅ Encontrar o horário selecionado
    const selectedTimeSlot = timeSlots.find(slot => slot.id === selectedTime);
    if (!selectedTimeSlot) {
      console.error('Selected time slot not found');
      return;
    }

    // ✅ Criar dados completos do agendamento
    const appointmentData = {
      service: selectedService,
      date: selectedDate,
      time: selectedTimeSlot,
      timeSlots: timeSlots,
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
    router.push('/cliente/agendar/confirmacao');
  };

  const handleBack = () => {
    router.push('/cliente/agendar');
  };

  const handleBackToServices = () => {
    router.push('/cliente/servicos');
  };

  const handleChangeDate = () => {
    router.push('/cliente/agendar');
  };

  // Estados de erro
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Carregando horários...</p>
        </div>
      </div>
    );
  }

  if (!selectedService || !selectedDate) {
    return (
      <NoTimeSlotsState 
        onBack={handleBackToServices}
        onChangeDate={handleChangeDate}
      />
    );
  }

  if (timeSlots.length === 0) {
    return (
      <NoTimeSlotsState 
        onBack={handleBack}
        onChangeDate={handleChangeDate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HorariosHeader 
        title="Escolha um horário"
        onBack={handleBack}
      />

      <main className="container px-4 py-8">
        {/* Appointment Summary */}
        <div className="mb-8">
          <AppointmentSummary 
            service={selectedService}
            selectedDate={selectedDate}
          />
        </div>

        {/* Time Slots */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Horários disponíveis
            </h2>
            <p className="text-gray-600">
              Selecione um horário para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          <TimeSlotGrid 
            timeSlots={timeSlots}
            selectedTime={selectedTime || undefined}
            onTimeSelect={handleTimeSelect}
          />
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button 
            onClick={handleContinue}
            disabled={!selectedTime}
            className="bg-linear-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-medium px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuar
          </Button>
          
          {!selectedTime && (
            <p className="mt-3 text-sm text-gray-500">
              Selecione um horário para continuar
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
