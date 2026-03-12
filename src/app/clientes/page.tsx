"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Search, Plus, User, Phone, Mail, MoreHorizontal } from "lucide-react";
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const mockClients = [
  { id: "1", name: "Maria Silva", phone: "(11) 98765-4321", email: "maria@email.com", lastVisit: "10/03/2026" },
  { id: "2", name: "Ana Oliveira", phone: "(11) 91234-5678", email: "ana@email.com", lastVisit: "05/03/2026" },
  { id: "3", name: "Carla Santos", phone: "(11) 99988-7766", email: "carla@email.com", lastVisit: "28/02/2026" },
  { id: "4", name: "Bruna Lima", phone: "(11) 95544-3322", email: "bruna@email.com", lastVisit: "15/02/2026" },
];

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = mockClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <AdminLayout>
      <PageHeader 
        title="Gestão de Clientes" 
        description="Visualize e gerencie as informações de suas clientes."
      >
        <Button className="gap-2">
          <Plus size={18} /> Nova Cliente
        </Button>
      </PageHeader>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por nome ou telefone..." 
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
              <TableHead>Cliente</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Última Visita</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {client.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{client.name}</span>
                      <span className="text-xs text-muted-foreground">{client.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone size={14} className="text-muted-foreground" />
                      {client.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail size={12} />
                      {client.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{client.lastVisit}</TableCell>
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
                      <DropdownMenuItem className="cursor-pointer">Ver Detalhes</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">Editar</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-destructive">Excluir</DropdownMenuItem>
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
