"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminProtectedRoute } from "@/components/auth/AdminProtectedRoute";
import { Plus, Search, MoreHorizontal, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { salonService } from "@/services";
import { Service } from "@/types";
import { toast } from "sonner";

interface ServiceForm {
  name: string;
  description: string;
  durationMinutes: number | "";
  price: number | "";
  active: boolean;
}

const emptyForm: ServiceForm = {
  name: "",
  description: "",
  durationMinutes: "",
  price: "",
  active: true,
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function ServicosAdminPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [formError, setFormError] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadServices = () => {
    setLoading(true);
    salonService
      .getAll()
      .then(setServices)
      .catch(() => toast.error("Erro ao carregar serviços."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openNewDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingId(service.id ?? null);
    setForm({
      name: service.name,
      description: service.description ?? "",
      durationMinutes: service.durationMinutes,
      price: service.price,
      active: service.active,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Nome é obrigatório."); return; }
    if (!form.durationMinutes || Number(form.durationMinutes) <= 0) { setFormError("Duração inválida."); return; }
    if (form.price === "" || Number(form.price) < 0) { setFormError("Preço inválido."); return; }

    setSaving(true);
    setFormError("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      durationMinutes: Number(form.durationMinutes),
      price: Number(form.price),
      active: form.active,
    };

    try {
      if (editingId) {
        await salonService.update(editingId, payload);
        setServices((prev) =>
          prev.map((s) => (s.id === editingId ? { ...s, ...payload } : s))
        );
        toast.success("Serviço atualizado com sucesso.");
      } else {
        const newId = await salonService.create(payload);
        setServices((prev) => [
          ...prev,
          { ...payload, id: newId, createdAt: new Date() } as Service,
        ]);
        toast.success("Serviço criado com sucesso.");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Erro ao salvar serviço.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await salonService.deactivate(id);
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active: false } : s))
      );
      toast.success("Serviço desativado.");
    } catch {
      toast.error("Erro ao desativar serviço.");
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await salonService.update(id, { active: true });
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active: true } : s))
      );
      toast.success("Serviço reativado.");
    } catch {
      toast.error("Erro ao ativar serviço.");
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await salonService.delete(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Serviço excluído.");
    } catch {
      toast.error("Erro ao excluir serviço.");
    }
  };

  const filtered = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const serviceToDelete = services.find((s) => s.id === confirmDeleteId);

  return (
    <AdminProtectedRoute>
      <AdminLayout>
      <PageHeader
        title="Serviços"
        description="Gerencie o catálogo de serviços do salão."
      />

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Buscar serviço..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={openNewDialog} className="gap-2">
          <Plus size={18} />
          Novo Serviço
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-slate-200" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            {searchTerm ? `Nenhum serviço encontrado para "${searchTerm}".` : "Nenhum serviço cadastrado."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-50">
                        <Scissors size={16} className="text-pink-500" />
                      </div>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDuration(service.durationMinutes)}</TableCell>
                  <TableCell className="font-medium">{formatPrice(service.price)}</TableCell>
                  <TableCell>
                    <Badge variant={service.active ? "default" : "secondary"}>
                      {service.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
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
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => openEditDialog(service)}
                        >
                          Editar
                        </DropdownMenuItem>
                        {service.active ? (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleDeactivate(service.id ?? "")}
                          >
                            Desativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleActivate(service.id ?? "")}
                          >
                            Reativar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive"
                          onClick={() => setConfirmDeleteId(service.id ?? "")}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog: Criar / Editar */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar serviço" : "Novo serviço"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Atualize as informações do serviço."
                : "Preencha os dados para cadastrar um novo serviço."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="svc-name">Nome</Label>
              <Input
                id="svc-name"
                placeholder="Ex: Manicure simples"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="svc-description">Descrição (opcional)</Label>
              <Textarea
                id="svc-description"
                placeholder="Descreva brevemente o serviço..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="svc-duration">Duração (min)</Label>
                <Input
                  id="svc-duration"
                  type="number"
                  placeholder="Ex: 60"
                  min={5}
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      durationMinutes: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="svc-price">Preço (R$)</Label>
                <Input
                  id="svc-price"
                  type="number"
                  placeholder="Ex: 65.00"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      price: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="svc-active"
                checked={form.active}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
              />
              <Label htmlFor="svc-active">Serviço ativo</Label>
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar serviço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar exclusão */}
      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o serviço{" "}
              <strong>{serviceToDelete?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
    </AdminProtectedRoute>
  );
}
