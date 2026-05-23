"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { isPast, isToday, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentService } from "@/services/appointments";
import { AppointmentCard, Appointment as AppointmentCardType } from "@/components/cliente/AppointmentCard";
import { ErrorState } from "@/components/shared/ErrorState";
import { AgendamentosSkeleton } from "@/components/cliente/ClienteSkeletons";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Calendar, Clock, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ClientAppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

interface ClientAppointment {
  id: string;
  service: { id: string; name: string; durationMinutes: number; price?: string; duration?: string; };
  date: Date;
  time: { id: string; time: string };
  status: ClientAppointmentStatus;
  observation?: string;
  createdAt: Date;
}

const STATUS_BADGE = {
  pending:   { label: "Pendente",   cls: "bg-[#FBF4E8] text-[#A88B55] border border-[#E8D5B0]"    },
  confirmed: { label: "Confirmado", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  completed: { label: "Concluído",  cls: "bg-stone-100 text-stone-600 border border-stone-200"   },
  cancelled: { label: "Cancelado",  cls: "bg-red-50 text-red-600 border border-red-200"          },
  no_show:   { label: "Ausente",    cls: "bg-slate-100 text-slate-600 border border-slate-200"   },
} as const;

const TABS = [
  { key: "upcoming", label: "Próximos" },
  { key: "history",  label: "Histórico" },
  { key: "all",      label: "Todos"     },
] as const;

export default function AgendamentosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history" | "all">("upcoming");

  useEffect(() => {
    const load = async () => {
      if (authLoading) return;
      try {
        setLoading(true); setError(null);
        if (!user) { setError("Você precisa estar logado."); return; }
        const raw = await appointmentService.getByClientIdWithServices(user.uid);
        if (!raw?.length) { setAppointments([]); return; }
        const formatted: ClientAppointment[] = raw
          .filter((a): a is typeof a & { status: ClientAppointmentStatus } =>
            ["pending","confirmed","completed","cancelled","no_show"].includes(a.status))
          .map(a => ({
            ...a,
            service: { ...a.service, price: `R$ ${a.service.price.toFixed(2)}`, duration: `${a.service.durationMinutes}min` },
          }));
        setAppointments(formatted);
      } catch (err) {
        const code = (err as { code?: string }).code;
        setError(code === "permission-denied" ? "Sem permissão para acessar agendamentos." : "Não foi possível carregar seus agendamentos.");
      } finally { setLoading(false); }
    };
    load();
  }, [user, authLoading]);

  const filtered = appointments.filter(a => {
    const d = new Date(a.date);
    if (activeTab === "upcoming") return !isPast(d) && a.status !== "cancelled";
    if (activeTab === "history") return isPast(d) || a.status === "completed" || a.status === "cancelled";
    return true;
  });

  const counts = {
    upcoming: appointments.filter(a => !isPast(new Date(a.date)) && a.status !== "cancelled").length,
    history: appointments.filter(a => isPast(new Date(a.date)) || a.status === "completed" || a.status === "cancelled").length,
    all: appointments.length,
  };

  const handleCancel = (appt: AppointmentCardType) => {
    appointmentService.cancel(appt.id)
      .then(() => {
        setAppointments(prev => prev.map(a =>
          a.id === appt.id ? { ...a, status: "cancelled" as ClientAppointmentStatus } : a));
        toast.success("Agendamento cancelado.");
      })
      .catch(() => toast.error("Não foi possível cancelar. Tente novamente."));
  };

  if (loading) return <AgendamentosSkeleton />;

  return (
    <div className="min-h-screen bg-[#F7F5F1]">

      {/* Header dark */}
      <div className="bg-[#111110] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#C9A96E]/8 blur-2xl translate-x-16 -translate-y-10" />
        <div className="px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6 max-w-lg mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => router.push("/cliente")}
              className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-90 transition-all shrink-0">
              <ArrowLeft size={16} className="text-white/80" />
            </button>
            <div>
              <h1 className="text-lg font-black text-white">Meus Agendamentos</h1>
              <p className="text-[10px] text-white/40">{counts.all} agendamento{counts.all !== 1 ? "s" : ""} no total</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pb-0 max-w-lg mx-auto relative z-10 gap-1">
          {TABS.map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-t-xl transition-all duration-200",
                activeTab === tab.key
                  ? "bg-[#F7F5F1] text-[#111110]"
                  : "text-white/40 hover:text-white/60"
              )}>
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={cn(
                  "ml-1.5 text-[8px] px-1.5 py-0.5 rounded-full font-black",
                  activeTab === tab.key ? "bg-[#111110] text-[#C9A96E]" : "bg-white/10 text-white/40"
                )}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-5 pb-32 max-w-lg mx-auto space-y-3">

        {error && (
          <ErrorState title="Erro" message={error} onRetry={() => window.location.reload()} size="sm" />
        )}

        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-white border border-stone-100 mx-auto mb-4 flex items-center justify-center">
                <Calendar size={24} className="text-stone-300" />
              </div>
              <p className="text-sm font-black text-stone-600 mb-1">Nenhum agendamento aqui</p>
              <p className="text-xs text-stone-400 mb-6">
                {activeTab === "upcoming" ? "Sem horários futuros agendados." : "Nenhum registro neste período."}
              </p>
              <button onClick={() => router.push("/cliente/servicos")}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#111110] text-white text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
                <Plus size={13} strokeWidth={3} /> Agendar agora
              </button>
            </motion.div>
          ) : (
            filtered.map((appt, i) => (
              <motion.div key={appt.id} layout
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 28 }}>
                <AppointmentCard
                  appointment={appt as unknown as AppointmentCardType}
                  onReschedule={() => router.push("/cliente/agendar")}
                  onCancel={handleCancel}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
