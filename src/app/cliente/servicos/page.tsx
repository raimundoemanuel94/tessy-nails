"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowLeft, Clock, ChevronRight, Sparkles, X } from "lucide-react";
import { globalStore } from "@/store/globalStore";
import { AppointmentStorage } from "@/lib/appointmentStorage";
import { ErrorState } from "@/components/shared/ErrorState";
import { ServicosSkeleton } from "@/components/cliente/ClienteSkeletons";

interface Service {
  id: string; name: string; description: string;
  price: string; duration: string;
}

const CATS = ["Todos","Manicure","Pedicure","Gel","Combo","Especial"];

export default function ServicosPage() {
  const router = useRouter();
  const [all, setAll]           = useState<Service[]>([]);
  const [shown, setShown]       = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [query, setQuery]       = useState("");
  const [cat, setCat]           = useState("Todos");

  useEffect(() => {
    globalStore.fetchServices(false)
      .then(data => {
        const v = data.filter(s => s.id && s.name && s.price && s.durationMinutes)
          .map(s => ({
            id: s.id, name: s.name,
            description: s.description || "",
            price: `R$ ${s.price.toFixed(2)}`,
            duration: `${s.durationMinutes}min`,
          }));
        setAll(v); setShown(v);
      })
      .catch(() => setError("Não foi possível carregar os serviços."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let r = all;
    if (query.trim()) r = r.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.description.toLowerCase().includes(query.toLowerCase())
    );
    if (cat !== "Todos") {
      r = r.filter(s => {
        const n = s.name.toLowerCase();
        if (cat === "Manicure") return n.includes("manicure") || n.includes("esmalt");
        if (cat === "Pedicure") return n.includes("pedicure");
        if (cat === "Gel")      return n.includes("gel") || n.includes("fibra") || n.includes("acrílic");
        if (cat === "Combo")    return n.includes("combo") || n.includes("casadinha");
        if (cat === "Especial") return n.includes("especial") || n.includes("premium") || n.includes("spa");
        return true;
      });
    }
    setShown(r);
  }, [query, cat, all]);

  const pick = (s: Service) => {
    AppointmentStorage.saveSelectedService(s);
    AppointmentStorage.clearAppointmentData();
    AppointmentStorage.clearSelectedDate();
    router.push("/cliente/agendar");
  };

  if (loading) return <ServicosSkeleton />;
  if (error)   return (
    <div className="min-h-screen bg-[#FAF8FF] flex items-center justify-center p-5">
      <ErrorState title="Erro" message={error} onRetry={() => window.location.reload()} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8FF]">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-20" style={{ background: "linear-gradient(160deg, #0F0C1E 0%, #1E1A2E 50%, #2A1A4E 100%)", paddingTop: "env(safe-area-inset-top)" }}>
        <div className="px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 max-w-lg mx-auto">

          {/* Título */}
          <div className="flex items-center gap-3 mb-4">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()}
              className="h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
              <ArrowLeft size={15} className="text-white/80" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-base font-black text-white leading-none">Serviços</h1>
              <p className="text-[10px] text-white/40 mt-0.5">{all.length} disponíveis</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar serviço..."
              className="w-full h-9 bg-white/10 border border-white/10 rounded-xl pl-8 pr-8 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#9D7FD4]/50 transition-colors" />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={12} className="text-white/40" />
              </button>
            )}
          </div>

          {/* Categorias */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`shrink-0 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                  cat === c
                    ? "bg-[#9D7FD4] text-white"
                    : "bg-white/10 text-white/50 hover:bg-white/15"
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── LISTA ──────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] max-w-lg mx-auto space-y-2.5">
        <AnimatePresence mode="popLayout">
          {shown.length === 0 ? (
            <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="text-center py-16">
              <div className="h-14 w-14 rounded-2xl bg-[#EDE5FF] flex items-center justify-center mx-auto mb-4">
                <Sparkles size={22} className="text-[#9D7FD4]" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-bold text-[#2A2440] mb-1">Nenhum serviço encontrado</p>
              <p className="text-xs text-[#9B8FC0]">Tente outra busca ou categoria</p>
            </motion.div>
          ) : shown.map((s, i) => (
            <motion.div key={s.id} layout
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, scale:0.96 }}
              transition={{ delay: i * 0.035, type:"spring", stiffness:320, damping:28 }}>
              <button onClick={() => pick(s)} className="w-full text-left group">
                <div className="bg-white rounded-2xl border border-[#EDE5FF] shadow-sm group-hover:border-[#9D7FD4]/40 group-hover:shadow-md transition-all overflow-hidden">
                  <div className="p-4 flex items-center gap-3.5">
                    {/* Ícone */}
                    <div className="h-11 w-11 rounded-xl bg-[#EDE5FF] flex items-center justify-center shrink-0 group-hover:bg-[#9D7FD4] transition-colors duration-250">
                      <Sparkles size={17} className="text-[#7C5CBF] group-hover:text-white transition-colors duration-250" strokeWidth={1.5} />
                    </div>
                    {/* Textos */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-[#1E1A2E] leading-tight truncate">{s.name}</p>
                      {s.description && (
                        <p className="text-[10px] text-[#9B8FC0] mt-0.5 line-clamp-1">{s.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Clock size={9} className="text-[#DDD5F5]" />
                        <span className="text-[9px] font-bold text-[#9B8FC0]">{s.duration}</span>
                      </div>
                    </div>
                    {/* Preço */}
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-black text-[#7C5CBF]">{s.price}</p>
                      <div className="mt-1 h-6 w-6 rounded-lg bg-[#EDE5FF] group-hover:bg-[#9D7FD4] flex items-center justify-center ml-auto transition-colors duration-250">
                        <ChevronRight size={12} className="text-[#7C5CBF] group-hover:text-white transition-colors duration-250" />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
