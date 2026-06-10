// @ts-nocheck
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Plus,
  Check,
  X,
  Scissors,
  User,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudioDetail {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  ownerId: string;
  createdAt: string | null;
  updatedAt: string | null;
  trialEndsAt: string | null;
}

interface Owner {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  bufferMinutes: number;
  isActive: boolean;
}

interface Settings {
  slotDuration: number;
  advanceDays: number;
  cancelHours: number;
  autoConfirm: boolean;
  workingHours: Record<string, { open: string; close: string; isOpen: boolean }>;
}

interface StudioData {
  studio: StudioDetail;
  owner: Owner | null;
  services: Service[];
  settings: Settings | null;
  stats: { appointments: number; services: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "—";
  }
}

function formatPrice(price: number): string {
  return `R$ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

const PLAN_COLORS: Record<string, string> = {
  pro: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  free: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  starter: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminStudioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studioId = params?.studioId as string;

  const [data, setData] = useState<StudioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit studio
  const [editingStudio, setEditingStudio] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [savingStudio, setSavingStudio] = useState(false);

  // Services
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [svcName, setSvcName] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcDuration, setSvcDuration] = useState("");
  const [svcBuffer, setSvcBuffer] = useState("0");
  const [savingSvc, setSavingSvc] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New service form
  const [addingService, setAddingService] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [newBuffer, setNewBuffer] = useState("0");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/studios/${studioId}`);
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? "Erro ao carregar studio");
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => { load(); }, [load]);

  // ─── Studio edit ───────────────────────────────────────────────────────────

  function openEditStudio() {
    if (!data) return;
    setEditName(data.studio.name);
    setEditSlug(data.studio.slug);
    setEditPlan(data.studio.plan);
    setEditActive(data.studio.isActive);
    setEditingStudio(true);
  }

  async function saveStudio() {
    if (!data) return;
    setSavingStudio(true);
    try {
      const res = await fetch(`/api/admin/studios/${studioId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, slug: editSlug, plan: editPlan, isActive: editActive }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error);
      setEditingStudio(false);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingStudio(false);
    }
  }

  // ─── Service edit ──────────────────────────────────────────────────────────

  function openEditService(svc: Service) {
    setEditingServiceId(svc.id);
    setSvcName(svc.name);
    setSvcPrice(String(svc.price));
    setSvcDuration(String(svc.durationMinutes));
    setSvcBuffer(String(svc.bufferMinutes));
  }

  async function saveService(id: string) {
    setSavingSvc(true);
    try {
      const res = await fetch(`/api/admin/studios/${studioId}/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: svcName,
          price: Number(svcPrice),
          durationMinutes: Number(svcDuration),
          bufferMinutes: Number(svcBuffer),
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error);
      setEditingServiceId(null);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingSvc(false);
    }
  }

  async function deleteService(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/studios/${studioId}/services/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error);
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleService(svc: Service) {
    try {
      await fetch(`/api/admin/studios/${studioId}/services/${svc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !svc.isActive }),
      });
      await load();
    } catch { /* noop */ }
  }

  // ─── Add service ───────────────────────────────────────────────────────────

  async function addService() {
    if (!newName || !newPrice || !newDuration) return;
    setSavingSvc(true);
    try {
      const res = await fetch(`/api/admin/studios/${studioId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          price: Number(newPrice),
          durationMinutes: Number(newDuration),
          bufferMinutes: Number(newBuffer),
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error);
      setAddingService(false);
      setNewName(""); setNewPrice(""); setNewDuration(""); setNewBuffer("0");
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingSvc(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-purple-400" size={32} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="text-red-400" size={32} />
        <p className="text-sm text-slate-400">{error ?? "Não foi possível carregar."}</p>
        <button onClick={load} className="text-sm text-purple-400 underline">Tentar novamente</button>
      </div>
    );
  }

  const { studio, owner, services, settings, stats } = data;
  const trialDaysLeft = studio.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(studio.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">{studio.name}</h1>
          <p className="text-xs text-slate-500 font-mono">{studio.id}</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-xl hover:bg-white/5 text-slate-400 transition"
          title="Recarregar"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Studio Info Card */}
      <Card
        title="Informações do Studio"
        action={
          !editingStudio ? (
            <IconBtn onClick={openEditStudio} title="Editar"><Pencil size={14} /></IconBtn>
          ) : null
        }
      >
        {editingStudio ? (
          <div className="space-y-3">
            <Field label="Nome" value={editName} onChange={setEditName} />
            <Field label="Slug" value={editSlug} onChange={setEditSlug} />
            <div>
              <label className="label">Plano</label>
              <select
                value={editPlan}
                onChange={(e) => setEditPlan(e.target.value)}
                className="select"
              >
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="label mb-0">Status</label>
              <button
                onClick={() => setEditActive((v) => !v)}
                className={`px-3 py-1 rounded-lg text-xs font-black border transition ${
                  editActive
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {editActive ? "Ativo" : "Inativo"}
              </button>
            </div>
            <div className="flex gap-2 pt-1">
              <SaveBtn onClick={saveStudio} loading={savingStudio} />
              <CancelBtn onClick={() => setEditingStudio(false)} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoCell label="Status">
              <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${studio.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                {studio.isActive ? "Ativo" : "Inativo"}
              </span>
            </InfoCell>
            <InfoCell label="Plano">
              <span className={`px-2 py-0.5 rounded-lg text-xs font-black border capitalize ${PLAN_COLORS[studio.plan] ?? PLAN_COLORS.free}`}>
                {studio.plan}
              </span>
            </InfoCell>
            <InfoCell label="Slug">
              <span className="text-xs font-mono text-slate-300">{studio.slug || "—"}</span>
            </InfoCell>
            <InfoCell label="Trial até">
              <span className="text-xs font-bold text-slate-300">
                {formatDate(studio.trialEndsAt)}
                {trialDaysLeft !== null && (
                  <span className={`ml-1 text-[10px] font-black ${trialDaysLeft <= 7 ? "text-amber-400" : "text-slate-500"}`}>
                    ({trialDaysLeft}d)
                  </span>
                )}
              </span>
            </InfoCell>
            <InfoCell label="Criado em">
              <span className="text-xs font-bold text-slate-300">{formatDate(studio.createdAt)}</span>
            </InfoCell>
            <InfoCell label="Agendamentos">
              <span className="text-sm font-black text-white">{stats.appointments}</span>
            </InfoCell>
            <InfoCell label="Serviços">
              <span className="text-sm font-black text-white">{stats.services}</span>
            </InfoCell>
          </div>
        )}
      </Card>

      {/* Profissional */}
      <Card title="Profissional" icon={<User size={14} />}>
        {owner ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-300 font-black text-lg">
              {(owner.name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
              <InfoCell label="Nome">
                <span className="text-sm font-black text-white">{owner.name || "—"}</span>
              </InfoCell>
              <InfoCell label="Email">
                <span className="text-xs text-slate-300">{owner.email || "—"}</span>
              </InfoCell>
              <InfoCell label="Telefone">
                <span className="text-xs text-slate-300">{owner.phone || "—"}</span>
              </InfoCell>
              <InfoCell label="UID">
                <span className="text-[10px] font-mono text-slate-500">{owner.uid?.slice(0, 12)}...</span>
              </InfoCell>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Owner não encontrado.{" "}
            <span className="text-[10px] font-mono text-slate-600">{studio.ownerId}</span>
          </p>
        )}
      </Card>

      {/* Serviços */}
      <Card
        title={`Serviços (${services.length})`}
        icon={<Scissors size={14} />}
        action={
          !addingService ? (
            <button
              onClick={() => setAddingService(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-black hover:bg-purple-500/20 transition"
            >
              <Plus size={12} /> Adicionar
            </button>
          ) : null
        }
      >
        {/* Formulário de novo serviço */}
        {addingService && (
          <div className="mb-4 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <p className="text-xs font-black text-purple-400 uppercase tracking-wider">Novo serviço</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <Field label="Nome *" value={newName} onChange={setNewName} placeholder="Ex: Manicure simples" />
              </div>
              <Field label="Preço (R$) *" value={newPrice} onChange={setNewPrice} placeholder="35" type="number" />
              <Field label="Duração (min) *" value={newDuration} onChange={setNewDuration} placeholder="45" type="number" />
            </div>
            <div className="flex gap-2">
              <SaveBtn onClick={addService} loading={savingSvc} label="Criar serviço" />
              <CancelBtn onClick={() => { setAddingService(false); setNewName(""); setNewPrice(""); setNewDuration(""); }} />
            </div>
          </div>
        )}

        {/* Lista de serviços */}
        {services.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">Nenhum serviço cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {services
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((svc) => {
                const isEditing = editingServiceId === svc.id;
                const isDeleting = deletingId === svc.id;

                return (
                  <div
                    key={svc.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      svc.isActive
                        ? "bg-white/5 border-white/10"
                        : "bg-white/2 border-white/5 opacity-50"
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="col-span-2">
                            <Field label="Nome" value={svcName} onChange={setSvcName} />
                          </div>
                          <Field label="Preço (R$)" value={svcPrice} onChange={setSvcPrice} type="number" />
                          <Field label="Duração (min)" value={svcDuration} onChange={setSvcDuration} type="number" />
                        </div>
                        <div className="flex gap-2">
                          <SaveBtn onClick={() => saveService(svc.id)} loading={savingSvc} />
                          <CancelBtn onClick={() => setEditingServiceId(null)} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-sm truncate">{svc.name}</span>
                            {!svc.isActive && (
                              <span className="text-[10px] font-black text-slate-500 border border-slate-700 rounded px-1">INATIVO</span>
                            )}
                          </div>
                          <div className="flex gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-emerald-400 font-black">
                              <DollarSign size={10} />
                              {formatPrice(svc.price)}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-400 font-bold">
                              <Clock size={10} />
                              {formatDuration(svc.durationMinutes)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleService(svc)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black border transition ${
                              svc.isActive
                                ? "text-slate-400 border-slate-700 hover:text-amber-400 hover:border-amber-500/30"
                                : "text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10"
                            }`}
                          >
                            {svc.isActive ? "Desativar" : "Ativar"}
                          </button>
                          <IconBtn onClick={() => openEditService(svc)} title="Editar">
                            <Pencil size={13} />
                          </IconBtn>
                          <IconBtn
                            onClick={() => deleteService(svc.id)}
                            title="Excluir"
                            className="hover:text-red-400 hover:bg-red-500/10"
                          >
                            {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </IconBtn>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </Card>

      {/* Horários de funcionamento */}
      {settings?.workingHours && (
        <Card title="Horários de Funcionamento" icon={<Calendar size={14} />}>
          <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
            {DAY_ORDER.map((day) => {
              const config = settings.workingHours[day];
              return (
                <div
                  key={day}
                  className={`rounded-xl p-3 text-center border transition ${
                    config?.isOpen
                      ? "bg-white/5 border-white/10"
                      : "bg-white/2 border-white/5 opacity-40"
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                    {DAY_LABELS[day]}
                  </p>
                  {config?.isOpen ? (
                    <>
                      <p className="text-xs font-black text-white">{config.open}</p>
                      <p className="text-[10px] text-slate-500">–</p>
                      <p className="text-xs font-black text-white">{config.close}</p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-600 font-bold">Fechado</p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400 font-bold">
            <span>Slot: <strong className="text-white">{settings.slotDuration}min</strong></span>
            <span>Antecedência: <strong className="text-white">{settings.advanceDays} dias</strong></span>
            <span>Cancelar até: <strong className="text-white">{settings.cancelHours}h antes</strong></span>
            <span>Auto-confirmar: <strong className="text-white">{settings.autoConfirm ? "Sim" : "Não"}</strong></span>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Card({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-purple-400">{icon}</span>}
          <h2 className="text-sm font-black text-white uppercase tracking-wider">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function InfoCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{label}</p>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition"
      />
    </div>
  );
}

function IconBtn({
  onClick,
  title,
  className = "",
  children,
}: {
  onClick: () => void;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition ${className}`}
    >
      {children}
    </button>
  );
}

function SaveBtn({
  onClick,
  loading,
  label = "Salvar",
}: {
  onClick: () => void;
  loading: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-black hover:bg-purple-500/30 disabled:opacity-50 transition"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
      {label}
    </button>
  );
}

function CancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 text-slate-400 border border-white/10 text-xs font-black hover:bg-white/10 transition"
    >
      <X size={12} /> Cancelar
    </button>
  );
}
