import { Bell, Cake, MessageCircle, RotateCcw, Send, Sparkles } from "lucide-react";
import {
  AdminActionButton,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/AdminUI";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const templates = [
  {
    icon: Bell,
    title: "Lembrete de horário",
    audience: "Clientes com agendamento nas próximas 24h",
    message: "Oi, {cliente}! Passando para lembrar do seu horário amanhã às {hora} no {salão}.",
    tone: "brand",
  },
  {
    icon: RotateCcw,
    title: "Convite de retorno",
    audience: "Clientes sem visita há 45 dias",
    message: "Oi, {cliente}! Já está na hora de cuidar das unhas de novo? Agende seu retorno pelo link do {salão}.",
    tone: "warning",
  },
  {
    icon: Cake,
    title: "Aniversário",
    audience: "Clientes aniversariantes do mês",
    message: "Feliz aniversário, {cliente}! O {salão} preparou um carinho especial para você.",
    tone: "success",
  },
  {
    icon: Sparkles,
    title: "Campanha geral",
    audience: "Todos os clientes com telefone",
    message: "Novos horários disponíveis no {salão}. Clique no link e garanta seu atendimento.",
    tone: "default",
  },
];

export default async function AdminMensagensPage() {
  const supabase = await createClient();

  const [{ count: clientsCount }, { count: clientsWithPhone }, { count: appointmentsToday }, { count: studiosCount }] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("clients").select("id", { count: "exact", head: true }).not("phone", "is", null),
    supabase.from("appointments").select("id", { count: "exact", head: true }).gte("appointment_date", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase.from("studios").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  return (
    <>
    <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', marginBottom: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 16 }}>⚠️</span>
      <div>
        <strong style={{ color: '#fbbf24', fontSize: 13 }}>Módulo em desenvolvimento</strong>
        <p style={{ margin: '2px 0 0', color: '#a1a1aa', fontSize: 12 }}>Os templates abaixo são pré-visualizações. O disparo real via WhatsApp Business API ainda não está integrado.</p>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 1120 }}>
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1120 }}>
      <AdminPageHeader
        eyebrow="Relacionamento"
        title="Central de mensagens"
        description="Campanhas e automações para clientes e manicures em todos os salões da plataforma."
        actions={<AdminActionButton href="/admin/clientes" tone="brand">Ver clientes</AdminActionButton>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <AdminMetricCard label="Clientes" value={clientsCount ?? 0} sub="base total" icon={MessageCircle} tone="brand" />
        <AdminMetricCard label="Com WhatsApp" value={clientsWithPhone ?? 0} sub="aptos para disparo" icon={Send} tone="success" />
        <AdminMetricCard label="Agenda hoje" value={appointmentsToday ?? 0} sub="candidatos a lembrete" icon={Bell} tone="warning" />
        <AdminMetricCard label="Salões ativos" value={studiosCount ?? 0} sub="tenants disponíveis" icon={Sparkles} tone="default" />
      </div>

      <AdminPanel title="Templates prontos" description="Primeiro passo: padronizar mensagens. Depois ligamos com gateway de WhatsApp e histórico de disparos." tone="brand">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, padding: 16 }}>
          {templates.map(({ icon: Icon, title, audience, message, tone }) => (
            <div key={title} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, background: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(129,140,248,0.25)" }}>
                    <Icon size={16} />
                  </div>
                  <strong style={{ color: "#1a1a2e", fontSize: 14 }}>{title}</strong>
                </div>
                <AdminStatusBadge tone={tone as any}>Modelo</AdminStatusBadge>
              </div>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 10px" }}>{audience}</p>
              <p style={{ color: "#d4d4d8", fontSize: 12, lineHeight: 1.55, margin: 0, padding: 12, borderRadius: 10, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(255,255,255,0.055)" }}>{message}</p>
            </div>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel title="Implementação recomendada" description="Para virar SaaS completo, essa central precisa de persistência e provedor de envio." tone="warning">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: 16 }}>
          {[
            ["1", "Tabela de campanhas", "Criar message_campaigns e message_events com salão, público, status e métricas."],
            ["2", "Gateway WhatsApp", "Integrar provedor e registrar enviado, entregue, erro e resposta."],
            ["3", "Automações", "Lembrete 24h, aniversário, retorno e campanha geral por segmento."],
          ].map(([step, title, desc]) => (
            <div key={step} style={{ padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "#ffffff" }}>
              <span style={{ color: "#7c3aed", fontSize: 11, fontWeight: 900 }}>{step}</span>
              <h3 style={{ color: "#1a1a2e", fontSize: 13, margin: "6px 0" }}>{title}</h3>
              <p style={{ color: "#94a3b8", fontSize: 12, margin: 0, lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
    </div>
    </>
  );
}
