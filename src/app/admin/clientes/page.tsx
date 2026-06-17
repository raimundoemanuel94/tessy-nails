/* eslint-disable */
import Link from "next/link";
import { CalendarClock, Heart, Search, Sparkles, Users } from "lucide-react";
import {
  AdminActionButton,
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/AdminUI";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

function daysAgo(date?: string | null) {
  if (!date) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
}

export default async function AdminClientesPage() {
  const supabase = await createClient();

  const [{ data: clients }, { data: studios }, { data: appointments }] = await Promise.all([
    supabase.from("clients").select("id, studio_id, name, phone, email, birth_date, source, is_active, created_at").order("created_at", { ascending: false }),
    supabase.from("studios").select("id, name, slug, is_active"),
    supabase.from("appointments").select("id, studio_id, client_id, client_name, price, status, appointment_date, created_at"),
  ]);

  const clientList = clients ?? [];
  const studioById = new Map((studios ?? []).map((studio) => [studio.id, studio]));

  const statsByClient = new Map<string, any>();
  for (const appointment of appointments ?? []) {
    const key = appointment.client_id || `${appointment.studio_id}:${appointment.client_name}`;
    const current = statsByClient.get(key) ?? { count: 0, revenue: 0, lastDate: null, completed: 0 };
    current.count += 1;
    if (appointment.status === "completed") {
      current.completed += 1;
      current.revenue += Number(appointment.price ?? 0);
    }
    if (!current.lastDate || appointment.appointment_date > current.lastDate) current.lastDate = appointment.appointment_date;
    statsByClient.set(key, current);
  }

  const enriched = clientList.map((client) => {
    const byId = statsByClient.get(client.id);
    const byName = statsByClient.get(`${client.studio_id}:${client.name}`);
    const stats = byId ?? byName ?? { count: 0, revenue: 0, lastDate: null, completed: 0 };
    return { ...client, stats, studio: studioById.get(client.studio_id) };
  });

  const activeClients = enriched.filter((client) => client.is_active !== false);
  const withPhone = enriched.filter((client) => client.phone);
  const recurring = enriched.filter((client) => client.stats.count >= 2);
  const dormant = enriched.filter((client) => {
    const days = daysAgo(client.stats.lastDate ?? client.created_at);
    return days !== null && days >= 45;
  });
  const totalRevenue = enriched.reduce((sum, client) => sum + Number(client.stats.revenue ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1180 }}>
      <AdminPageHeader
        eyebrow="Operação"
        title="Clientes da plataforma"
        description="Visão global dos clientes atendidos pelos salões, com histórico, recorrência e sinais de reativação."
        actions={
          <>
            <AdminActionButton href="/admin/mensagens" tone="brand">Criar campanha</AdminActionButton>
            <AdminActionButton href="/admin/studios" tone="muted">Ver salões</AdminActionButton>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <AdminMetricCard label="Clientes ativos" value={activeClients.length} sub={`${clientList.length} cadastros totais`} icon={Users} tone="brand" />
        <AdminMetricCard label="Com WhatsApp" value={withPhone.length} sub="prontos para lembretes" icon={Search} tone="success" />
        <AdminMetricCard label="Recorrentes" value={recurring.length} sub="2 ou mais visitas" icon={Heart} tone="success" />
        <AdminMetricCard label="Receita histórica" value={formatCurrency(totalRevenue)} sub="atendimentos concluídos" icon={Sparkles} tone="default" />
      </div>

      <AdminPanel
        title="Clientes para acompanhar"
        description="Priorize clientes parados, sem telefone ou com alto histórico de consumo."
        tone={dormant.length ? "warning" : "success"}
      >
        {enriched.length === 0 ? (
          <AdminEmptyState title="Nenhum cliente cadastrado" description="Os clientes aparecerão aqui quando os salões começarem a receber agendamentos." />
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr .8fr .8fr .8fr .7fr", gap: 12, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {["Cliente", "Salão", "Contato", "Visitas", "Última visita", "Receita"].map((heading) => (
                <span key={heading} style={{ color: "#71717a", fontSize: 10, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase" }}>{heading}</span>
              ))}
            </div>
            {enriched.slice(0, 40).map((client) => {
              const lastDays = daysAgo(client.stats.lastDate ?? client.created_at);
              const tone = lastDays !== null && lastDays >= 45 ? "warning" : client.stats.count >= 2 ? "success" : "muted";
              return (
                <div key={client.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr .8fr .8fr .8fr .7fr", gap: 12, alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", color: "#f4f4f5", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</strong>
                    <span style={{ color: "#71717a", fontSize: 11 }}>{client.email || client.source || "sem origem"}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    {client.studio ? (
                      <Link href={`/admin/studios/${client.studio.id}`} style={{ color: "#c7d2fe", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>{client.studio.name}</Link>
                    ) : (
                      <span style={{ color: "#71717a", fontSize: 12 }}>Sem salão</span>
                    )}
                  </div>
                  <AdminStatusBadge tone={client.phone ? "success" : "warning"}>{client.phone ? "WhatsApp" : "Sem telefone"}</AdminStatusBadge>
                  <span style={{ color: "#f4f4f5", fontSize: 13, fontWeight: 800 }}>{client.stats.count}</span>
                  <AdminStatusBadge tone={tone as any} dot>{lastDays === 0 ? "Hoje" : lastDays ? `${lastDays}d` : "Sem visita"}</AdminStatusBadge>
                  <strong style={{ color: Number(client.stats.revenue) > 0 ? "#4ade80" : "#71717a", fontSize: 13 }}>{formatCurrency(Number(client.stats.revenue ?? 0))}</strong>
                </div>
              );
            })}
          </div>
        )}
      </AdminPanel>

      <AdminPanel title="Oportunidades de CRM" description="Sinais úteis para campanhas e automações futuras." tone="brand">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: 16 }}>
          <AdminMetricCard label="Reativação" value={dormant.length} sub="45 dias sem visita" icon={CalendarClock} tone={dormant.length ? "warning" : "muted"} />
          <AdminMetricCard label="Sem contato" value={enriched.filter((client) => !client.phone).length} sub="cadastro incompleto" icon={Search} tone="warning" />
          <AdminMetricCard label="Potencial VIP" value={enriched.filter((client) => Number(client.stats.revenue ?? 0) >= 300).length} sub="alto consumo histórico" icon={Sparkles} tone="success" />
        </div>
      </AdminPanel>
    </div>
  );
}
