"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, addMonths, subMonths,
  isBefore, startOfDay, getDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn, ensureDate } from "@/lib/utils";
import { globalStore } from "@/store/globalStore";
import { TimeSlotGrid, TimeSlot } from "@/components/cliente/TimeSlotGrid";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import { AppointmentStorage } from "@/lib/appointmentStorage";
import { auth } from "@/lib/firebase";

interface Service {
  id: string; name: string; description?: string;
  price: string; duration: string; bufferMinutes?: number;
}

function getDurationMinutes(v?: string) {
  const d = Number.parseInt(v ?? "", 10);
  return Number.isFinite(d) && d > 0 ? d : 60;
}

// Fetch autenticado — passa o token Firebase no header Authorization
async function fetchWithAuth(url: string): Promise<Response> {
  try {
    const token = await auth?.currentUser?.getIdToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(url, { headers });
  } catch {
    return fetch(url);
  }
}

// Horário padrão quando API não retorna configuração
const DEFAULT_WD = {
  sunday:    { enabled: false, start: "08:00", end: "18:00" },
  monday:    { enabled: true,  start: "08:00", end: "18:00" },
  tuesday:   { enabled: true,  start: "08:00", end: "18:00" },
  wednesday: { enabled: true,  start: "08:00", end: "18:00" },
  thursday:  { enabled: true,  start: "08:00", end: "18:00" },
  friday:    { enabled: true,  start: "08:00", end: "18:00" },
  saturday:  { enabled: true,  start: "08:00", end: "14:00" },
} as const;

const WEEKDAYS = ["D","S","T","Q","Q","S","S"];
const DAY_KEYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as const;
type DayKey = typeof DAY_KEYS[number];
type WorkingDays = Record<DayKey, { enabled: boolean; start: string; end: string }>;

function parseMins(t: string) { const [h,m] = t.split(":").map(Number); return h*60+m; }

function buildSlots(date: Date, svc: Service | null, busySlots: {appointmentDate:string;serviceId:string}[], tMap: Map<string,{durationMinutes:number;bufferMinutes:number}>, wd: WorkingDays): TimeSlot[] {
  const dayKey = DAY_KEYS[date.getDay()];
  const config = wd[dayKey];
  if (!config?.enabled) return [];

  const total = getDurationMinutes(svc?.duration) + (svc?.bufferMinutes ?? 0);
  const slots: TimeSlot[] = [];
  let t = new Date(date); 
  const [sh,sm] = config.start.split(":").map(Number);
  const [eh,em] = config.end.split(":").map(Number);
  t.setHours(sh,sm,0,0);
  const endT = new Date(date); endT.setHours(eh,em,0,0);
  const now = new Date();

  while (t < endT) {
    const ss = new Date(t), se = new Date(t.getTime()+total*60000);
    if (se > endT) break; // não ultrapassa o fechamento
    const isPast = isToday(date) && ss < now;
    const busy = busySlots.some(apt => {
      const as2 = new Date(apt.appointmentDate);
      const tm  = tMap.get(apt.serviceId);
      const ae  = new Date(as2.getTime()+((tm?.durationMinutes??60)+(tm?.bufferMinutes??0))*60000);
      return ss < ae && se > as2;
    });
    const timeStr = format(ss,"HH:mm");
    const popular = ["10:00","11:00","15:00","16:00"].includes(timeStr);
    slots.push({ id:timeStr, time:timeStr, available:!busy&&!isPast, label:popular&&!busy&&!isPast?"Popular":undefined });
    t = new Date(t.getTime()+30*60000);
  }
  return slots;
}
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

