"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, Clock, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentService } from "@/services/appointments";
import { AppointmentStorage } from "@/lib/appointmentStorage";
import { cn } from "@/lib/utils";

// Interfaces locais
interface Service {
  id: string;
  name: string;
  description?: string;
  price: string;
  duration: string;
  image?: string;
  rating?: number;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  label?: string;
}

interface AppointmentData {
  service: Service;
  date: Date;
  time: TimeSlot;
  timeSlots: TimeSlot[];
  observation?: string;
}

export default function ConfirmacaoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
  const [observation, setObservation] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = AppointmentStorage.loadAppointmentData();
    if (!data || !data.service || !data.date || !data.time) {
      router.push('/cliente/agendar');
      return;
    }
    setAppointmentData(data);
    setObservation(data.observation || "");
    setLoading(false);
  }, [router]);

  const handleConfirmAppointment = async () => {
    if (!appointmentData || confirming) return;
    if (!user) {
      setError('Você precisa estar logado para confirmar agendamento.');
      return;
    }

    setConfirming(true);
    setError(null);

    const [hours, minutes] = (appointmentData.time?.time || "").split(":").map(Number);
    const appointmentDateTime = new Date(appointmentData.date);
    appointmentDateTime.setHours( hours || 0, minutes || 0, 0, 0);

    try {
      const appointmentId = await appointmentService.create({
        clientId: user.uid,
        serviceId: appointmentData.service.id,
        specialistId: user.uid,
        appointmentDate: appointmentDateTime,
        status: "pending",
        paymentStatus: "unpaid",
        notes: observation || null,
      });

      if (!appointmentId) throw new Error('Falha ao criar agendamento');

      // Stripe signal payment logic
      const stripeRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: appointmentData.service.name,
          price: 10,
          appointmentId,
          clientId: user.uid,
          isDeposit: true,
        }),
      });
      
      const stripeData = await stripeRes.json();
      if (stripeData.url) {
        window.location.href = stripeData.url;
      } else {
        router.push('/cliente/agendar/sucesso');
      }
    } catch (err: any) {
      console.error(err);
      setError('Ocorreu um erro ao confirmar seu agendamento.');
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!appointmentData) return null;

  return (
    <div className="px-5 pt-4 max-w-2xl mx-auto space-y-8">
      {/* Header Area */}
      <div className="flex items-center gap-4 py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/cliente/agendar/horarios')}
          className="h-12 w-12 rounded-2xl bg-white border border-brand-border text-brand-text hover:text-brand-primary shadow-sm active:scale-95 transition-all"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-brand-text tracking-tight uppercase">Confirmar</h1>
          <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-[0.2em]">Revise sua reserva</p>
        </div>
      </div>

      <main className="space-y-6 pb-20">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-bold uppercase tracking-wider">
            {error}
          </div>
        )}

        {/* Detail Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-brand-border bg-white p-8 shadow-xl shadow-brand-primary/5 space-y-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-bl-[5rem] -mr-8 -mt-8" />
          
          <div className="relative space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest leading-none">Procedimento</p>
                 <h4 className="text-2xl font-black text-brand-text tracking-tight leading-none">{appointmentData.service.name}</h4>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest leading-none">Sinal</p>
                 <p className="text-xl font-black text-brand-text">R$ 10,00</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                    <Calendar size={18} />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest leading-none mb-1">Data</p>
                    <p className="text-[11px] font-black text-brand-text capitalize">
                      {format(appointmentData.date, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                    <Clock size={18} />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-widest leading-none mb-1">Horário</p>
                    <p className="text-[11px] font-black text-brand-text uppercase">{appointmentData.time.time}</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="relative pt-6 border-t border-brand-border space-y-4">
             <div className="flex items-center gap-2">
                <CheckCircle className="text-brand-primary" size={16} />
                <p className="text-[10px] font-black text-brand-text uppercase tracking-widest">Observações Adicionais</p>
             </div>
             <Textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Ex: Preciso de remoção, chegar 5 min antes..."
                className="min-h-[120px] rounded-2xl border-brand-border bg-brand-background/50 focus:bg-white focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all font-medium text-sm"
             />
          </div>

          <div className="relative rounded-2xl bg-brand-primary/5 p-4 border border-brand-primary/10 text-center">
             <p className="text-[10px] text-brand-primary font-black uppercase tracking-[0.2em] leading-relaxed">
               Garantia de horário: sinal de R$ 10,00 (Stripe)<br/>
               <span className="opacity-60">O restante será pago no estabelecimento</span>
             </p>
          </div>
        </div>

        {/* Action Button */}
        <section className="pt-4 px-2">
          <Button 
            onClick={handleConfirmAppointment}
            disabled={confirming}
            className="w-full h-18 rounded-[2rem] bg-linear-to-br from-brand-primary to-brand-secondary text-white font-black text-lg shadow-2xl shadow-brand-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            {confirming ? (
              <div className="flex items-center gap-3">
                 <Loader2 size={24} className="animate-spin text-white" />
                 <span className="uppercase tracking-[0.2em] text-xs">Processando...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                 <span className="uppercase tracking-[0.2em] text-xs">Pagar Sinal e Confirmar</span>
                 <span className="text-[10px] font-bold opacity-60 tracking-wider">Você será redirecionado para o Stripe</span>
              </div>
            )}
          </Button>
        </section>
      </main>
    </div>
  );
}
