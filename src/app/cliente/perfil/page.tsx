"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PerfilHeader } from "@/components/cliente/PerfilHeader";
import { ClientProfileCard, ClientData } from "@/components/cliente/ClientProfileCard";
import { PersonalInfoSection, PersonalInfo } from "@/components/cliente/PersonalInfoSection";
import { ProfileShortcuts } from "@/components/cliente/ProfileShortcuts";
import { NoProfileDataState } from "@/components/cliente/NoProfileDataState";
import { useAuth } from "@/contexts/AuthContext";

export default function PerfilPage() {
  const router = useRouter();
  const { client, user, loading: authLoading, signOut } = useAuth();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados reais do cliente
  useEffect(() => {
    const loadClientData = async () => {
      if (authLoading) return;
      
      try {
        setLoading(true);
        setError(null);

        // ✅ Validar usuário autenticado
        if (!user) {
          setError('Você precisa estar logado para ver seu perfil.');
          return;
        }

        // ✅ Validar conexão
        if (!navigator.onLine) {
          setError('Sem conexão com a internet. Verifique sua conexão.');
          return;
        }

        if (client) {
          setClientData({
            id: client.id || user.uid,
            name: client.name,
            email: client.email || "",
            phone: client.phone || "Não informado",
            status: "active",
            createdAt: client.createdAt,
          });
          setPersonalInfo({
            fullName: client.name,
            email: client.email || "",
            phone: client.phone || "Não informado",
            address: "Não informado",
            birthDate: undefined,
            observations: client.notes || undefined,
          });
        }
        // Se client for null aqui, o AuthContext já cuida via needsPhoneLink.
      } catch (error: any) {
        console.error('Error in loadClientData:', error);
        
        // ✅ Tratamento específico de erros
        if (error.code === 'unavailable') {
          setError('Serviço temporariamente indisponível. Tente novamente em alguns minutos.');
        } else {
          setError('Ocorreu um erro ao carregar seus dados. Tente novamente mais tarde.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadClientData();
  }, [client, user, authLoading]);

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
    // Usar o signOut do AuthContext
    signOut();
    
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
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
          <p className="mt-4 text-brand-text-sub">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center">
        <div className="text-center p-8">
          <div className="mb-4">
            <svg className="h-12 w-12 text-destructive mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-brand-text-main mb-2">Erro no Perfil</h3>
          <p className="text-brand-text-sub mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => router.push('/cliente')}
              className="px-4 py-2 border border-brand-accent/30 rounded-lg hover:bg-brand-soft/30 transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
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
    <div className="min-h-screen bg-brand-background pb-28">
      <PerfilHeader
        title="Meu perfil"
        subtitle="Gerencie seus dados e preferências"
        onBack={handleBack}
      />

      <main className="px-5 py-6 max-w-2xl mx-auto">
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
