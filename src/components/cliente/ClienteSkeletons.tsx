"use client";
import { motion } from "framer-motion";

const PL = "animate-pulse rounded-full bg-[#EDE5FF]";
const PB = "animate-pulse rounded-2xl bg-[#EDE5FF]";

export function ClienteHomeSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF8FF]">
      <div className="h-52" style={{ background:"linear-gradient(145deg,#1E1A2E,#2A2044)" }}>
        <div className="px-5 pt-16 pb-6 max-w-lg mx-auto space-y-5">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className={`h-2.5 w-16 bg-white/20 ${PL}`} />
              <div className={`h-6 w-32 bg-white/30 ${PL}`} />
            </div>
            <div className={`h-10 w-10 ${PB} bg-white/15 rounded-2xl`} />
          </div>
          <div className={`h-14 w-full ${PB} bg-white/15`} />
        </div>
      </div>
      <div className="px-5 pt-5 space-y-5 max-w-lg mx-auto">
        <div className={`h-28 w-full ${PB}`} />
        <div className="grid grid-cols-4 gap-2">
          {[0,1,2,3].map(i => (
            <motion.div key={i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.07 }}
              className="flex flex-col items-center gap-2">
              <div className={`h-14 w-14 ${PB}`} />
              <div className={`h-2 w-10 ${PL}`} />
            </motion.div>
          ))}
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[0,1,2].map(i => <div key={i} className={`shrink-0 w-[136px] h-36 ${PB}`} />)}
        </div>
      </div>
    </div>
  );
}

export function AgendamentosSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF8FF]">
      <div className="h-36" style={{ background:"linear-gradient(145deg,#1E1A2E,#2A2044)" }}>
        <div className="px-5 pt-14 pb-4 max-w-lg mx-auto space-y-4">
          <div className={`h-5 w-40 bg-white/30 ${PL}`} />
          <div className={`h-12 w-full ${PB} bg-white/15`} />
        </div>
      </div>
      <div className="px-5 pt-4 max-w-lg mx-auto space-y-3">
        {[0,1].map(i => (
          <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.1 }}>
            <div className={`h-44 w-full ${PB}`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function ServicosSkeleton() {
  return (
    <div className="min-h-screen bg-[#FAF8FF]">
      <div className="h-40" style={{ background:"linear-gradient(145deg,#1E1A2E,#2A2044)" }}>
        <div className="px-5 pt-14 pb-4 max-w-lg mx-auto space-y-3">
          <div className={`h-5 w-32 bg-white/30 ${PL}`} />
          <div className={`h-9 w-full ${PB} bg-white/15`} />
        </div>
      </div>
      <div className="px-5 pt-4 max-w-lg mx-auto space-y-2.5">
        {[0,1,2,3].map(i => (
          <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}>
            <div className={`h-16 w-full ${PB}`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
