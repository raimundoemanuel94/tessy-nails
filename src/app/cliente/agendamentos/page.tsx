"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, isPast, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentService } from "@/services/appointments";
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { EmptyAppointmentsState } from "@/components/client/EmptyAppointmentsState";
import { AgendamentosHeader } from "@/components/client/AgendamentosHeader";
import { AppointmentTabs } from "@/components/client/AppointmentTabs";
import { AppointmentCard } from "@/components/client/AppointmentCard";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/client/BottomNav";

export default function AgendamentosPage() {
  const router = useRouter();
  const { user, client, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history" | "all">("upcoming");

  // Carregar agendamentos reais do Firestore
  useEffect(() => {
    const loadAppointments = async () => {
      if (authLoading) return;
      
      try {
        setLoading(true);
        setError(null);

        // ✅ Validar usuário autenticado
        if (!user) {
          setError('Você precisa estar logado para ver seus agendamentos.');
          return;
        }

        // ✅ Validar conexão
        if (!navigator.onLine) {
          setError('Sem conexão com a internet. Verifique sua conexão.');
          return;
        }

        // ✅ Buscar agendamentos diretamente do usuário no Firestore com detalhes dos serviços
        const appointmentsWithServiceDetails = await appointmentService.getByClientIdWithServices(user.uid);
        
        // ✅ Validar se há agendamentos
        if (!appointmentsWithServiceDetails || appointmentsWithServiceDetails.length === 0) {
          console.log('No appointments found for user:', user.uid);
          setAppointments([]);
          setLoading(false);
          return;
        }

        // ✅ Formatar dados para exibição
        const formattedAppointments = appointmentsWithServiceDetails.map(apt => ({
          ...apt,
          service: {
            ...apt.service,
            price: `R$ ${apt.service.price.toFixed(2)}`,
            duration: `${apt.service.durationMinutes}min`
          }
        }));

        setAppointments(formattedAppointments);
        console.log('Appointments loaded from Firestore:', formattedAppointments);
      } catch (error: any) {
        console.error('Error loading appointments:', error);
        
        // ✅ Tratamento específico de erros
        if (error.code === 'permission-denied') {
          setError('Sem permissão para acessar seus agendamentos. Contate o administrador.');
        } else if (error.code === 'unavailable') {
          setError('Serviço temporariamente indisponível. Tente novamente em alguns minutos.');
        } else {
          setError('Não foi possível carregar seus agendamentos. Verifique sua conexão e tente novamente.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [user, authLoading]);

  // Filtrar agendamentos por aba
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.date);
    
    switch (activeTab) {
      case 'upcoming':
        return !isPast(appointmentDate) && appointment.status !== 'cancelled';
      case 'history':
        return isPast(appointmentDate) || appointment.status === 'completed' || appointment.status === 'cancelled';
      default:
        return true;
    }
  });

  // Contadores para as abas
  const counts = {
    upcoming: appointments.filter(a => !isPast(new Date(a.date)) && a.status !== 'cancelled').length,
    history: appointments.filter(a => isPast(new Date(a.date)) || a.status === 'completed' || a.status === 'cancelled').length,
    all: appointments.length
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'upcoming' || tab === 'history' || tab === 'all') {
      setActiveTab(tab as 'upcoming' | 'history' | 'all');
    }
  };

  const handleViewDetails = (appointment: any) => {
    // Preparar para futura implementação
    console.log('View details:', appointment);
  };

  const handleReschedule = (appointment: any) => {
    // Preparar para futura implementação
    console.log('Reschedule:', appointment);
    router.push('/cliente/agendar');
  };

  const handleCancel = (appointment: any) => {
    // Preparar para futura implementação
    console.log('Cancel:', appointment);
  };

  const handleScheduleNew = () => {
    router.push('/cliente/servicos');
  };

  const handleBack = () => {
    router.push('/cliente');
  };

  // Estados de loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Carregando agendamentos...</p>
        </div>
      </div>
    );
  }

  // Estado vazio
  if (appointments.length === 0) {
    return (
      <EmptyAppointmentsState 
        onScheduleNew={handleScheduleNew}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AgendamentosHeader 
        title="Meus agendamentos"
        subtitle="Gerencie seus horários e tratamentos"
        onBack={handleBack}
      />

      <main className="container px-4 py-8">
        {/* Tabs */}
        <AppointmentTabs 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={counts}
        />

        {/* Appointments List */}
        {filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onViewDetails={handleViewDetails}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mb-4 h-16 w-16 rounded-full bg-brand-primary/5 flex items-center justify-center mx-auto">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'upcoming' 
                ? "Você não possui agendamentos futuros." 
                : "Você não possui agendamentos no histórico."
              }
            </p>
            <Button 
              onClick={handleScheduleNew}
              className="bg-linear-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-medium"
            >
              Agendar agora
            </Button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
