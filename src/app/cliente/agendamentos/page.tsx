"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isPast } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentService } from "@/services/appointments";
import { toast } from "sonner";
import { EmptyAppointmentsState } from "@/components/cliente/EmptyAppointmentsState";
import { AgendamentosHeader } from "@/components/cliente/AgendamentosHeader";
import { AppointmentTabs } from "@/components/cliente/AppointmentTabs";
import { AppointmentCard, Appointment as AppointmentCardType } from "@/components/cliente/AppointmentCard";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { AgendamentosSkeleton } from "@/components/cliente/ClienteSkeletons";
import { Plus } from "lucide-react";

// ✅ CORRIGIDO: Adicionado no_show que faltava
type ClientAppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show";

interface ClientAppointment {
  id: string;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    price?: string;
    duration?: string;
  };
  date: Date;
  time: { id: string; time: string };
  status: ClientAppointmentStatus;
  observation?: string;
  createdAt: Date;
}

export default function AgendamentosPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history" | "all">("upcoming");

  useEffect(() => {
    const loadAppointments = async () => {
      if (authLoading) return;
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setError("Você precisa estar logado para ver seus agendamentos.");
          return;
        }

        if (!navigator.onLine) {
          setError("Sem conexão com a internet. Verifique sua conexão.");
          return;
        }

        const appointmentsWithServiceDetails =
          await appointmentService.getByClientIdWithServices(user.uid);

        if (!appointmentsWithServiceDetails || appointmentsWithServiceDetails.length === 0) {
          setAppointments([]);
          setLoading(false);
          return;
        }

        const formattedAppointments: ClientAppointment[] = appointmentsWithServiceDetails
          .filter((apt): apt is typeof apt & { status: ClientAppointmentStatus } =>
            apt.status === "pending" ||
            apt.status === "confirmed" ||
            apt.status === "completed" ||
            apt.status === "cancelled" ||
            apt.status === "no_show"  // ✅ CORRIGIDO: incluído no_show
          )
          .map((apt) => ({
            ...apt,
            service: {
              ...apt.service,
              price: `R$ ${apt.service.price.toFixed(2)}`,
              duration: `${apt.service.durationMinutes}min`,
            },
          }));

        setAppointments(formattedAppointments);
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "permission-denied") {
          setError("Sem permissão para acessar seus agendamentos.");
        } else if (code === "unavailable") {
          setError("Serviço temporariamente indisponível. Tente novamente.");
        } else {
          setError("Não foi possível carregar seus agendamentos.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [user, authLoading]);

  const filteredAppointments = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.date);
    switch (activeTab) {
      case "upcoming":
        return !isPast(appointmentDate) && appointment.status !== "cancelled";
      case "history":
        return (
          isPast(appointmentDate) ||
          appointment.status === "completed" ||
          appointment.status === "cancelled"
        );
      default:
        return true;
    }
  });

  const counts = {
    upcoming: appointments.filter(
      (a) => !isPast(new Date(a.date)) && a.status !== "cancelled"
    ).length,
    history: appointments.filter(
      (a) =>
        isPast(new Date(a.date)) ||
        a.status === "completed" ||
        a.status === "cancelled"
    ).length,
    all: appointments.length,
  };

  const handleTabChange = (tab: string) => {
    if (tab === "upcoming" || tab === "history" || tab === "all") {
      setActiveTab(tab as "upcoming" | "history" | "all");
    }
  };

  const handleReschedule = () => router.push("/cliente/agendar");
  const handleCancel = (appointment: AppointmentCardType) => {
    appointmentService.cancel(appointment.id)
      .then(() => {
        setAppointments((prev: ClientAppointment[]) =>
          prev.map((a: ClientAppointment) =>
            a.id === appointment.id ? { ...a, status: "cancelled" as ClientAppointmentStatus } : a
          )
        );
        toast.success("Agendamento cancelado.");
      })
      .catch((err) => {
        console.error("Erro ao cancelar agendamento:", err);
        toast.error("Não foi possível cancelar. Tente novamente.");
      });
  };
  const handleScheduleNew = () => router.push("/cliente/servicos");
  const handleBack = () => router.push("/cliente");

  if (loading) {
    return <AgendamentosSkeleton />;
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
    <div className="min-h-screen bg-brand-background pb-28">
      <AgendamentosHeader
        title="Meus agendamentos"
        subtitle="Gerencie seus horários e tratamentos"
        onBack={handleBack}
      />

      <main className="px-5 py-6 max-w-2xl mx-auto">
        <AppointmentTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={counts}
        />

        {error && (
          <div className="mb-4">
            <ErrorState
              title="Erro ao carregar agendamentos"
              message={error}
              onRetry={() => window.location.reload()}
              size="sm"
            />
          </div>
        )}

        {filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment as unknown as AppointmentCardType}
                onReschedule={handleReschedule}
                onCancel={handleCancel}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 h-16 w-16 rounded-2xl bg-white border border-brand-soft flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-base font-black text-brand-text-main mb-1">
              Nenhum agendamento aqui
            </h3>
            <p className="text-xs text-brand-text-muted mb-6">
              {activeTab === "upcoming"
                ? "Você não tem horários futuros."
                : "Nenhum registro neste período."}
            </p>
            <Button
              onClick={handleScheduleNew}
              className="h-10 px-6 rounded-full bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold"
            >
              <Plus size={14} className="mr-1.5" strokeWidth={3} />
              Agendar agora
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
