"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, addMonths, subMonths,
  isBefore, startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn, ensureDate } from "@/lib/utils";
import { appointmentService } from "@/services/appointments";
import { globalStore } from "@/store/globalStore";
import { TimeSlotGrid, TimeSlot } from "@/components/cliente/TimeSlotGrid";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Sparkles } from "lucide-react";
import { AppointmentStorage } from "@/lib/appointmentStorage";

interface Service {
  id: string; name: string; description?: string;
  price: string; duration: string; bufferMinutes?: number;
}

function getDurationMinutes(value?: string) {
  const d = Number.parseInt(value ?? "", 10);
  return Number.isFinite(d) && d > 0 ? d : 60;
}

const WEEK_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const service = AppointmentStorage.loadSelectedService();
    if (!service) { router.push("/cliente/servicos"); return; }
    setSelectedService(service);
    const savedDate = AppointmentStorage.loadSelectedDate();
    if (savedDate) {
      setSelectedDate(savedDate);
      setCurrentMonth(savedDate);
      void fetchSlots(savedDate, service);
    }
  }, [router]);

  const fetchSlots = async (date: Date, serviceOverride?: Service) => {
    try {
      setLoadingSlots(true); setSlotsError(false);
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end   = new Date(date); end.setHours(23, 59, 59, 999);
      const res = await fetch(`/api/slots?start=${start.toISOString()}&end=${end.toISOString()}`);
      if (!res.ok) throw new Error();
      const { busySlots } = await res.json() as { busySlots: { appointmentDate: string; serviceId: string }[] };
      const allSvcs = await globalStore.fetchServices(false);
      const timingMap = new Map(allSvcs.map(s => [s.id, {
        durationMinutes: Number(s.durationMinutes) || 60,
        bufferMinutes: Number(s.bufferMinutes) || 0,
      }]));
      const cur = serviceOverride ?? selectedService;
      const totalBlock = getDurationMinutes(cur?.duration) + (cur?.bufferMinutes ?? 0);
      const slots: TimeSlot[] = [];
      let t = new Date(date); t.setHours(8, 0, 0, 0);
      const endT = new Date(date); endT.setHours(19, 0, 0, 0);
      const now = new Date();
      while (t < endT) {
        const slotStart = new Date(t);
        const slotEnd   = new Date(t.getTime() + totalBlock * 60000);
        const isPast = isToday(date) && slotStart < now;
        const busy = busySlots.some(apt => {
          const as = new Date(apt.appointmentDate);
          const tm = timingMap.get(apt.serviceId);
          const ae = new Date(as.getTime() + ((tm?.durationMinutes ?? 60) + (tm?.bufferMinutes ?? 0)) * 60000);
          return slotStart < ae && slotEnd > as;
        });
        slots.push({
          id: format(slotStart, "HH:mm"),
          time: format(slotStart, "HH:mm"),
          available: !busy && !isPast,
          label: ["10:00","11:00","15:00","16:00"].includes(format(slotStart,"HH:mm")) && !busy && !isPast ? "Popular" : undefined,
        });
        t = new Date(t.getTime() + 30 * 60000);
      }
      setTimeSlots(slots);
    } catch { setTimeSlots([]); setSlotsError(true); }
    finally { setLoadingSlots(false); }
  };

  const preloadMonth = useCallback(async (month: Date, service: Service | null) => {
    if (!service) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoadingAvailability(true);
    const today = startOfDay(new Date());
    const mStart = startOfMonth(month), mEnd = endOfMonth(month);
    const rangeStart = isBefore(mStart, today) ? today : mStart;
    const totalBlock = getDurationMinutes(service.duration) + (service.bufferMinutes ?? 0);
    try {
      const [allSvcs, res] = await Promise.all([
        globalStore.fetchServices(false),
        fetch(`/api/slots?start=${rangeStart.toISOString()}&end=${mEnd.toISOString()}`),
      ]);
      if (ctrl.signal.aborted) return;
      const { busySlots } = await res.json() as { busySlots: { appointmentDate: string; serviceId: string }[] };
      const timingMap = new Map(allSvcs.map(s => [s.id, {
        durationMinutes: Number(s.durationMinutes)||60,
        bufferMinutes: Number(s.bufferMinutes)||0,
      }]));
      const available = new Set<string>();
      const now = new Date();
      for (const day of eachDayOfInterval({ start: rangeStart, end: mEnd })) {
        if (ctrl.signal.aborted) break;
        const dayKey = format(day, "yyyy-MM-dd");
        const dayBusy = busySlots.filter(a => format(new Date(a.appointmentDate),"yyyy-MM-dd") === dayKey);
        let cur = new Date(day); cur.setHours(8,0,0,0);
        const dayEnd = new Date(day); dayEnd.setHours(19,0,0,0);
        let found = false;
        while (cur < dayEnd && !found) {
          const ss = new Date(cur), se = new Date(cur.getTime()+totalBlock*60000);
          if (!(isToday(day) && ss < now)) {
            found = !dayBusy.some(apt => {
              const as = new Date(apt.appointmentDate);
              const tm = timingMap.get(apt.serviceId);
              const ae = new Date(as.getTime()+((tm?.durationMinutes??60)+(tm?.bufferMinutes??0))*60000);
              return ss < ae && se > as;
            });
          }
          cur = new Date(cur.getTime()+30*60000);
        }
        if (found) available.add(dayKey);
      }
      if (!ctrl.signal.aborted) setAvailableDays(available);
    } catch { /* silencioso */ }
    finally { if (!ctrl.signal.aborted) setLoadingAvailability(false); }
  }, []);

  useEffect(() => {
    if (selectedService) void preloadMonth(currentMonth, selectedService);
  }, [currentMonth, selectedService, preloadMonth]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date); setSelectedTime(null);
    AppointmentStorage.saveSelectedDate(date);
    void fetchSlots(date);
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedService || !selectedTime) return;
    const slot = timeSlots.find(s => s.id === selectedTime);
    if (!slot) return;
    AppointmentStorage.saveAppointmentData({ service: selectedService, date: selectedDate, time: slot, timeSlots, observation: undefined });
    router.push("/cliente/agendar/confirmacao");
  };

  const days = selectedService ? eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }) : [];
  const firstDayOfWeek = days[0]?.getDay() ?? 0;

  if (!selectedService) return (
    <div className="min-h-screen bg-[#F7F5F1] flex items-center justify-center p-6 text-center">
      <div>
        <div className="h-16 w-16 rounded-2xl bg-[#111110]/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles size={28} className="text-[#111110]/40" />
        </div>
        <p className="text-sm font-bold text-stone-600 mb-4">Selecione um serviço primeiro</p>
        <button onClick={() => router.push("/cliente/servicos")}
          className="px-6 py-2.5 rounded-full bg-[#111110] text-white text-xs font-black uppercase tracking-widest">
          Ver Serviços
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F5F1]">

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div className="bg-[#111110] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#C9A96E]/8 blur-2xl translate-x-16 -translate-y-10" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />

        <div className="relative z-10 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => router.push("/cliente/servicos")}
              className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-90 transition-all shrink-0">
              <ArrowLeft size={16} className="text-white/80" />
            </button>
            <div>
              <h1 className="text-lg font-black text-white leading-none">Escolha o horário</h1>
              <p className="text-[10px] text-white/40 mt-0.5">Selecione data e hora disponíveis</p>
            </div>
          </div>

          {/* Service pill */}
          <div className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
            <div className="h-9 w-9 rounded-xl bg-[#FBF4E8]0/20 flex items-center justify-center shrink-0">
              <Sparkles size={15} className="text-[#C9A96E]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Serviço</p>
              <p className="text-sm font-black text-white truncate">{selectedService.name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-black text-[#C9A96E]">{selectedService.price}</p>
              <div className="flex items-center gap-1 justify-end">
                <Clock size={9} className="text-white/30" />
                <p className="text-[9px] text-white/30">{selectedService.duration}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-36 max-w-lg mx-auto space-y-5">

        {/* ── CALENDÁRIO ───────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50">
            <h3 className="text-sm font-black text-stone-800 capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="h-8 w-8 rounded-xl bg-[#F7F5F1] flex items-center justify-center active:scale-90 transition-all hover:bg-stone-100"
              >
                <ChevronLeft size={14} className="text-stone-500" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="h-8 w-8 rounded-xl bg-[#F7F5F1] flex items-center justify-center active:scale-90 transition-all hover:bg-stone-100"
              >
                <ChevronRight size={14} className="text-stone-500" />
              </button>
            </div>
          </div>

          <div className="px-4 pt-3 pb-4">
            {/* Week labels */}
            <div className="grid grid-cols-7 mb-2">
              {WEEK_LABELS.map(d => (
                <div key={d} className="text-center text-[9px] font-black text-stone-300 uppercase tracking-widest py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Offset for first day */}
              {[...Array(firstDayOfWeek)].map((_, i) => <div key={`e-${i}`} />)}

              {days.map(day => {
                const active   = selectedDate && isSameDay(day, selectedDate);
                const today    = isToday(day);
                const inMonth  = isSameMonth(day, currentMonth);
                const isPast   = isBefore(startOfDay(day), startOfDay(new Date()));
                const disabled = !inMonth || isPast;
                const dayKey   = format(day, "yyyy-MM-dd");
                const hasSlots = !disabled && availableDays.has(dayKey);

                return (
                  <button
                    key={day.toString()}
                    onClick={() => !disabled && handleDateSelect(day)}
                    disabled={disabled}
                    className={cn(
                      "relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200",
                      disabled && "opacity-20 cursor-not-allowed",
                      !disabled && !active && !today && "hover:bg-[#F7F5F1] active:scale-90",
                      !disabled && today && !active && "bg-[#FBF4E8]",
                      active && "bg-[#111110] shadow-lg shadow-[#111110]/25 scale-105",
                    )}
                  >
                    <span className={cn(
                      "text-[11px] font-black",
                      active  ? "text-white" :
                      today   ? "text-[#A88B55]" :
                      disabled? "text-stone-300" : "text-stone-700"
                    )}>
                      {format(day, "d")}
                    </span>
                    {/* Dot */}
                    {!active && !disabled && (
                      <span className={cn(
                        "absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full transition-all",
                        hasSlots          ? "w-1 h-1 bg-emerald-400" :
                        today             ? "w-1 h-1 bg-[#C9A96E]" :
                        loadingAvailability ? "w-1 h-1 bg-stone-200 animate-pulse" : "w-0 h-0"
                      )} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 pt-3 mt-2 border-t border-stone-50">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Disponível</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
                <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Hoje</span>
              </div>
              {loadingAvailability && (
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-stone-300 animate-pulse" />
                  <span className="text-[9px] text-stone-300">Verificando...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── HORÁRIOS ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div
              key="slots"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-1 rounded-full bg-[#111110]" />
                <p className="text-xs font-black text-stone-700">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>

              {loadingSlots ? (
                <div className="bg-white rounded-3xl border border-stone-100 p-8 flex flex-col items-center gap-3">
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-[#111110]/20"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }} />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Carregando horários</p>
                </div>
              ) : slotsError ? (
                <div className="bg-white rounded-3xl border border-red-100 p-6 text-center">
                  <p className="text-xs font-bold text-red-500 mb-2">Erro ao carregar horários</p>
                  <button onClick={() => void fetchSlots(selectedDate)}
                    className="text-[10px] font-black text-[#111110] uppercase tracking-widest underline underline-offset-2">
                    Tentar novamente
                  </button>
                </div>
              ) : timeSlots.length > 0 ? (
                <TimeSlotGrid timeSlots={timeSlots} selectedTime={selectedTime || undefined} onTimeSelect={setSelectedTime} />
              ) : (
                <div className="bg-white rounded-3xl border border-stone-100 p-8 text-center">
                  <p className="text-sm font-bold text-stone-500 mb-1">Sem horários disponíveis</p>
                  <p className="text-xs text-stone-400">Escolha outra data no calendário</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dica quando não selecionou data */}
        {!selectedDate && (
          <div className="text-center py-6">
            <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em]">
              Selecione um dia no calendário
            </p>
          </div>
        )}
      </div>

      {/* ── CTA FLUTUANTE ────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedTime && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] inset-x-0 px-5 z-40"
          >
            <div className="max-w-lg mx-auto">
              <button
                onClick={handleContinue}
                className="w-full h-[60px] rounded-2xl bg-[#111110] text-white flex items-center justify-between px-6 shadow-2xl shadow-[#111110]/40 active:scale-[0.98] transition-all"
              >
                <div className="text-left">
                  <p className="text-[8px] text-white/40 uppercase tracking-[0.25em] leading-none mb-1">Horário selecionado</p>
                  <p className="text-sm font-black leading-none">
                    {selectedDate && format(selectedDate, "dd/MM")} às {selectedTime}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-px w-8 bg-white/20" />
                  <div className="text-right">
                    <p className="text-[8px] text-white/40 uppercase tracking-widest leading-none mb-1">Total</p>
                    <p className="text-sm font-black text-[#C9A96E] leading-none">{selectedService.price}</p>
                  </div>
                  <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center ml-1">
                    <ChevronRight size={16} className="text-white" />
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
