"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { 
  User, 
  Bell, 
  Store, 
  Shield, 
  Moon, 
  Sun,
  Check,
  Mail,
  MessageSquare,
  Clock,
  MapPin,
  Phone,
  Globe,
  Key,
  Users,
  Zap,
  Save,
  Loader2,
  CreditCard
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
import { toast } from "sonner";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const accentColors = [
  { name: 'Violeta', value: 'violet', class: 'bg-violet-500' },
  { name: 'Roxo', value: 'purple', class: 'bg-purple-500' },
  { name: 'Índigo', value: 'indigo', class: 'bg-indigo-500' },
  { name: 'Rosa', value: 'pink', class: 'bg-pink-500' },
  { name: 'Azul', value: 'blue', class: 'bg-blue-500' },
  { name: 'Verde', value: 'green', class: 'bg-green-500' }
];

const weekDays = [
  { id: 'monday', label: 'Segunda-feira' },
  { id: 'tuesday', label: 'Terça-feira' },
  { id: 'wednesday', label: 'Quarta-feira' },
  { id: 'thursday', label: 'Quinta-feira' },
  { id: 'friday', label: 'Sexta-feira' },
  { id: 'saturday', label: 'Sábado' },
  { id: 'sunday', label: 'Domingo' }
];

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para Perfil
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Estados para Salão
  const [salonData, setSalonData] = useState({
    name: 'Tessy Nails Studio',
    address: 'Sorriso, MT',
    phone: '(66) 98765-4321',
    email: 'contato@tessynails.com',
    workingDays: {
      monday: { enabled: true, start: '09:00', end: '18:00' },
      tuesday: { enabled: true, start: '09:00', end: '18:00' },
      wednesday: { enabled: true, start: '09:00', end: '18:00' },
      thursday: { enabled: true, start: '09:00', end: '18:00' },
      friday: { enabled: true, start: '09:00', end: '18:00' },
      saturday: { enabled: true, start: '09:00', end: '14:00' },
      sunday: { enabled: false, start: '09:00', end: '14:00' }
    },
    appointmentInterval: 15,
    allowSundayBookings: false
  });

  // Estados para Notificações
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    newAppointment: true,
    appointmentReminder: true,
    appointmentCancellation: true,
    paymentReceived: true,
    reminderTime: 60 // minutos antes
  });

  // Estados para Aparência
  const [selectedColor, setSelectedColor] = useState('violet');

  // Estados para Segurança/Permissões
  const [securityData, setSecurityData] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    allowMultipleSessions: true,
    requirePasswordChange: false
  });

  // Estados para Integrações
  const [integrations, setIntegrations] = useState({
    firebaseConfigured: true,
    emailConfigured: false,
    smsConfigured: false,
    paymentsConfigured: false,
    whatsappConfigured: false
  });

  // Carregar configurações do Firestore
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Carregar configurações do salão
        const salonRef = doc(db, 'settings', 'salon');
        const salonSnap = await getDoc(salonRef);
        if (salonSnap.exists()) {
          setSalonData({ ...salonData, ...salonSnap.data() });
        }

        // Carregar preferências do usuário
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setProfileData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || ''
          });
        }

        // Carregar preferências de notificação
        const notifRef = doc(db, 'settings', `notifications_${user.uid}`);
        const notifSnap = await getDoc(notifRef);
        if (notifSnap.exists()) {
          setNotifications({ ...notifications, ...notifSnap.data() });
        }

      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Salvar Perfil
  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: profileData.name,
        phone: profileData.phone,
        updatedAt: new Date()
      });
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  // Salvar Salão
  const handleSaveSalon = async () => {
    try {
      setSaving(true);
      const salonRef = doc(db, 'settings', 'salon');
      await setDoc(salonRef, {
        ...salonData,
        updatedAt: new Date(),
        updatedBy: user?.uid
      });
      toast.success('Configurações do salão atualizadas!');
    } catch (error) {
      console.error('Erro ao salvar salão:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  // Salvar Notificações
  const handleSaveNotifications = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      const notifRef = doc(db, 'settings', `notifications_${user.uid}`);
      await setDoc(notifRef, {
        ...notifications,
        updatedAt: new Date()
      });
      toast.success('Preferências de notificação salvas!');
    } catch (error) {
      console.error('Erro ao salvar notificações:', error);
      toast.error('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto space-y-8 pb-20">
        <PageHeader 
          title="Configurações" 
          description="Personalize o sistema e gerencie suas preferências."
        />

        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="mb-8 flex flex-wrap h-auto gap-2 bg-muted/30 p-2 rounded-xl">
            <TabsTrigger 
              value="perfil" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 font-bold text-sm uppercase tracking-wider transition-all"
            >
              <User size={16} className="mr-2" /> Perfil
            </TabsTrigger>
            <TabsTrigger 
              value="salao" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 font-bold text-sm uppercase tracking-wider transition-all"
            >
              <Store size={16} className="mr-2" /> Salão
            </TabsTrigger>
            <TabsTrigger 
              value="notificacoes" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 font-bold text-sm uppercase tracking-wider transition-all"
            >
              <Bell size={16} className="mr-2" /> Notificações
            </TabsTrigger>
            <TabsTrigger 
              value="aparencia" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 font-bold text-sm uppercase tracking-wider transition-all"
            >
              <Moon size={16} className="mr-2" /> Aparência
            </TabsTrigger>
            <TabsTrigger 
              value="seguranca" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 font-bold text-sm uppercase tracking-wider transition-all"
            >
              <Shield size={16} className="mr-2" /> Segurança
            </TabsTrigger>
            <TabsTrigger 
              value="integracoes" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2 font-bold text-sm uppercase tracking-wider transition-all"
            >
              <Zap size={16} className="mr-2" /> Integrações
            </TabsTrigger>
          </TabsList>

          {/* ABA PERFIL */}
          <TabsContent value="perfil" className="space-y-6">
            <Card className="border-border/40 shadow-lg">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User size={20} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle>Dados Pessoais</CardTitle>
                    <CardDescription>Gerencie suas informações de acesso e perfil</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-semibold">Nome completo</Label>
                    <Input 
                      id="name" 
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-semibold">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profileData.email}
                      disabled
                      className="h-11 bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">Email não pode ser alterado</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-semibold">Telefone</Label>
                    <Input 
                      id="phone" 
                      value={profileData.phone}
                      onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                      placeholder="(00) 00000-0000"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Função</Label>
                    <Badge variant="secondary" className="h-11 px-4 flex items-center w-fit">
                      {user?.role === 'admin' ? 'Administrador' : 'Profissional'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 bg-muted/10">
                <Button onClick={handleSaveProfile} disabled={saving} className="font-bold">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Alterações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ABA SALÃO */}
          <TabsContent value="salao" className="space-y-6">
            <Card className="border-border/40 shadow-lg">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Store size={20} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle>Informações do Salão</CardTitle>
                    <CardDescription>Configure os detalhes do seu estabelecimento</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="salonName" className="font-semibold flex items-center gap-2">
                      <Store size={16} /> Nome do Salão
                    </Label>
                    <Input 
                      id="salonName" 
                      value={salonData.name}
                      onChange={(e) => setSalonData({...salonData, name: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salonPhone" className="font-semibold flex items-center gap-2">
                      <Phone size={16} /> Telefone
                    </Label>
                    <Input 
                      id="salonPhone" 
                      value={salonData.phone}
                      onChange={(e) => setSalonData({...salonData, phone: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address" className="font-semibold flex items-center gap-2">
                      <MapPin size={16} /> Endereço
                    </Label>
                    <Input 
                      id="address" 
                      value={salonData.address}
                      onChange={(e) => setSalonData({...salonData, address: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salonEmail" className="font-semibold flex items-center gap-2">
                      <Mail size={16} /> Email
                    </Label>
                    <Input 
                      id="salonEmail" 
                      type="email"
                      value={salonData.email}
                      onChange={(e) => setSalonData({...salonData, email: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold flex items-center gap-2">
                      <Clock size={16} /> Intervalo entre agendamentos
                    </Label>
                    <Select 
                      value={salonData.appointmentInterval.toString()}
                      onValueChange={(value) => setSalonData({...salonData, appointmentInterval: parseInt(value || '15')})}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="45">45 minutos</SelectItem>
                        <SelectItem value="60">1 hora</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider">Horários de Funcionamento</h3>
                  <div className="space-y-3">
                    {weekDays.map((day) => (
                      <div key={day.id} className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                        <Switch 
                          checked={salonData.workingDays[day.id as keyof typeof salonData.workingDays].enabled}
                          onCheckedChange={(checked) => setSalonData({
                            ...salonData,
                            workingDays: {
                              ...salonData.workingDays,
                              [day.id]: { ...salonData.workingDays[day.id as keyof typeof salonData.workingDays], enabled: checked }
                            }
                          })}
                        />
                        <span className="font-medium min-w-[120px]">{day.label}</span>
                        {salonData.workingDays[day.id as keyof typeof salonData.workingDays].enabled && (
                          <div className="flex items-center gap-2 flex-1">
                            <Input 
                              type="time"
                              value={salonData.workingDays[day.id as keyof typeof salonData.workingDays].start}
                              onChange={(e) => setSalonData({
                                ...salonData,
                                workingDays: {
                                  ...salonData.workingDays,
                                  [day.id]: { ...salonData.workingDays[day.id as keyof typeof salonData.workingDays], start: e.target.value }
                                }
                              })}
                              className="h-9"
                            />
                            <span className="text-muted-foreground">até</span>
                            <Input 
                              type="time"
                              value={salonData.workingDays[day.id as keyof typeof salonData.workingDays].end}
                              onChange={(e) => setSalonData({
                                ...salonData,
                                workingDays: {
                                  ...salonData.workingDays,
                                  [day.id]: { ...salonData.workingDays[day.id as keyof typeof salonData.workingDays], end: e.target.value }
                                }
                              })}
                              className="h-9"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 bg-muted/10">
                <Button onClick={handleSaveSalon} disabled={saving} className="font-bold">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Atualizar Salão
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ABA NOTIFICAÇÕES */}
          <TabsContent value="notificacoes" className="space-y-6">
            <Card className="border-border/40 shadow-lg">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bell size={20} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle>Preferências de Notificação</CardTitle>
                    <CardDescription>Escolha como e quando deseja receber notificações</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Canais de Notificação */}
                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider">Canais de Comunicação</h3>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
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
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
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
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <MessageSquare size={18} className="text-muted-foreground" />
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
                  <h3 className="font-bold text-sm uppercase tracking-wider">Eventos para Notificar</h3>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="font-medium text-sm">Novo Agendamento</Label>
                        <p className="text-xs text-muted-foreground">Quando um cliente fizer um novo agendamento</p>
                      </div>
                      <Switch 
                        checked={notifications.newAppointment}
                        onCheckedChange={(checked) => setNotifications({...notifications, newAppointment: checked})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="font-medium text-sm">Lembrete de Agendamento</Label>
                        <p className="text-xs text-muted-foreground">{notifications.reminderTime} minutos antes do horário marcado</p>
                      </div>
                      <Switch 
                        checked={notifications.appointmentReminder}
                        onCheckedChange={(checked) => setNotifications({...notifications, appointmentReminder: checked})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label className="font-medium text-sm">Cancelamento</Label>
                        <p className="text-xs text-muted-foreground">Quando um agendamento for cancelado</p>
                      </div>
                      <Switch 
                        checked={notifications.appointmentCancellation}
                        onCheckedChange={(checked) => setNotifications({...notifications, appointmentCancellation: checked})}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
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

                <Separator />

                <div className="space-y-2">
                  <Label className="font-semibold">Tempo de antecedência para lembretes</Label>
                  <Select 
                    value={notifications.reminderTime.toString()}
                    onValueChange={(value) => setNotifications({...notifications, reminderTime: parseInt(value || '60')})}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos antes</SelectItem>
                      <SelectItem value="60">1 hora antes</SelectItem>
                      <SelectItem value="120">2 horas antes</SelectItem>
                      <SelectItem value="1440">1 dia antes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 bg-muted/10">
                <Button onClick={handleSaveNotifications} disabled={saving} className="font-bold">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar Preferências
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ABA APARÊNCIA */}
          <TabsContent value="aparencia" className="space-y-6">
            <Card className="border-border/40 shadow-lg">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Moon size={20} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle>Tema do Sistema</CardTitle>
                    <CardDescription>Escolha como o sistema deve aparecer para você</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">Modo Escuro</span>
                    <p className="text-sm text-muted-foreground">Alterne entre os temas claro e escuro</p>
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
                  <Label className="font-semibold">Cor de Destaque</Label>
                  <p className="text-sm text-muted-foreground">Escolha a cor principal do sistema</p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    {accentColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={cn(
                          "relative h-12 w-12 rounded-full cursor-pointer transition-all hover:scale-110 shadow-lg",
                          color.class,
                          selectedColor === color.value && "ring-4 ring-offset-2 ring-primary scale-110"
                        )}
                        title={color.name}
                      >
                        {selectedColor === color.value && (
                          <Check className="absolute inset-0 m-auto text-white drop-shadow-lg" size={24} strokeWidth={3} />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="secondary" className="font-bold">
                      Cor selecionada: {accentColors.find(c => c.value === selectedColor)?.name}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA SEGURANÇA */}
          <TabsContent value="seguranca" className="space-y-6">
            <Card className="border-border/40 shadow-lg">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield size={20} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle>Segurança e Permissões</CardTitle>
                    <CardDescription>Gerencie configurações de segurança da conta</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-wider">Autenticação</h3>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20 opacity-60">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <Key size={18} className="text-muted-foreground" />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="font-medium">Autenticação de Dois Fatores</Label>
                          <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança (em breve)</p>
                        </div>
                      </div>
                      <Switch 
                        checked={securityData.twoFactorEnabled}
                        onCheckedChange={(checked) => setSecurityData({...securityData, twoFactorEnabled: checked})}
                        disabled
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Users size={18} className="text-primary" />
                        </div>
                        <div className="space-y-0.5">
                          <Label className="font-medium">Múltiplas Sessões</Label>
                          <p className="text-sm text-muted-foreground">Permitir login em vários dispositivos</p>
                        </div>
                      </div>
                      <Switch 
                        checked={securityData.allowMultipleSessions}
                        onCheckedChange={(checked) => setSecurityData({...securityData, allowMultipleSessions: checked})}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="font-semibold">Tempo de Sessão</Label>
                  <Select 
                    value={securityData.sessionTimeout.toString()}
                    onValueChange={(value) => setSecurityData({...securityData, sessionTimeout: parseInt(value || '30')})}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="240">4 horas</SelectItem>
                      <SelectItem value="1440">1 dia</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Tempo de inatividade antes de desconectar automaticamente</p>
                </div>

                <Separator />

                <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield size={20} className="text-amber-600 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">Dica de Segurança</h4>
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        Mantenha sua senha segura e nunca a compartilhe. Use uma combinação de letras, números e símbolos.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA INTEGRAÇÕES */}
          <TabsContent value="integracoes" className="space-y-6">
            <Card className="border-border/40 shadow-lg">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Zap size={20} className="text-primary" />
                  </div>
                  <div>
                    <CardTitle>Integrações</CardTitle>
                    <CardDescription>Conecte serviços externos ao sistema</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 dark:bg-orange-950 rounded-lg">
                        <Globe size={18} className="text-orange-600" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="font-medium">Firebase</Label>
                        <p className="text-sm text-muted-foreground">Backend e autenticação</p>
                      </div>
                    </div>
                    <Badge variant={integrations.firebaseConfigured ? "default" : "secondary"}>
                      {integrations.firebaseConfigured ? "✓ Configurado" : "Pendente"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Mail size={18} className="text-muted-foreground" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="font-medium">Email (SendGrid)</Label>
                        <p className="text-sm text-muted-foreground">Envio de emails transacionais</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Em breve</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <MessageSquare size={18} className="text-muted-foreground" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="font-medium">WhatsApp Business</Label>
                        <p className="text-sm text-muted-foreground">Notificações via WhatsApp</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Em breve</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <CreditCard size={18} className="text-muted-foreground" />
                      </div>
                      <div className="space-y-0.5">
                        <Label className="font-medium">Pagamentos (Stripe/Mercado Pago)</Label>
                        <p className="text-sm text-muted-foreground">Processamento de pagamentos online</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Em breve</Badge>
                  </div>
                </div>

                <Separator />

                <div className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Zap size={20} className="text-blue-600 mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-blue-900 dark:text-blue-100">Documentação Disponível</h4>
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        Consulte o arquivo <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">FIREBASE_NOTIFICATIONS.md</code> para instruções detalhadas sobre como configurar notificações Firebase Cloud Messaging.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
