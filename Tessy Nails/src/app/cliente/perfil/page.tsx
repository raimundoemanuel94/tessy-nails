"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PerfilHeader } from "@/components/client/PerfilHeader";
import { ClientProfileCard, ClientData } from "@/components/client/ClientProfileCard";
import { PersonalInfoSection, PersonalInfo } from "@/components/client/PersonalInfoSection";
import { ProfileShortcuts } from "@/components/client/ProfileShortcuts";
import { NoProfileDataState } from "@/components/client/NoProfileDataState";

// Mock data para perfil da cliente
const generateMockClientData = (): ClientData => {
  return {
    id: "1",
    name: "Maria Silva",
    email: "maria.silva@email.com",
    phone: "(11) 98765-4321",
    status: "active",
    createdAt: new Date("2024-01-15")
  };
};

const generateMockPersonalInfo = (): PersonalInfo => {
  return {
    fullName: "Maria Silva Santos",
    email: "maria.silva@email.com",
    phone: "(11) 98765-4321",
    address: "Rua das Flores, 123 - Jardim Primavera, São Paulo - SP",
    birthDate: new Date("1990-05-15"),
    observations: "Cliente preferencial, sempre agendar com a profissional Ana."
  };
};

export default function PerfilPage() {
  const router = useRouter();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados mockados
  useEffect(() => {
    const mockClientData = generateMockClientData();
    const mockPersonalInfo = generateMockPersonalInfo();
    
    setClientData(mockClientData);
    setPersonalInfo(mockPersonalInfo);
    setLoading(false);
  }, []);

  const handleEditProfile = () => {
    // Preparar para futura implementação
    console.log('Edit profile');
  };

  const handleEditPersonalInfo = () => {
    // Preparar para futura implementação
    console.log('Edit personal info');
  };

  const handleMyAppointments = () => {
    router.push('/cliente/agendamentos');
  };

  const handleNewAppointment = () => {
    router.push('/cliente/servicos');
  };

  const handleSettings = () => {
    // Preparar para futura implementação
    console.log('Settings');
  };

  const handleHelp = () => {
    // Preparar para futura implementação
    console.log('Help');
  };

  const handleLogout = () => {
    // Limpar dados de autenticação (mock)
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    
    // Redirecionar para login
    router.push('/login');
  };

  const handleBackToHome = () => {
    router.push('/cliente');
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
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Estado sem dados
  if (!clientData || !personalInfo) {
    return (
      <NoProfileDataState 
        onBackToHome={handleBackToHome}
        onGoToAppointments={handleMyAppointments}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PerfilHeader 
        title="Meu perfil"
        subtitle="Gerencie seus dados e preferências"
        onBack={handleBack}
      />

      <main className="container px-4 py-8">
        <div className="space-y-6">
          {/* Client Profile Card */}
          <ClientProfileCard 
            client={clientData}
            onEditProfile={handleEditProfile}
            showEditButton={true}
          />

          {/* Personal Information Section */}
          <PersonalInfoSection 
            info={personalInfo}
            onEdit={handleEditPersonalInfo}
            showEditButton={true}
          />

          {/* Profile Shortcuts */}
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
  );
}
