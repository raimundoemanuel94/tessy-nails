"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Image as ImageIcon, Share2, RefreshCw,
  Check, Sparkles, Clock, ChevronLeft, ChevronRight,
  Download, Copy, Wand2, Sun, Moon, Palette,
} from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { appointmentService } from "@/services/appointments";
import { globalStore } from "@/store/globalStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Slot {
  time: string;
  label?: string;
  occupied: boolean;
  selected: boolean;
}

type Template = "dark" | "lavanda" | "minimal";

const TEMPLATES: { id: Template; name: string; icon: typeof Sun; desc: string }[] = [
  { id: "dark",    name: "Dark",    icon: Moon,    desc: "Igual ao Instagram" },
  { id: "lavanda", name: "Lavanda", icon: Sparkles, desc: "Identidade do app" },
  { id: "minimal", name: "Minimal", icon: Sun,     desc: "Clean e elegante"   },
];

const TEMPLATE_STYLES: Record<Template, {
  bg: string; text: string; textSub: string; pill: string; pillText: string;
  pillOcup: string; pillOcupText: string; logo: string; star: string;
}> = {
  dark: {
    bg: "#0A0A0A", text: "#FFFFFF", textSub: "#888888",
    pill: "#1C1C1C", pillText: "#E8D5B0",
    pillOcup: "#111111", pillOcupText: "#333333",
    logo: "#FFFFFF", star: "#E8D5B0",
  },
  lavanda: {
    bg: "#1E1A2E", text: "#FFFFFF", textSub: "#9B8FC0",
    pill: "#2A2044", pillText: "#C4B0E8",
    pillOcup: "#1E1A2E", pillOcupText: "#3D3560",
    logo: "#9D7FD4", star: "#9D7FD4",
  },
  minimal: {
    bg: "#FAFAFA", text: "#1E1A2E", textSub: "#9B8FC0",
    pill: "#FFFFFF", pillText: "#7C5CBF",
    pillOcup: "#F4F0FF", pillOcupText: "#C4B0E8",
    logo: "#7C5CBF", star: "#9D7FD4",
  },
};

