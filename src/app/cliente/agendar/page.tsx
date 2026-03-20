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
import { cn } from "@/lib/utils";

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
    }
  }, [router]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    AppointmentStorage.saveSelectedDate(date);
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedService) return;

    const appointmentData = {
      service: selectedService,
      date: selectedDate,
      time: { id: 'temp', time: '00:00', available: true },
      timeSlots: [],
      observation: undefined
    };

    AppointmentStorage.saveAppointmentData(appointmentData);
    router.push('/cliente/agendar/horarios');
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

      {/* Selected Info & CTA */}
      <section className="space-y-6 pt-4">
        {selectedDate ? (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="h-10 w-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest leading-none mb-1">Data Escolhida</p>
                  <p className="text-base font-black text-brand-text capitalize">
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleContinue}
                className="w-full h-16 rounded-[2rem] bg-linear-to-br from-brand-primary to-brand-secondary text-white font-black text-base shadow-2xl shadow-brand-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Continuar para os horários
              </Button>
           </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-[0.3em] animate-pulse">
              Toque em uma data para prosseguir
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
