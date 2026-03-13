"use client";

export const dynamic = 'force-dynamic';

import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Phone, Mail, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { clientService } from "@/services/clients";
import { Client } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const clientsData = await clientService.getAll();
        setClients(clientsData);
        setFilteredClients(clientsData);
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  useEffect(() => {
    let filtered = clients;
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.phone && client.phone.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredClients(filtered);
  }, [clients, searchQuery]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader 
        title="Clientes" 
        description="Gerencie sua base de clientes" 
      />

      <div className="space-y-6">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Total de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground">Cadastrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Clientes Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground">Todos ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Novos este Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter(c => {
                  const createdAt = new Date(c.createdAt);
                  const now = new Date();
                  return createdAt.getMonth() === now.getMonth() && 
                         createdAt.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">Cadastrados recentemente</p>
            </CardContent>
          </Card>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredClients.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Total Agendamentos</TableHead>
                    <TableHead>Última Visita</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Desde {format(client.createdAt, "MMM yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{client.email}</span>
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{client.totalAppointments}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.lastVisit ? (
                          <span className="text-sm">
                            {format(client.lastVisit, "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          Ativo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  {searchQuery.trim() 
                    ? "Nenhum cliente encontrado para esta busca."
                    : "Nenhum cliente cadastrado ainda."
                  }
                </div>
                {!searchQuery.trim() && (
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Primeiro Cliente
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
