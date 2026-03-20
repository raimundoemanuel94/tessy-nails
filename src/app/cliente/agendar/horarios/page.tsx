"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, isToday, isBefore, isAfter, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Clock, 
  CheckCircle 
} from "lucide-react";
import { AppointmentStorage } from "@/lib/appointmentStorage";
import { cn } from "@/lib/utils";
import { HorariosHeader } from "@/components/cliente/HorariosHeader";
import { AppointmentSummary } from "@/components/cliente/AppointmentSummary";
import { TimeSlotGrid, TimeSlot } from "@/components/cliente/TimeSlotGrid";
import { NoTimeSlotsState } from "@/components/cliente/NoTimeSlotsState";

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

  useEffect(() => {
    const appointmentData = AppointmentStorage.loadAppointmentData();
    if (!appointmentData || !appointmentData.service || !appointmentData.date) {
      router.push('/cliente/agendar');
      return;
    }

    setSelectedService(appointmentData.service);
    setSelectedDate(appointmentData.date);
    setTimeSlots(generateMockTimeSlots());
    setLoading(false);
  }, [router]);

  const handleContinue = () => {
    if (!selectedTime || !selectedService || !selectedDate) return;

    const selectedTimeSlot = timeSlots.find(slot => slot.id === selectedTime);
    if (!selectedTimeSlot) return;

    const appointmentData = {
      service: selectedService,
      date: selectedDate,
      time: selectedTimeSlot,
      timeSlots: timeSlots,
      observation: undefined
    };

    AppointmentStorage.saveAppointmentData(appointmentData);
    router.push('/cliente/agendar/confirmacao');
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!selectedService || !selectedDate) {
    return (
      <NoTimeSlotsState 
        onBack={() => router.push('/cliente/servicos')}
        onChangeDate={() => router.push('/cliente/agendar')}
      />
    );
  }

  return (
    <div className="px-5 pt-4 max-w-2xl mx-auto space-y-8">
      <HorariosHeader 
        title="Escolha o horário"
        onBack={() => router.push('/cliente/agendar')}
      />

      <main className="space-y-8 pb-10">
        <AppointmentSummary 
          service={selectedService}
          selectedDate={selectedDate}
        />

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-xl font-black text-brand-text uppercase tracking-tight">Horários</h2>
              <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-[0.2em]">Disponíveis para este dia</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
              <Clock size={18} />
            </div>
          </div>

          <TimeSlotGrid 
            timeSlots={timeSlots}
            selectedTime={selectedTime || undefined}
            onTimeSelect={setSelectedTime}
          />
        </section>

        <section className="pt-4">
          {selectedTime ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <Button 
                onClick={handleContinue}
                className="w-full h-16 rounded-[2rem] bg-linear-to-br from-brand-primary to-brand-secondary text-white font-black text-base shadow-2xl shadow-brand-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Revisar Agendamento
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.3em] animate-pulse">
                Selecione um horário para prosseguir
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
