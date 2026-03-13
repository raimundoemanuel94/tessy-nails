"use client";

export const dynamic = 'force-dynamic';

import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Plus, Scissors, Clock, DollarSign, Edit2, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { salonService } from "@/services/salon";
import { Service } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar serviços reais do Firestore
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // ✅ Validar conexão
        if (!navigator.onLine) {
          setError('Sem conexão com a internet. Verifique sua conexão.');
          return;
        }
        
        const servicesData = await salonService.getAll();
        console.log('Services loaded from Firestore:', servicesData);
        
        // ✅ Validar se há serviços
        if (!servicesData || servicesData.length === 0) {
          console.warn('No services found in Firestore');
          setError('Nenhum serviço encontrado. Cadastre serviços para começar.');
          return;
        }
        
        // ✅ Validar estrutura dos dados
        const validServices = servicesData.filter(service => 
          service.id && 
          service.name && 
          service.price && 
          service.durationMinutes
        );
        
        if (validServices.length === 0) {
          setError('Serviços encontrados mas com dados incompletos. Verifique o cadastro.');
          return;
        }
        
        setServices(validServices);
      } catch (error: any) {
        console.error('Error loading services:', error);
        
        // ✅ Tratamento específico de erros
        if (error.code === 'permission-denied') {
          setError('Sem permissão para acessar os serviços. Verifique suas permissões.');
        } else if (error.code === 'unavailable') {
          setError('Serviço temporariamente indisponível. Tente novamente em alguns minutos.');
        } else {
          setError('Não foi possível carregar os serviços. Verifique sua conexão e tente novamente.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Scissors className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar serviços</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </AdminLayout>
    );
  }

  if (services.length === 0) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Scissors className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Nenhum serviço cadastrado</h2>
          <p className="text-gray-600 mb-4">Cadastre seus primeiros serviços para começar.</p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Serviço
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader 
        title="Serviços" 
        description="Gerencie os serviços oferecidos" 
      />

      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Todos os Serviços</h2>
            <p className="text-sm text-muted-foreground">
              {services.length} serviços cadastrados
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </div>

        {/* Services Grid */}
        {services.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      )}
                    </div>
                    <Badge variant={service.isActive ? "default" : "secondary"}>
                      {service.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{service.durationMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">R$ {service.price.toFixed(2)}</span>
                    </div>
                    {service.category && (
                      <div className="text-sm text-muted-foreground">
                        Categoria: {service.category}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex items-center gap-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit2 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Trash2 className="h-4 w-4 mr-2" />
                          {service.isActive ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum serviço cadastrado</h3>
            <p className="text-muted-foreground mb-6">
              Comece adicionando os serviços que você oferece.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Serviço
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
