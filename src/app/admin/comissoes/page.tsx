/* eslint-disable */
// @ts-nocheck
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

async function loadProfiles(supabase: any) {
  const rich = await supabase
    .from("profiles")
    .select("id, name, display_name, email, role, studio_id, commission_rate, is_active, created_at");

  if (!rich.error) return rich.data ?? [];

  const fallback = await supabase
    .from("profiles")
    .select("id, name, email, role, studio_id, created_at");

  return fallback.data ?? [];
}

async function loadAppointments(supabase: any) {
  const rich = await supabase
    .from("appointments")
    .select("id, studio_id, professional_id, service_name, price, status, appointment_date");

  if (!rich.error) return { rows: rich.data ?? [], hasProfessionalColumn: true };

  const fallback = await supabase
    .from("appointments")
    .select("id, studio_id, service_name, price, status, appointment_date");

  return { rows: fallback.data ?? [], hasProfessionalColumn: false };
}

export default async function AdminComissoesPage() {
  const supabase = await createClient();

  const [profiles, appointmentResult, { data: studios }] = await Promise.all([
    loadProfiles(supabase),
    loadAppointments(supabase),
    supabase.from("studios").select("id, name, slug"),
  ]);

  const appointments = appointmentResult.rows;
  const hasProfessionalColumn = appointmentResult.hasProfessionalColumn;
  const professionals = (profiles ?? []).filter((profile) => ["professional", "owner"].includes(profile.role));
  const completed = (appointments ?? []).filter((appointment) => appointment.status === "completed");
  const grossRevenue = completed.reduce((sum, appointment) => sum + Number(appointment.price ?? 0), 0);
  const estimatedCommission = grossRevenue * 0.4;
  const studioById = new Map((studios ?? []).map((studio) => [studio.id, studio]));

  const studioRows = (studios ?? [])
    .map((studio) => {
      const rows = completed.filter((appointment) => {
        if (appointment.studio_id !== studio.id) return false;
        return hasProfessionalColumn ? !appointment.professional_id : true;
      });
      const revenue = rows.reduce((sum, appointment) => sum + Number(appointment.price ?? 0), 0);
      return { studio, appointments: rows.length, revenue, estimate: revenue * 0.4 };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const professionalRows = professionals
    .map((professional) => {
      const rows = completed.filter((appointment) => appointment.professional_id === professional.id);
      const revenue = rows.reduce((sum, appointment) => sum + Number(appointment.price ?? 0), 0);
      const rate = Number(professional.commission_rate ?? 40);
      return { professional, rows, revenue, rate, estimate: revenue * (rate / 100) };
    })
    .filter((row) => row.rows.length > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const unassignedCompleted = hasProfessionalColumn
    ? completed.filter((appointment) => !appointment.professional_id).length
    : completed.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1120 }}>
      <AdminPageHeader
        eyebrow="Equipe"
        title="Comissoes"
        description="Visao superadmin para repasses por manicure, salao e servico."
        actions={<AdminActionButton href="/admin/profissionais" tone="brand">Gerenciar profissionais</AdminActionButton>}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <AdminMetricCard label="Profissionais" value={professionals.length} sub="owners e manicures" icon={UserRound} tone="brand" />
        <AdminMetricCard label="Atendimentos concluidos" value={completed.length} sub="base de calculo" icon={CalendarCheck} tone="success" />
        <AdminMetricCard label="Receita concluida" value={formatCurrency(grossRevenue)} sub="antes do repasse" icon={BadgeDollarSign} tone="default" />
        <AdminMetricCard label="Comissao estimada" value={formatCurrency(estimatedCommission)} sub={hasProfessionalColumn ? `${unassignedCompleted} sem manicure` : "simulacao 40%"} icon={Scissors} tone="warning" />
      </div>

      {hasProfessionalColumn && professionalRows.length > 0 ? (
        <AdminPanel title="Comissao por profissional" description="Atendimentos concluidos ja vinculados a uma manicure responsavel." tone="success">
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr .7fr .8fr .8fr", gap: 12, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {["Profissional", "Salao", "Atend.", "Receita", "Repasse"].map((heading) => (
                <span key={heading} style={{ color: "#71717a", fontSize: 10, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase" }}>{heading}</span>
              ))}
            </div>
            {professionalRows.slice(0, 30).map(({ professional, rows, revenue, rate, estimate }) => {
              const studio = professional.studio_id ? studioById.get(professional.studio_id) : null;
              return (
                <div key={professional.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr .7fr .8fr .8fr", gap: 12, alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <strong style={{ color: "#f4f4f5", fontSize: 13 }}>{professional.display_name || professional.name}</strong>
                    <p style={{ color: "#71717a", fontSize: 11, margin: "4px 0 0" }}>{professional.email || "sem email"} - {rate}%</p>
                  </div>
                  <span style={{ color: "#a1a1aa", fontSize: 12 }}>{studio?.name || "Sem salao"}</span>
                  <AdminStatusBadge tone="success">{rows.length} atend.</AdminStatusBadge>
                  <strong style={{ color: revenue ? "#4ade80" : "#71717a", fontSize: 13 }}>{formatCurrency(revenue)}</strong>
                  <strong style={{ color: estimate ? "#fbbf24" : "#71717a", fontSize: 13 }}>{formatCurrency(estimate)}</strong>
                </div>
              );
            })}
          </div>
        </AdminPanel>
      ) : null}

      <AdminPanel
        title={hasProfessionalColumn ? "Atendimentos ainda sem manicure" : "Estimativa por salao"}
        description={hasProfessionalColumn ? "Esses valores ficam no nivel do salao ate o agendamento receber professional_id." : "Enquanto o banco nao tiver professional_id, a estimativa fica no nivel do salao."}
        tone="warning"
      >
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr .8fr .8fr", gap: 12, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            {["Salao", "Concluidos", "Receita", "Repasse estimado"].map((heading) => (
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
    </div>
  );
}
