"use client";

import { useStudio } from "@/contexts/StudioContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function TrialBanner() {
  const { isInTrial, trialDaysLeft } = useStudio();
  const router = useRouter();

  if (!isInTrial) return null;
  const urgent = trialDaysLeft <= 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mb-4 rounded-2xl overflow-hidden"
        style={{
          background: urgent ? "linear-gradient(135deg,#2D1010,#4A1818)" : "linear-gradient(135deg,#1E1A2E,#2A1A4E)",
          border: urgent ? "1px solid rgba(248,113,113,0.3)" : "1px solid rgba(157,127,212,0.3)",
        }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: urgent ? "rgba(248,113,113,0.15)" : "rgba(157,127,212,0.15)" }}>
            {urgent ? <Clock size={14} className="text-red-400" /> : <Sparkles size={14} className="text-[#9D7FD4]" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black text-white">
              {trialDaysLeft === 0 ? "Trial expira hoje! 🔥" : `${trialDaysLeft} dia${trialDaysLeft > 1 ? "s" : ""} de trial`}
            </p>
            <p className="text-[9px] mt-0.5" style={{ color: urgent ? "rgba(248,113,113,0.6)" : "rgba(157,127,212,0.6)" }}>
              Plano Pro liberado • Assine para não perder acesso
            </p>
          </div>
          <button onClick={() => router.push("/configuracoes?tab=plano")}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-[9px] font-black text-white uppercase tracking-widest"
            style={{ background: urgent ? "#EF4444" : "linear-gradient(135deg,#7C5CBF,#9D7FD4)" }}>
            Assinar <ArrowRight size={10} />
          </button>
        </div>
        <div className="h-0.5" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full" style={{
            width: `${((3 - trialDaysLeft) / 3) * 100}%`,
            background: urgent ? "#EF4444" : "linear-gradient(90deg,#7C5CBF,#9D7FD4)",
          }} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
