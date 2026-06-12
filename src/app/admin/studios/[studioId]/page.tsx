/* eslint-disable */
// @ts-nocheck
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Scissors,
  ShieldAlert,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  AdminActionButton,
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/AdminUI";
import { formatCurrency, formatDuration } from "@/lib/utils";

type Tab = "overview" | "billing" | "services" | "settings";

const DAY_LABELS: Record<string, string> = {
  monday: "Seg",
  tuesday: "Ter",
  wednesday: "Qua",
  thursday: "Qui",
  friday: "Sex",
  saturday: "Sáb",
  sunday: "Dom",
};
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function fmtDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysUntil(value?: string | null) {
  if (!value) return null;
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function subscriptionTone(status?: string | null) {
  if (status === "active") return "success";
  if (status === "past_due") return "danger";
  if (status === "trial" || status === "trialing") return "warning";
  return "muted";
}

function subscriptionLabel(status?: string | null) {
  if (status === "active") return "Ativa";
  if (status === "past_due") return "Atrasada";
  if (status === "trial" || status === "trialing") return "Trial";
  if (status === "canceled") return "Cancelada";
  return "Sem assinatura";
}

function Field({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "#71717a", fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input-base"
        style={{ height: 38, borderRadius: 9 }}
      />
    </label>
  );
}

export default function AdminStudioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studioId = params?.studioId as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  const [editingStudio, setEditingStudio] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editPlan, setEditPlan] = useState("pro");
  const [editActive, setEditActive] = useState(true);
  const [savingStudio, setSavingStudio] = useState(false);

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: "", price: "", duration: "", buffer: "0" });
  const [addingService, setAddingService] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/studios/${studioId}`);
      const json = await response.json();
      if (!response.ok || json.error) throw new Error(json.error ?? "Erro ao carregar studio");
      setData(json);
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => {
    load();
  }, [load]);

  const studio = data?.studio;
  const services = data?.services ?? [];
  const activeServices = services.filter((service: any) => service.isActive);
  const subscriptionStatus = studio?.subscriptionStatus;
  const trialDays = daysUntil(studio?.trialEndsAt);
  const renewalDays = daysUntil(studio?.nextBillingDate);
  const health = useMemo(() => {
    if (!studio?.isActive) return { label: "Inativo", tone: "muted", description: "Acesso do tenant está pausado." };
    if (!data?.owner) return { label: "Atenção", tone: "warning", description: "Studio sem profissional/owner vinculado." };
    if (subscriptionStatus === "past_due") return { label: "Crítico", tone: "danger", description: "Assinatura atrasada coloca MRR em risco." };
    if (activeServices.length === 0) return { label: "Atenção", tone: "warning", description: "Nenhum serviço ativo para o cliente agendar." };
    return { label: "Saudável", tone: "success", description: "Tenant ativo, com owner e serviços disponíveis." };
  }, [activeServices.length, data?.owner, studio?.isActive, subscriptionStatus]);

  function openStudioEdit() {
    setEditName(studio.name);
    setEditSlug(studio.slug);
    setEditPlan(studio.plan);
    setEditActive(studio.isActive);
    setEditingStudio(true);
  }

  async function saveStudio() {
    setSavingStudio(true);
    try {
      const response = await fetch(`/api/admin/studios/${studioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, slug: editSlug, plan: editPlan, isActive: editActive }),
      });
      const json = await response.json();
      if (!response.ok || json.error) throw new Error(json.error ?? "Erro ao salvar");
      setEditingStudio(false);
      await load();
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setSavingStudio(false);
    }
  }

  function openServiceEdit(service: any) {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name,
      price: String(service.price),
      duration: String(service.durationMinutes),
      buffer: String(service.bufferMinutes ?? 0),
    });
  }

  async function saveService(id?: string) {
    const isNew = !id;
    setSavingService(true);
    try {
      const response = await fetch(`/api/admin/studios/${studioId}/services${isNew ? "" : `/${id}`}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: serviceForm.name,
          price: Number(serviceForm.price),
          durationMinutes: Number(serviceForm.duration),
          bufferMinutes: Number(serviceForm.buffer || 0),
        }),
      });
      const json = await response.json();
      if (!response.ok || json.error) throw new Error(json.error ?? "Erro ao salvar serviço");
      setAddingService(false);
      setEditingServiceId(null);
      setServiceForm({ name: "", price: "", duration: "", buffer: "0" });
      await load();
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setSavingService(false);
    }
  }

  async function toggleService(service: any) {
    await fetch(`/api/admin/studios/${studioId}/services/${service.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !service.isActive }),
    });
    await load();
  }

  async function deleteService() {
    if (!deleteTarget) return;
    setSavingService(true);
    try {
      const response = await fetch(`/api/admin/studios/${studioId}/services/${deleteTarget.id}`, { method: "DELETE" });
      const json = await response.json();
      if (!response.ok || json.error) throw new Error(json.error ?? "Erro ao excluir serviço");
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      setError(err.message ?? String(err));
    } finally {
      setSavingService(false);
    }
  }

  if (loading) {
    return (
      <AdminPanel>
        <div style={{ padding: 56, display: "flex", justifyContent: "center", color: "#71717a" }}>
          <Loader2 className="spin" />
        </div>
      </AdminPanel>
    );
  }

  if (error || !data) {
    return (
      <AdminEmptyState
        title="Não foi possível carregar o Studio"
        description={error || "Tente novamente em alguns instantes."}
        tone="danger"
        action={<AdminActionButton onClick={load} tone="danger">Tentar novamente</AdminActionButton>}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1120 }}>
      <AdminPageHeader
        eyebrow="Studio 360"
        title={studio.name}
        description={`Tenant /${studio.slug} · criado em ${fmtDate(studio.createdAt)}`}
        actions={
          <>
            <AdminActionButton onClick={() => router.back()} tone="muted"><ArrowLeft size={13} /> Voltar</AdminActionButton>
            <AdminActionButton href={`/agendar/${studio.slug}`} tone="brand"><ExternalLink size={13} /> Página pública</AdminActionButton>
            <AdminActionButton onClick={load} tone="muted"><RefreshCw size={13} /> Atualizar</AdminActionButton>
            <AdminActionButton onClick={openStudioEdit} tone="warning"><Pencil size={13} /> Editar</AdminActionButton>
          </>
        }
      />

      {error && <AdminStatusBadge tone="danger">{error}</AdminStatusBadge>}

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr repeat(3, 1fr)", gap: 12 }}>
        <AdminMetricCard label="Saúde" value={health.label} sub={health.description} icon={ShieldAlert} tone={health.tone as any} large />
        <AdminMetricCard label="MRR" value={formatCurrency(Number(studio.mrr ?? 0))} sub={subscriptionLabel(subscriptionStatus)} icon={DollarSign} tone={subscriptionTone(subscriptionStatus) as any} />
        <AdminMetricCard label="Agendamentos" value={data.stats.appointments} sub="histórico do studio" icon={Calendar} tone="brand" />
        <AdminMetricCard label="Serviços ativos" value={activeServices.length} sub={`${services.length} cadastrados`} icon={Scissors} tone={activeServices.length ? "success" : "warning"} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["overview", "Visão geral"],
          ["billing", "Assinatura"],
          ["services", "Serviços"],
          ["settings", "Horários"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className="admin-action-button"
            style={{
              color: tab === key ? "#818cf8" : "#71717a",
              background: tab === key ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
              borderColor: tab === key ? "rgba(99,102,241,0.30)" : "rgba(255,255,255,0.08)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {editingStudio && (
        <AdminPanel title="Editar studio" description="Ajustes administrativos do tenant." tone="warning">
          <div style={{ padding: 18, display: "grid", gridTemplateColumns: "1.2fr 1fr 150px auto", gap: 12, alignItems: "end" }}>
            <Field label="Nome" value={editName} onChange={setEditName} />
            <Field label="Slug" value={editSlug} onChange={setEditSlug} />
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ color: "#71717a", fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Plano</span>
              <select value={editPlan} onChange={(event) => setEditPlan(event.target.value)} className="input-base" style={{ height: 38, borderRadius: 9 }}>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="studio">Studio</option>
              </select>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <AdminActionButton onClick={() => setEditActive((value) => !value)} tone={editActive ? "success" : "danger"}>
                {editActive ? "Ativo" : "Inativo"}
              </AdminActionButton>
              <AdminActionButton onClick={saveStudio} tone="brand" disabled={savingStudio}>
                {savingStudio ? <Loader2 size={13} className="spin" /> : <Check size={13} />} Salvar
              </AdminActionButton>
              <AdminActionButton onClick={() => setEditingStudio(false)} tone="muted"><X size={13} /></AdminActionButton>
            </div>
          </div>
        </AdminPanel>
      )}

      {tab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <AdminPanel title="Profissional responsável" description="Quem opera este studio." tone={data.owner ? "success" : "warning"}>
            {data.owner ? (
              <div style={{ padding: 18, display: "grid", gridTemplateColumns: "52px 1fr", gap: 14, alignItems: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.24)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8", fontSize: 20, fontWeight: 850 }}>
                  {(data.owner.name || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ color: "#f4f4f5", fontWeight: 800, margin: 0 }}>{data.owner.name || "Sem nome"}</p>
                  <p style={{ color: "#71717a", margin: "4px 0 0", fontSize: 12 }}>{data.owner.email || "Sem email"}</p>
                  <p style={{ color: "#71717a", margin: "3px 0 0", fontSize: 12 }}>{data.owner.phone || "Sem telefone"}</p>
                </div>
              </div>
            ) : (
              <AdminEmptyState
                title="Studio sem owner"
                description="Vincule um profissional para liberar uma operação SaaS completa."
                tone="warning"
                action={<AdminActionButton href="/admin/profissionais" tone="warning"><User size={13} /> Vincular profissional</AdminActionButton>}
              />
            )}
          </AdminPanel>

          <AdminPanel title="Resumo operacional" description="Sinais rápidos de uso e configuração." tone="brand">
            <div style={{ padding: 18, display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#71717a", fontSize: 12 }}>Status do tenant</span>
                <AdminStatusBadge tone={studio.isActive ? "success" : "muted"} dot>{studio.isActive ? "Ativo" : "Inativo"}</AdminStatusBadge>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#71717a", fontSize: 12 }}>Plano</span>
                <AdminStatusBadge tone="brand">{studio.plan}</AdminStatusBadge>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#71717a", fontSize: 12 }}>Trial até</span>
                <strong style={{ color: trialDays !== null && trialDays <= 7 ? "#fbbf24" : "#f4f4f5", fontSize: 12 }}>{fmtDate(studio.trialEndsAt)}{trialDays !== null ? ` · ${trialDays}d` : ""}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#71717a", fontSize: 12 }}>Próxima cobrança</span>
                <strong style={{ color: renewalDays !== null && renewalDays < 0 ? "#f87171" : "#f4f4f5", fontSize: 12 }}>{fmtDate(studio.nextBillingDate)}{renewalDays !== null ? ` · ${renewalDays >= 0 ? `em ${renewalDays}d` : `${Math.abs(renewalDays)}d atrasado`}` : ""}</strong>
              </div>
            </div>
          </AdminPanel>
        </div>
      )}

      {tab === "billing" && (
        <AdminPanel title="Assinatura e monetização" description="Estado comercial do tenant e riscos de cobrança." tone={subscriptionTone(subscriptionStatus) as any}>
          <div style={{ padding: 18, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <AdminMetricCard label="Status" value={subscriptionLabel(subscriptionStatus)} icon={CreditCard} tone={subscriptionTone(subscriptionStatus) as any} />
            <AdminMetricCard label="MRR" value={formatCurrency(Number(studio.mrr ?? 0))} icon={DollarSign} tone={Number(studio.mrr) > 0 ? "success" : "muted"} />
            <AdminMetricCard label="Trial" value={trialDays === null ? "—" : `${trialDays}d`} sub={fmtDate(studio.trialEndsAt)} icon={Clock} tone={trialDays !== null && trialDays <= 7 ? "warning" : "muted"} />
            <AdminMetricCard label="Renovação" value={renewalDays === null ? "—" : renewalDays >= 0 ? `${renewalDays}d` : "Atrasada"} sub={fmtDate(studio.nextBillingDate)} icon={Calendar} tone={renewalDays !== null && renewalDays < 0 ? "danger" : "brand"} />
          </div>
        </AdminPanel>
      )}

      {tab === "services" && (
        <AdminPanel
          title={`Serviços (${services.length})`}
          description="Catálogo que controla a experiência pública de agendamento."
          actions={<AdminActionButton onClick={() => { setAddingService(true); setServiceForm({ name: "", price: "", duration: "", buffer: "0" }); }} tone="brand"><Plus size={13} /> Novo serviço</AdminActionButton>}
          tone={activeServices.length ? "success" : "warning"}
        >
          {(addingService || editingServiceId) && (
            <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "1.3fr 120px 130px 120px auto", gap: 10, alignItems: "end" }}>
              <Field label="Nome" value={serviceForm.name} onChange={(value: string) => setServiceForm((form) => ({ ...form, name: value }))} />
              <Field label="Preço" type="number" value={serviceForm.price} onChange={(value: string) => setServiceForm((form) => ({ ...form, price: value }))} />
              <Field label="Duração" type="number" value={serviceForm.duration} onChange={(value: string) => setServiceForm((form) => ({ ...form, duration: value }))} />
              <Field label="Buffer" type="number" value={serviceForm.buffer} onChange={(value: string) => setServiceForm((form) => ({ ...form, buffer: value }))} />
              <div style={{ display: "flex", gap: 8 }}>
                <AdminActionButton onClick={() => saveService(editingServiceId ?? undefined)} tone="brand" disabled={savingService}>
                  {savingService ? <Loader2 size={13} className="spin" /> : <Check size={13} />} Salvar
                </AdminActionButton>
                <AdminActionButton onClick={() => { setAddingService(false); setEditingServiceId(null); }} tone="muted"><X size={13} /></AdminActionButton>
              </div>
            </div>
          )}

          {services.length === 0 ? (
            <AdminEmptyState title="Nenhum serviço cadastrado" description="Sem serviços, a página pública não converte agendamentos." tone="warning" />
          ) : (
            services.map((service: any) => (
              <div key={service.id} style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px auto", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: service.isActive ? 1 : 0.55 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: "#f4f4f5", margin: 0, fontSize: 13, fontWeight: 800 }}>{service.name}</p>
                  <p style={{ color: "#71717a", margin: "4px 0 0", fontSize: 11 }}>{service.isActive ? "Disponível para agendamento" : "Oculto da vitrine"}</p>
                </div>
                <strong style={{ color: "#4ade80", fontSize: 12 }}>{formatCurrency(service.price)}</strong>
                <span style={{ color: "#a1a1aa", fontSize: 12 }}>{formatDuration(service.durationMinutes)}</span>
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <AdminActionButton onClick={() => toggleService(service)} tone={service.isActive ? "warning" : "success"}>{service.isActive ? "Desativar" : "Ativar"}</AdminActionButton>
                  <AdminActionButton onClick={() => openServiceEdit(service)} tone="muted"><Pencil size={12} /></AdminActionButton>
                  <AdminActionButton onClick={() => setDeleteTarget(service)} tone="danger"><Trash2 size={12} /></AdminActionButton>
                </div>
              </div>
            ))
          )}
        </AdminPanel>
      )}

      {tab === "settings" && (
        <AdminPanel title="Horários e regras" description="Configuração usada para gerar disponibilidade pública." tone="brand">
          {data.settings?.workingHours ? (
            <div style={{ padding: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 9 }}>
                {DAY_ORDER.map((day) => {
                  const config = data.settings.workingHours[day];
                  return (
                    <div key={day} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 12, background: config?.isOpen ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.015)", opacity: config?.isOpen ? 1 : 0.45, textAlign: "center" }}>
                      <p style={{ color: "#71717a", fontSize: 10, fontWeight: 800, margin: "0 0 8px", textTransform: "uppercase" }}>{DAY_LABELS[day]}</p>
                      {config?.isOpen ? (
                        <p style={{ color: "#f4f4f5", fontSize: 12, fontWeight: 800, margin: 0 }}>{config.open}<br />{config.close}</p>
                      ) : (
                        <p style={{ color: "#71717a", fontSize: 12, fontWeight: 700, margin: 0 }}>Fechado</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
                <AdminStatusBadge tone="brand">Slot {data.settings.slotDuration}min</AdminStatusBadge>
                <AdminStatusBadge tone="brand">Agenda {data.settings.advanceDays} dias</AdminStatusBadge>
                <AdminStatusBadge tone="brand">Cancelamento {data.settings.cancelHours}h</AdminStatusBadge>
                <AdminStatusBadge tone={data.settings.autoConfirm ? "success" : "warning"}>{data.settings.autoConfirm ? "Auto-confirma" : "Confirmação manual"}</AdminStatusBadge>
              </div>
            </div>
          ) : (
            <AdminEmptyState title="Configuração não encontrada" description="Crie as regras de agenda para o studio operar corretamente." tone="warning" />
          )}
        </AdminPanel>
      )}

      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,.72)", backdropFilter: "blur(8px)" }}>
          <AdminPanel title="Excluir serviço?" description={`Esta ação remove "${deleteTarget.name}" do catálogo do studio.`} tone="danger">
            <div style={{ padding: 18, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <AdminActionButton onClick={() => setDeleteTarget(null)} tone="muted">Cancelar</AdminActionButton>
              <AdminActionButton onClick={deleteService} tone="danger" disabled={savingService}>
                {savingService ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />} Excluir
              </AdminActionButton>
            </div>
          </AdminPanel>
        </div>
      )}
    </div>
  );
}
