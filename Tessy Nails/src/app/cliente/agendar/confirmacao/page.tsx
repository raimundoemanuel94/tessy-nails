"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ConfirmacaoHeader } from "@/components/client/ConfirmacaoHeader";
import { FullAppointmentSummary } from "@/components/client/FullAppointmentSummary";
import { ObservationField } from "@/components/client/ObservationField";
import { IncompleteAppointmentState } from "@/components/client/IncompleteAppointmentState";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft, Edit } from "lucide-react";
import { appointmentService } from "@/services/appointments";
import { Appointment } from "@/types";

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
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
  const [observation, setObservation] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do localStorage
  useEffect(() => {
    const savedAppointmentData = localStorage.getItem('appointmentData');
    if (savedAppointmentData) {
      try {
        const data: AppointmentData = JSON.parse(savedAppointmentData);
        setAppointmentData(data);
        setObservation(data.observation || "");
        setLoading(false);
      } catch (error) {
        console.error('Error parsing appointment data:', error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleConfirmAppointment = async () => {
    if (!appointmentData) return;

    // Prevenir duplo clique
    if (confirming) return;

    setConfirming(true);
    setError(null);

    try {
      // Preparar dados para o Firestore
      const appointmentDataForFirestore = {
        clientId: "client_placeholder", // Fallback - pode ser substituído por dados do usuário autenticado
        serviceId: appointmentData.service.id,
        specialistId: "specialist_placeholder", // Fallback - pode ser substituído por dados do profissional
        appointmentDate: appointmentData.date,
        status: "pending" as const,
        paymentStatus: "unpaid" as const,
        notes: observation || undefined,
      };

      console.log('Enviando dados para Firestore:', appointmentDataForFirestore);

      // Salvar no Firestore usando o appointmentService
      const appointmentId = await appointmentService.create(appointmentDataForFirestore);

      console.log('Agendamento criado com ID:', appointmentId);

      // Salvar dados completos do agendamento no localStorage para página de sucesso
      const confirmedAppointment = {
        id: appointmentId,
        ...appointmentDataForFirestore,
        confirmedAt: new Date(),
        status: "pending"
      };

      localStorage.setItem('confirmedAppointment', JSON.stringify(confirmedAppointment));

      // Limpar dados temporários
      localStorage.removeItem('selectedService');
      localStorage.removeItem('selectedDate');
      localStorage.removeItem('appointmentData');

      // Navegar para página de sucesso
      router.push('/cliente/agendar/sucesso');
      
    } catch (error) {
      console.error('Error confirming appointment:', error);
      setError('Não foi possível confirmar o agendamento. Tente novamente.');
      
      // Manter o usuário na página para tentar novamente
    } finally {
      setConfirming(false);
    }
  };

  const handleBack = () => {
    router.push('/cliente/agendar/horarios');
  };

  const handleEdit = () => {
    router.push('/cliente/agendar/horarios');
  };

  const handleChangeDate = () => {
    router.push('/cliente/agendar');
  };

  const handleBackToServices = () => {
    router.push('/cliente/servicos');
  };

  // Estados de erro
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

  if (!appointmentData) {
    return (
      <IncompleteAppointmentState 
        onBack={handleBackToServices}
        onEdit={handleEdit}
        onChangeDate={handleChangeDate}
        missingFields={["Serviço", "Data", "Horário"]}
      />
    );
  }

  const missingFields = [];
  if (!appointmentData.service) missingFields.push("Serviço");
  if (!appointmentData.date) missingFields.push("Data");
  if (!appointmentData.time) missingFields.push("Horário");

  if (missingFields.length > 0) {
    return (
      <IncompleteAppointmentState 
        onBack={handleBackToServices}
        onEdit={handleEdit}
        onChangeDate={handleChangeDate}
        missingFields={missingFields}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ConfirmacaoHeader 
        title="Confirmar agendamento"
        onBack={handleBack}
      />

      <main className="container px-4 py-8">
        {/* Full Appointment Summary */}
        <div className="mb-8">
          <FullAppointmentSummary 
            service={appointmentData.service}
            selectedDate={appointmentData.date}
            selectedTime={appointmentData.time}
            observation={observation}
          />
        </div>

        {/* Observation Field */}
        <div className="mb-8">
          <ObservationField 
            value={observation}
            onChange={setObservation}
            placeholder="Digite alguma observação para o atendimento (opcional)"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button 
              onClick={handleConfirmAppointment}
              disabled={confirming}
              className="bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirming ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Confirmar agendamento
                </>
              )}
            </Button>

            <Button 
              variant="outline"
              onClick={handleEdit}
              className="border-pink-200 text-pink-700 hover:bg-pink-50 px-6 py-3"
            >
              <Edit className="mr-2 h-4 w-4" />
              Voltar e editar
            </Button>
          </div>

          {/* Important Info */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Ao confirmar, você receberá uma confirmação por e-mail
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Cancelamento gratuito até 24h antes do horário
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
