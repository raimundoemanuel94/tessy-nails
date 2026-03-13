"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, isPast, isToday, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AgendamentosHeader } from "@/components/client/AgendamentosHeader";
import { AppointmentTabs } from "@/components/client/AppointmentTabs";
import { AppointmentCard, Appointment } from "@/components/client/AppointmentCard";
import { EmptyAppointmentsState } from "@/components/client/EmptyAppointmentsState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentService } from "@/services/appointments";
import { salonService } from "@/services/salon";

// Mock data para agendamentos
const generateMockAppointments = (): Appointment[] => {
  const now = new Date();
  
  return [
    // Próximos agendamentos
    {
      id: "1",
      service: {
        id: "1",
        name: "Manicure Completa",
        description: "Inclui esmaltação tradicional",
        price: "R$ 80,00",
        duration: "1h 30min"
      },
      date: addDays(now, 2),
      time: { id: "1", time: "09:00" },
      status: "confirmed",
      observation: "Prefiro cores claras",
      createdAt: now
    },
    {
      id: "2",
      service: {
        id: "2",
        name: "Pedicure Spa",
        description: "Tratamento completo para os pés",
        price: "R$ 120,00",
        duration: "2h"
      },
      date: addDays(now, 7),
      time: { id: "2", time: "14:00" },
      status: "pending",
      createdAt: now
    },
    {
      id: "3",
      service: {
        id: "3",
        name: "Alongamento de Unhas",
        description: "Alongamento em gel",
        price: "R$ 150,00",
        duration: "3h"
      },
      date: addDays(now, 14),
      time: { id: "3", time: "10:30" },
      status: "confirmed",
      createdAt: now
    },
    // Histórico
    {
      id: "4",
      service: {
        id: "4",
        name: "Manicure Francesinha",
        description: "Esmaltação em estilo francês",
        price: "R$ 90,00",
        duration: "2h"
      },
      date: addDays(now, -7),
      time: { id: "4", time: "15:00" },
      status: "completed",
      createdAt: addDays(now, -14)
    },
    {
      id: "5",
      service: {
        id: "5",
        name: "Spa das Mãos",
        description: "Hidratação e esfoliação",
        price: "R$ 60,00",
        duration: "1h"
      },
      date: addDays(now, -14),
      time: { id: "5", time: "11:00" },
      status: "completed",
      createdAt: addDays(now, -21)
    },
    {
      id: "6",
      service: {
        id: "6",
        name: "Manicure Completa",
        description: "Inclui esmaltação tradicional",
        price: "R$ 80,00",
        duration: "1h 30min"
      },
      date: addDays(now, -21),
      time: { id: "6", time: "13:30" },
      status: "cancelled",
      createdAt: addDays(now, -28)
    }
  ];
};

export default function AgendamentosPage() {
  const router = useRouter();
  const { user, client, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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
        console.log('Appointments loaded:', formattedAppointments);
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

  const handleViewDetails = (appointment: Appointment) => {
    // Preparar para futura implementação
    console.log('View details:', appointment);
  };

  const handleReschedule = (appointment: Appointment) => {
    // Preparar para futura implementação
    console.log('Reschedule:', appointment);
    router.push('/cliente/agendar');
  };

  const handleCancel = (appointment: Appointment) => {
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
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
    <div className="min-h-screen bg-gray-50">
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
            <div className="mb-4 h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto">
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
              className="bg-linear-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium"
            >
              Agendar agora
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
