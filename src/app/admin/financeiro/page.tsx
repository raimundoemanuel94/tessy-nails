"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getDocs, collection, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

const PLAN_PRICES: Record<string,number> = { free:0, starter:19, pro:29, studio:59 };
const PLAN_COLORS: Record<string,string>  = { free:"#5A5280", starter:"#9D7FD4", pro:"#7C5CBF", studio:"#F59E0B" };

export default function AdminFinanceiroPage() {
  const [data, setData] = useState<{ mrr:number; arr:number; byPlan:Record<string,{count:number;mrr:number}> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db!, "studios")).then(snap => {
      const studios = snap.docs.map(d => ({
        plan: String(d.data().plan || "free"),
        isActive: d.data().isActive !== false,
        trialEndsAt: d.data().trialEndsAt instanceof Timestamp ? d.data().trialEndsAt.toDate() : null,
      }));

      const active = studios.filter(s => s.isActive);
      const byPlan: Record<string,{count:number;mrr:number}> = {};
      let mrr = 0;

      active.forEach(s => {
        const p = PLAN_PRICES[s.plan] ?? 0;
        mrr += p;
        if (!byPlan[s.plan]) byPlan[s.plan] = { count:0, mrr:0 };
        byPlan[s.plan].count++;
        byPlan[s.plan].mrr += p;
      });

      setData({ mrr, arr: mrr * 12, byPlan });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <motion.div key={i} className="w-2 h-2 rounded-full bg-[#9D7FD4]"
            animate={{ y:[0,-8,0] }} transition={{ duration:0.6, delay:i*0.12, repeat:Infinity }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-white"
          style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>Financeiro 💰</h1>
        <p className="text-[11px] text-white/25 mt-0.5">Receita recorrente da plataforma</p>
      </div>

      {/* MRR/ARR */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label:"MRR", value:`R$ ${data?.mrr ?? 0}`, sub:"receita mensal recorrente", color:"#4ADE80" },
          { label:"ARR (projetado)", value:`R$ ${data?.arr ?? 0}`, sub:"se mantiver base atual", color:"#9D7FD4" },
        ].map(k => (
          <div key={k.label} className="rounded-2xl p-5"
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30 mb-2">{k.label}</p>
            <p className="text-[32px] font-black leading-none" style={{ fontFamily:"Georgia,serif", color:k.color }}>
              {k.value}
            </p>
            <p className="text-[9px] text-white/20 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Por plano */}
      <div className="rounded-2xl p-5"
        style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30 mb-4">Receita por plano</h2>
        <div className="space-y-3">
          {Object.entries(data?.byPlan ?? {}).map(([plan, info]) => (
            <div key={plan} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background:PLAN_COLORS[plan] || "#555" }} />
              <span className="text-[12px] font-bold text-white capitalize w-20 shrink-0">{plan}</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: `${data?.mrr ? (info.mrr/data.mrr)*100 : 0}%`,
                  background: PLAN_COLORS[plan],
                }} />
              </div>
              <span className="text-[10px] font-black text-white/50 tabular-nums w-24 text-right shrink-0">
                {info.count}x = R${info.mrr}
              </span>
            </div>
          ))}
          {!Object.keys(data?.byPlan ?? {}).length && (
            <p className="text-[11px] text-white/20">Sem dados ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
