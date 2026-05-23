"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PerfilHeader } from "@/components/cliente/PerfilHeader";
import { ClientProfileCard, ClientData } from "@/components/cliente/ClientProfileCard";
import { PersonalInfoSection, PersonalInfo } from "@/components/cliente/PersonalInfoSection";
import { ProfileShortcuts } from "@/components/cliente/ProfileShortcuts";
import { NoProfileDataState } from "@/components/cliente/NoProfileDataState";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorState } from "@/components/shared/ErrorState";
import { toast } from "sonner";

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
      } catch (error) {
        console.error('Error in loadClientData:', error);
        
        // ✅ Tratamento específico de erros
        if ((error as { code?: string }).code === 'unavailable') {
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

  const handleMyAppointments = () => {
    router.push('/cliente/agendamentos');
  };

  const handleNewAppointment = () => {
    router.push('/cliente/servicos');
  };

  const handleSettings = () => {
    toast.info('Em breve', { description: 'Configurações disponíveis em breve.' });
  };

  const handleHelp = () => {
    toast.info('Em breve', { description: 'Central de ajuda disponível em breve.' });
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

  // Estados de loading com skeleton
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-brand-background pb-28">
        <div className="bg-brand-primary px-5 pt-14 pb-8">
          <div className="h-6 w-32 rounded-full bg-white/20 animate-pulse mb-2" />
          <div className="h-4 w-48 rounded-full bg-white/10 animate-pulse" />
        </div>
        <main className="px-5 py-6 max-w-2xl mx-auto space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white border border-brand-soft p-5 animate-pulse">
              <div className="h-4 w-32 rounded-full bg-brand-soft/30 mb-3" />
              <div className="h-3 w-full rounded-full bg-brand-soft/20 mb-2" />
              <div className="h-3 w-2/3 rounded-full bg-brand-soft/20" />
            </div>
          ))}
        </main>
      </div>
    );
  }

  // Estado de erro com componente reutilizável
  if (error) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center p-5">
        <ErrorState
          title="Erro ao carregar perfil"
          message={error}
          onRetry={() => window.location.reload()}
          onDismiss={() => router.push('/cliente')}
          size="md"
        />
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
            onEditProfile={() => toast.info('Em breve', { description: 'Edição de perfil disponível em breve.' })}
            showEditButton={false}
          />

          {/* Personal Information Section */}
          <PersonalInfoSection 
            info={personalInfo}
            onEdit={() => toast.info('Em breve', { description: 'Edição de dados disponível em breve.' })}
            showEditButton={false}
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
