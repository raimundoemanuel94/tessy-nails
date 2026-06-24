"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle, BadgeCheck, Bell, CalendarClock, Check,
  CreditCard, Database, DollarSign, Edit3, Globe2,
  Loader2, LockKeyhole, MessageCircle, RotateCcw, Save,
  Settings2, ShieldCheck, Sparkles, Users, X,
} from "lucide-react";
import {
  AdminActionButton, AdminMetricCard, AdminPageHeader,
  AdminPanel, AdminStatusBadge,
} from "@/components/admin/AdminUI";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

const planTone: Record<string, string> = {
  free: "#94a3b8", starter: "#60a5fa", pro: "#7c3aed", studio: "#f472b6",
};

const SETTING_GROUPS = [
  {
    label: "Operacional",
    icon: CalendarClock,
    color: "#7c3aed",
    settings: [
      { key: "default_commission_rate", label: "Comissão padrão (%)", type: "number", min: 0, max: 100 },
      { key: "default_advance_days",    label: "Janela agendamento (dias)", type: "number", min: 1, max: 365 },
      { key: "default_cancel_hours",    label: "Cancelamento mínimo (horas)", type: "number", min: 0 },
      { key: "trial_days",              label: "Duração do trial (dias)", type: "number", min: 1 },
      { key: "overdue_block_days",      label: "Bloqueio inadimplência (dias)", type: "number", min: 1 },
    ],
  },
  {
    label: "Mensagens",
    icon: Bell,
    color: "#10b981",
    settings: [
      { key: "reminder_hours_before", label: "Lembrete antes do horário (horas)", type: "number", min: 1 },
      { key: "reactivation_days",     label: "Retorno de clientes inativos (dias)", type: "number", min: 1 },
    ],
  },
  {
    label: "Plataforma",
    icon: Globe2,
    color: "#3b82f6",
    settings: [
      { key: "platform_name",   label: "Nome da plataforma", type: "text" },
      { key: "support_email",   label: "Email de suporte", type: "email" },
      { key: "booking_timezone",label: "Fuso horário", type: "text" },
    ],
  },
];

function StatusLine({ ok, label, description }: any) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 10, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #e8e8f0" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: ok ? "#10b981" : "#f59e0b", background: ok ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${ok ? "rgba(16,185,129,0.22)" : "rgba(245,158,11,0.24)"}` }}>
        {ok ? <Check size={14} /> : <AlertTriangle size={14} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: "block", color: "#0f172a", fontSize: 13 }}>{label}</strong>
        <span style={{ display: "block", color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{description}</span>
      </div>
      <AdminStatusBadge tone={ok ? "success" : "warning"}>{ok ? "OK" : "Ajustar"}</AdminStatusBadge>
    </div>
  );
}

