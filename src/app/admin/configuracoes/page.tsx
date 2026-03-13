"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SalonConfig {
  name: string;
  phone: string;
  address: string;
  sundayEnabled: boolean;
  cleaningTime: number;
}

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
}

const SALON_CONFIG_DOC = "main";
const SALON_CONFIG_COLLECTION = "salon_config";

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("perfil");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSalon, setSavingSalon] = useState(false);

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: "",
  });

  const [salonForm, setSalonForm] = useState<SalonConfig>({
    name: "",
    phone: "",
    address: "",
    sundayEnabled: false,
    cleaningTime: 10,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: "",
      });

      // Tentar carregar phone do doc de usuário no Firestore
      getDoc(doc(db, "users", user.uid))
        .then((snap) => {
          if (snap.exists()) {
            setProfileForm({
              name: (snap.data().name as string) ?? user.name ?? "",
              email: (snap.data().email as string) ?? user.email ?? "",
              phone: (snap.data().phone as string) ?? "",
            });
          }
        })
        .catch(() => {});
    }

    // Carregar configurações do salão
    getDoc(doc(db, SALON_CONFIG_COLLECTION, SALON_CONFIG_DOC))
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data() as Partial<SalonConfig>;
          setSalonForm({
            name: d.name ?? "",
            phone: d.phone ?? "",
            address: d.address ?? "",
            sundayEnabled: d.sundayEnabled ?? false,
            cleaningTime: d.cleaningTime ?? 10,
          });
        }
      })
      .catch(() => {});
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!profileForm.name.trim()) {
      toast.error("O nome não pode estar vazio.");
      return;
    }
    setSavingProfile(true);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: profileForm.name.trim(),
          phone: profileForm.phone.trim(),
        },
        { merge: true }
      );
      toast.success("Perfil salvo com sucesso.");
    } catch {
      toast.error("Erro ao salvar perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSalon = async () => {
    if (!salonForm.name.trim()) {
      toast.error("O nome do salão não pode estar vazio.");
      return;
    }
    setSavingSalon(true);
    try {
      await setDoc(
        doc(db, SALON_CONFIG_COLLECTION, SALON_CONFIG_DOC),
        {
          name: salonForm.name.trim(),
          phone: salonForm.phone.trim(),
          address: salonForm.address.trim(),
          sundayEnabled: salonForm.sundayEnabled,
          cleaningTime: Number(salonForm.cleaningTime),
        },
        { merge: true }
      );
      toast.success("Configurações do salão salvas.");
    } catch {
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSavingSalon(false);
    }
  };

  return (
    <AdminProtectedRoute>
      <AdminLayout>
      <PageHeader
        title="Configurações"
        description="Personalize as informações do salão e do seu perfil."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex gap-2 border-b pb-1">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${activeTab === "perfil" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveTab("perfil")}
          >
            Perfil
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${activeTab === "salao" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveTab("salao")}
          >
            Salão
          </button>
        </div>

        {activeTab === "perfil" && (
          <Card>
            <CardHeader>
              <CardTitle>Perfil de Administrador</CardTitle>
              <CardDescription>
                Suas informações pessoais de acesso ao painel.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cfg-name">Nome</Label>
                <Input
                  id="cfg-name"
                  placeholder="Seu nome completo"
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cfg-email">E-mail</Label>
                <Input
                  id="cfg-email"
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="opacity-60 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  O e-mail não pode ser alterado por aqui.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cfg-phone">Telefone</Label>
                <Input
                  id="cfg-phone"
                  placeholder="(11) 99999-9999"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardFooter>
          </Card>
        )}

        {activeTab === "salao" && (
          <Card>
            <CardHeader>
              <CardTitle>Dados do Salão</CardTitle>
              <CardDescription>
                Informações que aparecem para os clientes no aplicativo.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="salon-name">Nome do Salão</Label>
                <Input
                  id="salon-name"
                  placeholder="Ex: Tessy Nails"
                  value={salonForm.name}
                  onChange={(e) =>
                    setSalonForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salon-phone">Telefone de Contato</Label>
                <Input
                  id="salon-phone"
                  placeholder="(11) 99999-9999"
                  value={salonForm.phone}
                  onChange={(e) =>
                    setSalonForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salon-address">Endereço</Label>
                <Input
                  id="salon-address"
                  placeholder="Rua, Nº, Bairro – Cidade/UF"
                  value={salonForm.address}
                  onChange={(e) =>
                    setSalonForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="salon-cleaning">Intervalo de limpeza (min)</Label>
                  <Input
                    id="salon-cleaning"
                    type="number"
                    min={0}
                    value={salonForm.cleaningTime}
                    onChange={(e) =>
                      setSalonForm((f) => ({
                        ...f,
                        cleaningTime: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2 justify-end pb-0.5">
                  <Label htmlFor="salon-sunday">Atender aos domingos</Label>
                  <div className="flex items-center gap-3 h-10">
                    <Switch
                      id="salon-sunday"
                      checked={salonForm.sundayEnabled}
                      onCheckedChange={(checked) =>
                        setSalonForm((f) => ({ ...f, sundayEnabled: checked }))
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      {salonForm.sundayEnabled ? "Sim" : "Não"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSalon} disabled={savingSalon}>
                {savingSalon ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardFooter>
          </Card>
        )}
      </Tabs>
    </AdminLayout>
    </AdminProtectedRoute>
  );
}
