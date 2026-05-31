"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Share2, RefreshCw, Wand2,
  ChevronLeft, ChevronRight, Download, Copy,
  Moon, Sun, Sparkles,
} from "lucide-react";
import { PageShell } from "@/components/shared/PageShell";
import { appointmentService } from "@/services/appointments";
import { globalStore } from "@/store/globalStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { generateVitrineCanvas, type VitrineTemplate } from "@/lib/vitrineCanvas";

interface Slot { time: string; occupied: boolean; selected: boolean; }

const TEMPLATES: { id: VitrineTemplate; name: string; icon: typeof Sun; desc: string; preview: string }[] = [
  { id: "dark",    name: "Dark",    icon: Moon,     desc: "Igual ao Instagram", preview: "#0A0A0A" },
  { id: "lavanda", name: "Lavanda", icon: Sparkles, desc: "Identidade do app",  preview: "#1E1A2E" },
  { id: "minimal", name: "Minimal", icon: Sun,      desc: "Clean e elegante",   preview: "#FAFAFA" },
];

const CAPTIONS = [
  "Responda rápido, vagas limitadas! 🔥",
  "Últimas vagas do dia ✨",
  "Reserve já o seu horário 💅",
  "Agenda do dia! Me chama 🤍",
];

export default function VitrinePage() {
  const router = useRouter();

  const [date, setDate]             = useState(new Date());
  const [slots, setSlots]           = useState<Slot[]>([]);
  const [template, setTemplate]     = useState<VitrineTemplate>("dark");
  const [caption, setCaption]       = useState(CAPTIONS[0]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [imgUrl, setImgUrl]         = useState<string | null>(null);
  const [step, setStep]             = useState<"config" | "preview">("config");

  const loadSlots = useCallback(async (d: Date) => {
    setLoading(true);
    setImgUrl(null);
    try {
      const [svcsRes, apptsRes] = await Promise.allSettled([
        globalStore.fetchServices(false),
        appointmentService.getByDateRange(startOfDay(d), endOfDay(d)),
      ]);

      const appts = apptsRes.status === "fulfilled" ? apptsRes.value : [];
      const occupiedTimes = new Set(
        appts
          .filter(a => ["pending","confirmed"].includes(a.status))
          .map(a => format(new Date(a.appointmentDate), "HH:mm"))
      );

      const result: Slot[] = [];
      let t = new Date(d); t.setHours(8, 0, 0, 0);
      const endT = new Date(d); endT.setHours(18, 0, 0, 0);
      const now = new Date();
      while (t <= endT) {
        const timeStr = format(t, "HH:mm");
        const isPast = d.toDateString() === now.toDateString() && t < now;
        if (!isPast) {
          const occ = occupiedTimes.has(timeStr);
          result.push({ time: timeStr, occupied: occ, selected: !occ });
        }
        t = new Date(t.getTime() + 30 * 60000);
      }
      setSlots(result);
    } catch {
      toast.error("Erro ao carregar horários");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSlots(date); }, [date, loadSlots]);

  const freeSelected = slots.filter(s => s.selected && !s.occupied).length;

  const handleGenerate = async () => {
    if (freeSelected === 0) {
      toast.error("Selecione pelo menos 1 horário livre");
      return;
    }
    setGenerating(true);
    try {
      const dateLabel = format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
      const canvas = generateVitrineCanvas(slots, template, dateLabel, caption);
      const url = canvas.toDataURL("image/png", 1.0);
      setImgUrl(url);
      setStep("preview");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!imgUrl) return;
    const shareText = `${caption}\n\n✦ NAILIT`;
    try {
      const blob  = await (await fetch(imgUrl)).blob();
      const file  = new File([blob], "nailit.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
      } else {
        // Fallback: download + copiar texto
        const a = document.createElement("a");
        a.href = imgUrl; a.download = "nailit-horarios.png"; a.click();
        await navigator.clipboard.writeText(shareText);
        toast.success("Imagem baixada + texto copiado! 📋");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") toast.error("Erro ao compartilhar");
    }
  };

  const handleCopyText = async () => {
    const freeSlots = slots.filter(s => s.selected && !s.occupied);
    const manha = freeSlots.filter(s => +s.time.split(":")[0] < 12).map(s => s.time).join(" • ");
    const tarde  = freeSlots.filter(s => +s.time.split(":")[0] >= 12).map(s => s.time).join(" • ");
    const text = [
      `💅 Horários disponíveis — ${format(date,"EEEE, d/MM",{locale:ptBR})}`,
      manha ? `\n🌅 Manhã: ${manha}` : "",
      tarde  ? `\n☀️ Tarde: ${tarde}`  : "",
      `\n\n${caption}`,
      "\n✦ Nailit",
    ].join("");
    await navigator.clipboard.writeText(text);
    toast.success("Texto copiado! Cola no WhatsApp 📋");
  };

  const toggleSlot = (time: string) =>
    setSlots(p => p.map(s => s.time === time && !s.occupied ? {...s, selected: !s.selected} : s));

  return (
    <PageShell>
      <div className="max-w-xl mx-auto">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.push("/agenda")}
            className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0">
            <ArrowLeft size={16} className="text-slate-500" />
          </button>
          <div className="flex-1">
            <h1 className="text-[15px] font-black text-slate-800 leading-none">Vitrine do Dia</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">Gere e compartilhe seus horários</p>
          </div>
          {step === "config" && (
            <button onClick={() => loadSlots(date)}
              className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <RefreshCw size={14} className="text-slate-400" />
            </button>
          )}
          {step === "preview" && (
            <button onClick={() => setStep("config")}
              className="h-9 px-3 rounded-xl bg-slate-100 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors">
              <ArrowLeft size={13} /> Editar
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════════════════════
              STEP 1 — CONFIGURAR
          ══════════════════════════════════════════════════════════════ */}
          {step === "config" && (
            <motion.div key="config"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              className="space-y-4">

              {/* Data */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">Data</p>
                <div className="flex items-center justify-between">
                  <button onClick={() => { const d=new Date(date); d.setDate(d.getDate()-1); setDate(d); }}
                    className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors active:scale-90">
                    <ChevronLeft size={18} className="text-slate-500" />
                  </button>
                  <div className="text-center">
                    <p className="text-base font-black text-slate-800 capitalize">
                      {format(date,"EEEE",{locale:ptBR})}
                    </p>
                    <p className="text-sm font-bold text-[#7C5CBF]">
                      {format(date,"d 'de' MMMM",{locale:ptBR})}
                    </p>
                  </div>
                  <button onClick={() => { const d=new Date(date); d.setDate(d.getDate()+1); setDate(d); }}
                    className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors active:scale-90">
                    <ChevronRight size={18} className="text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Slots */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">
                    Horários — <span className="text-[#7C5CBF]">{freeSelected} selecionados</span>
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setSlots(p => p.map(s => s.occupied ? s : {...s, selected:true}))}
                      className="text-[9px] font-black text-[#7C5CBF] uppercase tracking-widest hover:underline">
                      Todos
                    </button>
                    <button onClick={() => setSlots(p => p.map(s => ({...s, selected:false})))}
                      className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:underline">
                      Limpar
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex gap-1.5 justify-center py-6">
                    {[0,1,2].map(i => (
                      <motion.div key={i} className="w-2 h-2 rounded-full bg-[#9D7FD4]"
                        animate={{ y:[0,-6,0] }}
                        transition={{ duration:0.6, delay:i*0.12, repeat:Infinity }} />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-4">Sem horários para este dia</p>
                ) : (
                  <div className="space-y-4">
                    {[
                      { label:"🌅 Manhã", group: slots.filter(s => +s.time.split(":")[0] < 12)  },
                      { label:"☀️ Tarde", group: slots.filter(s => +s.time.split(":")[0] >= 12) },
                    ].filter(p => p.group.length > 0).map(period => (
                      <div key={period.label}>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">
                          {period.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {period.group.map(slot => (
                            <button key={slot.time} onClick={() => toggleSlot(slot.time)}
                              disabled={slot.occupied}
                              className={cn(
                                "h-9 px-3.5 rounded-xl text-xs font-black transition-all active:scale-90",
                                slot.occupied
                                  ? "bg-slate-50 text-slate-200 cursor-not-allowed"
                                  : slot.selected
                                  ? "bg-[#7C5CBF] text-white shadow-md shadow-[#7C5CBF]/25"
                                  : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                              )}>
                              {slot.occupied ? `${slot.time} ✓` : slot.time}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Template */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">Visual</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {TEMPLATES.map(t => (
                    <button key={t.id} onClick={() => setTemplate(t.id)}
                      className={cn(
                        "rounded-2xl p-3 text-left border-2 transition-all active:scale-95",
                        template === t.id
                          ? "border-[#7C5CBF]"
                          : "border-slate-100 hover:border-[#DDD5F5]"
                      )}>
                      {/* Preview mini */}
                      <div className="h-10 rounded-xl mb-2.5 flex items-center justify-center relative overflow-hidden"
                        style={{ background: t.preview, border: t.id === "minimal" ? "1px solid #E2E8F0" : "none" }}>
                        {template === t.id && (
                          <div className="absolute inset-0 rounded-xl border-2 border-[#7C5CBF]" />
                        )}
                        <t.icon size={16}
                          className={t.id === "minimal" ? "text-[#7C5CBF]" : "text-white/70"} />
                        {template === t.id && (
                          <div className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-[#7C5CBF] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                      <p className={cn("text-xs font-black leading-none",
                        template === t.id ? "text-[#7C5CBF]" : "text-slate-700")}>
                        {t.name}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3">Mensagem</p>
                <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={2}
                  className="w-full text-sm text-slate-700 bg-slate-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#9D7FD4]/30 resize-none font-medium border-0" />
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  {CAPTIONS.map(c => (
                    <button key={c} onClick={() => setCaption(c)}
                      className={cn(
                        "text-[9px] font-bold px-2.5 py-1 rounded-full transition-all",
                        caption === c
                          ? "bg-[#7C5CBF] text-white"
                          : "bg-[#EDE5FF] text-[#7C5CBF] hover:bg-[#DDD5F5]"
                      )}>
                      {c.length > 25 ? c.slice(0,25)+"…" : c}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale:0.97 }}
                onClick={handleGenerate}
                disabled={generating || loading || freeSelected === 0}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-sm transition-all disabled:opacity-40 shadow-xl shadow-[#7C5CBF]/20"
                style={{ background:"linear-gradient(135deg,#5A3F9A,#9D7FD4)" }}
              >
                {generating ? (
                  <>
                    <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }}>
                      <Wand2 size={18} />
                    </motion.div>
                    Gerando imagem...
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    Gerar Vitrine {freeSelected > 0 ? `(${freeSelected} horários)` : ""}
                  </>
                )}
              </motion.button>

            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 2 — PREVIEW
          ══════════════════════════════════════════════════════════════ */}
          {step === "preview" && imgUrl && (
            <motion.div key="preview"
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
              className="space-y-4">

              {/* Preview */}
              <div className="rounded-2xl overflow-hidden bg-slate-900 p-4 flex justify-center">
                <img src={imgUrl} alt="Vitrine" className="rounded-xl max-w-full shadow-2xl"
                  style={{ maxHeight: 520 }} />
              </div>

              {/* Ações principais */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button whileTap={{ scale:0.97 }} onClick={handleShare}
                  className="h-14 rounded-2xl flex items-center justify-center gap-2.5 text-white font-black text-sm shadow-lg"
                  style={{ background:"linear-gradient(135deg,#1E1A2E,#5A3F9A)" }}>
                  <Share2 size={17} /> Compartilhar
                </motion.button>
                <motion.button whileTap={{ scale:0.97 }} onClick={handleCopyText}
                  className="h-14 rounded-2xl flex items-center justify-center gap-2.5 font-black text-sm bg-white border-2 border-[#EDE5FF] text-[#7C5CBF] hover:bg-[#FAF8FF] transition-colors">
                  <Copy size={17} /> Copiar texto
                </motion.button>
              </div>

              {/* Download */}
              <a href={imgUrl} download="nailit-horarios.png"
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-bold text-slate-500">
                <Download size={14} /> Baixar imagem
              </a>

              {/* Dica */}
              <div className="flex items-start gap-3 bg-[#EDE5FF] rounded-2xl p-4">
                <span className="text-xl shrink-0">💡</span>
                <p className="text-xs font-bold text-[#5A3F9A] leading-relaxed">
                  Toque em <strong>Compartilhar</strong> para enviar direto ao WhatsApp Status ou Instagram Stories. Funciona no celular!
                </p>
              </div>

              {/* Gerar novo */}
              <button onClick={() => { setStep("config"); setImgUrl(null); }}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-bold text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw size={13} /> Gerar outra versão
              </button>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </PageShell>
  );
}
