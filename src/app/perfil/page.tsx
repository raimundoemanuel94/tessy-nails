"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PerfilHeader } from "@/components/client/PerfilHeader";
import { ClientProfileCard, ClientData } from "@/components/client/ClientProfileCard";
import { PersonalInfoSection, PersonalInfo } from "@/components/client/PersonalInfoSection";
import { ProfileShortcuts } from "@/components/client/ProfileShortcuts";
import { NoProfileDataState } from "@/components/client/NoProfileDataState";
import { useAuth } from "@/contexts/AuthContext";
import { clientService } from "@/services";
import { ClientProtectedRoute } from "@/components/auth/ClientProtectedRoute";

export default function PerfilPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Dados básicos sempre disponíveis via AuthContext
    const baseClientData: ClientData = {
      id: user.uid,
      name: user.name,
      email: user.email,
      phone: "",
      avatar: user.photoURL,
      status: user.isActive ? "active" : "inactive",
      createdAt: new Date(user.createdAt),
    };

    const basePersonalInfo: PersonalInfo = {
      fullName: user.name,
      email: user.email,
      phone: "",
    };

    // Tentar enriquecer com dados do Firestore (coleção clients)
    clientService
      .getById(user.uid)
      .then((clientDoc) => {
        if (clientDoc) {
          setClientData({
            ...baseClientData,
            phone: clientDoc.phone ?? "",
          });
          setPersonalInfo({
            ...basePersonalInfo,
            phone: clientDoc.phone ?? "",
            observations: clientDoc.notes,
          });
        } else {
          setClientData(baseClientData);
          setPersonalInfo(basePersonalInfo);
        }
      })
      .catch(() => {
        setClientData(baseClientData);
        setPersonalInfo(basePersonalInfo);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleEditProfile = () => {
    // Preparar para futura implementação
  };

  const handleEditPersonalInfo = () => {
    // Preparar para futura implementação
  };

  const handleMyAppointments = () => {
    router.push("/agendamentos");
  };

  const handleNewAppointment = () => {
    router.push("/servicos");
  };

  const handleSettings = () => {
    // Preparar para futura implementação
  };

  const handleHelp = () => {
    // Preparar para futura implementação
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const handleBackToHome = () => {
    router.push("/cliente");
  };

  const handleBack = () => {
    router.push("/cliente");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!clientData || !personalInfo) {
    return (
      <NoProfileDataState
        onBackToHome={handleBackToHome}
        onGoToAppointments={handleMyAppointments}
      />
    );
  }

  return (
    <ClientProtectedRoute>
      <div className="min-h-screen bg-gray-50">
      <PerfilHeader
        title="Meu perfil"
        subtitle="Gerencie seus dados e preferências"
        onBack={handleBack}
      />

      <main className="container px-4 py-8">
        <div className="space-y-6">
          <ClientProfileCard
            client={clientData}
            onEditProfile={handleEditProfile}
            showEditButton={true}
          />

          <PersonalInfoSection
            info={personalInfo}
            onEdit={handleEditPersonalInfo}
            showEditButton={true}
          />

          <ProfileShortcuts
            onMyAppointments={handleMyAppointments}
            onNewAppointment={handleNewAppointment}
            onSettings={handleSettings}
            onHelp={handleHelp}
            onLogout={handleLogout}
            onBackToHome={handleBackToHome}
          />
        </div>
      </main>
    </div>
    </ClientProtectedRoute>
  );
}
