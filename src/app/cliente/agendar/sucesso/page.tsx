"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
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
  clientName: string;
  observation?: string;
  confirmedAt: Date;
  id: string;
}

interface AppointmentDetailsResponse {
  appointment?: {
    id: string;
    appointmentDate: string;
    status: string;
    notes: string | null;
    client: {
      id: string;
      name: string;
    };
    service: {
      id: string;
      name: string;
      price: number;
      durationMinutes: number;
    };
  };
}

function SucessoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const [appointment, setAppointment] = useState<ConfirmedAppointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      if (!appointmentId) {
        setAppointment(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/appointments/${encodeURIComponent(appointmentId)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Falha ao buscar agendamento");
        }

        const data = (await response.json()) as AppointmentDetailsResponse;
        if (!data.appointment) {
          throw new Error("Resposta invalida do agendamento");
        }

        const appointmentDate = new Date(data.appointment.appointmentDate);
        if (Number.isNaN(appointmentDate.getTime())) {
          throw new Error("Data do agendamento invalida");
        }

        const time = format(appointmentDate, "HH:mm");

        setAppointment({
          id: data.appointment.id,
          date: appointmentDate,
          time: {
            id: time,
            time,
            available: true,
          },
          service: {
            id: data.appointment.service.id,
            name: data.appointment.service.name,
            price: `R$ ${Number(data.appointment.service.price).toFixed(2)}`,
            duration: `${Number(data.appointment.service.durationMinutes)}min`,
          },
          clientName: data.appointment.client.name || "Cliente",
          observation: data.appointment.notes || undefined,
          confirmedAt: new Date(),
        });
      } catch (error) {
        console.error("Error fetching appointment details:", error);
        setAppointment(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [appointmentId]);

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
        clientName={appointment.clientName}
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

export default function SucessoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
        </div>
      }
    >
      <SucessoContent />
    </Suspense>
  );
}
