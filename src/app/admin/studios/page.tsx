"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getDocs, collection, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, CheckCircle2, XCircle, Clock, Search, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Studio = {
  id: string; name: string; plan: string;
  isActive: boolean; ownerId: string;
  createdAt: Date; trialEndsAt: Date | null; slug?: string;
};

const PLAN_COLORS: Record<string,string> = {
  free:"#5A5280", starter:"#9D7FD4", pro:"#7C5CBF", studio:"#F59E0B",
};
const PLAN_PRICES: Record<string,number> = { free:0, starter:19, pro:29, studio:59 };

export default function AdminStudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [filtered, setFiltered] = useState<Studio[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState<"all"|"active"|"trial"|"inactive">("all");

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db!, "studios"));
      const list: Studio[] = snap.docs.map(d => ({
        id: d.id,
        name:     String(d.data().name || ""),
        plan:     String(d.data().plan || "free"),
        isActive: d.data().isActive !== false,
        ownerId:  String(d.data().ownerId || ""),
        slug:     d.data().slug ? String(d.data().slug) : undefined,
        createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toDate() : new Date(),
        trialEndsAt: d.data().trialEndsAt instanceof Timestamp ? d.data().trialEndsAt.toDate() : null,
      }));
      setStudios(list.sort((a,b) => b.createdAt.getTime()-a.createdAt.getTime()));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    let list = studios;
    const now = new Date();
    if (filter === "active")   list = list.filter(s => s.isActive && !(s.trialEndsAt && s.trialEndsAt > now));
    if (filter === "trial")    list = list.filter(s => s.trialEndsAt && s.trialEndsAt > now);
    if (filter === "inactive") list = list.filter(s => !s.isActive);
    if (search) list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(list);
  }, [studios, filter, search]);

  const toggleActive = async (studio: Studio) => {
    try {
      await updateDoc(doc(db!, "studios", studio.id), { isActive: !studio.isActive });
      setStudios(prev => prev.map(s => s.id === studio.id ? { ...s, isActive: !s.isActive } : s));
      toast.success(studio.isActive ? "Studio desativado" : "Studio ativado");
    } catch { toast.error("Erro ao atualizar"); }
  };

  const changePlan = async (studio: Studio, plan: string) => {
    try {
      await updateDoc(doc(db!, "studios", studio.id), { plan });
      setStudios(prev => prev.map(s => s.id === studio.id ? { ...s, plan } : s));
      toast.success(`Plano alterado para ${plan}`);
    } catch { toast.error("Erro ao alterar plano"); }
  };

  const now = new Date();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-white"
            style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>Studios 🏢</h1>
          <p className="text-[11px] text-white/25 mt-0.5">{studios.length} cadastrados</p>
        </div>
      </div>

      {/* Filtros + busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full h-10 pl-9 pr-4 rounded-xl text-[12px] text-white placeholder-white/20 outline-none"
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}
          />
        </div>
        <div className="flex gap-1.5">
          {(["all","active","trial","inactive"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
              style={filter === f
                ? { background:"rgba(157,127,212,0.2)", color:"#C4A8E8", border:"1px solid rgba(157,127,212,0.3)" }
                : { background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.3)", border:"1px solid rgba(255,255,255,0.06)" }
              }>
              {f === "all" ? "Todos" : f === "active" ? "Ativos" : f === "trial" ? "Trial" : "Inativos"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <motion.div key={i} className="w-2 h-2 rounded-full bg-[#9D7FD4]"
                animate={{ y:[0,-8,0] }} transition={{ duration:0.6, delay:i*0.12, repeat:Infinity }} />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-white/20 text-[12px]">
          Nenhum studio encontrado.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s, i) => {
            const inTrial = s.trialEndsAt && s.trialEndsAt > now;
            const trialDays = inTrial
              ? Math.ceil((s.trialEndsAt!.getTime() - now.getTime()) / 86400000)
              : 0;

            return (
              <motion.div key={s.id}
                initial={{ opacity:0, y:6 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.03 }}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>

                {/* Avatar */}
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-[13px] font-black text-white shrink-0"
                  style={{ background:`${PLAN_COLORS[s.plan]}25`, border:`1px solid ${PLAN_COLORS[s.plan]}35` }}>
                  {s.name?.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold text-white truncate">{s.name}</p>
                    {inTrial && (
                      <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full flex items-center gap-1"
                        style={{ background:"rgba(251,191,36,0.15)", color:"#FBBF24" }}>
                        <Clock size={7} /> {trialDays}d
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-white/20 mt-0.5">
                    Desde {format(s.createdAt, "dd/MM/yyyy")}
                    {s.slug && ` · /${s.slug}`}
                  </p>
                </div>

                {/* Plano selector */}
                <select
                  value={s.plan}
                  onChange={e => changePlan(s, e.target.value)}
                  className="h-8 px-2 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer outline-none"
                  style={{
                    background:`${PLAN_COLORS[s.plan]}20`,
                    color: PLAN_COLORS[s.plan],
                    border:`1px solid ${PLAN_COLORS[s.plan]}30`,
                  }}>
                  {["free","starter","pro","studio"].map(p => (
                    <option key={p} value={p} style={{ background:"#1A1A2E", color:"white" }}>
                      {p} {PLAN_PRICES[p] > 0 ? `R$${PLAN_PRICES[p]}` : ""}
                    </option>
                  ))}
                </select>

                {/* Toggle ativo */}
                <button onClick={() => toggleActive(s)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: s.isActive ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
                    border: s.isActive ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(248,113,113,0.2)",
                  }}>
                  {s.isActive
                    ? <CheckCircle2 size={14} className="text-emerald-400" />
                    : <XCircle size={14} className="text-red-400" />
                  }
                </button>

                {/* Ver detalhes */}
                <Link href={`/admin/studios/${s.id}`}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/8 transition-all">
                  <ChevronRight size={14} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
