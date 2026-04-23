"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SuccessHeader } from "@/components/cliente/SuccessHeader";
import { SuccessBlock } from "@/components/cliente/SuccessBlock";
import { SuccessAppointmentSummary } from "@/components/cliente/SuccessAppointmentSummary";
import { SuccessActions } from "@/components/cliente/SuccessActions";
import { NoRecentAppointmentState } from "@/components/cliente/NoRecentAppointmentState";

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

interface ConfirmedAppointment {
  service: Service;
  date: Date;
  time: TimeSlot;
  observation?: string;
  confirmedAt: Date;
  id: string;
}

export default function SucessoPage() {
  const router = useRouter();
  const [appointment, setAppointment] = useState<ConfirmedAppointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const savedAppointment = localStorage.getItem('confirmedAppointment');
      if (savedAppointment) {
        try {
          const data: ConfirmedAppointment = JSON.parse(savedAppointment);
          if (data.service && data.service.name) {
            if (typeof data.date === 'string') {
              data.date = new Date(data.date);
            }
            setAppointment(data);
          }
        } catch (error) {
          console.error('Error parsing confirmed appointment:', error);
        }
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <NoRecentAppointmentState 
        onBackToHome={() => router.push('/cliente')}
        onSearchAppointments={() => router.push('/cliente/agendamentos')}
      />
    );
  }

  return (
    <div className="px-5 pt-8 max-w-2xl mx-auto space-y-12 pb-20 overflow-hidden">
      <SuccessBlock 
        title="Reserva Concluída!"
        subtitle="Seu momento de cuidado está garantido"
        message="Prepare-se para uma experiência incrível. Nos vemos em breve!"
      />

      <SuccessAppointmentSummary 
        service={appointment.service}
        selectedDate={appointment.date}
        selectedTime={appointment.time}
        observation={appointment.observation}
        status="Agendado"
      />

      <SuccessActions 
        onMyAppointments={() => router.push('/cliente/agendamentos')}
        onBackToHome={() => router.push('/cliente')}
      />
    </div>
  );
}
