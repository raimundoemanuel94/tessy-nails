"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HorariosHeader } from "@/components/client/HorariosHeader";
import { AppointmentSummary } from "@/components/client/AppointmentSummary";
import { TimeSlotGrid, TimeSlot } from "@/components/client/TimeSlotGrid";
import { NoTimeSlotsState } from "@/components/client/NoTimeSlotsState";
import { Button } from "@/components/ui/button";
import { appointmentService } from "@/services";

// Horário de funcionamento: 08:00–18:00, intervalos de 30min
const WORK_START = 8;
const WORK_END = 18;
const INTERVAL = 30;

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

function generateSlots(occupiedTimes: Set<string>): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let id = 1;
  for (let hour = WORK_START; hour < WORK_END; hour++) {
    for (let min = 0; min < 60; min += INTERVAL) {
      const time = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      slots.push({ id: String(id++), time, available: !occupiedTimes.has(time) });
    }
  }
  return slots;
}

export default function HorariosPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedAppointmentData = localStorage.getItem("appointmentData");
    if (!savedAppointmentData) {
      setLoading(false);
      return;
    }

    let data: AppointmentData;
    try {
      data = JSON.parse(savedAppointmentData);
    } catch {
      setLoading(false);
      return;
    }

    const parsedDate = new Date(data.date);
    setSelectedService(data.service);
    setSelectedDate(parsedDate);

    appointmentService
      .getByDateRange(startOfDay(parsedDate), endOfDay(parsedDate))
      .then((appointments) => {
        const occupiedTimes = new Set<string>(
          appointments
            .filter((a) => a.status !== "cancelled")
            .map((a) => {
              const d = new Date(a.appointmentDate);
              return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
            })
        );
        setTimeSlots(generateSlots(occupiedTimes));
      })
      .catch(() => {
        setError("Não foi possível verificar disponibilidade. Exibindo todos os horários.");
        setTimeSlots(generateSlots(new Set()));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleTimeSelect = (timeId: string) => {
    setSelectedTime(timeId);
  };

  const handleContinue = () => {
    if (selectedTime && selectedService && selectedDate) {
      const slot = timeSlots.find((s) => s.id === selectedTime);
      if (!slot) return;
      const appointmentData = {
        service: selectedService,
        date: selectedDate,
        time: slot,
        timeSlots,
      };
      localStorage.setItem("appointmentData", JSON.stringify(appointmentData));
      router.push("/agendar/confirmacao");
    }
  };

  const handleBack = () => {
    router.push("/agendar");
  };

  const handleBackToServices = () => {
    router.push("/servicos");
  };

  const handleChangeDate = () => {
    router.push("/agendar");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
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
        <div className="mb-8">
          <AppointmentSummary
            service={selectedService}
            selectedDate={selectedDate}
          />
        </div>

        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Horários disponíveis
            </h2>
            <p className="text-gray-600">
              Selecione um horário para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          {error && (
            <p className="mb-4 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <TimeSlotGrid
            timeSlots={timeSlots}
            selectedTime={selectedTime || undefined}
            onTimeSelect={handleTimeSelect}
          />
        </div>

        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedTime}
            className="bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
