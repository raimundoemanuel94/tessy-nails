"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, DollarSign, Sparkles, ChevronRight } from "lucide-react";
import { salonService } from "@/services/salon";
import { AppointmentStorage } from "@/lib/appointmentStorage";
import { Service } from "@/types";

function svcEmoji(name: string) {
  const n = name.toLowerCase();
  if (n.includes("ped"))       return "🦶";
  if (n.includes("gel") || n.includes("fibra") || n.includes("acr")) return "💎";
  if (n.includes("spa"))       return "🛁";
  if (n.includes("combo") || n.includes("casad")) return "✨";
  if (n.includes("especial") || n.includes("prem")) return "👑";
  return "💅";
}

export default function ServicoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [svc, setSvc]       = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);

  useEffect(() => {
    if (!id) return;
    salonService.getById(id)
      .then(s => { if (s) setSvc(s); else setError(true); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: "#FAF8FF" }}>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <motion.div key={i} className="w-2 h-2 rounded-full bg-[#9D7FD4]"
            animate={{ y: [0,-8,0] }}
            transition={{ duration: 0.6, delay: i*0.12, repeat: Infinity }} />
        ))}
      </div>
    </div>
  );

  if (error || !svc) return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-8 text-center" style={{ background: "#FAF8FF" }}>
      <span className="text-4xl">😕</span>
      <p className="text-sm font-bold text-[#9B8FC0]">Serviço não encontrado</p>
      <button onClick={() => router.push("/cliente/servicos")}
        className="px-5 h-10 rounded-2xl bg-[#EDE5FF] text-[#7C5CBF] text-xs font-black">
        Ver serviços
      </button>
    </div>
  );

  const handleAgendar = () => {
    AppointmentStorage.saveSelectedService({
      id: svc.id, name: svc.name,
      description: svc.description,
      price: `R$ ${svc.price.toFixed(2)}`,
      duration: `${svc.durationMinutes}min`,
    });
    AppointmentStorage.clearAppointmentData();
    AppointmentStorage.clearSelectedDate();
    router.push("/cliente/agendar");
  };

  return (
    <div className="min-h-dvh" style={{ background: "#FAF8FF" }}>

      {/* Hero */}
      <div className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0F0C1E 0%, #1E1A2E 50%, #2A1A4E 100%)",
          paddingTop: "env(safe-area-inset-top)",
        }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #9D7FD4, transparent)" }} />
        </div>
        <div className="relative z-10 px-5 pt-4 pb-0 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => router.push("/cliente/servicos")}
              className="h-9 w-9 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center active:scale-90 transition-all">
              <ArrowLeft size={16} className="text-white/70" />
            </button>
            <h1 className="text-sm font-black text-white">Detalhes do serviço</h1>
          </div>

          <div className="flex items-start gap-4 pb-6">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ background: "rgba(157,127,212,0.2)", border: "1px solid rgba(157,127,212,0.3)" }}>
              {svcEmoji(svc.name)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[18px] font-black text-white leading-tight">{svc.name}</h2>
              <p className="text-[11px] text-white/40 mt-1">{svc.description || "Serviço especializado"}</p>
            </div>
          </div>
        </div>
        <div className="relative h-5 -mb-px"
          style={{ background: "linear-gradient(160deg, #0F0C1E, #2A1A4E)" }}>
          <div className="absolute bottom-0 inset-x-0 h-5 bg-[#FAF8FF] rounded-t-[28px]" />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-5 pb-[calc(8rem+env(safe-area-inset-bottom))] max-w-lg mx-auto space-y-4">

        {/* Info chips */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-[#EDE5FF] p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#EDE5FF] flex items-center justify-center shrink-0">
              <DollarSign size={15} className="text-[#7C5CBF]" />
            </div>
            <div>
              <p className="text-[8px] font-bold text-[#9B8FC0] uppercase tracking-widest">Valor</p>
              <p className="text-[15px] font-black text-[#7C5CBF]">R$ {svc.price.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[#EDE5FF] p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#EDE5FF] flex items-center justify-center shrink-0">
              <Clock size={15} className="text-[#7C5CBF]" />
            </div>
            <div>
              <p className="text-[8px] font-bold text-[#9B8FC0] uppercase tracking-widest">Duração</p>
              <p className="text-[15px] font-black text-[#1E1A2E]">{svc.durationMinutes}min</p>
            </div>
          </div>
        </div>

        {/* Descrição */}
        {svc.description && (
          <div className="bg-white rounded-2xl border border-[#EDE5FF] p-5">
            <p className="text-[8px] font-black text-[#9B8FC0] uppercase tracking-[0.25em] mb-2">Descrição</p>
            <p className="text-[13px] text-[#6B6480] leading-relaxed">{svc.description}</p>
          </div>
        )}

        {/* Card resumo */}
        <div className="bg-white rounded-2xl border border-[#EDE5FF] p-5"
          style={{ boxShadow: "0 4px 16px rgba(157,127,212,0.08)" }}>
          <p className="text-[8px] font-black text-[#9B8FC0] uppercase tracking-[0.25em] mb-3">Resumo</p>
          <div className="space-y-2.5">
            {[
              { label: "Serviço", value: svc.name },
              { label: "Preço", value: `R$ ${svc.price.toFixed(2)}` },
              { label: "Duração", value: `${svc.durationMinutes} minutos` },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-[#9B8FC0]">{row.label}</span>
                <span className="text-[12px] font-black text-[#1E1A2E]">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA fixo */}
      <div className="fixed bottom-0 inset-x-0 px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] pt-4"
        style={{ background: "linear-gradient(to top, #FAF8FF 60%, transparent)" }}>
        <div className="max-w-lg mx-auto">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleAgendar}
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 text-white font-black text-sm shadow-2xl"
            style={{ background: "linear-gradient(135deg, #1E1A2E 0%, #5A3F9A 55%, #9D7FD4 100%)" }}>
            <Sparkles size={17} />
            Agendar este serviço
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
