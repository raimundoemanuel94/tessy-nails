"use client";

export const dynamic = 'force-dynamic';

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { PageShell } from "@/components/shared/PageShell";
import { PageHero } from "@/components/shared/PageHero";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { Search, Plus, Phone, Mail, Calendar, MoreHorizontal, Edit, Trash2, Loader2, UserPlus, Users, UserCheck, UserMinus } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { clientService } from "@/services/clients";
import { Client } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClientForm } from "@/components/shared/ClientForm";
import { toast } from "sonner";
import { ensureDate, cn } from "@/lib/utils";

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("active");

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const clientsData = await clientService.getAll();
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filteredClientsList = useMemo(() => {
    let list = clients;
    
    // Filtro de status
    if (statusFilter === "active") {
      list = list.filter(c => c.isActive !== false);
    } else if (statusFilter === "inactive") {
      list = list.filter(c => c.isActive === false);
    }

    if (!searchQuery.trim()) return list;
    
    return list.filter(client =>
      (client.name && client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (client.phone && client.phone.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [clients, searchQuery, statusFilter]);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Tem certeza que deseja desativar este cliente?")) return;
    setActionLoading(id);
    try {
      await clientService.deactivate(id);
      toast.success("Cliente desativado com sucesso.");
      await loadClients();
    } catch (error) {
      toast.error("Erro ao desativar cliente.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleHardDelete = async (id: string) => {
    if (!confirm("⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL. Tem certeza que deseja excluir PERMANENTEMENTE este cliente do sistema?")) return;
    setActionLoading(id);
    try {
      await clientService.hardDelete(id);
      toast.success("Cliente removido permanentemente.");
      await loadClients();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir cliente permanentemente.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader 
        title="Clientes" 
        description="Gerencie sua base de clientes e acompanhe o crescimento."
        icon={Users}
      >
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingClient(null);
        }}>
          <DialogTrigger
            render={
              <Button className="gap-2" size="lg">
                <Plus size={20} className="stroke-3" /> Novo Cliente
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <ClientForm 
              client={editingClient} 
              onSuccess={() => {
                setIsDialogOpen(false);
                setEditingClient(null);
                loadClients();
              }}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingClient(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <PageHero 
        title="Sua Comunidade"
        subtitle="Acompanhe o crescimento, atividade e fidelidade da sua base de clientes em um só lugar."
        metrics={[
          { label: "Total", value: clients.length, icon: Users },
          { label: "Ativos", value: clients.filter(c => c.isActive !== false).length, icon: UserCheck },
          { label: "Novos", value: clients.filter(c => {
            const createdAt = ensureDate(c.createdAt);
            const now = new Date();
            return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
          }).length, icon: UserPlus },
        ]}
      />

      {/* Search and Tabs */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between bg-white/40 p-8 rounded-[2.5rem] border border-brand-accent/10 backdrop-blur-2xl shadow-premium">
        <div className="flex flex-col gap-3 w-full lg:w-auto">
          <label className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50 ml-1">Status das Clientes</label>
          <Tabs 
            defaultValue="active" 
            value={statusFilter} 
            onValueChange={setStatusFilter}
            className="w-full lg:w-auto"
          >
            <TabsList className="grid w-full grid-cols-2 lg:w-[350px] h-12 bg-white/50 p-1.5 rounded-2xl border border-brand-accent/10">
              <TabsTrigger 
                value="active" 
                className="rounded-xl data-[state=active]:bg-brand-primary data-[state=active]:text-white data-[state=active]:shadow-premium transition-all font-black text-xs h-full"
              >
                Ativas ({clients.filter(c => c.isActive !== false).length})
              </TabsTrigger>
              <TabsTrigger 
                value="inactive" 
                className="rounded-xl data-[state=active]:bg-brand-primary data-[state=active]:text-white data-[state=active]:shadow-premium transition-all font-black text-xs h-full"
              >
                Inativas ({clients.filter(c => c.isActive === false).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col gap-3 flex-1 w-full max-w-md">
          <label className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-50 ml-1">Buscar na Lista</label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-sub opacity-40 group-focus-within:text-brand-primary transition-colors" size={20} />
            <Input
              placeholder="Nome, email ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-2xl border-brand-accent/10 bg-white/50 focus:ring-4 focus:ring-brand-primary/10 transition-all font-bold text-sm shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard 
          title="Total Geral" 
          value={clients.length} 
          icon={Users} 
          description="Clientes registrados"
          variant="primary"
        />
        <MetricCard 
          title="Status Ativo" 
          value={clients.filter(c => c.isActive !== false).length} 
          icon={UserCheck} 
          description="Clientes Recorrentes"
          variant="success"
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard 
          title="Inativas" 
          value={clients.filter(c => c.isActive === false).length} 
          icon={UserMinus} 
          description="Clientes perdidos"
          variant="warning"
        />
      </div>

      {/* Clients Table */}
      <SectionCard 
        title="Lista de Clientes" 
        description="Visualize e gerencie todos os seus clientes cadastrados."
      >
        {filteredClientsList.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-brand-accent/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-40">Cliente</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-40">Contato</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-40">Agendamentos</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-40">Última Visita</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-40">Status</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-[2px] text-brand-text-sub opacity-40">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientsList.map((client) => (
                <TableRow key={client.id} className="group border-brand-accent/5 hover:bg-brand-soft/10 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl border border-brand-accent/10 shadow-sm">
                        <AvatarImage src={client.photoURL} />
                        <AvatarFallback className="bg-linear-to-br from-brand-primary to-brand-secondary text-white font-black">
                          {client.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-black text-brand-text-main group-hover:text-brand-primary transition-colors tracking-tight">
                          {client.name}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-brand-text-sub opacity-40">
                          Desde {format(ensureDate(client.createdAt), "MMM yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 group/contact">
                        <div className="w-6 h-6 rounded-lg bg-brand-soft/20 flex items-center justify-center text-brand-text-sub group-hover/contact:text-brand-primary transition-colors">
                          <Mail size={12} />
                        </div>
                        <span className="text-xs font-bold text-brand-text-main">{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2 group/contact">
                          <div className="w-6 h-6 rounded-lg bg-brand-soft/20 flex items-center justify-center text-brand-text-sub group-hover/contact:text-brand-primary transition-colors">
                            <Phone size={12} />
                          </div>
                          <span className="text-xs font-bold text-brand-text-main">{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs border border-slate-200/40 dark:border-white/5">
                        {client.totalAppointments}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.lastVisit ? (
                      <span className="text-xs font-black text-brand-text-main tabular-nums">
                        {format(ensureDate(client.lastVisit), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    ) : (
                      <Badge variant="neutral" size="xs" className="opacity-30">Nunca</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.isActive !== false ? "success" : "neutral"} size="xs" className="border-none shadow-none font-black">
                      {client.isActive !== false ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" disabled={actionLoading === client.id} className="h-9 w-9 rounded-xl hover:bg-brand-primary/10 text-brand-text-sub hover:text-brand-primary transition-all">
                            {actionLoading === client.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-5 w-5" />
                            )}
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="rounded-2xl border border-brand-accent/10 p-2 shadow-premium-xl bg-white">
                        <DropdownMenuItem onClick={() => handleEdit(client)} className="rounded-xl font-bold cursor-pointer">
                          <Edit className="h-4 w-4 mr-2 text-brand-primary" />
                          Editar
                        </DropdownMenuItem>
                        {client.isActive !== false ? (
                          <DropdownMenuItem 
                            className="rounded-xl font-bold text-amber-600 focus:text-amber-600 cursor-pointer" 
                            onClick={() => client.id && handleDeactivate(client.id)}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Desativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            className="rounded-xl font-bold text-emerald-600 focus:text-emerald-600 cursor-pointer" 
                            onClick={() => client.id && clientService.update(client.id, { isActive: true }).then(() => {
                              toast.success("Cliente reativado.");
                              loadClients();
                            })}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Reativar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="rounded-xl font-black text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer" 
                          onClick={() => client.id && handleHardDelete(client.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir Permanente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-20 bg-slate-50/50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
            <Users className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <div className="text-slate-500 dark:text-slate-400 font-bold">
              {searchQuery.trim() 
                ? "Nenhum cliente encontrado para esta busca."
                : "Nenhum cliente cadastrado ainda."
              }
            </div>
            {!searchQuery.trim() && (
              <Button size="lg" className="mt-6 gap-2 font-bold">
                <Plus className="h-5 w-5 stroke-3" />
                Cadastrar Primeiro Cliente
              </Button>
            )}
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}
