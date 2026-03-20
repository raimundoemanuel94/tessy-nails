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
  LayoutDashboard
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
          <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Carregando serviços...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/60 dark:bg-slate-900/60 rounded-[2.5rem] border border-slate-200/40 dark:border-white/5 backdrop-blur-xl">
          <div className="h-20 w-20 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-6">
            <XCircle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">Erro ao carregar</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-md text-center">{error}</p>
          <Button 
            onClick={loadData}
            className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5"
          >
            Tentar novamente
          </Button>
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white/60 dark:bg-slate-900/60 rounded-[2.5rem] border border-slate-200/40 dark:border-white/5 backdrop-blur-xl">
          <div className="relative mb-8">
            <div className="h-28 w-28 rounded-[2rem] bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center border border-violet-100 dark:border-violet-500/20 shadow-inner">
              <Scissors className="h-12 w-12 text-violet-400" />
            </div>
            <div className="absolute -top-2 -right-2 h-8 w-8 rounded-xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/40 border-2 border-white dark:border-slate-900 animate-bounce">
              <Plus className="h-4 w-4 text-white stroke-3" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">Nenhum serviço cadastrado</h2>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-10 max-w-sm text-center">
            Sua lista está vazia. Comece cadastrando seus serviços para que seus clientes possam agendar e sua agenda cresça!
          </p>
          <Button 
            onClick={openCreate}
            className="bg-brand-primary hover:opacity-90 text-white font-bold rounded-xl px-10 h-14 text-base shadow-xl shadow-brand-primary/30 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5 mr-2 stroke-3" />
            Cadastrar Primeiro Serviço
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
              className="bg-brand-primary hover:opacity-90 text-white rounded-xl px-6 h-11 font-bold shadow-lg shadow-brand-primary/20 transition-all hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5 mr-2 stroke-3" />
              Novo Serviço
            </Button>
          </PageHeader>

          <PageHero 
            title="Seu Catálogo"
            subtitle="Organize seus serviços, defina preços e otimize o tempo de sua equipe com precisão."
            metrics={[
              { label: "Total", value: stats.total, icon: Scissors },
              { label: "Ativos", value: stats.active, icon: CheckCircle2 },
              { label: "Inativos", value: stats.inactive, icon: EyeOff },
              { label: "Média", value: `R$ ${stats.avgPrice.toFixed(0)}`, icon: DollarSign },
            ]}
          />

          <SectionCard title="Lista de Serviços">

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar serviço por nome, descrição ou categoria..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-sm focus-visible:ring-violet-500/30"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-white/10 rounded-xl p-1">
              {(['all', 'active', 'inactive'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "h-9 px-3.5 text-xs font-semibold rounded-lg transition-all",
                    activeFilter === filter 
                      ? "bg-brand-primary hover:opacity-90 text-white shadow-md shadow-brand-primary/25" 
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  )}
                >
                  {filter === 'all' ? `Todos (${stats.total})` : filter === 'active' ? `Ativos (${stats.active})` : `Inativos (${stats.inactive})`}
                </Button>
              ))}
            </div>
          </div>

          {/* Services Grid */}
          {filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Nenhum serviço encontrado</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Tente ajustar os filtros ou a busca</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((service) => (
                <Card 
                  key={service.id} 
                  className={cn(
                    "group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl",
                    service.isActive !== false
                      ? "hover:shadow-violet-500/10"
                      : "opacity-70 hover:opacity-100 hover:shadow-slate-500/10"
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

                  <CardHeader className="pb-3 relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Service icon */}
                        <div className={cn(
                          "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                          service.isActive !== false
                            ? "bg-violet-100 dark:bg-violet-500/10"
                            : "bg-slate-100 dark:bg-slate-800"
                        )}>
                          <Scissors className={cn(
                            "h-5 w-5",
                            service.isActive !== false ? "text-brand-primary" : "text-slate-400"
                          )} strokeWidth={2.5} />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                            {service.name}
                          </CardTitle>
                          {service.category && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Tag className="h-3 w-3 text-slate-400" />
                              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                {service.category}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant="outline"
                        className={cn(
                          "shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-transparent",
                          service.isActive !== false
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        )}
                      >
                        {service.isActive !== false ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3 relative z-10">
                    {service.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    
                    {/* Price & Duration Row */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-100/80 dark:border-white/5">
                        <DollarSign className="h-4 w-4 text-violet-500 shrink-0" strokeWidth={2.5} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Preço</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                            R$ {service.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-100/80 dark:border-white/5">
                        <Clock className="h-4 w-4 text-violet-500 shrink-0" strokeWidth={2.5} />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Duração</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                            {formatDuration(service.durationMinutes)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 pb-4 px-6 relative z-10">
                    <div className="flex items-center gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 rounded-xl text-xs font-semibold border-slate-200/80 dark:border-white/10 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 dark:hover:bg-violet-500/10 dark:hover:text-violet-400 transition-all"
                        onClick={() => openEdit(service)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-9 rounded-xl text-xs font-semibold border-slate-200/80 dark:border-white/10 transition-all",
                          service.isActive !== false
                            ? "hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                            : "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                        )}
                        disabled={!!actionLoading}
                        onClick={() => service.isActive !== false ? handleDeactivate(service.id) : handleActivate(service.id)}
                      >
                        {actionLoading === service.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : service.isActive !== false ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Power className="h-3.5 w-3.5 mr-1.5" />
                            Ativar
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
        <DialogContent className="sm:max-w-[480px] rounded-2xl border-slate-200/60 dark:border-white/10 bg-white dark:bg-slate-900 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                {editingService ? (
                  <Edit2 className="h-5 w-5 text-brand-primary" />
                ) : (
                  <Plus className="h-5 w-5 text-brand-primary" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingService ? "Editar serviço" : "Novo serviço"}
                </DialogTitle>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {editingService ? "Atualize as informações do serviço" : "Preencha os dados para cadastrar"}
                </p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="form-name" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Nome do serviço *
              </Label>
              <Input
                id="form-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Manicure completa"
                required
                className="h-11 rounded-xl border-slate-200/80 dark:border-white/10 focus-visible:ring-violet-500/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-desc" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Descrição
              </Label>
              <Textarea
                id="form-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descreva o que inclui este serviço..."
                rows={2}
                className="resize-none rounded-xl border-slate-200/80 dark:border-white/10 focus-visible:ring-violet-500/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="form-duration" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Duração (min) *
                </Label>
                <Input
                  id="form-duration"
                  type="number"
                  min={1}
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value) || 0)}
                  className="h-11 rounded-xl border-slate-200/80 dark:border-white/10 focus-visible:ring-violet-500/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-price" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Preço (R$) *
                </Label>
                <Input
                  id="form-price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value) || 0)}
                  className="h-11 rounded-xl border-slate-200/80 dark:border-white/10 focus-visible:ring-violet-500/30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-category" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Categoria
              </Label>
              <Input
                id="form-category"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Ex: Unhas, Estética, Spa..."
                className="h-11 rounded-xl border-slate-200/80 dark:border-white/10 focus-visible:ring-violet-500/30"
              />
            </div>
            {editingService && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <input
                  type="checkbox"
                  id="form-active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded-md border-slate-300 dark:border-white/20 text-brand-primary focus:ring-brand-primary/30 h-4 w-4"
                />
                <Label htmlFor="form-active" className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                  Serviço ativo e visível para clientes
                </Label>
              </div>
            )}
            <div className="flex gap-3 justify-end pt-3 border-t border-slate-100 dark:border-white/5">
              <Button 
                type="button" 
                variant="outline" 
                onClick={closeForm}
                className="rounded-xl px-5 h-10 text-sm font-semibold border-slate-200/80 dark:border-white/10"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={formLoading}
                className="rounded-xl px-6 h-10 text-sm font-semibold bg-brand-primary hover:opacity-90 shadow-lg shadow-brand-primary/25"
              >
                {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingService ? "Salvar Alterações" : "Cadastrar Serviço"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
