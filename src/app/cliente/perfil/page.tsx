"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PerfilHeader } from "@/components/client/PerfilHeader";
import { ClientProfileCard, ClientData } from "@/components/client/ClientProfileCard";
import { PersonalInfoSection, PersonalInfo } from "@/components/client/PersonalInfoSection";
import { ProfileShortcuts } from "@/components/client/ProfileShortcuts";
import { NoProfileDataState } from "@/components/client/NoProfileDataState";
import { useAuth } from "@/contexts/AuthContext";
import { clientService } from "@/services/clients";
import { Client } from "@/types";

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
          // ✅ Usar dados do client do AuthContext
          const transformedClientData: ClientData = {
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone || "Não informado",
            status: "active",
            createdAt: client.createdAt
          };

          const transformedPersonalInfo: PersonalInfo = {
            fullName: client.name,
            email: client.email,
            phone: client.phone || "Não informado",
            address: "Não informado",
            birthDate: new Date(),
            observations: client.notes || undefined
          };

          setClientData(transformedClientData);
          setPersonalInfo(transformedPersonalInfo);
        } else {
          // ✅ Buscar dados do cliente pelo UID com tratamento de erro
          try {
            const clientData = await clientService.getById(user.uid);
            if (clientData) {
              const transformedClientData: ClientData = {
                id: clientData.id,
                name: clientData.name,
                email: clientData.email,
                phone: clientData.phone || "Não informado",
                status: "active",
                createdAt: clientData.createdAt
              };

              const transformedPersonalInfo: PersonalInfo = {
                fullName: clientData.name,
                email: clientData.email,
                phone: clientData.phone || "Não informado",
                address: "Não informado",
                birthDate: new Date(),
                observations: clientData.notes || undefined
              };

              setClientData(transformedClientData);
              setPersonalInfo(transformedPersonalInfo);
            } else {
              setError('Dados do cliente não encontrados. Parece que seu cadastro está incompleto. Contate o administrador.');
            }
          } catch (fetchError: any) {
            console.error('Error fetching client data:', fetchError);
            
            // ✅ Tratamento específico de erros
            if (fetchError.code === 'permission-denied') {
              setError('Sem permissão para acessar seus dados. Contate o administrador.');
            } else if (fetchError.code === 'not-found') {
              setError('Seu cadastro não foi encontrado. Faça login novamente ou contate o administrador.');
            } else {
              setError('Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.');
            }
          }
        }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="mb-4">
            <svg className="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro no Perfil</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              Tentar Novamente
            </button>
            <button 
              onClick={() => router.push('/cliente')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
