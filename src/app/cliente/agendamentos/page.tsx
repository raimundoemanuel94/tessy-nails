"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { isPast, isToday, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentService } from "@/services/appointments";
import { AppointmentCard, Appointment as ApptCard } from "@/components/cliente/AppointmentCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { AgendamentosSkeleton } from "@/components/cliente/ClienteSkeletons";
import { toast } from "sonner";
import { ArrowLeft, Plus, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type ApptStatus = "pending"|"confirmed"|"completed"|"cancelled"|"no_show";
interface Appt {
  id:string; service:{id:string;name:string;durationMinutes:number;price?:string;duration?:string};
  date:Date; time:{id:string;time:string}; status:ApptStatus; observation?:string; createdAt:Date;
}

const TABS = [
  { key:"upcoming", label:"Próximos"  },
  { key:"history",  label:"Histórico" },
  { key:"all",      label:"Todos"     },
] as const;

export default function AgendamentosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [appts, setAppts]   = useState<Appt[]>([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string|null>(null);
  const [tab, setTab]       = useState<"upcoming"|"history"|"all">("upcoming");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setError("Você precisa estar logado."); setLoad(false); return; }
    appointmentService.getByClientIdWithServices(user.uid)
      .then(raw => {
        if (!raw?.length) { setAppts([]); return; }
        setAppts(raw
          .filter((a): a is typeof a & {status:ApptStatus} =>
            ["pending","confirmed","completed","cancelled","no_show"].includes(a.status))
          .map(a => ({
            ...a,
            service: { ...a.service, price:`R$ ${a.service.price.toFixed(2)}`, duration:`${a.service.durationMinutes}min` },
          })));
      })
      .catch(err => setError((err as {code?:string}).code === "permission-denied"
        ? "Sem permissão para acessar agendamentos."
        : "Não foi possível carregar seus agendamentos."))
      .finally(() => setLoad(false));
  }, [user, authLoading]);

  const shown = appts.filter(a => {
    const d = new Date(a.date);
    if (tab === "upcoming") return !isPast(d) && a.status !== "cancelled";
    if (tab === "history")  return isPast(d) || ["completed","cancelled"].includes(a.status);
    return true;
  });

  const counts = {
    upcoming: appts.filter(a => !isPast(new Date(a.date)) && a.status !== "cancelled").length,
    history:  appts.filter(a => isPast(new Date(a.date)) || ["completed","cancelled"].includes(a.status)).length,
    all:      appts.length,
  };

  const cancel = (a: ApptCard) => {
    appointmentService.cancel(a.id)
      .then(() => { setAppts(p => p.map(x => x.id === a.id ? {...x, status:"cancelled"} : x)); toast.success("Cancelado."); })
      .catch(() => toast.error("Não foi possível cancelar."));
  };

  if (loading) return <AgendamentosSkeleton />;

  return (
    <div className="min-h-screen bg-[#FAF8FF]">

      {/* Header */}
      <div style={{ background: "linear-gradient(145deg, #1E1A2E 0%, #2A2044 100%)" }}>
        <div className="px-5 pt-[calc(env(safe-area-inset-top)+1rem)] max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <motion.button whileTap={{ scale:0.9 }} onClick={() => router.push("/cliente")}
              className="h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
              <ArrowLeft size={15} className="text-white/80" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-base font-black text-white leading-none">Meus Agendamentos</h1>
              <p className="text-[10px] text-white/40 mt-0.5">{counts.all} no total</p>
            </div>
            <motion.button whileTap={{ scale:0.9 }} onClick={() => router.push("/cliente/servicos")}
              className="h-9 w-9 rounded-xl bg-[#9D7FD4] flex items-center justify-center shrink-0 shadow-lg">
              <Plus size={16} className="text-white" strokeWidth={2.5} />
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/8 rounded-2xl p-1 mb-0">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-1",
                  tab === t.key ? "bg-white text-[#1E1A2E]" : "text-white/40"
                )}>
                {t.label}
                {counts[t.key] > 0 && (
                  <span className={cn(
                    "text-[8px] px-1.5 py-0.5 rounded-full font-black",
                    tab === t.key ? "bg-[#EDE5FF] text-[#7C5CBF]" : "bg-white/10 text-white/30"
                  )}>
                    {counts[t.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Wave divider */}
        <div className="h-3 rounded-t-none" />
      </div>

      {/* Content */}
      <div className="px-5 pt-4 pb-32 max-w-lg mx-auto space-y-3">
        {error && <ErrorState title="Erro" message={error} onRetry={() => window.location.reload()} size="sm" />}

        <AnimatePresence mode="popLayout">
          {shown.length === 0 ? (
            <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="flex flex-col items-center py-16 text-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[#EDE5FF] flex items-center justify-center">
                <Calendar size={26} className="text-[#9D7FD4]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-black text-[#2A2440] mb-1">Nenhum agendamento aqui</p>
                <p className="text-xs text-[#9B8FC0]">
                  {tab === "upcoming" ? "Que tal reservar um horário agora?" : "Nenhum registro neste período."}
                </p>
              </div>
              {tab === "upcoming" && (
                <button onClick={() => router.push("/cliente/servicos")}
                  className="px-5 py-2 rounded-full text-xs font-black text-white uppercase tracking-widest"
                  style={{ background:"linear-gradient(135deg, #7C5CBF, #9D7FD4)" }}>
                  Agendar agora
                </button>
              )}
            </motion.div>
          ) : shown.map((a, i) => (
            <motion.div key={a.id} layout
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, scale:0.97 }}
              transition={{ delay: i * 0.05, type:"spring", stiffness:300, damping:28 }}>
              <AppointmentCard
                appointment={a as unknown as ApptCard}
                onReschedule={() => router.push("/cliente/agendar")}
                onCancel={cancel}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
