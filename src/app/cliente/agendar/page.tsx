"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, ensureDate } from "@/lib/utils";
import { appointmentService } from "@/services/appointments";
import { TimeSlotGrid, TimeSlot } from "@/components/cliente/TimeSlotGrid";
import { Loader2, Sparkles, CheckCircle, ChevronRight, ArrowLeft, Calendar as CalendarIcon, Clock } from "lucide-react";
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

export default function AgendarPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const service = AppointmentStorage.loadSelectedService();
    if (!service) {
      router.push('/cliente/servicos');
      return;
    }
    setSelectedService(service);

    const savedDate = AppointmentStorage.loadSelectedDate();
    if (savedDate) {
      setSelectedDate(savedDate);
      setCurrentMonth(savedDate);
      fetchSlots(savedDate);
    }
  }, [router]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
    AppointmentStorage.saveSelectedDate(date);
    fetchSlots(date);
  };

  const fetchSlots = async (date: Date) => {
    try {
      setLoadingSlots(true);
      const startOfDayTime = new Date(date);
      startOfDayTime.setHours(0, 0, 0, 0);
      const endOfDayTime = new Date(date);
      endOfDayTime.setHours(23, 59, 59, 999);
      
      const appointments = await appointmentService.getByDateRange(startOfDayTime, endOfDayTime);
      const activeAppointments = appointments.filter(a => 
        ['pending', 'confirmed', 'completed'].includes(a.status)
      );

      const durationMinutes = 60; 
      const slots: TimeSlot[] = [];
      let currentTime = new Date(date);
      currentTime.setHours(8, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(19, 0, 0, 0);
      const now = new Date();

      while (currentTime < endTime) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60000);
        
        const isPastSlot = isToday(date) && slotStart < now;
        
        const hasOverlap = activeAppointments.some(apt => {
          const aptStart = ensureDate(apt.appointmentDate);
          const aptEnd = new Date(aptStart.getTime() + 60 * 60000);
          return (
            (slotStart < aptEnd && slotEnd > aptStart) ||
            (slotStart.getTime() === aptStart.getTime())
          );
        });

        slots.push({
          id: format(slotStart, 'HH:mm'),
          time: format(slotStart, 'HH:mm'),
          available: !hasOverlap && !isPastSlot,
          label: ['10:00', '11:00', '15:00', '16:00'].includes(format(slotStart, 'HH:mm')) && !hasOverlap && !isPastSlot ? 'Popular' : undefined
        });

        currentTime = new Date(currentTime.getTime() + 30 * 60000);
      }
      
      setTimeSlots(slots);
    } catch (error) {
      console.error("Erro ao buscar horários", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedService || !selectedTime) return;

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

  if (!selectedService) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 px-6 text-center">
        <div className="h-20 w-20 rounded-3xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
          <CalendarIcon size={32} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-brand-text">Ops!</h2>
          <p className="text-sm text-brand-text-muted">Selecione um serviço primeiro para continuar seu agendamento.</p>
        </div>
        <Button 
          onClick={() => router.push('/cliente/servicos')}
          className="h-12 px-8 rounded-2xl bg-brand-primary hover:bg-brand-secondary font-black uppercase tracking-widest text-[10px]"
        >
          Ver Serviços
        </Button>
      </div>
    );
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  return (
    <div className="px-5 pt-4 max-w-2xl mx-auto space-y-8">
      {/* Header Area */}
      <div className="flex items-center gap-4 py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/cliente/servicos')}
          className="h-12 w-12 rounded-2xl bg-white border border-brand-border text-brand-text hover:text-brand-primary shadow-sm active:scale-95 transition-all"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-brand-text tracking-tight uppercase">Escolha o dia</h1>
          <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-[0.2em]">Sua experiência começa aqui</p>
        </div>
      </div>

      {/* Mini Service Card */}
      <section className="relative overflow-hidden rounded-[2rem] border border-brand-border bg-white p-5 shadow-xl shadow-brand-primary/5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-2xl">
              💅
            </div>
            <div>
              <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-0.5">Serviço Selecionado</p>
              <h3 className="text-lg font-black text-brand-text">{selectedService.name}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-brand-primary">{selectedService.price}</p>
            <p className="text-[10px] font-bold text-brand-text-muted uppercase">{selectedService.duration}</p>
          </div>
        </div>
      </section>

      {/* Calendar Section */}
      <section className="space-y-4">
        <div className="rounded-[2.5rem] border border-brand-border bg-white p-6 shadow-xl shadow-brand-primary/5">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-8 px-2">
            <h3 className="text-lg font-black text-brand-text uppercase tracking-tight">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <div className="flex gap-2">
               <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="h-10 w-10 rounded-xl hover:bg-brand-primary/5 text-brand-text-muted"
              >
                <ArrowLeft size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="h-10 w-10 rounded-xl hover:bg-brand-primary/5 text-brand-text-muted rotate-180"
              >
                <ArrowLeft size={18} />
              </Button>
            </div>
          </div>
          
          {/* Days Week Labels */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
              <div key={idx} className="text-center text-[10px] font-black text-brand-text-muted uppercase tracking-widest py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const active = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <button
                  key={day.toString()}
                  onClick={() => handleDateSelect(day)}
                  disabled={!isCurrentMonth}
                  className={cn(
                    "relative aspect-square rounded-2xl text-sm font-black transition-all duration-300 active:scale-90 flex items-center justify-center",
                    !isCurrentMonth && "opacity-20 cursor-default",
                    isCurrentMonth && !active && !today && "text-brand-text hover:bg-brand-primary/5",
                    today && !active && "text-brand-primary bg-brand-primary/5",
                    active && "bg-linear-to-br from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/30 scale-105"
                  )}
                >
                  {format(day, 'd')}
                  {today && !active && (
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Selected Info & Time Grid */}
      <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {selectedDate && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div>
                <h2 className="text-xl font-black text-brand-text uppercase tracking-tight">Horários Disponíveis</h2>
                <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-[0.2em]">Toque para selecionar</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                <Sparkles size={18} />
              </div>
            </div>

            {loadingSlots ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary/40" />
              </div>
            ) : timeSlots.length > 0 ? (
              <TimeSlotGrid 
                timeSlots={timeSlots}
                selectedTime={selectedTime || undefined}
                onTimeSelect={setSelectedTime}
              />
            ) : (
              <div className="text-center py-10 bg-brand-primary/5 rounded-3xl border border-brand-primary/10">
                <p className="text-xs font-black text-brand-primary uppercase tracking-widest">Não há horários para este dia</p>
                <p className="text-[10px] text-brand-text-muted mt-1">Por favor, selecione outra data no calendário</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Floating Sticky Bottom Action */}
      {selectedTime && (
        <div className="fixed bottom-0 inset-x-0 p-6 bg-linear-to-t from-white via-white to-transparent pt-12 z-50 animate-in slide-in-from-bottom-full duration-500">
          <div className="max-w-2xl mx-auto">
            <Button 
              onClick={handleContinue}
              className="w-full h-16 rounded-2xl bg-[#EE428F] text-white font-black text-base shadow-2xl shadow-[#EE428F]/30 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-between px-8"
            >
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 leading-none mb-1">Total a pagar</p>
                <p className="text-lg leading-none">{selectedService.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm border-l border-white/20 pl-4 py-1">Continuar</span>
                <ChevronRight size={20} />
              </div>
            </Button>
          </div>
        </div>
      )}
      
      {!selectedDate && (
        <div className="text-center py-10 opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Selecione uma data acima</p>
        </div>
      )}
    </div>
  );
}
