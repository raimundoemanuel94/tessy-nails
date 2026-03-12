"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isPast } from "date-fns";
import { AgendamentosHeader } from "@/components/client/AgendamentosHeader";
import { AppointmentTabs } from "@/components/client/AppointmentTabs";
import { AppointmentCard, Appointment } from "@/components/client/AppointmentCard";
import { EmptyAppointmentsState } from "@/components/client/EmptyAppointmentsState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentService, salonService } from "@/services";
import { Appointment as FirestoreAppointment, Service as FirestoreService } from "@/types";
import { ClientProtectedRoute } from "@/components/auth/ClientProtectedRoute";

function mapToLocalAppointment(
  a: FirestoreAppointment,
  serviceMap: Map<string, FirestoreService>
): Appointment {
  const firestoreService = serviceMap.get(a.serviceId);
  const appointmentDate = new Date(a.appointmentDate);
  const timeStr = `${String(appointmentDate.getHours()).padStart(2, "0")}:${String(appointmentDate.getMinutes()).padStart(2, "0")}`;

  return {
    id: a.id ?? "",
    service: {
      id: a.serviceId,
      name: firestoreService?.name ?? "Serviço",
      description: firestoreService?.description,
      price: firestoreService
        ? firestoreService.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        : undefined,
      duration: firestoreService
        ? (() => {
            const m = firestoreService.durationMinutes;
            if (m < 60) return `${m}min`;
            const h = Math.floor(m / 60);
            const rem = m % 60;
            return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
          })()
        : undefined,
    },
    date: appointmentDate,
    time: { id: "1", time: timeStr },
    status: a.status as Appointment["status"],
    observation: a.notes,
    createdAt: new Date(a.createdAt),
  };
}

export default function AgendamentosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    Promise.all([
      appointmentService.getByClientId(user.uid),
      salonService.getAll(),
    ])
      .then(([firestoreAppointments, firestoreServices]) => {
        const serviceMap = new Map<string, FirestoreService>(
          firestoreServices.filter((s) => s.id).map((s) => [s.id!, s])
        );
        setAppointments(firestoreAppointments.map((a) => mapToLocalAppointment(a, serviceMap)));
      })
      .catch(() => setError("Não foi possível carregar seus agendamentos."))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.date);
    switch (activeTab) {
      case "upcoming":
        return !isPast(appointmentDate) && appointment.status !== "cancelled";
      case "history":
        return isPast(appointmentDate) || appointment.status === "completed" || appointment.status === "cancelled";
      default:
        return true;
    }
  });

  const counts = {
    upcoming: appointments.filter((a) => !isPast(new Date(a.date)) && a.status !== "cancelled").length,
    history: appointments.filter((a) => isPast(new Date(a.date)) || a.status === "completed" || a.status === "cancelled").length,
    all: appointments.length,
  };

  const handleViewDetails = (_appointment: Appointment) => {
    // Preparar para futura implementação
  };

  const handleReschedule = (_appointment: Appointment) => {
    router.push("/agendar");
  };

  const handleCancel = (_appointment: Appointment) => {
    // Preparar para futura implementação
  };

  const handleScheduleNew = () => {
    router.push("/servicos");
  };

  const handleBack = () => {
    router.push("/");
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-red-600 mb-4">{error}</p>
          <Button
            onClick={handleScheduleNew}
            className="bg-linear-to-r from-pink-500 to-rose-500 text-white font-medium"
          >
            Agendar agora
          </Button>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <EmptyAppointmentsState
        onScheduleNew={handleScheduleNew}
        onBack={handleBack}
      />
    );
  }

  return (
    <ClientProtectedRoute>
      <div className="min-h-screen bg-gray-50">
      <AgendamentosHeader
        title="Meus agendamentos"
        subtitle="Gerencie seus horários e tratamentos"
        onBack={handleBack}
      />

      <main className="container px-4 py-8">
        <AppointmentTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={counts}
        />

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
              {activeTab === "upcoming"
                ? "Você não possui agendamentos futuros."
                : "Você não possui agendamentos no histórico."}
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
    </ClientProtectedRoute>
  );
}
