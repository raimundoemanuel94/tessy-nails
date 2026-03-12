"use client";

import { useState } from "react";
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

const mockAppointments = [
  { id: "1", client: "Maria Silva", service: "Manicure", date: "12/03/2026", time: "14:00", status: "confirmed", price: "R$ 45,00" },
  { id: "2", client: "Ana Oliveira", service: "Alongamento em Gel", date: "12/03/2026", time: "15:30", status: "pending", price: "R$ 180,00" },
  { id: "3", client: "Carla Santos", service: "Pedicure", date: "11/03/2026", time: "10:00", status: "completed", price: "R$ 60,00" },
  { id: "4", client: "Bruna Lima", service: "Esmaltação em Gel", date: "11/03/2026", time: "11:30", status: "cancelled", price: "R$ 80,00" },
];

export default function AgendamentosPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAppointments = mockAppointments.filter(app => 
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
            {filteredAppointments.map((app) => (
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
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal size={18} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer">Confirmar</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">Remarcar</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-destructive">Cancelar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
