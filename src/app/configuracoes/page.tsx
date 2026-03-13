"use client";

export const dynamic = 'force-dynamic';

import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { 
  User, 
  Settings, 
  Bell, 
  CreditCard, 
  Store, 
  Shield, 
  Moon, 
  Sun 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme();

  return (
    <AdminLayout>
      <PageHeader 
        title="Configurações" 
        description="Personalize o sistema e gerencie suas preferências."
      />

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="mb-8 flex flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="perfil" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border rounded-md px-4 py-2">
            <User size={16} className="mr-2" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="salao" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border rounded-md px-4 py-2">
            <Store size={16} className="mr-2" /> Salão
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border rounded-md px-4 py-2">
            <Bell size={16} className="mr-2" /> Notificações
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border rounded-md px-4 py-2">
            <Moon size={16} className="mr-2" /> Aparência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Gerencie suas informações de acesso e perfil.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" defaultValue="Tessy Nails" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="contato@tessynails.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" defaultValue="(11) 98765-4321" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button>Salvar Alterações</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="salao">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Salão</CardTitle>
              <CardDescription>Configure os detalhes do seu estabelecimento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="salonName">Nome do Salão</Label>
                <Input id="salonName" defaultValue="Tessy Nails Studio" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" defaultValue="Rua das Flores, 123 - Centro" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Atendimento aos Domingos</Label>
                    <p className="text-sm text-muted-foreground">Permitir agendamentos aos domingos.</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Intervalo entre agendamentos</Label>
                    <p className="text-sm text-muted-foreground">Tempo de limpeza entre clientes.</p>
                  </div>
                  <Badge variant="outline">15 min</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button>Atualizar Salão</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia">
          <Card>
            <CardHeader>
              <CardTitle>Tema do Sistema</CardTitle>
              <CardDescription>Escolha como o sistema deve aparecer para você.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Modo Escuro</span>
                  <p className="text-sm text-muted-foreground">Alterne entre os temas claro e escuro.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Sun size={18} className={theme === "light" ? "text-primary" : "text-muted-foreground"} />
                  <Switch 
                    checked={theme === "dark"} 
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                  />
                  <Moon size={18} className={theme === "dark" ? "text-primary" : "text-muted-foreground"} />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Cor de Destaque</Label>
                <div className="flex gap-2 pt-2">
                  {["bg-pink-500", "bg-purple-500", "bg-indigo-500", "bg-rose-500"].map((color) => (
                    <div 
                      key={color} 
                      className={`h-8 w-8 rounded-full cursor-pointer border-2 border-transparent hover:border-slate-400 ${color}`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
