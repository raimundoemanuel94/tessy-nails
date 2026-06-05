// @ts-nocheck
"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2, Clock, Scissors } from "lucide-react";

type Service = { id: string; name: string; price: number; duration_minutes: number };
type Studio  = { id: string; name: string; slug: string };
type Step    = "service" | "date" | "time" | "client" | "confirm" | "done";

const DAY_NAMES = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function fPrice(p: number) { return `R$ ${p.toLocaleString("pt-BR",{minimumFractionDigits:2})}`; }
function fDur(m: number) { return m < 60 ? `${m}min` : `${Math.floor(m/60)}h${m%60>0?m%60+"min":""}`; }

export default function AgendarPage() {
  const { slug } = useParams() as { slug: string };
  const [studio, setStudio]   = useState<Studio | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [loadingStudio, setLoadingStudio] = useState(true);
  const [studioError, setStudioError] = useState<string | null>(null);

  const [step, setStep]               = useState<Step>("service");
  const [selectedSvc, setSelectedSvc] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots]             = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [weekOffset, setWeekOffset]   = useState(0);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [apptId, setApptId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/studios/${slug}`)
      .then(r => r.json())
      .then(d => { if (d.error) setStudioError(d.error); else { setStudio(d.studio); setServices(d.services); setSettings(d.settings); } })
      .catch(() => setStudioError("Erro ao carregar."))
      .finally(() => setLoadingStudio(false));
  }, [slug]);

  const loadSlots = useCallback(async () => {
    if (!studio || !selectedDate || !selectedSvc) return;
    setLoadingSlots(true); setSlots([]);
    const res = await fetch(`/api/public/slots?studioId=${studio.id}&date=${selectedDate}&duration=${selectedSvc.duration_minutes}`);
    const data = await res.json();
    setSlots(data.slots ?? []);
    setLoadingSlots(false);
  }, [studio, selectedDate, selectedSvc]);

  useEffect(() => { if (step === "time") loadSlots(); }, [step, loadSlots]);

  const today = new Date(); today.setHours(0,0,0,0);
  const advanceDays = (settings as Record<string, number> | null)?.advance_days ?? 30;
  const wh = (settings as Record<string, unknown> | null)?.working_hours as Record<string, { is_open: boolean }> | undefined;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(today, weekOffset * 7 + i);
    return d;
  }).filter(d => {
    const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
    return diff >= 0 && diff < advanceDays;
  });

  function isDayOpen(d: Date) {
    if (!wh) return true;
    return wh[DAY_NAMES[d.getDay()]]?.is_open ?? false;
  }

  async function submit() {
    if (!studio || !selectedSvc || !selectedDate || !selectedSlot || !clientName || !clientPhone) return;
    setSubmitting(true); setSubmitError(null);
    const [y,mo,d] = selectedDate.split("-").map(Number);
    const [h,mi] = selectedSlot.split(":").map(Number);
    const dt = new Date(y, mo-1, d, h, mi, 0);
    const res = await fetch("/api/public/appointments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studioId: studio.id, serviceId: selectedSvc.id, serviceName: selectedSvc.name,
        durationMinutes: selectedSvc.duration_minutes, price: selectedSvc.price,
        appointmentDate: dt.toISOString(), clientName, clientPhone, clientEmail,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.error) { setSubmitError(data.error ?? "Erro."); setSubmitting(false); return; }
    setApptId(data.appointmentId); setStep("done");
    setSubmitting(false);
  }

  if (loadingStudio) return <div className="min-h-screen flex items-center justify-center" style={{background:"var(--bg)"}}><Loader2 className="animate-spin" size={32} style={{color:"var(--brand)"}}/></div>;
  if (studioError || !studio) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-4 text-center" style={{background:"var(--bg)"}}>
      <div className="text-5xl">💅</div>
      <p className="font-black text-lg" style={{color:"var(--text)"}}>Studio não encontrado</p>
    </div>
  );

  if (step === "done") return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-4 text-center" style={{background:"var(--bg)"}}>
      <CheckCircle2 size={52} style={{color:"#4ade80"}}/>
      <h1 className="text-2xl font-black" style={{color:"var(--text)"}}>Agendado!</h1>
      <div className="card w-full max-w-sm text-left space-y-2">
        <Row label="Serviço" value={selectedSvc?.name ?? ""} />
        <Row label="Data" value={format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", {locale:ptBR})} />
        <Row label="Horário" value={selectedSlot} />
        <Row label="Valor" value={fPrice(selectedSvc?.price ?? 0)} />
      </div>
      {apptId && <p className="text-xs font-mono" style={{color:"var(--muted)"}}>#{apptId.slice(0,8)}</p>}
    </div>
  );

  return (
    <div className="min-h-screen" style={{background:"var(--bg)"}}>
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3" style={{background:"var(--surface)", borderBottom:"1px solid var(--border)"}}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white" style={{background:"var(--brand)"}}>
          {studio.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-black" style={{color:"var(--text)"}}>{studio.name}</p>
          <p className="text-xs" style={{color:"var(--muted)"}}>Agendamento Online</p>
        </div>
      </header>

      <div className="h-1 flex" style={{background:"var(--surface2)"}}>
        {(["service","date","time","client"] as Step[]).map((s,i) => {
          const cur = ["service","date","time","client","confirm"].indexOf(step);
          return <div key={s} className="flex-1 transition-all" style={{background: i <= cur ? "var(--brand)" : "transparent"}} />;
        })}
      </div>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {step === "service" && (
          <Section title="Escolha o serviço" icon={<Scissors size={16}/>}>
            {services.map(svc => (
              <button key={svc.id} onClick={() => { setSelectedSvc(svc); setSelectedDate(""); setSelectedSlot(""); setStep("date"); }}
                className="w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all"
                style={{background:"var(--surface)", border:"1px solid var(--border)"}}>
                <div>
                  <p className="font-black" style={{color:"var(--text)"}}>{svc.name}</p>
                  <p className="text-xs flex items-center gap-1 mt-0.5" style={{color:"var(--muted)"}}><Clock size={11}/>{fDur(svc.duration_minutes)}</p>
                </div>
                <span className="font-black" style={{color:"var(--brand-light)"}}>{fPrice(svc.price)}</span>
              </button>
            ))}
          </Section>
        )}

        {step === "date" && (
          <Section title="Escolha a data" onBack={() => setStep("service")}>
            {selectedSvc && <SelectedSummary svc={selectedSvc}/>}
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setWeekOffset(w => Math.max(0,w-1))} disabled={weekOffset===0} className="btn-ghost p-2"><ChevronLeft size={16}/></button>
              <span className="text-xs font-bold" style={{color:"var(--muted)"}}>
                {weekDays.length > 0 ? `${format(weekDays[0],"dd/MM")} – ${format(weekDays[weekDays.length-1],"dd/MM")}` : ""}
              </span>
              <button onClick={() => setWeekOffset(w => w+1)} disabled={weekDays.length < 7} className="btn-ghost p-2"><ChevronRight size={16}/></button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(d => {
                const str = format(d,"yyyy-MM-dd"); const open = isDayOpen(d);
                return (
                  <button key={str} disabled={!open} onClick={() => { setSelectedDate(str); setSelectedSlot(""); setStep("time"); }}
                    className="flex flex-col items-center py-2 rounded-xl text-xs font-bold transition-all"
                    style={!open ? {opacity:.25} : str===selectedDate ? {background:"var(--brand)",color:"#fff"} : {background:"var(--surface)",border:"1px solid var(--border)",color:"var(--muted)"}}>
                    <span className="text-[10px] opacity-60">{format(d,"EEE",{locale:ptBR}).slice(0,3)}</span>
                    <span className="text-base">{format(d,"d")}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {step === "time" && (
          <Section title="Escolha o horário" onBack={() => setStep("date")}>
            {selectedSvc && <SelectedSummary svc={selectedSvc} date={format(parseISO(selectedDate),"EEEE, dd 'de' MMMM",{locale:ptBR})}/>}
            {loadingSlots ? <div className="flex justify-center py-8"><Loader2 className="animate-spin" size={24} style={{color:"var(--brand)"}}/></div>
            : slots.length === 0 ? <div className="text-center py-8"><p style={{color:"var(--muted)"}}>Nenhum horário disponível.</p><button onClick={() => setStep("date")} className="text-sm font-bold mt-3" style={{color:"var(--brand-light)"}}>Escolher outra data</button></div>
            : <div className="grid grid-cols-4 gap-2">
                {slots.map(s => (
                  <button key={s} onClick={() => { setSelectedSlot(s); setStep("client"); }}
                    className="py-2.5 rounded-xl text-sm font-bold transition-all"
                    style={{background:"var(--surface)", border:"1px solid var(--border)", color:"var(--text)"}}>
                    {s}
                  </button>
                ))}
              </div>}
          </Section>
        )}

        {step === "client" && (
          <Section title="Seus dados" onBack={() => setStep("time")}>
            {selectedSvc && <SelectedSummary svc={selectedSvc} date={format(parseISO(selectedDate),"EEEE, dd 'de' MMMM",{locale:ptBR})} slot={selectedSlot}/>}
            <div className="flex flex-col gap-3">
              <input className="input-base" placeholder="Nome completo *" value={clientName} onChange={e=>setClientName(e.target.value)}/>
              <input className="input-base" type="tel" placeholder="WhatsApp *" value={clientPhone} onChange={e=>setClientPhone(e.target.value)}/>
              <input className="input-base" type="email" placeholder="E-mail (opcional)" value={clientEmail} onChange={e=>setClientEmail(e.target.value)}/>
            </div>
            <button onClick={() => setStep("confirm")} disabled={!clientName||!clientPhone} className="btn-primary w-full mt-4">Revisar →</button>
          </Section>
        )}

        {step === "confirm" && (
          <Section title="Confirmar" onBack={() => setStep("client")}>
            <div className="card space-y-3">
              <Row label="Serviço" value={selectedSvc?.name ?? ""}/>
              <Row label="Data" value={format(parseISO(selectedDate),"EEEE, dd 'de' MMMM",{locale:ptBR})}/>
              <Row label="Horário" value={selectedSlot}/>
              <Row label="Valor" value={fPrice(selectedSvc?.price??0)}/>
              <hr style={{borderColor:"var(--border)"}}/>
              <Row label="Nome" value={clientName}/>
              <Row label="Telefone" value={clientPhone}/>
            </div>
            {submitError && <p className="text-sm text-center" style={{color:"#f87171"}}>{submitError}</p>}
            <button onClick={submit} disabled={submitting} className="btn-primary w-full mt-4">
              {submitting ? <><Loader2 size={14} className="animate-spin"/> Confirmando...</> : "Confirmar agendamento ✓"}
            </button>
          </Section>
        )}
      </main>
    </div>
  );
}

function Section({ title, icon, onBack, children }: { title: string; icon?: React.ReactNode; onBack?: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {onBack && <button onClick={onBack} className="btn-ghost p-1.5"><ChevronLeft size={16}/></button>}
        {icon && <span style={{color:"var(--brand-light)"}}>{icon}</span>}
        <h2 className="text-base font-black" style={{color:"var(--text)"}}>{title}</h2>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function SelectedSummary({ svc, date, slot }: { svc: { name: string }; date?: string; slot?: string }) {
  return (
    <div className="flex flex-wrap gap-3 px-4 py-3 rounded-xl mb-2" style={{background:"var(--surface2)", border:"1px solid var(--border)"}}>
      <span className="text-xs font-black" style={{color:"var(--brand-light)"}}>{svc.name}</span>
      {date && <span className="text-xs" style={{color:"var(--muted)"}}>{date}</span>}
      {slot && <span className="text-xs font-bold" style={{color:"var(--text)"}}>{slot}</span>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-xs font-bold uppercase tracking-wider" style={{color:"var(--muted)"}}>{label}</span>
      <span className="text-xs font-black" style={{color:"var(--text)"}}>{value}</span>
    </div>
  );
}