// ── Componente de calendário premium ──────────────────────────────────────
function PremiumCalendar({
  currentMonth, selectedDate, availableDays, loadingAvailability, workingDays,
  onDateSelect, onPrevMonth, onNextMonth,
}: {
  currentMonth: Date; selectedDate: Date | null;
  availableDays: Set<string>; loadingAvailability: boolean;
  workingDays: WorkingDays;
  onDateSelect: (d: Date) => void;
  onPrevMonth: () => void; onNextMonth: () => void;
}) {
  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const offset = getDay(days[0]);
  const today = new Date();
  const todayKey = format(today, "yyyy-MM-dd");

  // Agrupar em semanas
  const allCells: (Date | null)[] = [
    ...Array(offset).fill(null),
    ...days,
  ];
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < allCells.length; i += 7) {
    weeks.push(allCells.slice(i, i + 7).concat(Array(7).fill(null)).slice(0, 7));
  }

  return (
    <div className="select-none">
      {/* Month header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-xl font-black text-[#1E1A2E] leading-none">
            {MONTHS_PT[currentMonth.getMonth()]}
          </h2>
          <p className="text-[11px] font-bold text-[#9B8FC0] mt-0.5">
            {currentMonth.getFullYear()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loadingAvailability && (
            <div className="flex gap-0.5 mr-1">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-1 h-1 rounded-full bg-[#9D7FD4]/40"
                  animate={{ opacity:[0.3,1,0.3] }}
                  transition={{ duration:1, delay:i*0.2, repeat:Infinity }} />
              ))}
            </div>
          )}
          <motion.button whileTap={{ scale:0.85 }} onClick={onPrevMonth}
            className="h-9 w-9 rounded-2xl bg-[#EDE5FF] flex items-center justify-center">
            <ChevronLeft size={15} className="text-[#7C5CBF]" />
          </motion.button>
          <motion.button whileTap={{ scale:0.85 }} onClick={onNextMonth}
            className="h-9 w-9 rounded-2xl bg-[#EDE5FF] flex items-center justify-center">
            <ChevronRight size={15} className="text-[#7C5CBF]" />
          </motion.button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 mb-3">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center">
            <span className="text-[10px] font-black text-[#C4BAE0] uppercase tracking-widest">{d}</span>
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="space-y-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (!day) return <div key={di} />;

              const dayKey    = format(day, "yyyy-MM-dd");
              const isPast    = isBefore(startOfDay(day), startOfDay(today));
              const isTd      = isToday(day);
              const active    = selectedDate && isSameDay(day, selectedDate);
              const dayName   = DAY_KEYS[day.getDay()];
              const closedDay = !workingDays[dayName]?.enabled;
              const hasSlots  = !isPast && !closedDay && availableDays.has(dayKey);
              const disabled  = (isPast && !isTd) || closedDay;

              return (
                <motion.button
                  key={dayKey}
                  whileTap={!disabled ? { scale: 0.88 } : undefined}
                  onClick={() => !disabled && onDateSelect(day)}
                  disabled={disabled}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-2xl transition-all duration-200",
                    "h-11 w-full",
                    disabled  && "opacity-25 cursor-not-allowed",
                    !disabled && !active && !isTd && "hover:bg-[#FAF8FF]",
                    !disabled && isTd && !active && "bg-[#EDE5FF]",
                    active && "shadow-lg",
                  )}
                  style={active ? {
                    background: "linear-gradient(135deg, #5A3F9A 0%, #9D7FD4 100%)",
                    boxShadow: "0 4px 16px rgba(125, 79, 212, 0.35)",
                  } : undefined}
                >
                  <span className={cn(
                    "text-[13px] font-black leading-none",
                    active    ? "text-white"    :
                    isTd      ? "text-[#7C5CBF]" :
                    disabled  ? "text-[#C4BAE0]" : "text-[#1E1A2E]"
                  )}>
                    {format(day, "d")}
                  </span>

                  {/* Dot de disponibilidade */}
                  {!active && (
                    <span className={cn(
                      "absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full transition-all duration-300",
                      hasSlots ? "w-1 h-1 bg-emerald-400" :
                      isTd && !hasSlots && !isPast ? "w-1 h-1 bg-[#9D7FD4]/40" :
                      "w-0 h-0"
                    )} />
                  )}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#F0EBFF]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          <span className="text-[9px] font-bold text-[#9B8FC0] uppercase tracking-widest">Livre</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7C5CBF] inline-block" />
          <span className="text-[9px] font-bold text-[#9B8FC0] uppercase tracking-widest">Selecionado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#EDE5FF] inline-block" />
          <span className="text-[9px] font-bold text-[#9B8FC0] uppercase tracking-widest">Hoje</span>
        </div>
      </div>
    </div>
  );
}

