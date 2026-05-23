"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, Clock, CheckCircle, PenLine,
  Loader2, Sparkles, ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentService } from "@/services/appointments";
import { AppointmentStorage } from "@/lib/appointmentStorage";

interface Service { id: string; name: string; description?: string; price: string; duration: string; }
interface TimeSlot { id: string; time: string; available: boolean; label?: string; }
interface AppointmentData { service: Service; date: Date; time: TimeSlot; timeSlots: TimeSlot[]; observation?: string; }

const DEPOSIT_AMOUNT = 10;
const DEPOSIT_LABEL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(DEPOSIT_AMOUNT);

export default function ConfirmacaoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<AppointmentData | null>(null);
  const [observation, setObservation] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = AppointmentStorage.loadAppointmentData();
    if (!d?.service || !d?.date || !d?.time) { router.push("/cliente/agendar"); return; }
    setData(d); setObservation(d.observation || ""); setLoading(false);
  }, [router]);

  const handleConfirm = async () => {
    if (!data || confirming || !user) { if (!user) setError("Você precisa estar logado."); return; }
    setConfirming(true); setError(null);
    const [h, m] = (data.time?.time || "").split(":").map(Number);
    const dt = new Date(data.date); dt.setHours(h || 0, m || 0, 0, 0);
    try {
      const appointmentId = await appointmentService.create({
        clientId: user.uid, serviceId: data.service.id,
        specialistId: "unassigned", appointmentDate: dt,
        status: "pending", paymentStatus: "unpaid",
        notes: observation || null,
      });
      if (!appointmentId) throw new Error();
      const stripeRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceName: data.service.name, price: DEPOSIT_AMOUNT, appointmentId, clientId: user.uid, isDeposit: true }),
      });
      const stripeData = await stripeRes.json();
      if (stripeData.url) window.location.href = stripeData.url;
      else router.push(`/cliente/agendar/sucesso?appointmentId=${encodeURIComponent(appointmentId)}`);
    } catch { setError("Erro ao confirmar agendamento. Tente novamente."); setConfirming(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#2C1810] flex items-center justify-center">
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <motion.div key={i} className="w-2 h-2 rounded-full bg-amber-400"
            animate={{ scale:[1,1.5,1], opacity:[0.4,1,0.4] }}
            transition={{ duration: 0.8, delay: i*0.15, repeat: Infinity }} />
        ))}
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#F5F0EA]">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="bg-[#2C1810] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-amber-400/8 blur-2xl translate-x-16 -translate-y-10" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />

        <div className="relative z-10 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6 max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => router.push("/cliente/agendar")}
              className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-90 transition-all shrink-0">
              <ArrowLeft size={16} className="text-white/80" />
            </button>
            <div>
              <h1 className="text-lg font-black text-white leading-none">Confirmar agendamento</h1>
              <p className="text-[10px] text-white/40 mt-0.5">Revise os detalhes antes de confirmar</p>
            </div>
          </div>

          {/* Service pill no header */}
          <div className="flex items-center gap-3 bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Sparkles size={15} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Serviço</p>
              <p className="text-sm font-black text-white truncate">{data.service.name}</p>
            </div>
            <p className="text-base font-black text-amber-400 shrink-0">{data.service.price}</p>
          </div>
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-36 max-w-lg mx-auto space-y-4">

        {/* Erro */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Resumo data/hora ─ */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
          className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-[#2C1810]/0 via-amber-500 to-[#2C1810]/0" />
          <div className="p-5 grid grid-cols-2 gap-3">
            {[
              { icon: Calendar, label: "Data",    value: format(data.date, "dd 'de' MMMM", { locale: ptBR }), sub: format(data.date, "EEEE", { locale: ptBR }) },
              { icon: Clock,    label: "Horário", value: data.time.time, sub: data.service.duration },
            ].map((item, i) => (
              <motion.div key={i}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.1 + i*0.06 }}
                className="rounded-2xl bg-[#F5F0EA] p-4 flex flex-col gap-2">
                <div className="h-8 w-8 rounded-xl bg-[#2C1810] flex items-center justify-center">
                  <item.icon size={14} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">{item.label}</p>
                  <p className="text-sm font-black text-stone-800 mt-0.5">{item.value}</p>
                  <p className="text-[9px] text-stone-400 capitalize mt-0.5">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Pagamento ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}
          className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
          <div className="p-5 space-y-3">
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.25em]">Pagamento</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#2C1810] p-4">
                <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Sinal agora</p>
                <p className="text-xl font-black text-amber-400">{DEPOSIT_LABEL}</p>
                <p className="text-[8px] text-white/30 mt-1">via Stripe</p>
              </div>
              <div className="rounded-2xl bg-[#F5F0EA] p-4">
                <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-1">Restante</p>
                <p className="text-xl font-black text-stone-700">{data.service.price}</p>
                <p className="text-[8px] text-stone-400 mt-1">no salão</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl p-3">
              <ShieldCheck size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 leading-relaxed">
                O sinal de <strong>{DEPOSIT_LABEL}</strong> garante seu horário. O restante é pago no estabelecimento.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Observação ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}
          className="bg-white rounded-3xl border border-stone-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <PenLine size={13} className="text-stone-400" />
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.25em]">Observações (opcional)</p>
          </div>
          <Textarea
            value={observation}
            onChange={e => setObservation(e.target.value)}
            placeholder="Ex: Remoção de gel, chegar 5 min antes..."
            className="min-h-[100px] rounded-2xl border-stone-100 bg-[#F5F0EA] focus:bg-white focus:border-[#2C1810]/20 text-sm resize-none"
          />
        </motion.div>
      </div>

      {/* ── CTA FLUTUANTE ──────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] z-40 bg-gradient-to-t from-[#F5F0EA] via-[#F5F0EA]/90 to-transparent pt-6">
        <div className="max-w-lg mx-auto">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full h-[60px] rounded-2xl bg-[#2C1810] text-white flex items-center justify-center gap-3 shadow-2xl shadow-[#2C1810]/40 transition-all disabled:opacity-60"
          >
            {confirming ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm font-black">Processando...</span>
              </>
            ) : (
              <>
                <CheckCircle size={18} className="text-amber-400" />
                <div className="text-left">
                  <p className="text-sm font-black leading-none">Pagar sinal e confirmar</p>
                  <p className="text-[9px] text-white/40 mt-0.5">Você será redirecionado para o Stripe</p>
                </div>
                <div className="ml-auto text-base font-black text-amber-400">{DEPOSIT_LABEL}</div>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
