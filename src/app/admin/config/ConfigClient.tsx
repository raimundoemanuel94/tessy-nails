"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  CalendarClock,
  Check,
  CreditCard,
  Database,
  DollarSign,
  Edit3,
  Globe2,
  Loader2,
  LockKeyhole,
  MessageCircle,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  AdminActionButton,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/AdminUI";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

const planTone: Record<string, string> = {
  free: "#94a3b8",
  starter: "#60a5fa",
  pro: "#818cf8",
  studio: "#f472b6",
};

function StatusLine({ ok, label, description }: any) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 10, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #e8e8f0" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: ok ? "#4ade80" : "#fbbf24", background: ok ? "rgba(74,222,128,0.10)" : "rgba(251,191,36,0.10)", border: `1px solid ${ok ? "rgba(74,222,128,0.22)" : "rgba(251,191,36,0.24)"}` }}>
        {ok ? <Check size={14} /> : <AlertTriangle size={14} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: "block", color: "#1a1a2e", fontSize: 13 }}>{label}</strong>
        <span style={{ display: "block", color: "#94a3b8", fontSize: 12, marginTop: 2 }}>{description}</span>
      </div>
      <AdminStatusBadge tone={ok ? "success" : "warning"}>{ok ? "OK" : "Ajustar"}</AdminStatusBadge>
    </div>
  );
}