// ── Componente de horários premium ────────────────────────────────────────
function PremiumTimeSlots({
  slots, selected, onSelect,
}: {
  slots: TimeSlot[]; selected: string | null;
  onSelect: (id: string) => void;
}) {
  const manha = slots.filter(s => parseInt(s.time.split(":")[0]) < 12);
  const tarde = slots.filter(s => parseInt(s.time.split(":")[0]) >= 12);

  const renderGroup = (label: string, emoji: string, group: TimeSlot[]) => {
    if (!group.length) return null;
    const freeCount = group.filter(s => s.available).length;

    return (
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{emoji}</span>
            <span className="text-xs font-black text-[#2A2440] uppercase tracking-widest">{label}</span>
          </div>
          <span className="text-[9px] font-bold text-[#9B8FC0]">
            {freeCount} horário{freeCount !== 1 ? "s" : ""} livre{freeCount !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {group.map((slot, i) => {
            const isSelected = selected === slot.id;
            const avail = slot.available;

            return (
              <motion.button
                key={slot.id}
                initial={{ opacity:0, scale:0.8 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ delay: i * 0.025, type:"spring", stiffness:400, damping:25 }}
                whileTap={avail ? { scale:0.9 } : undefined}
                onClick={() => avail && onSelect(slot.id)}
                disabled={!avail}
                className="relative"
              >
                <div className={cn(
                  "h-12 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 relative overflow-hidden",
                  isSelected
                    ? "shadow-lg shadow-[#7C5CBF]/30"
                    : avail
                    ? "bg-white border border-[#EDE5FF] hover:border-[#9D7FD4]/40 hover:bg-[#FAF8FF]"
                    : "bg-[#FAF8FF] border border-transparent opacity-40 cursor-not-allowed"
                )}
                style={isSelected ? {
                  background: "linear-gradient(135deg, #5A3F9A 0%, #9D7FD4 100%)",
                } : undefined}>
                  {/* Pulse se selecionado */}
                  {isSelected && (
                    <motion.div className="absolute inset-0 rounded-2xl"
                      animate={{ opacity:[0.3,0,0.3] }}
                      transition={{ duration:2, repeat:Infinity }}
                      style={{ background:"radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)" }} />
                  )}

                  <span className={cn(
                    "text-[11px] font-black tabular-nums relative z-10",
                    isSelected ? "text-white" : avail ? "text-[#1E1A2E]" : "text-[#C4BAE0]"
                  )}>
                    {slot.time}
                  </span>

                  {isSelected && (
                    <CheckCircle2 size={8} className="text-white/70 mt-0.5 relative z-10" />
                  )}

                  {/* Dot verde */}
                  {!isSelected && avail && (
                    <span className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-emerald-400" />
                  )}

                  {/* Badge popular */}
                  {slot.label && avail && !isSelected && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-px rounded-full bg-[#9D7FD4] text-[7px] font-black text-white whitespace-nowrap">
                      {slot.label}
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {renderGroup("Manhã", "🌅", manha)}
      {renderGroup("Tarde", "☀️", tarde)}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────
export default function AgendarPage() {
  const router = useRouter();
  const [service, setService]           = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeSlots, setTimeSlots]       = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError]     = useState(false);
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [workingDays, setWorkingDays]   = useState<WorkingDays>(DEFAULT_WD as WorkingDays);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const svc = AppointmentStorage.loadSelectedService();
    if (!svc) { router.push("/cliente/servicos"); return; }
    setService(svc);
    const saved = AppointmentStorage.loadSelectedDate();
    if (saved) {
      setSelectedDate(saved); setCurrentMonth(saved);
      void fetchSlots(saved, svc);
    }
  }, [router]);

  const fetchSlots = async (date: Date, svcOverride?: Service) => {
    try {
      setLoadingSlots(true); setSlotsError(false);
      const start = new Date(date); start.setHours(0,0,0,0);
      const end   = new Date(date); end.setHours(23,59,59,999);

      let busySlots: {appointmentDate:string;serviceId:string}[] = [];
      let wd: WorkingDays = workingDays;

      try {
        const res = await fetchWithAuth(`/api/slots?start=${start.toISOString()}&end=${end.toISOString()}`);
        if (res.ok) {
          const data = await res.json() as { busySlots: typeof busySlots; workingDays?: WorkingDays };
          busySlots = data.busySlots ?? [];
          if (data.workingDays) { wd = data.workingDays; setWorkingDays(data.workingDays); }
        }
      } catch { /* API indisponível — dia totalmente livre */ }

      const allSvcs = await globalStore.fetchServices(false);
      const tMap = new Map(allSvcs.map(s => [s.id,{ durationMinutes:Number(s.durationMinutes)||60, bufferMinutes:Number(s.bufferMinutes)||0 }]));
      const cur = svcOverride ?? service;
      const slots = buildSlots(date, cur, busySlots, tMap, wd);
      setTimeSlots(slots);
    } catch { setTimeSlots([]); setSlotsError(true); }
    finally { setLoadingSlots(false); }
  };

  const preloadMonth = useCallback(async (month: Date, svc: Service | null) => {
    if (!svc) return;
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    setLoadingAvail(true);
    const today  = startOfDay(new Date());
    const mStart = startOfMonth(month), mEnd = endOfMonth(month);
    const rangeStart = isBefore(mStart, today) ? today : mStart;

    try {
      let busySlots: {appointmentDate:string;serviceId:string}[] = [];
      let wd: WorkingDays = workingDays;

      try {
        const res = await fetchWithAuth(`/api/slots?start=${rangeStart.toISOString()}&end=${mEnd.toISOString()}`);
        if (ctrl.signal.aborted) return;
        if (res.ok) {
          const data = await res.json() as { busySlots: typeof busySlots; workingDays?: WorkingDays };
          busySlots = data.busySlots ?? [];
          if (data.workingDays) { wd = data.workingDays; setWorkingDays(data.workingDays); }
        }
      } catch { /* usa defaults */ }

      const allSvcs = await globalStore.fetchServices(false);
      if (ctrl.signal.aborted) return;
      const tMap = new Map(allSvcs.map(s => [s.id,{ durationMinutes:Number(s.durationMinutes)||60, bufferMinutes:Number(s.bufferMinutes)||0 }]));
      const available = new Set<string>();

      for (const day of eachDayOfInterval({ start: rangeStart, end: mEnd })) {
        if (ctrl.signal.aborted) break;
        const dayKey = format(day,"yyyy-MM-dd");
        const dayBusy = busySlots.filter(a => format(new Date(a.appointmentDate),"yyyy-MM-dd") === dayKey);
        const slots = buildSlots(day, svc, dayBusy, tMap, wd);
        if (slots.some(s => s.available)) available.add(dayKey);
      }

      if (!ctrl.signal.aborted) setAvailableDays(available);
    } catch { /* silencioso */ }
    finally { if (!ctrl.signal.aborted) setLoadingAvail(false); }
  }, [workingDays]);

  useEffect(() => {
    if (service) void preloadMonth(currentMonth, service);
  }, [currentMonth, service, preloadMonth]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date); setSelectedTime(null);
    AppointmentStorage.saveSelectedDate(date);
    void fetchSlots(date);
  };

  const handleContinue = () => {
    if (!selectedDate || !service || !selectedTime) return;
    const slot = timeSlots.find(s => s.id === selectedTime);
    if (!slot) return;
    AppointmentStorage.saveAppointmentData({ service, date: selectedDate, time: slot, timeSlots, observation: undefined });
    router.push("/cliente/agendar/confirmacao");
  };

  if (!service) return (
    <div className="min-h-dvh bg-[#FAF8FF] flex items-center justify-center p-6 text-center">
      <div>
        <div className="h-16 w-16 rounded-2xl bg-[#EDE5FF] flex items-center justify-center mx-auto mb-4">
          <Sparkles size={24} className="text-[#9D7FD4]" />
        </div>
        <p className="text-sm font-bold text-[#6B6480] mb-4">Selecione um serviço primeiro</p>
        <button onClick={() => router.push("/cliente/servicos")}
          className="px-6 py-2.5 rounded-full text-white text-xs font-black uppercase tracking-widest"
          style={{ background:"linear-gradient(135deg,#5A3F9A,#9D7FD4)" }}>
          Ver Serviços
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#FAF8FF]">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div style={{ background:"linear-gradient(145deg,#1E1A2E 0%,#2A2044 100%)" }}
        className="relative overflow-hidden">
        <div className="absolute inset-0 tn-dot-pattern opacity-20" />
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#9D7FD4]/15 blur-3xl translate-x-10 -translate-y-10" />

        <div className="relative z-10 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-5 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <motion.button whileTap={{ scale:0.9 }}
              onClick={() => router.push("/cliente/servicos")}
              className="h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
              <ArrowLeft size={15} className="text-white/80" />
            </motion.button>
            <div>
              <h1 className="text-base font-black text-white leading-none">Agendar</h1>
              <p className="text-[10px] text-white/40 mt-0.5">Escolha data e horário</p>
            </div>
          </div>

          {/* Service card */}
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 border border-white/10 px-4 py-3">
            <div className="h-9 w-9 rounded-xl bg-[#9D7FD4]/30 flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-[#EDE5FF]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Serviço</p>
              <p className="text-sm font-black text-white truncate">{service.name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-black text-[#9D7FD4]">{service.price}</p>
              <div className="flex items-center gap-1 justify-end mt-0.5">
                <Clock size={9} className="text-white/30" />
                <p className="text-[9px] text-white/30">{service.duration}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))] max-w-lg mx-auto space-y-4">

        {/* ── CALENDÁRIO PREMIUM ──────────────────────────────── */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.05, type:"spring", stiffness:280, damping:26 }}
          className="bg-white rounded-3xl border border-[#EDE5FF] shadow-sm p-5"
        >
          <PremiumCalendar
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            availableDays={availableDays}
            loadingAvailability={loadingAvail}
            workingDays={workingDays}
            onDateSelect={handleDateSelect}
            onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
            onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
          />
        </motion.div>

        {/* ── DATA SELECIONADA HEADER ──────────────────────────── */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div
              key="date-header"
              initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-10 }}
              transition={{ type:"spring", stiffness:350, damping:30 }}
              className="flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background:"linear-gradient(135deg,#5A3F9A,#9D7FD4)" }}>
                <span className="text-white font-black text-sm">{format(selectedDate,"d")}</span>
              </div>
              <div>
                <p className="text-xs font-black text-[#1E1A2E] capitalize">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-[9px] text-[#9B8FC0] font-bold">
                  {timeSlots.filter(s => s.available).length} horários disponíveis
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HORÁRIOS ────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div
              key="slots"
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
              transition={{ type:"spring", stiffness:280, damping:28 }}
              className="bg-white rounded-3xl border border-[#EDE5FF] shadow-sm p-5"
            >
              {loadingSlots ? (
                <div className="flex flex-col items-center py-8 gap-3">
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i => (
                      <motion.div key={i}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background:"linear-gradient(135deg,#5A3F9A,#9D7FD4)" }}
                        animate={{ y:[0,-8,0], opacity:[0.4,1,0.4] }}
                        transition={{ duration:0.8, delay:i*0.15, repeat:Infinity }} />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-[#9B8FC0] uppercase tracking-widest">
                    Carregando horários...
                  </p>
                </div>
              ) : slotsError ? (
                <div className="text-center py-6">
                  <p className="text-sm font-bold text-red-400 mb-3">Erro ao carregar horários</p>
                  <button onClick={() => selectedDate && fetchSlots(selectedDate)}
                    className="text-xs font-black text-[#7C5CBF] underline underline-offset-2 uppercase tracking-widest">
                    Tentar novamente
                  </button>
                </div>
              ) : timeSlots.length > 0 ? (
                <PremiumTimeSlots
                  slots={timeSlots}
                  selected={selectedTime}
                  onSelect={setSelectedTime}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-2xl bg-[#EDE5FF] flex items-center justify-center mx-auto mb-3">
                    <Clock size={18} className="text-[#9D7FD4]" />
                  </div>
                  <p className="text-sm font-bold text-[#2A2440] mb-1">Sem horários disponíveis</p>
                  <p className="text-xs text-[#9B8FC0]">Tente outro dia no calendário</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedDate && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
            className="text-center py-4">
            <p className="text-[10px] font-black text-[#C4BAE0] uppercase tracking-[0.3em]">
              ↑ Toque em um dia disponível
            </p>
          </motion.div>
        )}
      </div>

      {/* ── CTA FLUTUANTE ───────────────────────────────────── */}
      <AnimatePresence>
        {selectedTime && (
          <motion.div
            initial={{ opacity:0, y:80 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:80 }}
            transition={{ type:"spring", stiffness:400, damping:35 }}
            className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] inset-x-0 px-5 z-40"
          >
            <div className="max-w-lg mx-auto">
              <motion.button
                whileTap={{ scale:0.97 }}
                onClick={handleContinue}
                className="w-full h-[62px] rounded-2xl flex items-center justify-between px-5 relative overflow-hidden"
                style={{ background:"linear-gradient(135deg,#1E1A2E 0%,#3D2B6E 60%,#5A3F9A 100%)" }}
              >
                {/* Shimmer */}
                <motion.div className="absolute inset-0"
                  animate={{ x:["-100%","200%"] }}
                  transition={{ duration:3, repeat:Infinity, ease:"linear", repeatDelay:1 }}
                  style={{ background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)" }} />

                <div className="relative z-10 text-left">
                  <p className="text-[8px] text-white/40 uppercase tracking-[0.3em] leading-none mb-1">
                    {selectedDate && format(selectedDate,"EEEE, dd/MM",{locale:ptBR})}
                  </p>
                  <p className="text-[15px] font-black text-white leading-none">às {selectedTime}</p>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[8px] text-white/40 uppercase tracking-widest leading-none mb-1">Total</p>
                    <p className="text-sm font-black text-[#C4B0E8] leading-none">{service.price}</p>
                  </div>
                  <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center">
                    <ChevronRight size={16} className="text-white" />
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
