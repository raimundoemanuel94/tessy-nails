"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, ArrowLeft, Calendar, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { salonService } from "@/services/salon";
import { Service } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadService = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!params.id || typeof params.id !== 'string') {
          setError('ID do serviço inválido');
          return;
        }

        const serviceData = await salonService.getById(params.id);
        
        if (!serviceData) {
          setError('Serviço não encontrado');
          return;
        }

        setService(serviceData);
      } catch (err) {
        console.error('Error loading service:', err);
        setError('Não foi possível carregar os detalhes do serviço');
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [params.id]);

  const handleScheduleClick = () => {
    if (!user) {
      toast.error('Você precisa estar logado para agendar um serviço');
      router.push('/login');
      return;
    }

    if (!service) return;

    // Armazenar serviço selecionado e redirecionar para agendamento
    const appointmentData = {
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      serviceDuration: service.durationMinutes
    };

    // Salvar no localStorage ou contexto
    localStorage.setItem('selectedService', JSON.stringify(appointmentData));
    
    toast.success('Serviço selecionado! Redirecionando para o agendamento...');
    router.push('/cliente/agendar');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes do serviço...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-brand-primary/5 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error || 'Serviço não encontrado'}</p>
          </div>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Serviços
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {service.name}
            </h1>
            <p className="text-lg text-gray-600">
              Serviço profissional de alta qualidade
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="bg-linear-to-r from-brand-primary to-brand-secondary h-48 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-6xl mb-4">💅</div>
                  <h2 className="text-2xl font-bold">{service.name}</h2>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">Descrição do Serviço</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {service.description || 'Serviço profissional realizado com produtos de alta qualidade e técnicas modernas.'}
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">O que está incluído</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>Atendimento profissional</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>Produtos de alta qualidade</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>Ambiente confortável e higienizado</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>Duração garantida do serviço</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">Informações Adicionais</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Clock className="h-5 w-5 text-brand-primary mr-2" />
                        <span className="font-medium">Duração</span>
                      </div>
                      <p className="text-gray-700">{service.durationMinutes} minutos</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <DollarSign className="h-5 w-5 text-brand-primary mr-2" />
                        <span className="font-medium">Preço</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        R$ {service.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {service.category && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3">Categoria</h3>
                    <Badge variant="secondary" className="text-sm">
                      {service.category}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-center">Agendar este Serviço</CardTitle>
                <CardDescription className="text-center">
                  Clique abaixo para selecionar este serviço e continuar com o agendamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-brand-primary mb-2">
                    R$ {service.price.toFixed(2)}
                  </div>
                  <div className="flex items-center justify-center text-brand-text-sub mb-4">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{service.durationMinutes} minutos</span>
                  </div>
                </div>

                <Button
                  onClick={handleScheduleClick}
                  className="w-full bg-linear-to-r from-brand-primary to-brand-secondary hover:opacity-90"
                  size="lg"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Agendar Agora
                </Button>

                <div className="text-center text-sm text-gray-500">
                  <p>Você será redirecionado para a página de agendamento</p>
                  <p>para selecionar data e horário</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
