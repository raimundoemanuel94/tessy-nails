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
  price: string; duration: string; isActive: boolean;
}

const CATEGORIES = ["Todos", "Manicure", "Pedicure", "Gel", "Combo", "Especial"];

export default function ServicosPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [filtered, setFiltered] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await globalStore.fetchServices(false);
        const valid = data.filter(s => s.id && s.name && s.price && s.durationMinutes)
          .map(s => ({
            id: s.id, name: s.name,
            description: s.description || "",
            price: `R$ ${s.price.toFixed(2)}`,
            duration: `${s.durationMinutes}min`,
            isActive: s.isActive !== false,
          }));
        setServices(valid);
        setFiltered(valid);
      } catch { setError("Não foi possível carregar os serviços."); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    let result = services;
    if (query.trim()) result = result.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.description.toLowerCase().includes(query.toLowerCase())
    );
    if (activeCategory !== "Todos") {
      result = result.filter(s => {
        const n = s.name.toLowerCase();
        if (activeCategory === "Manicure") return n.includes("manicure") || n.includes("esmalt");
        if (activeCategory === "Pedicure") return n.includes("pedicure") || n.includes("pé");
        if (activeCategory === "Gel") return n.includes("gel") || n.includes("fibra") || n.includes("acrílico");
        if (activeCategory === "Combo") return n.includes("combo") || n.includes("casadinha");
        if (activeCategory === "Especial") return n.includes("especial") || n.includes("premium") || n.includes("spa");
        return true;
      });
    }
    setFiltered(result);
  }, [query, activeCategory, services]);

  const handleSelect = (service: Service) => {
    AppointmentStorage.saveSelectedService(service);
    AppointmentStorage.clearAppointmentData();
    AppointmentStorage.clearSelectedDate();
    router.push("/cliente/agendar");
  };

  if (loading) return <ServicosSkeleton />;

  if (error) return (
    <div className="min-h-screen bg-[#F5F0EA] flex items-center justify-center p-5">
      <ErrorState title="Erro" message={error} onRetry={() => window.location.reload()} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F0EA]">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#2C1810]">
        <div className="relative overflow-hidden px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-5 max-w-lg mx-auto">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-amber-400/8 blur-2xl translate-x-10 -translate-y-10" />
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => router.back()}
              className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-90 transition-all">
              <ArrowLeft size={16} className="text-white/80" />
            </button>
            <div>
              <h1 className="text-lg font-black text-white leading-none">Nossos Serviços</h1>
              <p className="text-[10px] text-white/40 mt-0.5">{services.length} serviços disponíveis</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar serviço..."
              className="w-full h-10 bg-white/10 border border-white/10 rounded-2xl pl-9 pr-9 text-xs text-white placeholder:text-white/30 outline-none focus:border-amber-400/40 transition-colors"
            />
            {query && (
              <button onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={13} className="text-white/40" />
              </button>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-5 pb-4 max-w-lg mx-auto">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeCategory === cat
                  ? "bg-amber-500 text-white shadow-md"
                  : "bg-white/10 text-white/50 hover:bg-white/15"
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-5 pt-4 pb-32 max-w-lg mx-auto space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-16">
              <Sparkles size={32} className="text-stone-300 mx-auto mb-3" strokeWidth={1} />
              <p className="text-sm font-bold text-stone-500">Nenhum serviço encontrado</p>
              <p className="text-xs text-stone-400 mt-1">Tente outra busca</p>
            </motion.div>
          ) : filtered.map((service, i) => (
            <motion.button
              key={service.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 30 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(service)}
              className="w-full text-left"
            >
              <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                <div className="h-0.5 bg-gradient-to-r from-[#2C1810]/0 via-[#2C1810]/40 to-[#2C1810]/0 group-hover:via-amber-500 transition-all duration-500" />
                <div className="p-4 flex items-center gap-4">
                  {/* Icon */}
                  <div className="h-12 w-12 rounded-xl bg-[#F5F0EA] flex items-center justify-center shrink-0 group-hover:bg-[#2C1810] transition-colors duration-300">
                    <Sparkles size={18} className="text-[#2C1810]/30 group-hover:text-amber-400 transition-colors duration-300" strokeWidth={1.5} />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-stone-800 leading-tight truncate">{service.name}</p>
                    {service.description && (
                      <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">{service.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <Clock size={9} className="text-stone-300" />
                      <span className="text-[9px] font-bold text-stone-400">{service.duration}</span>
                    </div>
                  </div>
                  {/* Price + arrow */}
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <p className="text-sm font-black text-[#2C1810]">{service.price}</p>
                    <div className="h-7 w-7 rounded-xl bg-[#F5F0EA] group-hover:bg-[#2C1810] flex items-center justify-center transition-colors duration-300">
                      <ChevronRight size={13} className="text-stone-400 group-hover:text-amber-400 transition-colors duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
