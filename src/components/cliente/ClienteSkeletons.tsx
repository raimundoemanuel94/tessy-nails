"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const PL = "animate-pulse rounded-full bg-[#EDE5FF]";
const PB = "animate-pulse rounded-2xl bg-[#EDE5FF]";
const PW = "animate-pulse rounded-2xl bg-white/15";

// Timeout de segurança — se skeleton durar > 10s no iOS, mostra erro com retry
function useSkeletonTimeout(ms = 10000) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return timedOut;
}

function TimeoutFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-8 text-center"
      style={{ background: "#FAF8FF", paddingTop: "env(safe-area-inset-top)" }}>
      <div className="h-16 w-16 rounded-3xl flex items-center justify-center text-3xl"
        style={{ background: "linear-gradient(135deg,#1E1A2E,#5A3F9A)" }}>
        💜
      </div>
      <div>
        <p className="text-[15px] font-black text-[#1E1A2E] mb-1">Carregamento lento</p>
        <p className="text-[11px] text-[#9B8FC0] leading-relaxed">
          Verifique sua conexão e tente novamente.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="h-11 px-6 rounded-2xl text-white text-xs font-black uppercase tracking-[0.15em]"
        style={{ background: "linear-gradient(135deg,#1E1A2E,#7C5CBF)" }}>
        Tentar novamente
      </button>
      <p className="text-[9px] text-[#C4B0E8] font-black uppercase tracking-[0.3em]"
        style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>nailit</p>
    </div>
  );
}

export function ClienteHomeSkeleton() {
  const timedOut = useSkeletonTimeout(10000);
  if (timedOut) return <TimeoutFallback />;

  return (
    <div className="min-h-screen" style={{ background: "#FAF8FF" }}>
      {/* Hero escuro */}
      <div style={{ background: "linear-gradient(160deg,#0F0C1E,#1E1A2E,#2A1A4E)", paddingTop:"env(safe-area-inset-top)" }}>
        <div className="px-5 pt-5 pb-0 max-w-lg mx-auto">
          {/* Header row */}
          <div className="flex justify-between items-start mb-5">
            <div className="space-y-2">
              <div className={`h-2 w-12 ${PW} rounded-full opacity-40`} />
              <div className={`h-6 w-36 ${PW} opacity-50`} />
              <div className={`h-1.5 w-24 ${PW} rounded-full opacity-20`} />
            </div>
            <div className="flex gap-2">
              <div className={`h-10 w-10 rounded-2xl ${PW} opacity-40`} />
              <div className={`h-10 w-10 rounded-2xl ${PW} opacity-40`} />
            </div>
          </div>
          {/* Card próximo agendamento */}
          <div className={`h-24 w-full ${PW} rounded-2xl opacity-30 mb-5`} />
          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-2 pb-6">
            {[0,1,2,3].map(i => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`h-12 w-12 rounded-2xl ${PW} opacity-30`} />
                <div className={`h-1.5 w-8 ${PW} rounded-full opacity-20`} />
              </div>
            ))}
          </div>
        </div>
        {/* Curva */}
        <div className="relative h-5 -mb-px" style={{ background:"linear-gradient(160deg,#0F0C1E,#2A1A4E)" }}>
          <div className="absolute bottom-0 inset-x-0 h-5 bg-[#FAF8FF] rounded-t-[28px]" />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-4 space-y-4 max-w-lg mx-auto">
        {/* Label */}
        <div className={`h-2 w-16 ${PL}`} />
        {/* Grid 2x2 serviços */}
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => (
            <motion.div key={i}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.06 }}
              className={`h-28 w-full ${PB}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AgendamentosSkeleton() {
  const timedOut = useSkeletonTimeout(10000);
  if (timedOut) return <TimeoutFallback />;

  return (
    <div className="min-h-screen" style={{ background:"#FAF8FF" }}>
      <div style={{ background:"linear-gradient(160deg,#0F0C1E,#1E1A2E,#2A1A4E)", paddingTop:"env(safe-area-inset-top)" }}>
        <div className="px-5 pt-4 pb-0 max-w-lg mx-auto space-y-3">
          <div className="flex justify-between items-center">
            <div className="space-y-1.5">
              <div className={`h-5 w-36 ${PW} opacity-50`} />
              <div className={`h-2 w-20 ${PW} rounded-full opacity-25`} />
            </div>
            <div className={`h-9 w-9 rounded-2xl ${PW} opacity-40`} />
          </div>
          <div className={`h-11 w-full ${PW} rounded-2xl opacity-30 mb-4`} />
        </div>
        <div className="relative h-5 -mb-px" style={{ background:"linear-gradient(160deg,#0F0C1E,#2A1A4E)" }}>
          <div className="absolute bottom-0 inset-x-0 h-5 bg-[#FAF8FF] rounded-t-[28px]" />
        </div>
      </div>
      <div className="px-5 pt-4 max-w-lg mx-auto space-y-3">
        {[0,1,2].map(i => (
          <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}>
            <div className={`h-36 w-full ${PB}`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function ServicosSkeleton() {
  const timedOut = useSkeletonTimeout(10000);
  if (timedOut) return <TimeoutFallback />;

  return (
    <div className="min-h-screen" style={{ background:"#FAF8FF" }}>
      <div style={{ background:"linear-gradient(160deg,#0F0C1E,#1E1A2E,#2A1A4E)", paddingTop:"env(safe-area-inset-top)" }}>
        <div className="px-5 pt-4 pb-0 max-w-lg mx-auto space-y-3">
          <div className={`h-5 w-28 ${PW} opacity-50`} />
          <div className={`h-10 w-full ${PW} rounded-2xl opacity-30 mb-4`} />
        </div>
        <div className="relative h-5 -mb-px" style={{ background:"linear-gradient(160deg,#0F0C1E,#2A1A4E)" }}>
          <div className="absolute bottom-0 inset-x-0 h-5 bg-[#FAF8FF] rounded-t-[28px]" />
        </div>
      </div>
      <div className="px-5 pt-4 max-w-lg mx-auto space-y-2.5">
        {[0,1,2,3,4].map(i => (
          <motion.div key={i} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
            <div className={`h-16 w-full ${PB}`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
