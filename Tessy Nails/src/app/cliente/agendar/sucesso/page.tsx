"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SuccessHeader } from "@/components/client/SuccessHeader";
import { SuccessBlock } from "@/components/client/SuccessBlock";
import { SuccessAppointmentSummary } from "@/components/client/SuccessAppointmentSummary";
import { SuccessActions } from "@/components/client/SuccessActions";
import { NoRecentAppointmentState } from "@/components/client/NoRecentAppointmentState";

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

  // Carregar dados do agendamento confirmado
  useEffect(() => {
    const savedAppointment = localStorage.getItem('confirmedAppointment');
    if (savedAppointment) {
      try {
        const data: ConfirmedAppointment = JSON.parse(savedAppointment);
        
        // Converter string de data para Date
        if (typeof data.date === 'string') {
          data.date = new Date(data.date);
        }
        
        setAppointment(data);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing confirmed appointment:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleMyAppointments = () => {
    // Preparar para futura implementação
    router.push('/cliente/agendamentos');
  };

  const handleBackToHome = () => {
    router.push('/cliente');
  };

  const handleSearchAppointments = () => {
    // Preparar para futura implementação
    router.push('/cliente/agendamentos');
  };

  // Estados de loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Estado sem agendamento
  if (!appointment) {
    return (
      <NoRecentAppointmentState 
        onBackToHome={handleBackToHome}
        onSearchAppointments={handleSearchAppointments}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      <SuccessHeader />

      <main className="container px-4 py-8">
        <div className="space-y-8">
          {/* Success Block */}
          <SuccessBlock 
            title="Agendamento confirmado!"
            subtitle="Seu horário foi reservado com sucesso"
            message="Estamos muito felizes em receber você! Prepare-se para uma experiência incrível de cuidado e beleza."
          />

          {/* Appointment Summary */}
          <SuccessAppointmentSummary 
            service={appointment.service}
            selectedDate={appointment.date}
            selectedTime={appointment.time}
            observation={appointment.observation}
            status="Confirmado"
          />

          {/* Action Buttons */}
          <SuccessActions 
            onMyAppointments={handleMyAppointments}
            onBackToHome={handleBackToHome}
          />
        </div>
      </main>
    </div>
  );
}
