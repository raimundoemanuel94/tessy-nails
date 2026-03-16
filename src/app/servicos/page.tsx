"use client";

export const dynamic = 'force-dynamic';

import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Plus, Sparkles, Clock, DollarSign, Edit2, Trash2, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback } from "react";
import { salonService } from "@/services/salon";
import { Service } from "@/types";
import { toast } from "sonner";

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDuration, setFormDuration] = useState(30);
  const [formPrice, setFormPrice] = useState(0);
  const [formCategory, setFormCategory] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    if (!isFormOpen) return;
    if (editingService) {
      setFormName(editingService.name);
      setFormDescription(editingService.description ?? "");
      setFormDuration(editingService.durationMinutes);
      setFormPrice(editingService.price);
      setFormCategory(editingService.category ?? "");
      setFormIsActive(editingService.isActive ?? true);
    } else {
      setFormName("");
      setFormDescription("");
      setFormDuration(30);
      setFormPrice(0);
      setFormCategory("");
      setFormIsActive(true);
    }
  }, [isFormOpen, editingService]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formName.trim();
    if (!name || formDuration < 1 || formPrice < 0) {
      toast.error("Preencha nome, duração (≥ 1 min) e preço (≥ 0).");
      return;
    }
    setFormLoading(true);
    try {
      if (editingService) {
        await salonService.update(editingService.id, {
          name,
          description: formDescription.trim() || undefined,
          durationMinutes: formDuration,
          price: formPrice,
          category: formCategory.trim() || undefined,
          isActive: formIsActive,
        });
        toast.success("Serviço atualizado.");
      } else {
        await salonService.create({
          name,
          description: formDescription.trim() || undefined,
          durationMinutes: formDuration,
          price: formPrice,
          category: formCategory.trim() || undefined,
          isActive: formIsActive,
        });
        toast.success("Serviço cadastrado.");
      }
      closeForm();
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setFormLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!navigator.onLine) {
        setError("Sem conexão com a internet. Verifique sua conexão.");
        return;
      }
      const data = await salonService.getAllWithInactive();
      const valid = (data || []).filter(
        (s) => s.id && s.name != null && s.price != null && s.durationMinutes != null
      );
      setServices(valid);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "permission-denied") {
        setError("Sem permissão para acessar os serviços. Verifique suas permissões.");
      } else if (e.code === "unavailable") {
        setError("Serviço temporariamente indisponível. Tente novamente em alguns minutos.");
      } else {
        setError("Não foi possível carregar os serviços. Verifique sua conexão e tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingService(null);
    setIsFormOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingService(null);
  };

  const handleActivate = async (id: string) => {
    setActionLoading(id);
    try {
      await salonService.activate(id);
      toast.success("Serviço ativado.");
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao ativar.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (id: string) => {
    setActionLoading(id);
    try {
      await salonService.deactivate(id);
      toast.success("Serviço desativado.");
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao desativar.");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Sparkles className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar serviços</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadData}>Tentar novamente</Button>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Sparkles className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Nenhum serviço cadastrado</h2>
          <p className="text-gray-600 mb-4">Cadastre seus primeiros serviços para começar.</p>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Cadastrar Serviço
          </Button>
        </div>
      ) : (
        <>
          <PageHeader 
            title="Serviços" 
            description="Gerencie os serviços oferecidos" 
          />

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Todos os Serviços</h2>
                <p className="text-sm text-muted-foreground">
                  {services.length} serviços cadastrados
                </p>
              </div>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Serviço
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        {service.description && (
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        )}
                      </div>
                      <Badge variant={service.isActive ? "default" : "secondary"}>
                        {service.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{service.durationMinutes} min</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">R$ {service.price.toFixed(2)}</span>
                      </div>
                      {service.category && (
                        <div className="text-sm text-muted-foreground">
                          Categoria: {service.category}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex items-center gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEdit(service)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="outline" size="sm" disabled={!!actionLoading}>
                              {actionLoading === service.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => openEdit(service)}
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() =>
                              service.isActive
                                ? handleDeactivate(service.id)
                                : handleActivate(service.id)
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {service.isActive ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Dialog Novo / Editar Serviço */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="form-name">Nome *</Label>
              <Input
                id="form-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Manicure completa"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-desc">Descrição</Label>
              <Textarea
                id="form-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Opcional"
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="form-duration">Duração (min) *</Label>
                <Input
                  id="form-duration"
                  type="number"
                  min={1}
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-price">Preço (R$) *</Label>
                <Input
                  id="form-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-category">Categoria</Label>
              <Input
                id="form-category"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            {editingService && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="form-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-input"
                />
                <Label htmlFor="form-active" className="cursor-pointer">Serviço ativo</Label>
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingService ? "Salvar" : "Cadastrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