function ModuleCard({ icon: Icon, title, status, description, items, tone = "brand" }: any) {
  const color = tone === "success" ? "#4ade80" : tone === "warning" ? "#fbbf24" : tone === "danger" ? "#f87171" : "#818cf8";
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, background: "#ffffff", minHeight: 190 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color, background: `${color}18`, border: `1px solid ${color}38` }}>
            <Icon size={17} />
          </div>
          <div>
            <strong style={{ display: "block", color: "#1a1a2e", fontSize: 14 }}>{title}</strong>
            <span style={{ display: "block", color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{description}</span>
          </div>
        </div>
        <AdminStatusBadge tone={tone}>{status}</AdminStatusBadge>
      </div>
      <div style={{ display: "grid", gap: 7 }}>
        {items.map((item: string) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 7, color: "#64748b", fontSize: 12 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: color, opacity: 0.8 }} />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConfigClient({ plans, studios, settings, counts, envStatus }: any) {
  const sb = createClient();
  const [rows, setRows] = useState(plans);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ label: "", price: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState("");

  const metrics = useMemo(() => {
    const activeStudios = studios.filter((studio: any) => studio.is_active);
    const trial = studios.filter((studio: any) => ["trial", "trialing"].includes(studio.subscription_status));
    const pastDue = studios.filter((studio: any) => studio.subscription_status === "past_due");
    const autoConfirm = settings.filter((setting: any) => setting.auto_confirm).length;
    const configuredHours = settings.filter((setting: any) => setting.working_hours && Object.keys(setting.working_hours).length > 0).length;
    const priceByPlan = new Map(rows.map((plan: any) => [plan.plan, Number(plan.price ?? 0)]));
    const mrr = studios.reduce((sum: number, studio: any) => {
      if (studio.subscription_status !== "active") return sum;
      return sum + Number(studio.mrr ?? priceByPlan.get(studio.plan) ?? 0);
    }, 0);
    return { activeStudios, trial, pastDue, autoConfirm, configuredHours, mrr };
  }, [studios, settings, rows]);

  function openEdit(plan: any) {
    setEditing(plan.plan);
    setDraft({ label: plan.label ?? "", price: String(plan.price ?? 0) });
    setError("");
  }

  async function savePlan(plan: string) {
    const price = Number(draft.price);
    if (!draft.label.trim()) return setError("Nome do plano é obrigatório.");
    if (!Number.isFinite(price) || price < 0) return setError("Preço inválido.");

    setSaving(true);
    setError("");
    const { error } = await sb.from("plan_prices").update({ label: draft.label.trim(), price }).eq("plan", plan);
    setSaving(false);
    if (error) return setError(error.message);
    setRows((current: any[]) => current.map((row) => row.plan === plan ? { ...row, label: draft.label.trim(), price } : row));
    setEditing(null);
    setSaved(plan);
    setTimeout(() => setSaved(null), 2500);
  }

  const envOk = [
    envStatus.supabaseUrl,
    envStatus.supabaseAnon,
    envStatus.serviceRole,
    envStatus.stripeSecret,
    envStatus.stripePublic,
    envStatus.whatsapp,
  ].filter(Boolean).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1180 }}>
      <AdminPageHeader
        eyebrow="Sistema"
        title="Configurações da Plataforma"
        description="Centro de controle da plataforma para planos, integrações, segurança, regras operacionais e módulos do Nailit."
        actions={
          <>
            <AdminActionButton href="/admin/config/planos" tone="brand">Planos avançados</AdminActionButton>
            <AdminActionButton href="/admin/mensagens" tone="muted">Mensagens</AdminActionButton>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <AdminMetricCard label="MRR configurado" value={formatCurrency(metrics.mrr)} sub="por planos e assinaturas" icon={DollarSign} tone="success" />
        <AdminMetricCard label="Salões ativos" value={metrics.activeStudios.length} sub={`${metrics.trial.length} em teste`} icon={Globe2} tone="brand" />
        <AdminMetricCard label="Agenda configurada" value={`${metrics.configuredHours}/${studios.length}`} sub={`${metrics.autoConfirm} com auto-confirmação`} icon={CalendarClock} tone="warning" />
        <AdminMetricCard label="Integrações OK" value={`${envOk}/6`} sub={envStatus.bookingTimezone} icon={Database} tone={envOk >= 4 ? "success" : "warning"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 14, alignItems: "start" }}>
        <AdminPanel title="Planos e preços" description="Edição rápida do catálogo comercial usado para calcular MRR da plataforma." tone="brand">
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            {rows.map((plan: any) => {
              const color = planTone[plan.plan] ?? "#818cf8";
              const isEdit = editing === plan.plan;
              const studiosInPlan = studios.filter((studio: any) => studio.plan === plan.plan);
              const paying = studiosInPlan.filter((studio: any) => studio.subscription_status === "active").length;
              return (
                <div key={plan.plan} className="admin-plan-card" style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14, background: "#ffffff" }}>
                  {isEdit ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 140px auto", gap: 10, alignItems: "end" }}>
                      <label style={{ display: "grid", gap: 5 }}>
                        <span style={{ color: "#94a3b8", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Nome</span>
                        <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} className="input-base" />
                      </label>
                      <label style={{ display: "grid", gap: 5 }}>
                        <span style={{ color: "#94a3b8", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>Preço mensal</span>
                        <input value={draft.price} type="number" min="0" onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))} className="input-base" />
                      </label>
                      <div style={{ display: "flex", gap: 7 }}>
                        <button onClick={() => savePlan(plan.plan)} disabled={saving} className="admin-action-button" style={{ color: "#4ade80", borderColor: "rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.10)" }}>
                          {saving ? <Loader2 size={13} className="spin" /> : <Save size={13} />} Salvar
                        </button>
                        <button onClick={() => setEditing(null)} className="admin-action-button" style={{ color: "#94a3b8", borderColor: "rgba(113,113,122,0.20)", background: "rgba(113,113,122,0.10)" }}>
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="admin-plan-display-row" style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 14, alignItems: "center" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span className="admin-plan-badge" style={{ color, border: `1px solid ${color}44`, background: `${color}18`, borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>{plan.plan}</span>
                          <strong className="admin-plan-name" style={{ color: "#1a1a2e", fontSize: 14 }}>{plan.label}</strong>
                        </div>
                        <span className="admin-plan-meta" style={{ color: "#94a3b8", fontSize: 12 }}>{studiosInPlan.length} salões · {paying} pagantes</span>
                      </div>
                      <strong className={Number(plan.price) > 0 ? "admin-plan-price" : "admin-plan-price admin-plan-price-free"} style={{ color: Number(plan.price) > 0 ? "#4ade80" : "#94a3b8", fontSize: 15 }}>{formatCurrency(Number(plan.price ?? 0))}</strong>
                      <AdminStatusBadge tone={saved === plan.plan ? "success" : "muted"}>{saved === plan.plan ? "Salvo" : "Mensal"}</AdminStatusBadge>
                      <button onClick={() => openEdit(plan)} className="admin-action-button" style={{ color: "#7c3aed", borderColor: "rgba(99,102,241,0.26)", background: "rgba(99,102,241,0.11)" }}>
                        <Edit3 size={13} /> Editar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {error && <p style={{ color: "#f87171", fontSize: 12, margin: 0 }}>{error}</p>}
          </div>
        </AdminPanel>

        <AdminPanel title="Status técnico" description="Checklist das variáveis e serviços necessários para produção." tone={envOk >= 4 ? "success" : "warning"}>
          <div style={{ padding: "4px 16px 10px" }}>
            <StatusLine ok={envStatus.supabaseUrl && envStatus.supabaseAnon} label="Supabase público" description="URL e chave anon configuradas." />
            <StatusLine ok={envStatus.serviceRole} label="Service role" description="Necessário para rotas administrativas e automações." />
            <StatusLine ok={envStatus.stripeSecret && envStatus.stripePublic} label="Pagamentos" description="Stripe pronto para checkout/webhooks." />
            <StatusLine ok={envStatus.whatsapp} label="WhatsApp gateway" description="Envio automático de mensagens e lembretes." />
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="Módulos da plataforma" description="O que precisa existir para o Nailit operar como SaaS completo para vários salões." tone="brand">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: 16 }}>
          <ModuleCard icon={CalendarClock} title="Agenda global" status="Ativo" tone="success" description="Monitoramento multi-salão" items={["Agendamentos por salão", "Auto-confirmação por conta", "Horários por regras do salão"]} />
          <ModuleCard icon={Users} title="Clientes e CRM" status="Parcial" tone="warning" description="Base e segmentos" items={["Clientes globais", "Reativação", "Aniversários e VIP"]} />
          <ModuleCard icon={MessageCircle} title="Mensagens" status="Preparado" tone="warning" description="Campanhas e WhatsApp" items={["Templates", "Lembretes", "Gateway pendente"]} />
          <ModuleCard icon={CreditCard} title="Financeiro SaaS" status="Ativo" tone="success" description="MRR e cobrança" items={["Planos editáveis", "Inadimplência", "Assinaturas"]} />
          <ModuleCard icon={Sparkles} title="Comissões" status="Próximo" tone="warning" description="Repasse por manicure" items={["Falta professional_id", "Percentual por perfil", "Fechamento mensal"]} />
          <ModuleCard icon={LockKeyhole} title="Segurança" status="Base" tone="brand" description="Controle administrativo" items={["Perfil de administrador", "Proteção de rotas", "Auditoria pendente"]} />
        </div>
      </AdminPanel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <AdminPanel title="Regras operacionais recomendadas" description="Defaults que devem virar tabela platform_settings no próximo passo." tone="warning">
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            {[
              ["Janela padrão de agendamento", "30 dias para cliente final, editável por salão."],
              ["Cancelamento mínimo", "2h ou 24h conforme plano do salão."],
              ["Bloqueio por inadimplência", "Suspender link público após X dias em atraso."],
              ["Comissão padrão", "40% até o salão definir regra própria."],
              ["Mensagens automáticas", "Lembrete 24h antes e retorno após 45 dias."],
            ].map(([title, desc]) => (
              <div key={title} style={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 10, alignItems: "start" }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24", background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.24)" }}>
                  <Settings2 size={14} />
                </div>
                <div>
                  <strong style={{ color: "#1a1a2e", fontSize: 13 }}>{title}</strong>
                  <p style={{ color: "#94a3b8", fontSize: 12, margin: "3px 0 0", lineHeight: 1.45 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Próximas tabelas críticas" description="Para liberar edição real de tudo sem depender de env ou hardcode." tone="brand">
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            {[
              ["platform_settings", "marca, suporte, políticas globais, timezone e regras default"],
              ["message_campaigns", "campanhas, público, status, conteúdo e métricas"],
              ["message_events", "fila de envio, entregue, erro, resposta e provider"],
              ["commission_rules", "percentuais por salão, profissional, serviço e período"],
              ["audit_logs", "quem alterou preço, plano, salão, usuário e permissões"],
            ].map(([table, desc]) => (
              <div key={table} style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "#ffffff" }}>
                <code style={{ color: "#7c3aed", fontSize: 12, fontWeight: 800 }}>{table}</code>
                <p style={{ color: "#94a3b8", fontSize: 12, margin: "5px 0 0", lineHeight: 1.45 }}>{desc}</p>
              </div>
            ))}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
