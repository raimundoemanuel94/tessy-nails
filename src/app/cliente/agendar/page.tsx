"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  isBefore,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn, ensureDate } from "@/lib/utils";
import { appointmentService } from "@/services/appointments";
import { globalStore } from "@/store/globalStore";
import { TimeSlotGrid, TimeSlot } from "@/components/cliente/TimeSlotGrid";
import {
  Loader2,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Calendar as CalendarIcon,
} from "lucide-react";
import { AppointmentStorage } from "@/lib/appointmentStorage";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  duration: string;
  bufferMinutes?: number;
  image?: string;
  rating?: number;
}

function getDurationMinutes(value?: string) {
  const duration = Number.parseInt(value ?? "", 10);
  return Number.isFinite(duration) && duration > 0 ? duration : 60;
}

export default function AgendarPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const availabilityAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const service = AppointmentStorage.loadSelectedService();
    if (!service) {
      router.push("/cliente/servicos");
      return;
    }
    setSelectedService(service);
      const savedDate = AppointmentStorage.loadSelectedDate();
      if (savedDate) {
        setSelectedDate(savedDate);
        setCurrentMonth(savedDate);
        void fetchSlots(savedDate, service);
      }
  }, [router]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    AppointmentStorage.saveSelectedDate(date);
    void fetchSlots(date);
  };

  const fetchSlots = async (date: Date, serviceOverride?: Service) => {
    try {
      setLoadingSlots(true);
      setSlotsError(false);
      const startOfDayTime = new Date(date);
      startOfDayTime.setHours(0, 0, 0, 0);
      const endOfDayTime = new Date(date);
      endOfDayTime.setHours(23, 59, 59, 999);

      const slotsRes = await fetch(
        `/api/slots?start=${startOfDayTime.toISOString()}&end=${endOfDayTime.toISOString()}`
      );
      if (!slotsRes.ok) throw new Error("Falha ao buscar slots");
      const slotsData = await slotsRes.json() as { busySlots: { appointmentDate: string; serviceId: string }[] };
      const activeAppointments = slotsData.busySlots;
      const allServices = await globalStore.fetchServices(false);
      const serviceTimingById = new Map(
        allServices.map((service) => [
          service.id,
          {
            durationMinutes: Number(service.durationMinutes) || 60,
            bufferMinutes: Number(service.bufferMinutes) || 0,
          },
        ])
      );

      // Usar duração real do serviço selecionado (com buffer)
      const currentService = serviceOverride ?? selectedService;
      const serviceDuration = getDurationMinutes(currentService?.duration);
      const serviceBuffer = currentService?.bufferMinutes ?? 0;
      const totalBlockMinutes = serviceDuration + serviceBuffer;
      const slots: TimeSlot[] = [];
      let currentTime = new Date(date);
      currentTime.setHours(8, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(19, 0, 0, 0);
      const now = new Date();

      while (currentTime < endTime) {
        const slotStart = new Date(currentTime);
        const slotEnd = new Date(
          currentTime.getTime() + totalBlockMinutes * 60000
        );
        const isPastSlot = isToday(date) && slotStart < now;
        const hasOverlap = activeAppointments.some((apt) => {
          const aptStart = new Date(apt.appointmentDate);
          const timing = serviceTimingById.get(apt.serviceId);
          const busyMinutes = (timing?.durationMinutes ?? 60) + (timing?.bufferMinutes ?? 0);
          const aptEnd = new Date(aptStart.getTime() + busyMinutes * 60000);
          return slotStart < aptEnd && slotEnd > aptStart;
        });
        slots.push({
          id: format(slotStart, "HH:mm"),
          time: format(slotStart, "HH:mm"),
          available: !hasOverlap && !isPastSlot,
          label:
            ["10:00", "11:00", "15:00", "16:00"].includes(
              format(slotStart, "HH:mm")
            ) &&
            !hasOverlap &&
            !isPastSlot
              ? "Popular"
              : undefined,
        });
        currentTime = new Date(currentTime.getTime() + 30 * 60000);
      }
      setTimeSlots(slots);
    } catch (error) {
      console.error("Erro ao buscar horários", error);
      setTimeSlots([]);
      setSlotsError(true);
    } finally {
      setLoadingSlots(false);
    }
  };

  const preloadMonthAvailability = useCallback(async (month: Date, service: Service | null) => {
    if (!service) return;

    // Cancel any in-flight preload via a simple flag
    if (availabilityAbortRef.current) {
      availabilityAbortRef.current.abort();
    }
    const controller = new AbortController();
    availabilityAbortRef.current = controller;

    setLoadingAvailability(true);

    const today = startOfDay(new Date());
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    // Only future days (from today onwards)
    const rangeStart = isBefore(monthStart, today) ? today : monthStart;

    const serviceDuration = getDurationMinutes(service.duration);
    const serviceBuffer = service.bufferMinutes ?? 0;
    const totalBlockMinutes = serviceDuration + serviceBuffer;

    try {
      // Fetch month slots via public API (Admin SDK, sem auth de staff)
      const [allServices, slotsRes] = await Promise.all([
        globalStore.fetchServices(false),
        fetch(`/api/slots?start=${rangeStart.toISOString()}&end=${monthEnd.toISOString()}`),
      ]);
      if (controller.signal.aborted) return;
      if (!slotsRes.ok) throw new Error("Falha ao buscar slots do mês");
      const slotsData = await slotsRes.json() as { busySlots: { appointmentDate: string; serviceId: string }[] };

      const serviceTimingById = new Map(
        allServices.map((s) => [
          s.id,
          {
            durationMinutes: Number(s.durationMinutes) || 60,
            bufferMinutes: Number(s.bufferMinutes) || 0,
          },
        ])
      );

      const busyApts = slotsData.busySlots;

      // Check each future day of the month
      const futureDays = eachDayOfInterval({ start: rangeStart, end: monthEnd });
      const available = new Set<string>();
      const now = new Date();

      for (const day of futureDays) {
        if (controller.signal.aborted) break;

        // Appointments that fall on this day
        const dayKey = format(day, "yyyy-MM-dd");
        const dayBusy = busyApts.filter(
          (a) => format(new Date(a.appointmentDate), "yyyy-MM-dd") === dayKey
        );

        let cur = new Date(day); cur.setHours(8, 0, 0, 0);
        const dayEnd = new Date(day); dayEnd.setHours(19, 0, 0, 0);
        let foundSlot = false;

        while (cur < dayEnd && !foundSlot) {
          const slotStart = new Date(cur);
          const slotEnd = new Date(cur.getTime() + totalBlockMinutes * 60000);
          const isPast = isToday(day) && slotStart < now;
          if (!isPast) {
            const blocked = dayBusy.some((apt) => {
              const aptStart = new Date(apt.appointmentDate);
              const timing = serviceTimingById.get(apt.serviceId);
              const busyMin = (timing?.durationMinutes ?? 60) + (timing?.bufferMinutes ?? 0);
              const aptEnd = new Date(aptStart.getTime() + busyMin * 60000);
              return slotStart < aptEnd && slotEnd > aptStart;
            });
            if (!blocked) foundSlot = true;
          }
          cur = new Date(cur.getTime() + 30 * 60000);
        }

        if (foundSlot) available.add(dayKey);
      }

      if (!controller.signal.aborted) setAvailableDays(available);
    } catch {
      // Non-critical — indicators simply won't show
    } finally {
      if (!controller.signal.aborted) setLoadingAvailability(false);
    }
  }, []);

  // Re-preload when month or service changes
  useEffect(() => {
    if (selectedService) {
      void preloadMonthAvailability(currentMonth, selectedService);
    }
  }, [currentMonth, selectedService, preloadMonthAvailability]);

  const handleContinue = () => {
    if (!selectedDate || !selectedService || !selectedTime) return;
    const selectedTimeSlot = timeSlots.find((slot) => slot.id === selectedTime);
    if (!selectedTimeSlot) return;
    AppointmentStorage.saveAppointmentData({
      service: selectedService,
      date: selectedDate,
      time: selectedTimeSlot,
      timeSlots: timeSlots,
      observation: undefined,
    });
    router.push("/cliente/agendar/confirmacao");
  };

  if (!selectedService) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 px-6 text-center">
        <div className="h-20 w-20 rounded-3xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
          <CalendarIcon size={32} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-brand-text">Ops!</h2>
          <p className="text-sm text-brand-text-muted">
            Selecione um serviço primeiro para continuar seu agendamento.
          </p>
        </div>
        <Button
          onClick={() => router.push("/cliente/servicos")}
          className="h-12 px-8 rounded-2xl bg-brand-primary hover:bg-brand-secondary font-black uppercase tracking-widest text-[10px]"
        >
          Ver Serviços
        </Button>
      </div>
    );
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  return (
    <div className="px-5 pt-4 pb-48 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/cliente/servicos")}
          className="h-12 w-12 rounded-2xl bg-white border border-brand-soft text-brand-text-main hover:text-brand-primary shadow-sm active:scale-95 transition-all"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-brand-text-main tracking-tight uppercase">
            Escolha o dia
          </h1>
          <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-[0.2em]">
            Sua experiência começa aqui
          </p>
        </div>
      </div>

      {/* Mini Service Card */}
      <section className="relative overflow-hidden rounded-[2rem] border border-brand-soft bg-white p-5 shadow-xl shadow-brand-primary/5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-2xl">
              💅
            </div>
            <div>
              <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-0.5">
                Serviço Selecionado
              </p>
              <h3 className="text-lg font-black text-brand-text-main">
                {selectedService.name}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-brand-primary">
              {selectedService.price}
            </p>
            <p className="text-[10px] font-bold text-brand-text-muted uppercase">
              {selectedService.duration}
            </p>
          </div>
        </div>
      </section>

      {/* Calendar */}
      <section className="space-y-4">
        <div className="rounded-[2.5rem] border border-brand-soft bg-white p-3 sm:p-6 shadow-xl shadow-brand-primary/5">
          {/* Month header */}
          <div className="flex items-center justify-between mb-4 sm:mb-8 px-2">
            <h3 className="text-lg font-black text-brand-text-main uppercase tracking-tight">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="h-10 w-10 rounded-xl hover:bg-brand-primary/5 text-brand-text-muted transition-all active:scale-90"
              >
                <ArrowLeft size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="h-10 w-10 rounded-xl hover:bg-brand-primary/5 text-brand-text-muted transition-all active:scale-90"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>

          {/* Week labels */}
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {["D", "S", "T", "Q", "Q", "S", "S"].map(
              (day, idx) => (
                <div
                  key={idx}
                  className="text-center text-[10px] font-black text-brand-text-muted uppercase tracking-wide py-1"
                >
                  {day}
                </div>
              )
            )}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5">
            {days.map((day) => {
              const active = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isPastDay = isBefore(
                startOfDay(day),
                startOfDay(new Date())
              );
              const isDisabled = !isCurrentMonth || isPastDay;
              const dayKey = format(day, "yyyy-MM-dd");
              const hasAvailability = !isDisabled && availableDays.has(dayKey);

              return (
                <button
                  key={day.toString()}
                  onClick={() => !isDisabled && handleDateSelect(day)}
                  disabled={isDisabled}
                  className={cn(
                    "relative aspect-square min-h-[44px] rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center",
                    isDisabled && "opacity-20 cursor-not-allowed",
                    !isDisabled &&
                      !active &&
                      !today &&
                      "text-brand-text-main hover:bg-brand-primary/5 active:scale-90",
                    !isDisabled &&
                      today &&
                      !active &&
                      "text-brand-primary bg-brand-primary/5 active:scale-90",
                    active &&
                      "bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/30 scale-105"
                  )}
                >
                  {format(day, "d")}
                  {/* Availability dot — green when slots exist, shown below the number */}
                  {!active && !isDisabled && (
                    <span
                      className={cn(
                        "absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full transition-all duration-300",
                        hasAvailability
                          ? "w-1.5 h-1.5 bg-emerald-400"
                          : today
                          ? "w-1 h-1 bg-brand-primary"
                          : loadingAvailability
                          ? "w-1 h-1 bg-brand-text-muted/20 animate-pulse"
                          : "w-0 h-0"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 pt-3 px-1 border-t border-brand-soft/50">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">Com horários</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-primary inline-block" />
              <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">Hoje</span>
            </div>
            {loadingAvailability && (
              <div className="flex items-center gap-1.5 ml-auto">
                <Loader2 className="w-3 h-3 animate-spin text-brand-text-muted/40" />
                <span className="text-[10px] font-bold text-brand-text-muted/40 uppercase tracking-wider">Verificando...</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Time slots */}
      {selectedDate && (
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between px-2">
            <div>
              <h2 className="text-xl font-black text-brand-text-main uppercase tracking-tight">
                Horários Disponíveis
              </h2>
              <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-[0.2em]">
                Toque para selecionar
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
              <Sparkles size={18} />
            </div>
          </div>

          {loadingSlots ? (
            <div className="flex justify-center py-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary/40" />
                <p className="text-xs font-black text-brand-primary uppercase tracking-widest">
                  Carregando horários...
                </p>
              </div>
            </div>
          ) : slotsError ? (
            <div className="text-center py-10 bg-brand-primary/5 rounded-3xl border border-brand-primary/10">
              <p className="text-xs font-black text-brand-primary uppercase tracking-widest">
                Erro ao carregar horários, tente novamente
              </p>
            </div>
          ) : timeSlots.length > 0 ? (
            <TimeSlotGrid
              timeSlots={timeSlots}
              selectedTime={selectedTime || undefined}
              onTimeSelect={setSelectedTime}
            />
          ) : (
            <div className="text-center py-10 bg-brand-primary/5 rounded-3xl border border-brand-primary/10">
              <p className="text-xs font-black text-brand-primary uppercase tracking-widest">
                Sem horários disponíveis
              </p>
              <p className="text-[10px] text-brand-text-muted mt-1">
                Por favor, selecione outra data no calendário
              </p>
            </div>
          )}
        </section>
      )}

      {!selectedDate && (
        <div className="text-center py-10 opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">
            Selecione uma data acima
          </p>
        </div>
      )}

      {/* CTA flutuante -- acima do BottomNav */}
      {selectedTime && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] inset-x-0 px-5 z-40 animate-in slide-in-from-bottom-4 duration-300">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleContinue}
              className="w-full h-16 rounded-2xl bg-brand-primary text-white font-black shadow-2xl shadow-brand-primary/40 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-between px-8"
            >
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 leading-none mb-1">
                  Serviço
                </p>
                <p className="text-base leading-none">{selectedService.price}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black border-l border-white/20 pl-4 py-1">
                  Continuar
                </span>
                <ChevronRight size={20} strokeWidth={2.5} />
              </div>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