function ModuleCard({ icon: Icon, title, status, description, items, tone = "brand" }: any) {
  const color = tone === "success" ? "#10b981" : tone === "warning" ? "#f59e0b" : tone === "danger" ? "#ef4444" : "#7c3aed";
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, background: "#ffffff" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color, background: `${color}12`, border: `1px solid ${color}30` }}>
            <Icon size={17} />
          </div>
          <div>
            <strong style={{ display: "block", color: "#0f172a", fontSize: 14 }}>{title}</strong>
            <span style={{ display: "block", color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{description}</span>
          </div>
        </div>
        <AdminStatusBadge tone={tone}>{status}</AdminStatusBadge>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {items.map((item: string) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 7, color: "#64748b", fontSize: 12 }}>
            <span style={{ width: 4, height: 4, borderRadius: 999, background: color, flexShrink: 0 }} />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConfigClient({ plans, studios, settings, counts, envStatus }: any) {
  const sb = createClient();

  // Plans state
  const [rows, setRows] = useState(plans);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [planDraft, setPlanDraft] = useState({ label: "", price: "" });
  const [savingPlan, setSavingPlan] = useState(false);
  const [savedPlan, setSavedPlan] = useState<string | null>(null);
  const [planError, setPlanError] = useState("");

  // Platform settings state
  const [platformSettings, setPlatformSettings] = useState<Record<string, string>>({});
  const [editingSettings, setEditingSettings] = useState<Record<string, string>>({});
  const [savingGroup, setSavingGroup] = useState<string | null>(null);
  const [savedGroup, setSavedGroup] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null);
  function showToast(msg: string, ok = true) { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); }
  const [settingsError, setSettingsError] = useState("");

  // Load platform settings
  useEffect(() => {
    sb.from("platform_settings").select("key, value").then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((row: any) => {
          const raw = row.value;
          map[row.key] = typeof raw === "string" ? raw.replace(/^"|"$/g, "") : String(raw);
        });
        setPlatformSettings(map);
        setEditingSettings(map);
      }
      setLoadingSettings(false);
    });
  }, []);

  async function saveGroup(groupLabel: string, keys: string[]) {
    setSavingGroup(groupLabel);
    setSettingsError("");
    const updates = keys.map((key) => ({
      key,
      value: isNaN(Number(editingSettings[key])) || editingSettings[key] === ""
        ? JSON.stringify(editingSettings[key] ?? "")
        : Number(editingSettings[key]),
      updated_at: new Date().toISOString(),
    }));
    const { error } = await sb.from("platform_settings").upsert(updates, { onConflict: "key" });
    setSavingGroup(null);
    if (error) { setSettingsError(error.message); return; }
    setPlatformSettings({ ...editingSettings });
    setSavedGroup(groupLabel);
    setTimeout(() => setSavedGroup(null), 2500);
    showToast(`${groupLabel} salvo!`);
  }

  // Plans
  function openEditPlan(plan: any) {
    setEditingPlan(plan.plan);
    setPlanDraft({ label: plan.label ?? "", price: String(plan.price ?? 0) });
    setPlanError("");
  }
  async function savePlan(plan: string) {
    const price = Number(planDraft.price);
    if (!planDraft.label.trim()) return setPlanError("Nome obrigatório.");
    if (!Number.isFinite(price) || price < 0) return setPlanError("Preço inválido.");
    setSavingPlan(true);
    setPlanError("");
    const { error } = await sb.from("plan_prices").update({ label: planDraft.label.trim(), price }).eq("plan", plan);
    setSavingPlan(false);
    if (error) return setPlanError(error.message);
    setRows((c: any[]) => c.map((r) => r.plan === plan ? { ...r, label: planDraft.label.trim(), price } : r));
    setEditingPlan(null);
    setSavedPlan(plan);
    setTimeout(() => setSavedPlan(null), 2500);
    showToast("Plano salvo!");
  }

  // Metrics
  const activeStudios = studios.filter((s: any) => s.is_active);
  const trial = studios.filter((s: any) => ["trial", "trialing"].includes(s.subscription_status));
  const autoConfirm = settings.filter((s: any) => s.auto_confirm).length;
  const configuredHours = settings.filter((s: any) => s.working_hours && Object.keys(s.working_hours).length > 0).length;
  const priceByPlan = new Map(rows.map((p: any) => [p.plan, Number(p.price ?? 0)]));
  const mrr = studios.reduce((sum: number, s: any) => {
    if (s.subscription_status !== "active") return sum;
    return sum + Number(s.mrr ?? priceByPlan.get(s.plan) ?? 0);
  }, 0);
  const envOk = [envStatus.supabaseUrl, envStatus.supabaseAnon, envStatus.serviceRole, envStatus.stripeSecret, envStatus.stripePublic, envStatus.whatsapp].filter(Boolean).length;

  return (
    <>
    {toast && (
      <div style={{position:"fixed",bottom:24,right:24,zIndex:200,padding:"12px 18px",borderRadius:10,
        background:toast.ok?"#10b981":"#ef4444",color:"#fff",fontSize:13,fontWeight:600,
        boxShadow:"0 4px 20px rgba(0,0,0,0.15)"}}>
        {toast.msg}
      </div>
    )}
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1180 }}>
      <AdminPageHeader
        eyebrow="Sistema"
        title="Configurações da Plataforma"
        description="Centro de controle do Nailit — planos, regras operacionais, integrações e módulos."
        actions={
          <>
            <AdminActionButton href="/admin/config/planos" tone="brand">Planos avançados</AdminActionButton>
            <AdminActionButton href="/admin/mensagens" tone="muted">Mensagens</AdminActionButton>
          </>
        }
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <AdminMetricCard label="MRR configurado" value={formatCurrency(mrr)} sub="por planos ativos" icon={DollarSign} tone="success" />
        <AdminMetricCard label="Salões ativos" value={activeStudios.length} sub={`${trial.length} em teste`} icon={Globe2} tone="brand" />
        <AdminMetricCard label="Agenda configurada" value={`${configuredHours}/${studios.length}`} sub={`${autoConfirm} auto-confirmação`} icon={CalendarClock} tone="warning" />
        <AdminMetricCard label="Integrações OK" value={`${envOk}/6`} sub={envStatus.bookingTimezone ?? "sem timezone"} icon={Database} tone={envOk >= 4 ? "success" : "warning"} />
      </div>

      {/* Planos + Status técnico */}
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 14, alignItems: "start" }}>
        <AdminPanel title="Planos e preços" description="Edição do catálogo comercial." tone="brand">
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            {rows.map((plan: any) => {
              const color = planTone[plan.plan] ?? "#7c3aed";
              const isEdit = editingPlan === plan.plan;
              const inPlan = studios.filter((s: any) => s.plan === plan.plan);
              const paying = inPlan.filter((s: any) => s.subscription_status === "active").length;
              return (
                <div key={plan.plan} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, background: "#fff" }}>
                  {isEdit ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 130px auto", gap: 10, alignItems: "end" }}>
                      <label style={{ display: "grid", gap: 4 }}>
                        <span style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Nome</span>
                        <input value={planDraft.label} onChange={(e) => setPlanDraft((d) => ({ ...d, label: e.target.value }))} className="input-base" />
                      </label>
                      <label style={{ display: "grid", gap: 4 }}>
                        <span style={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>Preço/mês</span>
                        <input value={planDraft.price} type="number" min="0" step="0.01" onChange={(e) => setPlanDraft((d) => ({ ...d, price: e.target.value }))} className="input-base" />
                      </label>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => savePlan(plan.plan)} disabled={savingPlan} className="admin-action-button" style={{ color: "#10b981", borderColor: "rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.08)" }}>
                          {savingPlan ? <Loader2 size={13} className="spin" /> : <Save size={13} />} Salvar
                        </button>
                        <button onClick={() => setEditingPlan(null)} className="admin-action-button">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 12, alignItems: "center" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ color, border: `1px solid ${color}44`, background: `${color}12`, borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{plan.plan}</span>
                          <strong style={{ color: "#0f172a", fontSize: 14 }}>{plan.label}</strong>
                        </div>
                        <span style={{ color: "#94a3b8", fontSize: 12 }}>{inPlan.length} salões · {paying} pagantes</span>
                      </div>
                      <strong style={{ color: Number(plan.price) > 0 ? "#10b981" : "#94a3b8", fontSize: 15 }}>{formatCurrency(Number(plan.price ?? 0))}</strong>
                      <AdminStatusBadge tone={savedPlan === plan.plan ? "success" : "muted"}>{savedPlan === plan.plan ? "✓ Salvo" : "Mensal"}</AdminStatusBadge>
                      <button onClick={() => openEditPlan(plan)} className="admin-action-button" style={{ color: "#7c3aed", borderColor: "rgba(124,58,237,0.22)", background: "rgba(124,58,237,0.08)" }}>
                        <Edit3 size={13} /> Editar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {planError && <p style={{ color: "#ef4444", fontSize: 12, margin: 0 }}>{planError}</p>}
          </div>
        </AdminPanel>

        <AdminPanel title="Status técnico" description="Variáveis e serviços necessários." tone={envOk >= 4 ? "success" : "warning"}>
          <div style={{ padding: "4px 16px 10px" }}>
            <StatusLine ok={envStatus.supabaseUrl && envStatus.supabaseAnon} label="Supabase público" description="URL e chave anon configuradas." />
            <StatusLine ok={envStatus.serviceRole} label="Service role" description="Necessário para rotas admin e automações." />
            <StatusLine ok={envStatus.stripeSecret && envStatus.stripePublic} label="Pagamentos" description="Stripe pronto para checkout/webhooks." />
            <StatusLine ok={envStatus.whatsapp} label="WhatsApp gateway" description="Envio automático de mensagens." />
          </div>
        </AdminPanel>
      </div>

      {/* Regras operacionais — editáveis e salvam no banco */}
      <div style={{ display: "grid", gap: 14 }}>
        {loadingSettings ? (
          <div style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}><Loader2 size={20} className="spin" /></div>
        ) : (
          SETTING_GROUPS.map((group) => {
            const Icon = group.icon;
            const isSaving = savingGroup === group.label;
            const isSaved = savedGroup === group.label;
            const keys = group.settings.map((s) => s.key);
            const isDirty = keys.some((k) => editingSettings[k] !== platformSettings[k]);
            return (
              <AdminPanel key={group.label}
                title={group.label}
                description="Configurações salvas no banco — afetam todos os salões."
                tone="brand"
                actions={
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {isSaved && <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>✓ Salvo</span>}
                    {isDirty && !isSaving && (
                      <button onClick={() => setEditingSettings((e) => { const r = { ...e }; keys.forEach((k) => { r[k] = platformSettings[k]; }); return r; })}
                        className="admin-action-button" style={{ fontSize: 12 }}>
                        <RotateCcw size={12} /> Desfazer
                      </button>
                    )}
                    <button onClick={() => saveGroup(group.label, keys)} disabled={isSaving || !isDirty} className="admin-action-button"
                      style={{ color: isDirty ? "#10b981" : "#94a3b8", borderColor: isDirty ? "rgba(16,185,129,0.25)" : "#e2e8f0", background: isDirty ? "rgba(16,185,129,0.08)" : "#f8fafc" }}>
                      {isSaving ? <Loader2 size={13} className="spin" /> : <Save size={13} />} Salvar {group.label}
                    </button>
                  </div>
                }
              >
                <div style={{ padding: "8px 16px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {group.settings.map((s) => (
                    <label key={s.key} style={{ display: "grid", gap: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>{s.label}</span>
                      <input
                        type={s.type ?? "text"}
                        value={editingSettings[s.key] ?? ""}
                        min={(s as any).min}
                        max={(s as any).max}
                        onChange={(e) => setEditingSettings((prev) => ({ ...prev, [s.key]: e.target.value }))}
                        className="input-base"
                        style={{ background: editingSettings[s.key] !== platformSettings[s.key] ? "rgba(124,58,237,0.04)" : "", borderColor: editingSettings[s.key] !== platformSettings[s.key] ? "rgba(124,58,237,0.30)" : "" }}
                      />
                    </label>
                  ))}
                </div>
                {settingsError && <p style={{ color: "#ef4444", fontSize: 12, padding: "0 16px 12px" }}>{settingsError}</p>}
              </AdminPanel>
            );
          })
        )}
      </div>

      {/* Módulos */}
      <AdminPanel title="Módulos da plataforma" description="Status de cada módulo do Nailit." tone="brand">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: 16 }}>
          <ModuleCard icon={CalendarClock} title="Agenda global" status="Ativo" tone="success" description="Monitoramento multi-salão" items={["Agendamentos por salão", "Auto-confirmação", "Horários por regras"]} />
          <ModuleCard icon={Users} title="Clientes e CRM" status="Parcial" tone="warning" description="Base e segmentos" items={["Clientes globais", "Reativação", "Aniversários e VIP"]} />
          <ModuleCard icon={MessageCircle} title="Mensagens" status="Preparado" tone="warning" description="Campanhas e WhatsApp" items={["Templates prontos", "Lembretes", "Gateway pendente"]} />
          <ModuleCard icon={CreditCard} title="Financeiro SaaS" status="Ativo" tone="success" description="MRR e cobrança" items={["Planos editáveis", "Inadimplência", "Assinaturas"]} />
          <ModuleCard icon={Sparkles} title="Comissões" status="Próximo" tone="warning" description="Repasse por profissional" items={["commission_rules no banco", "Percentual por perfil", "Fechamento mensal"]} />
          <ModuleCard icon={LockKeyhole} title="Segurança" status="Base" tone="brand" description="Controle administrativo" items={["Perfil superadmin", "Proteção de rotas", "Auditoria pendente"]} />
        </div>
      </AdminPanel>
    </div>
    </>
  );
}
