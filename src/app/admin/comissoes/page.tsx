import { BadgeDollarSign, CalendarCheck, Scissors, UserRound } from "lucide-react";
import {
  AdminActionButton,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/AdminUI";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminComissoesPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: appointments }, { data: studios }, { data: services }] = await Promise.all([
    supabase.from("profiles").select("id, name, email, role, studio_id, created_at"),
    supabase.from("appointments").select("id, studio_id, service_name, price, status, appointment_date"),
    supabase.from("studios").select("id, name, slug"),
    supabase.from("services").select("id, studio_id, name, price, is_active"),
  ]);

  const professionals = (profiles ?? []).filter((profile) => ["professional", "owner"].includes(profile.role));
  const completed = (appointments ?? []).filter((appointment) => appointment.status === "completed");
  const grossRevenue = completed.reduce((sum, appointment) => sum + Number(appointment.price ?? 0), 0);
  const estimatedCommission = grossRevenue * 0.4;
  const studioById = new Map((studios ?? []).map((studio) => [studio.id, studio]));

  const studioRows = (studios ?? []).map((studio) => {
    const rows = completed.filter((appointment) => appointment.studio_id === studio.id);
    const revenue = rows.reduce((sum, appointment) => sum + Number(appointment.price ?? 0), 0);
    return { studio, appointments: rows.length, revenue, estimate: revenue * 0.4 };
  }).sort((a, b) => b.revenue - a.revenue);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1120 }}>
      <AdminPageHeader
        eyebrow="Equipe"
        title="Comissões"
        description="Visão superadmin para preparar repasses por manicure, salão e serviço."
        actions={<AdminActionButton href="/admin/profissionais" tone="brand">Gerenciar profissionais</AdminActionButton>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <AdminMetricCard label="Profissionais" value={professionals.length} sub="owners e manicures" icon={UserRound} tone="brand" />
        <AdminMetricCard label="Atendimentos concluídos" value={completed.length} sub="base de cálculo" icon={CalendarCheck} tone="success" />
        <AdminMetricCard label="Receita concluída" value={formatCurrency(grossRevenue)} sub="antes de repasse" icon={BadgeDollarSign} tone="default" />
        <AdminMetricCard label="Comissão estimada" value={formatCurrency(estimatedCommission)} sub="simulação 40%" icon={Scissors} tone="warning" />
      </div>

      <AdminPanel title="Estimativa por salão" description="Enquanto o agendamento não tiver profissional vinculado, a estimativa fica no nível do salão." tone="warning">
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr .8fr .8fr", gap: 12, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            {["Salão", "Concluídos", "Receita", "Repasse estimado"].map((heading) => (
              <span key={heading} style={{ color: "#71717a", fontSize: 10, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase" }}>{heading}</span>
            ))}
          </div>
          {studioRows.slice(0, 30).map(({ studio, appointments, revenue, estimate }) => (
            <div key={studio.id} style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr .8fr .8fr", gap: 12, alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div>
                <a href={`/admin/studios/${studio.id}`} style={{ color: "#f4f4f5", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>{studio.name}</a>
                <p style={{ color: "#71717a", fontSize: 11, margin: "4px 0 0", fontFamily: "monospace" }}>/{studio.slug}</p>
              </div>
              <AdminStatusBadge tone={appointments ? "success" : "muted"}>{appointments} atend.</AdminStatusBadge>
              <strong style={{ color: revenue ? "#4ade80" : "#71717a", fontSize: 13 }}>{formatCurrency(revenue)}</strong>
              <strong style={{ color: estimate ? "#fbbf24" : "#71717a", fontSize: 13 }}>{formatCurrency(estimate)}</strong>
            </div>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel title="Para ativar comissão real por manicure" description="Esse é o próximo upgrade estrutural necessário para ficar nível SaaS completo." tone="brand">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: 16 }}>
          {[
            ["appointments.professional_id", "Vincular cada atendimento à manicure responsável."],
            ["profiles.commission_rate", "Definir percentual por profissional ou por salão."],
            ["commission_payouts", "Fechamento de repasse com status: pendente, pago e ajustado."],
          ].map(([title, desc]) => (
            <div key={title} style={{ padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}>
              <h3 style={{ color: "#c7d2fe", fontSize: 13, margin: "0 0 7px", fontFamily: "monospace" }}>{title}</h3>
              <p style={{ color: "#71717a", fontSize: 12, margin: 0, lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
