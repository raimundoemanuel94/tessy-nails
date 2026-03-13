"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, Clock, User, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentService } from "@/services/appointments";
import { AppointmentStorage } from "@/lib/appointmentStorage";
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
  const { user } = useAuth(); // ✅ Adicionar user do AuthContext
  const [appointmentData, setAppointmentData] = useState<AppointmentData | null>(null);
  const [observation, setObservation] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do localStorage com validação
  useEffect(() => {
    // ✅ Carregar dados completos do agendamento
    const appointmentData = AppointmentStorage.loadAppointmentData();
    if (!appointmentData) {
      console.error('No appointment data found, redirecting...');
      router.push('/cliente/agendar');
      return;
    }

    // ✅ Validar dados essenciais
    if (!appointmentData.service || !appointmentData.date || !appointmentData.time) {
      console.error('Invalid appointment data:', appointmentData);
      router.push('/cliente/agendar');
      return;
    }

    setAppointmentData(appointmentData);
    setObservation(appointmentData.observation || "");
    setLoading(false);
  }, [router]);

  const handleConfirmAppointment = async () => {
    if (!appointmentData) return;

    // Prevenir duplo clique
    if (confirming) return;

    // ✅ Validar usuário autenticado
    if (!user) {
      setError('Você precisa estar logado para confirmar agendamento.');
      return;
    }

    setConfirming(true);
    setError(null);

    // ✅ Validar dados do agendamento
    if (!appointmentData.service.id || !user.uid) {
      setError('Dados do agendamento inválidos. Tente novamente começando do início.');
      return;
    }

    // ✅ Validar data do agendamento
    if (!appointmentData.date || appointmentData.date < new Date()) {
      setError('Data do agendamento inválida. Selecione uma data futura.');
      return;
    }

    // ✅ Validar horário do agendamento
    if (!appointmentData.time || !appointmentData.time.time) {
      setError('Horário do agendamento inválido. Selecione um horário disponível.');
      return;
    }

    try {
      // Preparar dados para o Firestore
      const appointmentDataForFirestore = {
        clientId: user.uid, // ✅ Usar UID real do usuário
        serviceId: appointmentData.service.id,
        specialistId: user.uid, // ✅ Usar próprio usuário como especialista (temp)
        appointmentDate: appointmentData.date,
        status: "pending" as const,
        paymentStatus: "unpaid" as const,
        notes: observation || null, // ✅ Converter undefined para null
      };

      console.log('Enviando dados para Firestore:', appointmentDataForFirestore);

      // ✅ Validar dados antes de enviar
      if (!appointmentDataForFirestore.clientId || !appointmentDataForFirestore.serviceId) {
        throw new Error('Dados essenciais do agendamento estão faltando');
      }

      // Salvar no Firestore usando o appointmentService
      const appointmentId = await appointmentService.create(appointmentDataForFirestore);

      console.log('Agendamento criado com ID:', appointmentId);

      // ✅ Validar se o ID foi retornado
      if (!appointmentId) {
        throw new Error('Não foi possível obter o ID do agendamento criado');
      }

      // Salvar dados completos do agendamento no localStorage para página de sucesso
      const confirmedAppointment = {
        id: appointmentId,
        service: appointmentData.service, // ✅ Salvar objeto service completo
        date: appointmentData.date,
        time: appointmentData.time,
        observation: observation || undefined,
        confirmedAt: new Date(),
        status: "pending"
      };

      localStorage.setItem('confirmedAppointment', JSON.stringify(confirmedAppointment));

      // ✅ Limpar dados do localStorage após sucesso
      AppointmentStorage.clearAll();

      // ✅ Navegar para página de sucesso
      router.push('/cliente/agendar/sucesso');
    } catch (error: any) {
      console.error('Error confirming appointment:', error);
      setError('Ocorreu um erro ao confirmar seu agendamento. Tente novamente.');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Dados do agendamento não encontrados</h2>
          <p className="text-gray-600 mb-6">Por favor, comece o processo de agendamento novamente.</p>
          <div className="space-x-4">
            <Button onClick={handleBackToServices} variant="outline">
              Voltar para Serviços
            </Button>
            <Button onClick={handleEdit}>
              Editar Agendamento
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const missingFields = [];
  if (!appointmentData.service) missingFields.push("Serviço");
  if (!appointmentData.date) missingFields.push("Data");
  if (!appointmentData.time) missingFields.push("Horário");

  if (missingFields.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Dados incompletos</h2>
          <p className="text-gray-600 mb-6">
            Faltam as seguintes informações: {missingFields.join(", ")}
          </p>
          <div className="space-x-4">
            <Button onClick={handleBackToServices} variant="outline">
              Voltar para Serviços
            </Button>
            <Button onClick={handleEdit}>
              Editar Agendamento
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Confirmar agendamento</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Erro</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Resumo do agendamento */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Resumo do agendamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Serviço */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Serviço</h3>
                    <p className="text-gray-600">{appointmentData.service.name}</p>
                    <p className="text-sm text-gray-500">{appointmentData.service.duration}</p>
                  </div>
                  <Badge variant="secondary">{appointmentData.service.price}</Badge>
                </div>

                {/* Data e horário */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Data e horário</h3>
                    <p className="text-gray-600">
                      {format(appointmentData.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-gray-500">{appointmentData.time.time}</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <Clock className="h-4 w-4" />
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações (opcional)
                  </label>
                  <Textarea
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Adicione alguma observação para seu agendamento..."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Button 
              onClick={handleConfirmAppointment}
              disabled={confirming}
              className="w-full"
            >
              {confirming ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Confirmar agendamento
                </>
              )}
            </Button>

            <Button 
              variant="outline" 
              onClick={handleEdit}
              className="w-full"
            >
              Editar agendamento
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
