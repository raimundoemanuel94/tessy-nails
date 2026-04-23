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
import { AppointmentCard } from "@/components/cliente/AppointmentCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type ClientAppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

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

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-brand-soft bg-white animate-pulse">
      <div className="h-1 w-full bg-brand-soft" />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-16 rounded-full bg-brand-soft" />
            <div className="h-4 w-48 rounded-full bg-brand-soft" />
          </div>
          <div className="h-6 w-20 rounded-full bg-brand-soft" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-9 rounded-xl bg-brand-soft" />
          <div className="flex-1 h-9 rounded-xl bg-brand-soft" />
        </div>
        <div className="h-12 rounded-2xl bg-brand-soft" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-11 rounded-2xl bg-brand-soft" />
          <div className="h-11 rounded-2xl bg-brand-soft" />
        </div>
      </div>
    </div>
  );
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
            apt.status === "cancelled"
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
  const handleCancel = async (appointment: { id: string }) => {
    try {
      await appointmentService.cancel(appointment.id);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointment.id ? { ...a, status: "cancelled" } : a
        )
      );
      toast.success("Agendamento cancelado.");
    } catch (err) {
      console.error("Erro ao cancelar agendamento:", err);
      toast.error("Não foi possível cancelar. Tente novamente.");
    }
  };
  const handleScheduleNew = () => router.push("/cliente/servicos");
  const handleBack = () => router.push("/cliente");

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-background pb-28">
        <AgendamentosHeader
          title="Meus agendamentos"
          subtitle="Gerencie seus horários"
          onBack={handleBack}
        />
        <main className="px-5 py-6 max-w-2xl mx-auto space-y-4">
          <div className="flex gap-2 mb-5">
            {["Próximos", "Histórico", "Todos"].map((t) => (
              <div key={t} className="h-10 w-24 rounded-full bg-white border border-brand-soft animate-pulse" />
            ))}
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </main>
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
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-bold">
            {error}
          </div>
        )}

        {filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
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
