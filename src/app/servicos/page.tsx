"use client";

import { useState } from "react";
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

const mockServices = [
  { id: "1", name: "Manicure Simples", duration: "45 min", price: "R$ 45,00", active: true },
  { id: "2", name: "Pedicure Completa", duration: "60 min", price: "R$ 60,00", active: true },
  { id: "3", name: "Alongamento em Gel", duration: "120 min", price: "R$ 180,00", active: true },
  { id: "4", name: "Esmaltação em Gel", duration: "60 min", price: "R$ 80,00", active: true },
  { id: "5", name: "Banho de Gel", duration: "90 min", price: "R$ 120,00", active: false },
];

export default function ServicosPage() {
  return (
    <AdminLayout>
      <PageHeader 
        title="Catálogo de Serviços" 
        description="Defina os serviços oferecidos e seus respectivos valores."
      >
        <Button className="gap-2">
          <Plus size={18} /> Novo Serviço
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockServices.map((service) => (
          <Card key={service.id} className={`transition-all ${!service.active && "opacity-60 bg-slate-50"}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold">{service.name}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="cursor-pointer gap-2">
                    <Edit2 size={16} /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer gap-2 text-destructive">
                    <Trash2 size={16} /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={16} />
                  {service.duration}
                </div>
                <div className="flex items-center gap-1 font-bold text-lg text-primary">
                  <DollarSign size={18} />
                  {service.price}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Badge variant={service.active ? "default" : "outline"}>
                {service.active ? "Ativo" : "Inativo"}
              </Badge>
              <Button variant="outline" size="sm">Ver detalhes</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
