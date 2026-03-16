"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
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
  Sun,
  Check,
  Mail,
  MessageSquare,
  Calendar as CalendarIcon
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
import { cn } from "@/lib/utils";

const accentColors = [
  { name: 'Violeta', value: 'violet', class: 'bg-violet-500' },
  { name: 'Roxo', value: 'purple', class: 'bg-purple-500' },
  { name: 'Índigo', value: 'indigo', class: 'bg-indigo-500' },
  { name: 'Rosa', value: 'pink', class: 'bg-pink-500' },
  { name: 'Azul', value: 'blue', class: 'bg-blue-500' },
  { name: 'Verde', value: 'green', class: 'bg-green-500' }
];

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme();
  const [selectedColor, setSelectedColor] = useState('violet');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    newAppointment: true,
    appointmentReminder: true,
    appointmentCancellation: true,
    paymentReceived: true
  });

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

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>Escolha como e quando deseja receber notificações.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Canais de Notificação */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Canais de Comunicação</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail size={18} className="text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="font-medium">Email</Label>
                        <p className="text-sm text-muted-foreground">Receber notificações por email</p>
                      </div>
                    </div>
                    <Switch 
                      checked={notifications.email}
                      onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Bell size={18} className="text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="font-medium">Push (Navegador)</Label>
                        <p className="text-sm text-muted-foreground">Notificações no navegador</p>
                      </div>
                    </div>
                    <Switch 
                      checked={notifications.push}
                      onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <MessageSquare size={18} className="text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="font-medium">SMS</Label>
                        <p className="text-sm text-muted-foreground">Mensagens de texto (em breve)</p>
                      </div>
                    </div>
                    <Switch 
                      checked={notifications.sms}
                      onCheckedChange={(checked) => setNotifications({...notifications, sms: checked})}
                      disabled
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Tipos de Notificação */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Eventos para Notificar</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="font-medium text-sm">Novo Agendamento</Label>
                      <p className="text-xs text-muted-foreground">Quando um cliente fizer um novo agendamento</p>
                    </div>
                    <Switch 
                      checked={notifications.newAppointment}
                      onCheckedChange={(checked) => setNotifications({...notifications, newAppointment: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="font-medium text-sm">Lembrete de Agendamento</Label>
                      <p className="text-xs text-muted-foreground">1 hora antes do horário marcado</p>
                    </div>
                    <Switch 
                      checked={notifications.appointmentReminder}
                      onCheckedChange={(checked) => setNotifications({...notifications, appointmentReminder: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="font-medium text-sm">Cancelamento</Label>
                      <p className="text-xs text-muted-foreground">Quando um agendamento for cancelado</p>
                    </div>
                    <Switch 
                      checked={notifications.appointmentCancellation}
                      onCheckedChange={(checked) => setNotifications({...notifications, appointmentCancellation: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="font-medium text-sm">Pagamento Recebido</Label>
                      <p className="text-xs text-muted-foreground">Confirmação de pagamentos</p>
                    </div>
                    <Switch 
                      checked={notifications.paymentReceived}
                      onCheckedChange={(checked) => setNotifications({...notifications, paymentReceived: checked})}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button>Salvar Preferências</Button>
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
              <div className="space-y-3">
                <Label>Cor de Destaque</Label>
                <p className="text-sm text-muted-foreground">Escolha a cor principal do sistema.</p>
                <div className="flex flex-wrap gap-3 pt-2">
                  {accentColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={cn(
                        "relative h-10 w-10 rounded-full cursor-pointer transition-all hover:scale-110",
                        color.class,
                        selectedColor === color.value && "ring-2 ring-offset-2 ring-primary"
                      )}
                      title={color.name}
                    >
                      {selectedColor === color.value && (
                        <Check className="absolute inset-0 m-auto text-white" size={20} strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  Cor selecionada: <span className="font-bold">{accentColors.find(c => c.value === selectedColor)?.name}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
