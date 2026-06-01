"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, Clock, CheckCircle, PenLine,
  Loader2, Sparkles, CalendarCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentService } from "@/services/appointments";
import { AppointmentStorage } from "@/lib/appointmentStorage";
import { notificationService } from "@/services/notifications";

interface Service { id: string; name: string; description?: string; price: string; duration: string; }
interface TimeSlot { id: string; time: string; available: boolean; label?: string; }
interface AppointmentData { service: Service; date: Date; time: TimeSlot; timeSlots: TimeSlot[]; observation?: string; }

export default function ConfirmacaoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData]           = useState<AppointmentData | null>(null);
  const [observation, setObs]     = useState("");
  const [loading, setLoading]     = useState(true);
  const [confirming, setConfirm]  = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    const d = AppointmentStorage.loadAppointmentData();
    if (!d?.service || !d?.date || !d?.time) { router.push("/cliente/agendar"); return; }
    setData(d); setObs(d.observation || ""); setLoading(false);
  }, [router]);

  const handleConfirm = async () => {
    if (!data || confirming || !user) {
      if (!user) setError("Você precisa estar logado.");
      return;
    }
    setConfirm(true); setError(null);
    const [h, m] = (data.time?.time || "").split(":").map(Number);
    const dt = new Date(data.date); dt.setHours(h || 0, m || 0, 0, 0);
    try {
      const appointmentId = await appointmentService.create({
        clientId: user.uid,
        serviceId: data.service.id,
        specialistId: "unassigned",
        appointmentDate: dt,
        status: "pending",
        paymentStatus: "unpaid",
        notes: observation || null,
      });
      if (!appointmentId) throw new Error("Falha ao criar agendamento.");

      // Notificar Tessy sobre novo agendamento
      void notificationService.notifyNewAppointment({
        clientName: user.name || "Cliente",
        serviceName: data.service.name,
        date: format(dt, "dd/MM", { locale: ptBR }),
        time: data.time.time,
      }).catch(() => {});

      router.push(`/cliente/agendar/sucesso?appointmentId=${encodeURIComponent(appointmentId)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao confirmar. Tente novamente.");
      setConfirm(false);
    }
  };

  if (loading) return (
    <div className="min-h-dvh bg-[#1E1A2E] flex items-center justify-center">
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <motion.div key={i} className="w-2 h-2 rounded-full bg-[#9D7FD4]"
            animate={{ scale:[1,1.5,1], opacity:[0.4,1,0.4] }}
            transition={{ duration:0.8, delay:i*0.15, repeat:Infinity }} />
        ))}
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="min-h-dvh bg-[#FAF8FF]">

      {/* Header */}
      <div style={{ background:"linear-gradient(145deg,#1E1A2E 0%,#2A2044 100%)" }} className="relative overflow-hidden">
        <div className="absolute inset-0 tn-dot-pattern opacity-20" />
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#9D7FD4]/15 blur-3xl translate-x-10 -translate-y-10" />
        <div className="relative z-10 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <motion.button whileTap={{ scale:0.9 }} onClick={() => router.push("/cliente/agendar")}
              className="h-9 w-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
              <ArrowLeft size={15} className="text-white/80" />
            </motion.button>
            <div>
              <h1 className="text-base font-black text-white leading-none">Confirmar agendamento</h1>
              <p className="text-[10px] text-white/40 mt-0.5">Revise os detalhes antes de confirmar</p>
            </div>
          </div>
          {/* Serviço */}
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 border border-white/10 px-4 py-3">
            <div className="h-9 w-9 rounded-xl bg-[#9D7FD4]/30 flex items-center justify-center shrink-0">
              <Sparkles size={14} className="text-[#EDE5FF]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Serviço</p>
              <p className="text-sm font-black text-white truncate">{data.service.name}</p>
            </div>
            <p className="text-sm font-black text-[#9D7FD4] shrink-0">{data.service.price}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-5 pb-[calc(9rem+env(safe-area-inset-bottom))] max-w-lg mx-auto space-y-4">

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data e hora */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
          className="bg-white rounded-3xl border border-[#EDE5FF] shadow-sm overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-[#1E1A2E]/0 via-[#9D7FD4] to-[#1E1A2E]/0" />
          <div className="p-5 grid grid-cols-2 gap-3">
            {[
              { icon: Calendar, label:"Data",    value: format(data.date,"dd 'de' MMMM",{locale:ptBR}), sub: format(data.date,"EEEE",{locale:ptBR}) },
              { icon: Clock,    label:"Horário", value: data.time.time, sub: data.service.duration },
            ].map((item,i) => (
              <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1+i*0.06 }}
                className="rounded-2xl bg-[#FAF8FF] p-4 flex flex-col gap-2">
                <div className="h-8 w-8 rounded-xl bg-[#1E1A2E] flex items-center justify-center">
                  <item.icon size={13} className="text-[#9D7FD4]" />
                </div>
                <div>
                  <p className="text-[8px] font-bold text-[#9B8FC0] uppercase tracking-widest">{item.label}</p>
                  <p className="text-sm font-black text-[#1E1A2E] mt-0.5">{item.value}</p>
                  <p className="text-[9px] text-[#9B8FC0] capitalize mt-0.5">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Observação */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}
          className="bg-white rounded-3xl border border-[#EDE5FF] shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <PenLine size={13} className="text-[#9B8FC0]" />
            <p className="text-[9px] font-black text-[#9B8FC0] uppercase tracking-[0.25em]">Observações (opcional)</p>
          </div>
          <Textarea
            value={observation}
            onChange={e => setObs(e.target.value)}
            placeholder="Ex: Prefiro esmalte escuro, retirada de cutícula..."
            className="min-h-[90px] rounded-2xl border-[#EDE5FF] bg-[#FAF8FF] focus:bg-white focus:border-[#9D7FD4]/30 text-sm resize-none"
          />
        </motion.div>
      </div>

      {/* CTA fixo */}
      <div className="fixed bottom-0 inset-x-0 px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] bg-gradient-to-t from-[#FAF8FF] via-[#FAF8FF]/95 to-transparent pt-8">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale:0.98 }}
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full h-[60px] rounded-2xl flex items-center justify-center gap-3 text-white shadow-2xl shadow-[#1E1A2E]/30 transition-all disabled:opacity-60"
            style={{ background:"linear-gradient(135deg,#1E1A2E 0%,#3D2B6E 60%,#5A3F9A 100%)" }}
          >
            {confirming ? (
              <><Loader2 size={18} className="animate-spin" /><span className="text-sm font-black">Confirmando...</span></>
            ) : (
              <><CheckCircle size={18} className="text-[#9D7FD4]" /><span className="text-sm font-black">Confirmar agendamento</span></>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
