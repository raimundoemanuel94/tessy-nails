"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, isToday, isBefore, isAfter, setHours, setMinutes, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { appointmentService } from "@/services/appointments";
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

  useEffect(() => {
    const appointmentData = AppointmentStorage.loadAppointmentData();
    if (!appointmentData || !appointmentData.service || !appointmentData.date) {
      router.push('/cliente/agendar');
      return;
    }

    setSelectedService(appointmentData.service);
    setSelectedDate(appointmentData.date);
    
    // Fetch Real Slots based on existing appointments
    const fetchSlots = async () => {
      try {
        const targetDate = new Date(appointmentData.date);
        const startOfDayTime = startOfDay(targetDate);
        const endOfDayTime = addDays(startOfDayTime, 1);
        
        const appointments = await appointmentService.getByDateRange(startOfDayTime, endOfDayTime);
        const activeAppointments = appointments.filter(a => 
          ['pending', 'confirmed', 'completed'].includes(a.status)
        );

        const durationMinutes = 60; // Considera base de 1h para bloqueio por simplificação
        
        const slots: TimeSlot[] = [];
        let currentTime = setMinutes(setHours(targetDate, 8), 0); // Inicio: 08:00
        const endTime = setMinutes(setHours(targetDate, 18), 0); // Fim: 18:00
        const now = new Date();

        while (isBefore(currentTime, endTime)) {
          const slotStart = currentTime;
          const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60000);
          
          const isPastSlot = isToday(targetDate) && isBefore(slotStart, now);
          
          const hasOverlap = activeAppointments.some(apt => {
            const aptStart = new Date(apt.appointmentDate);
            const aptEnd = new Date(aptStart.getTime() + 60 * 60000); // Assumindo bloqueio de 1h
            return (
              (slotStart < aptEnd && slotEnd > aptStart) ||
              (slotStart.getTime() === aptStart.getTime())
            );
          });

          slots.push({
            id: format(slotStart, 'HH:mm'),
            time: format(slotStart, 'HH:mm'),
            available: !hasOverlap && !isPastSlot,
            label: ['10:00', '14:00', '16:00'].includes(format(slotStart, 'HH:mm')) && !hasOverlap && !isPastSlot ? 'Popular' : undefined
          });

          currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30 min por slot
        }
        
        setTimeSlots(slots);
      } catch (error) {
        console.error("Erro ao buscar horários", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSlots();

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
