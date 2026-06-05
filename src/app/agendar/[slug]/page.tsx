"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, Clock, Scissors } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
}

interface Studio {
  id: string;
  name: string;
  slug: string;
}

interface Settings {
  slotDuration: number;
  advanceDays: number;
  cancelHours: number;
  workingHours: Record<string, { open: string; close: string; isOpen: boolean }>;
}

type Step = "service" | "date" | "time" | "client" | "confirm" | "done";

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  return `R$ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AgendarPage() {
  const params = useParams();
  const slug = params?.slug as string;

  // Dados do studio
  const [studio, setStudio] = useState<Studio | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadingStudio, setLoadingStudio] = useState(true);
  const [studioError, setStudioError] = useState<string | null>(null);

  // Fluxo de agendamento
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(""); // "YYYY-MM-DD"
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  // Slots
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Dados do cliente
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Submissão
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  // Calendário — semana exibida
  const [weekOffset, setWeekOffset] = useState(0);

  // ─── Carrega studio ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!slug) return;
    setLoadingStudio(true);
    fetch(`/api/studios/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setStudioError(data.error);
        } else {
          setStudio(data.studio);
          setServices(data.services ?? []);
          setSettings(data.settings ?? null);
        }
      })
      .catch(() => setStudioError("Não foi possível carregar o estúdio."))
      .finally(() => setLoadingStudio(false));
  }, [slug]);

  // ─── Carrega slots quando data/serviço muda ──────────────────────────────

  const loadSlots = useCallback(async () => {
    if (!studio || !selectedDate || !selectedService) return;
    setLoadingSlots(true);
    setSlots([]);
    try {
      const res = await fetch(
        `/api/slots?studioId=${studio.id}&date=${selectedDate}&duration=${selectedService.durationMinutes}`
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [studio, selectedDate, selectedService]);

  useEffect(() => {
    if (step === "time") loadSlots();
  }, [step, loadSlots]);

  // ─── Datas disponíveis ───────────────────────────────────────────────────

  const advanceDays = settings?.advanceDays ?? 30;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, weekOffset * 7 + i);
    return d;
  }).filter((d) => {
    const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
    return diff >= 0 && diff < advanceDays;
  });

  function isDayOpen(date: Date) {
    if (!settings?.workingHours) return true;
    const name = DAY_NAMES[date.getDay()];
    return settings.workingHours[name]?.isOpen ?? false;
  }

  // ─── Submissão ───────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!studio || !selectedService || !selectedDate || !selectedSlot || !clientName || !clientPhone) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const [year, month, day] = selectedDate.split("-").map(Number);
      const [hour, minute] = selectedSlot.split(":").map(Number);
      const appointmentDate = new Date(year, month - 1, day, hour, minute, 0);

      const res = await fetch("/api/appointments/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studioId: studio.id,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          durationMinutes: selectedService.durationMinutes,
          price: selectedService.price,
          appointmentDate: appointmentDate.toISOString(),
          clientName,
          clientPhone,
          clientEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setSubmitError(data.error ?? "Erro ao criar agendamento.");
      } else {
        setAppointmentId(data.appointmentId);
        setStep("done");
      }
    } catch {
      setSubmitError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loadingStudio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7FF]">
        <Loader2 className="animate-spin text-[#7C5CBF]" size={36} />
      </div>
    );
  }

  if (studioError || !studio) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F7FF] gap-4 px-4 text-center">
        <div className="text-5xl">💅</div>
        <h1 className="text-xl font-black text-slate-800">Estúdio não encontrado</h1>
        <p className="text-sm text-slate-500">{studioError ?? "O link pode estar incorreto."}</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F7FF] gap-6 px-4 text-center">
        <CheckCircle2 className="text-emerald-500" size={56} />
        <h1 className="text-2xl font-black text-slate-800">Agendamento confirmado!</h1>
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm max-w-sm w-full text-left space-y-3">
          <Row label="Serviço" value={selectedService?.name ?? ""} />
          <Row label="Data" value={format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })} />
          <Row label="Horário" value={selectedSlot} />
          <Row label="Duração" value={formatDuration(selectedService?.durationMinutes ?? 0)} />
          <Row label="Valor" value={formatPrice(selectedService?.price ?? 0)} />
        </div>
        <p className="text-xs text-slate-400 max-w-xs">
          Guarda esse horário! Qualquer dúvida, entre em contato diretamente com {studio.name}.
        </p>
        {appointmentId && (
          <p className="text-[10px] font-mono text-slate-300">#{appointmentId.slice(0, 8)}</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7FF]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7C5CBF] to-[#9D7FD4] flex items-center justify-center text-white text-sm font-black">
          {studio.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-black text-slate-800 leading-none">{studio.name}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Agendamento Online</p>
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-slate-100 px-4 py-2">
        <div className="flex gap-1 max-w-lg mx-auto">
          {(["service", "date", "time", "client"] as Step[]).map((s, i) => {
            const steps: Step[] = ["service", "date", "time", "client", "confirm", "done"];
            const currentIndex = steps.indexOf(step);
            const thisIndex = steps.indexOf(s);
            const done = thisIndex < currentIndex;
            const active = thisIndex === currentIndex;
            return (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${
                  done ? "bg-[#7C5CBF]" : active ? "bg-[#9D7FD4]" : "bg-slate-100"
                }`}
              />
            );
          })}
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* ── Passo 1: Serviço ── */}
        {step === "service" && (
          <Section title="Escolha o serviço" icon={<Scissors size={16} />}>
            <div className="space-y-2">
              {services
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => {
                      setSelectedService(svc);
                      setSelectedDate("");
                      setSelectedSlot("");
                      setStep("date");
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-[#9D7FD4] hover:bg-[#EDE5FF]/20 transition-all text-left group"
                  >
                    <div>
                      <p className="font-black text-slate-800 group-hover:text-[#7C5CBF] transition-colors">
                        {svc.name}
                      </p>
                      <p className="text-xs text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        {formatDuration(svc.durationMinutes)}
                      </p>
                    </div>
                    <span className="text-sm font-black text-[#7C5CBF]">{formatPrice(svc.price)}</span>
                  </button>
                ))}
            </div>
          </Section>
        )}

        {/* ── Passo 2: Data ── */}
        {step === "date" && (
          <Section
            title="Escolha a data"
            onBack={() => setStep("service")}
          >
            {selectedService && (
              <SelectedSummary service={selectedService} />
            )}

            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
                disabled={weekOffset === 0}
                className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                {weekDays.length > 0
                  ? `${format(weekDays[0], "dd/MM")} – ${format(weekDays[weekDays.length - 1], "dd/MM")}`
                  : ""}
              </span>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                disabled={weekDays.length < 7}
                className="p-2 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((d) => {
                const str = format(d, "yyyy-MM-dd");
                const open = isDayOpen(d);
                const isSelected = str === selectedDate;
                return (
                  <button
                    key={str}
                    disabled={!open}
                    onClick={() => {
                      setSelectedDate(str);
                      setSelectedSlot("");
                      setStep("time");
                    }}
                    className={[
                      "flex flex-col items-center py-2 rounded-xl text-xs font-black transition-all",
                      !open
                        ? "opacity-25 cursor-not-allowed"
                        : isSelected
                        ? "bg-[#7C5CBF] text-white"
                        : "bg-white border border-slate-100 hover:border-[#9D7FD4] hover:text-[#7C5CBF]",
                    ].join(" ")}
                  >
                    <span className="text-[10px] opacity-60">
                      {format(d, "EEE", { locale: ptBR }).slice(0, 3)}
                    </span>
                    <span className="text-base leading-tight">{format(d, "d")}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Passo 3: Horário ── */}
        {step === "time" && (
          <Section
            title="Escolha o horário"
            onBack={() => setStep("date")}
          >
            {selectedService && selectedDate && (
              <SelectedSummary
                service={selectedService}
                date={format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              />
            )}

            {loadingSlots ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-[#7C5CBF]" size={28} />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-8">
                <p className="font-black text-slate-500">Nenhum horário disponível</p>
                <p className="text-xs text-slate-400 mt-1">Tente outra data.</p>
                <button
                  onClick={() => setStep("date")}
                  className="mt-4 text-sm font-black text-[#7C5CBF] underline"
                >
                  Voltar
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setStep("client");
                    }}
                    className="py-2.5 rounded-xl border border-slate-100 bg-white text-sm font-black text-slate-800 hover:border-[#9D7FD4] hover:text-[#7C5CBF] hover:bg-[#EDE5FF]/20 transition-all"
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Passo 4: Dados do cliente ── */}
        {step === "client" && (
          <Section title="Seus dados" onBack={() => setStep("time")}>
            {selectedService && selectedDate && selectedSlot && (
              <SelectedSummary
                service={selectedService}
                date={format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                slot={selectedSlot}
              />
            )}

            <div className="space-y-3 mt-2">
              <Field
                label="Nome completo *"
                value={clientName}
                onChange={setClientName}
                placeholder="Seu nome"
              />
              <Field
                label="WhatsApp / Telefone *"
                value={clientPhone}
                onChange={setClientPhone}
                placeholder="(00) 00000-0000"
                type="tel"
              />
              <Field
                label="E-mail (opcional)"
                value={clientEmail}
                onChange={setClientEmail}
                placeholder="seu@email.com"
                type="email"
              />
            </div>

            <button
              onClick={() => setStep("confirm")}
              disabled={!clientName.trim() || !clientPhone.trim()}
              className="mt-4 w-full py-3.5 rounded-2xl bg-[#7C5CBF] text-white font-black text-sm hover:bg-[#6B4CAF] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Revisar agendamento →
            </button>
          </Section>
        )}

        {/* ── Passo 5: Confirmar ── */}
        {step === "confirm" && (
          <Section title="Confirmar agendamento" onBack={() => setStep("client")}>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3">
              <Row label="Serviço" value={selectedService?.name ?? ""} />
              <Row label="Data" value={format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })} />
              <Row label="Horário" value={selectedSlot} />
              <Row label="Duração" value={formatDuration(selectedService?.durationMinutes ?? 0)} />
              <Row label="Valor" value={formatPrice(selectedService?.price ?? 0)} />
              <hr className="border-slate-100" />
              <Row label="Nome" value={clientName} />
              <Row label="Telefone" value={clientPhone} />
              {clientEmail && <Row label="E-mail" value={clientEmail} />}
            </div>

            {submitError && (
              <p className="text-sm font-bold text-red-500 text-center mt-2">{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-4 w-full py-3.5 rounded-2xl bg-[#7C5CBF] text-white font-black text-sm hover:bg-[#6B4CAF] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Confirmando...
                </>
              ) : (
                "Confirmar agendamento ✓"
              )}
            </button>
          </Section>
        )}
      </main>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  onBack,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {icon && <span className="text-[#7C5CBF]">{icon}</span>}
        <h2 className="text-base font-black text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SelectedSummary({
  service,
  date,
  slot,
}: {
  service: Service;
  date?: string;
  slot?: string;
}) {
  return (
    <div className="mb-4 rounded-xl bg-[#EDE5FF]/30 border border-[#DDD5F5] px-4 py-3 flex flex-wrap gap-x-4 gap-y-1">
      <span className="text-xs font-black text-[#7C5CBF]">{service.name}</span>
      {date && <span className="text-xs font-bold text-slate-500">{date}</span>}
      {slot && <span className="text-xs font-bold text-slate-500">{slot}</span>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-xs font-black uppercase tracking-wider text-slate-400 shrink-0">{label}</span>
      <span className="text-xs font-black text-slate-800 text-right">{value}</span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-[#9D7FD4] transition"
      />
    </div>
  );
}
