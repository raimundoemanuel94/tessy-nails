"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { appointmentService, clientService, salonService } from "@/services";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Search, Plus, Calendar, Clock, MoreHorizontal, User, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function AgendamentosPage() {
  const [appointments, setAppointments] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [apps, clients, services] = await Promise.all([
          appointmentService.getAll(),
          clientService.getAll(),
          salonService.getAll()
        ]);

        const enriched = apps.map(app => {
          const client = clients.find(c => c.id === app.clientId);
          const service = services.find(s => s.id === app.serviceId);
          
          return {
            id: app.id,
            client: client ? client.name : `Cliente ${app.clientId.slice(0, 8)}`,
            service: service ? service.name : `Serviço ${app.serviceId.slice(0, 8)}`,
            date: format(app.appointmentDate, "dd/MM/yyyy"),
            time: format(app.appointmentDate, "HH:mm"),
            status: app.status,
            price: service ? `R$ ${service.price.toFixed(2)}` : "R$ 0,00"
          };
        });

        setAppointments(enriched);
      } catch (error) {
        console.error("Error loading appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredAppointments = appointments.filter(app => 
    app.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <PageHeader 
        title="Controle de Agendamentos" 
        description="Visualize todo o histórico e próximos agendamentos."
      >
        <Button className="gap-2">
          <Plus size={18} /> Novo Agendamento
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por cliente ou serviço..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar size={14} className="text-muted-foreground" />
                          {app.date}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock size={12} />
                          {app.time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-muted-foreground" />
                        {app.client}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Scissors size={16} className="text-muted-foreground" />
                        {app.service}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        app.status === "confirmed" ? "default" : 
                        app.status === "pending" ? "outline" : 
                        app.status === "completed" ? "secondary" : "destructive"
                      }>
                        {app.status === "confirmed" ? "Confirmado" : 
                         app.status === "pending" ? "Pendente" : 
                         app.status === "completed" ? "Concluído" : "Cancelado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{app.price}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal size={18} />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer">Confirmar</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">Remarcar</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-destructive">Cancelar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum agendamento encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

    </AdminLayout>
  );
}
