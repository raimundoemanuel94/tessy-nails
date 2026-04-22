"use client";

export const dynamic = 'force-dynamic';

import { PageShell } from "@/components/shared/PageShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { PageHero } from "@/components/shared/PageHero";
import { MetricCard } from "@/components/shared/MetricCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { 
  Plus, Scissors, Clock, DollarSign, Edit2, Loader2,
  Search, Sparkles, Tag, EyeOff, Power, CheckCircle2, XCircle,
  LayoutDashboard, Trash2
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback, useMemo } from "react";
import { salonService } from "@/services/salon";
import { Service } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Derived stats
  const stats = useMemo(() => {
    const active = services.filter(s => s.isActive !== false);
    const inactive = services.filter(s => s.isActive === false);
    const avgPrice = services.length > 0 
      ? services.reduce((sum, s) => sum + s.price, 0) / services.length 
      : 0;
    const categories = [...new Set(services.map(s => s.category).filter(Boolean))];
    return { active: active.length, inactive: inactive.length, total: services.length, avgPrice, categories };
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    let filtered = services;
    if (activeFilter === 'active') filtered = filtered.filter(s => s.isActive !== false);
    if (activeFilter === 'inactive') filtered = filtered.filter(s => s.isActive === false);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [services, activeFilter, searchQuery]);

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
    setActionLoading(`activate:${id}`);
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
    setActionLoading(`deactivate:${id}`);
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

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Excluir o serviÃ§o "${name}"? Essa aÃ§Ã£o nÃ£o pode ser desfeita.`);
    if (!confirmed) return;

    setActionLoading(`delete:${id}`);
    try {
      await salonService.delete(id);
      toast.success("ServiÃ§o excluÃ­do.");
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir.");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  return (
    <PageShell>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-b-2 border-brand-primary animate-spin" />
          </div>
          <p className="text-xs font-black text-brand-text-sub opacity-40 uppercase tracking-widest">Carregando serviços...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/40 rounded-[2.5rem] border border-brand-accent/10 backdrop-blur-2xl">
          <div className="h-20 w-20 rounded-3xl bg-brand-warning/10 flex items-center justify-center mb-6">
            <XCircle className="h-10 w-10 text-brand-warning" />
          </div>
          <h2 className="text-xl font-black text-brand-text-main mb-2 uppercase tracking-tight">Erro ao carregar</h2>
          <p className="text-sm font-bold text-brand-text-sub opacity-60 mb-8 max-w-md text-center">{error}</p>
          <Button 
            onClick={loadData}
            className="bg-brand-warning/80 hover:bg-brand-warning text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-brand-warning/20 transition-all hover:-translate-y-0.5"
          >
            Tentar novamente
          </Button>
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white/40 rounded-[2.5rem] border border-brand-accent/10 backdrop-blur-2xl">
          <div className="relative mb-8">
            <div className="h-28 w-28 rounded-[2rem] bg-brand-soft/20 flex items-center justify-center border border-brand-accent/10 shadow-inner">
              <Scissors className="h-12 w-12 text-brand-primary/40" />
            </div>
            <div className="absolute -top-2 -right-2 h-8 w-8 rounded-xl bg-brand-primary flex items-center justify-center shadow-premium-xl border-2 border-white animate-bounce">
              <Plus className="h-4 w-4 text-white stroke-3" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-brand-text-main mb-3 uppercase tracking-tight">Nenhum serviço cadastrado</h2>
          <p className="text-sm font-bold text-brand-text-sub mb-10 max-w-sm text-center opacity-60">
            Sua lista está vazia. Comece cadastrando seus serviços para que seus clientes possam agendar e sua agenda cresça!
          </p>
          <Button 
            onClick={openCreate}
            size="lg"
            className="h-14 px-10 text-base font-black"
          >
            <Plus className="h-5 w-5 mr-3 stroke-4" />
            CADASTRAR PRIMEIRO SERVIÇO
          </Button>
        </div>
      ) : (
        <>
          <PageHeader 
            title="Serviços" 
            description="Gerencie todos os serviços oferecidos pelo salão."
            icon={Sparkles}
          >
            <Button 
              onClick={openCreate}
              size="lg"
              className="gap-2"
            >
              <Plus className="h-5 w-5 stroke-3" />
              Novo Serviço
            </Button>
          </PageHeader>

          <PageHero 
            title="Seu Catálogo"
            subtitle="Organize seus serviços, defina preços e otimize o tempo de sua equipe com precisão."
            metrics={[
              { label: "Total", value: stats.total, icon: Scissors, variant: "primary" },
              { label: "Ativos", value: stats.active, icon: CheckCircle2, variant: "success" },
              { label: "Inativos", value: stats.inactive, icon: EyeOff, variant: "warning" },
              { label: "Média", value: `R$ ${stats.avgPrice.toFixed(0)}`, icon: DollarSign, variant: "accent" },
            ]}
          />

          <SectionCard title="Lista de Serviços">

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text-sub opacity-40 group-focus-within:text-brand-primary transition-colors" />
              <Input
                placeholder="Buscar por nome, descrição ou categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-2xl border-brand-accent/10 bg-white/50 backdrop-blur-sm text-sm font-bold shadow-inner"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-white/50 backdrop-blur-sm border border-brand-accent/10 rounded-2xl p-1.5">
              {(['all', 'active', 'inactive'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "h-9 px-4 text-xs font-black uppercase tracking-wider rounded-xl transition-all",
                    activeFilter === filter 
                      ? "bg-brand-primary hover:opacity-90 text-white shadow-premium" 
                      : "text-brand-text-sub opacity-60 hover:opacity-100"
                  )}
                >
                  {filter === 'all' ? `Todos` : filter === 'active' ? `Ativos` : `Inativos`}
                </Button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-brand-soft/20 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-brand-text-sub opacity-30" />
              </div>
              <p className="text-sm font-black text-brand-text-sub opacity-60">Nenhum serviço encontrado</p>
              <p className="text-xs text-brand-text-sub opacity-40 mt-1">Tente ajustar os filtros ou a busca</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((service) => (
                <Card 
                  key={service.id} 
                  className={cn(
                    "group relative overflow-hidden transition-all duration-500 hover:shadow-premium-xl hover:-translate-y-1 border-brand-accent/5 bg-white/40 backdrop-blur-md rounded-2xl",
                    service.isActive !== false
                      ? "hover:bg-white"
                      : "opacity-60 hover:opacity-100"
                  )}
                >
                  {/* Premium Shine Effect */}
                  <div className="absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  
                  {/* Decorative glow */}
                  <div className={cn(
                    "absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full blur-3xl transition-all duration-700 pointer-events-none",
                    service.isActive !== false
                      ? "bg-violet-500/5 group-hover:bg-violet-500/15"
                      : "bg-slate-500/5 group-hover:bg-slate-500/10"
                  )} />

                  <CardHeader className="pb-3 relative z-10 font-black">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-4 min-w-0">
                        {/* Service icon */}
                        <div className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm",
                          service.isActive !== false
                            ? "bg-brand-primary text-white"
                            : "bg-brand-soft/20 text-brand-text-sub"
                        )}>
                          <Scissors className="h-5 w-5" strokeWidth={3} />
                        </div>
                        <div className="min-w-0 pt-1">
                          <CardTitle className="text-[1.05rem] font-bold text-brand-text-main tracking-tight line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors pr-2">
                            {service.name}
                          </CardTitle>
                          {service.category && (
                            <div className="flex items-center gap-1.5 mt-1 opacity-40">
                              <Tag className="h-3 w-3 text-brand-text-sub" />
                              <span className="text-[10px] font-black text-brand-text-sub uppercase tracking-[0.2em]">
                                {service.category}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant={service.isActive !== false ? "success" : "neutral"}
                        size="xs"
                        className="shrink-0 border-none shadow-none font-black opacity-80"
                      >
                        {service.isActive !== false ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-4 relative z-10">
                    {service.description && (
                      <p className="text-xs text-brand-text-sub font-bold leading-relaxed mb-6 line-clamp-2 opacity-70">
                        {service.description}
                      </p>
                    )}
                    
                    {/* Price & Duration Row */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-brand-soft/10 border border-brand-accent/5">
                        <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-brand-primary shadow-sm">
                          <DollarSign className="h-4 w-4" strokeWidth={3} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-brand-text-sub uppercase tracking-widest opacity-40">Preço</p>
                          <p className="text-base font-black text-brand-text-main tracking-tight tabular-nums">
                            R$ {service.price.toFixed(0)}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl bg-brand-soft/10 border border-brand-accent/5">
                        <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-brand-secondary shadow-sm">
                          <Clock className="h-4 w-4" strokeWidth={3} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-brand-text-sub uppercase tracking-widest opacity-40">Duração</p>
                          <p className="text-base font-black text-brand-text-main tracking-tight">
                            {formatDuration(service.durationMinutes)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 pb-6 px-6 relative z-10">
                    <div className="flex items-center gap-3 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-11 rounded-xl text-xs font-black uppercase tracking-widest border-brand-accent/20 text-brand-text-sub hover:bg-brand-primary/5 hover:text-brand-primary transition-all shadow-none"
                        onClick={() => openEdit(service)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border-brand-accent/20 transition-all shadow-none",
                          service.isActive !== false
                            ? "hover:bg-brand-text-sub/5 hover:text-brand-text-sub"
                            : "hover:bg-brand-success/5 hover:text-brand-success"
                        )}
                        disabled={!!actionLoading}
                        onClick={() => service.isActive !== false ? handleDeactivate(service.id) : handleActivate(service.id)}
                      >
                        {actionLoading === `activate:${service.id}` || actionLoading === `deactivate:${service.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : service.isActive !== false ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5 mr-2" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Power className="h-3.5 w-3.5 mr-2" />
                            Ativar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border-brand-danger/20 text-brand-danger hover:bg-brand-danger/5 transition-all shadow-none"
                        disabled={!!actionLoading}
                        onClick={() => handleDelete(service.id, service.name)}
                      >
                        {actionLoading === `delete:${service.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Excluir
                          </>
                        )}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </SectionCard>
      </>
      )}

      {/* Dialog Novo / Editar Serviço */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl border-brand-accent/10 bg-white p-0 overflow-hidden shadow-premium-xl">
          <DialogHeader className="px-8 pt-8 pb-6 border-b border-brand-accent/5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                {editingService ? (
                  <Edit2 className="h-6 w-6 text-brand-primary" />
                ) : (
                  <Plus className="h-6 w-6 text-brand-primary" strokeWidth={3} />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-brand-text-main tracking-tight">
                  {editingService ? "Editar serviço" : "Novo serviço"}
                </DialogTitle>
                <p className="text-xs font-bold text-brand-text-sub opacity-50 mt-1">
                  {editingService ? "Atualize as informações do serviço" : "Preencha os dados para cadastrar"}
                </p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="p-8 space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="form-name" className="text-[10px] font-black text-brand-text-sub uppercase tracking-[2px] opacity-50 ml-1">
                Nome do serviço *
              </Label>
              <Input
                id="form-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Manicure completa"
                required
                className="h-12 rounded-2xl border-brand-accent/10 bg-brand-soft/5 focus-visible:ring-brand-primary/20 font-bold"
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="form-desc" className="text-[10px] font-black text-brand-text-sub uppercase tracking-[2px] opacity-50 ml-1">
                Descrição
              </Label>
              <Textarea
                id="form-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descreva o que inclui este serviço..."
                rows={3}
                className="resize-none rounded-2xl border-brand-accent/10 bg-brand-soft/5 focus-visible:ring-brand-primary/20 font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <Label htmlFor="form-duration" className="text-[10px] font-black text-brand-text-sub uppercase tracking-[2px] opacity-50 ml-1">
                  Duração (min) *
                </Label>
                <Input
                  id="form-duration"
                  type="number"
                  min={1}
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value) || 0)}
                  className="h-12 rounded-2xl border-brand-accent/10 bg-brand-soft/5 focus-visible:ring-brand-primary/20 font-black tabular-nums"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="form-price" className="text-[10px] font-black text-brand-text-sub uppercase tracking-[2px] opacity-50 ml-1">
                  Preço (R$) *
                </Label>
                <Input
                  id="form-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value) || 0)}
                  className="h-12 rounded-2xl border-brand-accent/10 bg-brand-soft/5 focus-visible:ring-brand-primary/20 font-black tabular-nums"
                />
              </div>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="form-category" className="text-[10px] font-black text-brand-text-sub uppercase tracking-[2px] opacity-50 ml-1">
                Categoria
              </Label>
              <Input
                id="form-category"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Ex: Unhas, Estética, Spa..."
                className="h-12 rounded-2xl border-brand-accent/10 bg-brand-soft/5 focus-visible:ring-brand-primary/20 font-bold"
              />
            </div>
            {editingService && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-brand-soft/5 border border-brand-accent/5">
                <input
                  type="checkbox"
                  id="form-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded-md border-brand-accent/20 text-brand-primary focus:ring-brand-primary/20 h-5 w-5 transition-all"
                />
                <Label htmlFor="form-active" className="cursor-pointer text-sm font-bold text-brand-text-main">
                  Serviço ativo e visível para clientes
                </Label>
              </div>
            )}
            <div className="flex gap-4 justify-end pt-4 border-t border-brand-accent/5">
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeForm}
                className="rounded-xl px-6 h-12 text-xs font-black uppercase tracking-widest border-brand-accent/20 text-brand-text-sub hover:bg-brand-primary/5 shadow-none"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={formLoading}
                className="rounded-xl px-8 h-12 text-xs font-black uppercase tracking-widest bg-brand-primary hover:opacity-90 shadow-premium border-none"
              >
                {formLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : editingService ? "Salvar Alterações" : "Cadastrar Serviço"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