// ─── Componente do Card Visual (o que vira imagem) ────────────────────────────
function VitrineCard({
  cardRef, slots, template, date, caption,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  slots: Slot[]; template: Template; date: Date; caption: string;
}) {
  const s = TEMPLATE_STYLES[template];
  const manha = slots.filter(sl => parseInt(sl.time.split(":")[0]) < 12 && sl.selected);
  const tarde = slots.filter(sl => parseInt(sl.time.split(":")[0]) >= 12 && sl.selected);
  const dateStr = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });

  const Pill = ({ slot }: { slot: Slot }) => (
    <div style={{
      background: slot.occupied ? s.pillOcup : s.pill,
      color: slot.occupied ? s.pillOcupText : s.pillText,
      borderRadius: 100, padding: "10px 20px",
      fontSize: 16, fontWeight: 700, display: "inline-block",
      border: `1.5px solid ${slot.occupied ? "transparent" : s.pillText + "30"}`,
      opacity: slot.occupied ? 0.4 : 1,
      textDecoration: slot.occupied ? "line-through" : "none",
    }}>
      {slot.occupied ? "❤️" : slot.time}
    </div>
  );

  const Group = ({ label, group }: { label: string; group: Slot[] }) => {
    if (!group.length) return null;
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: s.textSub, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 10, textTransform: "uppercase" }}>
          {label}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {group.map(sl => <Pill key={sl.time} slot={sl} />)}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      style={{
        width: 400, background: s.bg, padding: "40px 32px 32px",
        fontFamily: "'Inter', -apple-system, sans-serif",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Estrelinhas decorativas */}
      {["top-6 right-8","top-20 right-4","bottom-20 left-6","top-40 left-3"].map((pos, i) => (
        <span key={i} style={{
          position:"absolute", fontSize: i%2===0 ? 18 : 12,
          color: s.star, opacity: 0.7,
          top: pos.includes("top") ? pos.split(" ")[0].replace("top-","")+"px" : undefined,
          bottom: pos.includes("bottom") ? pos.split(" ")[1].replace("bottom-","")+"px" : undefined,
          left: pos.includes("left") ? pos.split(" ")[2]?.replace("left-","")+"px" : undefined,
          right: pos.includes("right") ? pos.split(" ")[1]?.replace("right-","")+"px" : undefined,
        }}>✦</span>
      ))}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: s.textSub, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 6, textTransform: "capitalize" }}>
          {dateStr}
        </div>
        <div style={{ color: s.text, fontSize: 36, fontWeight: 900, lineHeight: 1.1, marginBottom: 6 }}>
          Horários<br />disponíveis
        </div>
        <div style={{ color: s.star, fontSize: 20 }}>💅</div>
      </div>

      {/* Slots */}
      <Group label="Manhã" group={manha} />
      <Group label="Tarde" group={tarde} />

      {/* Caption */}
      {caption && (
        <div style={{
          marginTop: 16, padding: "12px 16px", borderRadius: 12,
          background: template === "minimal" ? "#F0EBFF" : "rgba(255,255,255,0.06)",
          color: s.textSub, fontSize: 12, lineHeight: 1.5,
        }}>
          {caption}
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 24, paddingTop: 16,
        borderTop: `1px solid ${s.textSub}25`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ color: s.logo, fontSize: 13, fontWeight: 900, letterSpacing: "0.05em" }}>
          TESSY NAILS
        </div>
        <div style={{ color: s.textSub, fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Atualizado ✦
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function VitrinePage() {
  const router  = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  const [date, setDate]           = useState(new Date());
  const [slots, setSlots]         = useState<Slot[]>([]);
  const [template, setTemplate]   = useState<Template>("dark");
  const [caption, setCaption]     = useState("Responda rápido, vagas limitadas! 🔥");
  const [loading, setLoading]     = useState(true);
  const [generating, setGen]      = useState(false);
  const [generated, setGenerated] = useState(false);
  const [imgUrl, setImgUrl]       = useState<string | null>(null);
  const [step, setStep]           = useState<"config" | "preview">("config");

  // Carregar slots do dia
  const loadSlots = useCallback(async (d: Date) => {
    setLoading(true); setGenerated(false); setImgUrl(null);
    try {
      const [allServices, appointments] = await Promise.allSettled([
        globalStore.fetchServices(false),
        appointmentService.getByDateRange(startOfDay(d), endOfDay(d)),
      ]);

      const appts = appointments.status === "fulfilled" ? appointments.value : [];
      const services = allServices.status === "fulfilled" ? allServices.value : [];

      // Horários ocupados
      const occupiedTimes = new Set(
        appts
          .filter(a => ["pending","confirmed"].includes(a.status))
          .map(a => format(new Date(a.appointmentDate), "HH:mm"))
      );

      // Gerar todos os slots do dia (08h–18h de 30 em 30 min)
      const generated: Slot[] = [];
      const now = new Date();
      let t = new Date(d); t.setHours(8, 0, 0, 0);
      const end = new Date(d); end.setHours(18, 0, 0, 0);

      while (t <= end) {
        const timeStr = format(t, "HH:mm");
        const isPast  = d.toDateString() === now.toDateString() && t < now;
        if (!isPast) {
          generated.push({
            time: timeStr,
            occupied: occupiedTimes.has(timeStr),
            selected: !occupiedTimes.has(timeStr), // pré-seleciona só os livres
          });
        }
        t = new Date(t.getTime() + 30 * 60000);
      }

      setSlots(generated);
    } catch {
      toast.error("Erro ao carregar horários");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSlots(date); }, [date, loadSlots]);

  // Gerar imagem com html2canvas
  const handleGenerate = async () => {
    if (!cardRef.current) return;
    setGen(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,        // resolução 3x para ficar nítido
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      setImgUrl(url);
      setGenerated(true);
      setStep("preview");
    } catch {
      toast.error("Erro ao gerar imagem");
    } finally {
      setGen(false);
    }
  };

  // Compartilhar nativo
  const handleShare = async () => {
    if (!imgUrl) return;
    try {
      const blob = await (await fetch(imgUrl)).blob();
      const file = new File([blob], "tessy-nails-horarios.png", { type: "image/png" });
      const shareText = `${caption}\n\n✦ TESSY NAILS`;

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
      } else {
        // Fallback: download
        const a = document.createElement("a");
        a.href = imgUrl; a.download = "tessy-nails-horarios.png"; a.click();
        // Copiar texto
        await navigator.clipboard.writeText(shareText);
        toast.success("Imagem baixada e texto copiado! 📋");
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") toast.error("Erro ao compartilhar");
    }
  };

  // Copiar texto
  const handleCopyText = async () => {
    const freeSlots = slots.filter(s => s.selected && !s.occupied);
    const manha = freeSlots.filter(s => parseInt(s.time.split(":")[0]) < 12).map(s => s.time).join(" • ");
    const tarde  = freeSlots.filter(s => parseInt(s.time.split(":")[0]) >= 12).map(s => s.time).join(" • ");
    const dateStr = format(date, "EEEE, d/MM", { locale: ptBR });
    const text = [
      `💅 Horários disponíveis — ${dateStr}`,
      manha ? `\n🌅 Manhã: ${manha}` : "",
      tarde  ? `\n☀️ Tarde: ${tarde}`  : "",
      `\n\n${caption}`,
      "\n✦ Tessy Nails",
    ].join("");
    await navigator.clipboard.writeText(text);
    toast.success("Texto copiado! Cola no WhatsApp 📋");
  };

  const freeCount  = slots.filter(s => s.selected && !s.occupied).length;
  const totalCount = slots.filter(s => !s.occupied).length;

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/agenda")}
            className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <ArrowLeft size={16} className="text-slate-500" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-800 leading-none">Vitrine do Dia</h1>
            <p className="text-xs text-slate-400 mt-0.5">Gere e compartilhe seus horários disponíveis</p>
          </div>
          <button onClick={() => loadSlots(date)}
            className="ml-auto h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <RefreshCw size={15} className="text-slate-500" />
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-6">
          {["Configurar","Prévia & Compartilhar"].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => i === 0 ? setStep("config") : generated && setStep("preview")}
                className={cn("flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full transition-all",
                  (i === 0 ? step === "config" : step === "preview")
                    ? "bg-[#7C5CBF] text-white"
                    : "bg-slate-100 text-slate-400"
                )}>
                <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px]">{i+1}</span>
                {s}
              </button>
              {i === 0 && <ChevronRight size={12} className="text-slate-300" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: CONFIGURAR ──────────────────────────────────────────── */}
          {step === "config" && (
            <motion.div key="config" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>

              {/* Seletor de data */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">Data</p>
                <div className="flex items-center justify-between">
                  <button onClick={() => { const d = new Date(date); d.setDate(d.getDate()-1); setDate(d); }}
                    className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                    <ChevronLeft size={16} className="text-slate-500" />
                  </button>
                  <div className="text-center">
                    <p className="text-base font-black text-slate-800 capitalize">
                      {format(date, "EEEE", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-[#7C5CBF] font-bold">
                      {format(date, "d 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                  <button onClick={() => { const d = new Date(date); d.setDate(d.getDate()+1); setDate(d); }}
                    className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                    <ChevronRight size={16} className="text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Slots */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">
                    Horários — {freeCount} de {totalCount} livres selecionados
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setSlots(p => p.map(s => s.occupied ? s : {...s, selected: true}))}
                      className="text-[9px] font-black text-[#7C5CBF] uppercase tracking-widest">
                      Todos
                    </button>
                    <span className="text-slate-200">|</span>
                    <button onClick={() => setSlots(p => p.map(s => ({...s, selected: false})))}
                      className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Nenhum
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex gap-1 py-4 justify-center">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-[#9D7FD4]"
                        animate={{ y:[0,-6,0] }} transition={{ duration:0.6, delay:i*0.1, repeat:Infinity }} />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-4">Sem horários para este dia</p>
                ) : (
                  <div className="space-y-3">
                    {["Manhã","Tarde"].map(period => {
                      const group = slots.filter(s =>
                        period === "Manhã"
                          ? parseInt(s.time.split(":")[0]) < 12
                          : parseInt(s.time.split(":")[0]) >= 12
                      );
                      if (!group.length) return null;
                      return (
                        <div key={period}>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">
                            {period === "Manhã" ? "🌅" : "☀️"} {period}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {group.map(slot => (
                              <button key={slot.time}
                                onClick={() => !slot.occupied && setSlots(p =>
                                  p.map(s => s.time === slot.time ? {...s, selected: !s.selected} : s)
                                )}
                                disabled={slot.occupied}
                                className={cn(
                                  "h-10 px-4 rounded-xl text-xs font-black transition-all",
                                  slot.occupied
                                    ? "bg-slate-50 text-slate-200 cursor-not-allowed line-through"
                                    : slot.selected
                                    ? "bg-[#7C5CBF] text-white shadow-md shadow-[#7C5CBF]/30"
                                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                )}>
                                {slot.occupied ? `${slot.time} ✓` : slot.time}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Template */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">Template visual</p>
                <div className="grid grid-cols-3 gap-2">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setTemplate(t.id)}
                      className={cn(
                        "rounded-2xl p-3 text-left border-2 transition-all",
                        template === t.id ? "border-[#7C5CBF] bg-[#EDE5FF]" : "border-slate-100 hover:border-[#DDD5F5]"
                      )}>
                      <div className={cn(
                        "h-8 w-8 rounded-xl flex items-center justify-center mb-2",
                        template === t.id ? "bg-[#7C5CBF]" : "bg-slate-100"
                      )}>
                        <t.icon size={15} className={template === t.id ? "text-white" : "text-slate-500"} />
                      </div>
                      <p className="text-xs font-black text-slate-700">{t.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">Mensagem</p>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  rows={2}
                  className="w-full text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#9D7FD4]/30 resize-none font-medium"
                  placeholder="Responda rápido, vagas limitadas!"
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  {["Vagas limitadas! 🔥","Últimas vagas ✨","Responda já! 💅"].map(s => (
                    <button key={s} onClick={() => setCaption(s)}
                      className="text-[9px] font-bold text-[#7C5CBF] bg-[#EDE5FF] px-2.5 py-1 rounded-full hover:bg-[#DDD5F5] transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button onClick={handleGenerate} disabled={generating || freeCount === 0}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-sm transition-all disabled:opacity-50 shadow-xl shadow-[#7C5CBF]/25"
                style={{ background:"linear-gradient(135deg,#5A3F9A,#9D7FD4)" }}>
                {generating ? (
                  <><motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }}>
                    <Wand2 size={18} /></motion.div> Gerando imagem...</>
                ) : (
                  <><Wand2 size={18} /> Gerar Vitrine</>
                )}
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: PREVIEW ─────────────────────────────────────────────── */}
          {step === "preview" && (
            <motion.div key="preview" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
              className="space-y-4">

              {/* Preview da imagem gerada */}
              {imgUrl && (
                <div className="bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center p-4">
                  <img src={imgUrl} alt="Vitrine" className="max-w-full rounded-xl shadow-2xl" style={{ maxHeight: 500 }} />
                </div>
              )}

              {/* Botões de ação */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleShare}
                  className="h-14 rounded-2xl flex items-center justify-center gap-2.5 text-white font-black text-sm shadow-lg"
                  style={{ background:"linear-gradient(135deg,#1E1A2E,#5A3F9A)" }}>
                  <Share2 size={17} /> Compartilhar
                </button>
                <button onClick={handleCopyText}
                  className="h-14 rounded-2xl flex items-center justify-center gap-2.5 font-black text-sm bg-white border-2 border-[#EDE5FF] text-[#7C5CBF] hover:bg-[#EDE5FF] transition-colors">
                  <Copy size={17} /> Copiar texto
                </button>
              </div>

              {/* Download */}
              {imgUrl && (
                <a href={imgUrl} download="tessy-nails-horarios.png"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-bold text-slate-500">
                  <Download size={15} /> Baixar imagem
                </a>
              )}

              {/* Dica */}
              <div className="flex items-start gap-3 bg-[#EDE5FF] rounded-2xl p-4">
                <span className="text-lg shrink-0">💡</span>
                <p className="text-xs font-bold text-[#5A3F9A] leading-relaxed">
                  <strong>Dica:</strong> Toque em "Compartilhar" para enviar direto para o WhatsApp Status ou Instagram Stories. O texto já vai junto!
                </p>
              </div>

              {/* Botão voltar para editar */}
              <button onClick={() => setStep("config")}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-bold text-slate-500 flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Editar configurações
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Card oculto que vira imagem — fora da tela */}
        <div className="fixed -top-[9999px] -left-[9999px] pointer-events-none" aria-hidden="true">
          <VitrineCard
            cardRef={cardRef}
            slots={slots}
            template={template}
            date={date}
            caption={caption}
          />
        </div>

      </div>
    </PageShell>
  );
}
