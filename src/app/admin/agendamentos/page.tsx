/* eslint-disable */
import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/AdminUI";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" | "muted" }> = {
  completed: { label: "Concluído", tone: "success" },
  confirmed: { label: "Confirmado", tone: "success" },
  pending: { label: "Pendente", tone: "warning" },
  cancelled: { label: "Cancelado", tone: "danger" },
  canceled: { label: "Cancelado", tone: "danger" },
};

function isToday(date: string) {
  const target = new Date(date);
  const now = new Date();
  return target.toDateString() === now.toDateString();
}

function isFuture(date: string) {
  return new Date(date).getTime() >= Date.now();
}

export default async function AdminAgendamentosPage() {
  const supabase = await createClient();

  const [{ data: appointments }, { data: studios }] = await Promise.all([
    supabase.from("appointments").select("id, studio_id, client_name, service_name, appointment_date, duration_minutes, price, status, payment_status, source, created_at").order("appointment_date", { ascending: false }).limit(250),
    supabase.from("studios").select("id, name, slug"),
  ]);

  const appointmentList = appointments ?? [];
  const studioById = new Map((studios ?? []).map((studio) => [studio.id, studio]));
  const today = appointmentList.filter((appointment) => isToday(appointment.appointment_date));
  const upcoming = appointmentList.filter((appointment) => isFuture(appointment.appointment_date));
  const completed = appointmentList.filter((appointment) => appointment.status === "completed");
  const cancelled = appointmentList.filter((appointment) => ["cancelled", "canceled"].includes(appointment.status));
  const revenue = completed.reduce((sum, appointment) => sum + Number(appointment.price ?? 0), 0);
  const noShowRisk = appointmentList.filter((appointment) => appointment.status === "pending" && isFuture(appointment.appointment_date));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1180 }}>
      <AdminPageHeader
        eyebrow="Operação"
        title="Agendamentos globais"
        description="Monitoramento de agenda de todos os salões: volume, status, receita e risco de atendimento."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <AdminMetricCard label="Hoje" value={today.length} sub="atendimentos no dia" icon={CalendarDays} tone="brand" />
        <AdminMetricCard label="Próximos" value={upcoming.length} sub="a partir de agora" icon={Clock} tone="warning" />
        <AdminMetricCard label="Concluídos" value={completed.length} sub={formatCurrency(revenue)} icon={CheckCircle2} tone="success" />
        <AdminMetricCard label="Cancelados" value={cancelled.length} sub={`${noShowRisk.length} pendentes futuros`} icon={XCircle} tone={cancelled.length ? "danger" : "muted"} />
      </div>

      <AdminPanel title="Linha do tempo da plataforma" description="Últimos agendamentos registrados entre todos os salões." tone="brand">
        {appointmentList.length === 0 ? (
          <AdminEmptyState title="Nenhum agendamento encontrado" description="Assim que os salões receberem reservas, elas entram nesta linha do tempo." />
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr .8fr .8fr .7fr", gap: 12, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {["Cliente", "Salão", "Serviço", "Data", "Status", "Valor"].map((heading) => (
                <span key={heading} style={{ color: "#71717a", fontSize: 10, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase" }}>{heading}</span>
              ))}
            </div>
            {appointmentList.slice(0, 80).map((appointment) => {
              const studio = studioById.get(appointment.studio_id);
              const status = STATUS[appointment.status] ?? { label: appointment.status || "Sem status", tone: "muted" };
              return (
                <div key={appointment.id} style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr .8fr .8fr .7fr", gap: 12, alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <strong style={{ color: "#f4f4f5", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appointment.client_name}</strong>
                  <div style={{ minWidth: 0 }}>
                    {studio ? (
                      <Link href={`/admin/studios/${studio.id}`} style={{ color: "#c7d2fe", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>{studio.name}</Link>
                    ) : (
                      <span style={{ color: "#71717a", fontSize: 12 }}>Sem salão</span>
                    )}
                  </div>
                  <span style={{ color: "#a1a1aa", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{appointment.service_name || "Serviço"}</span>
                  <span style={{ color: "#a1a1aa", fontSize: 12 }}>{new Date(appointment.appointment_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                  <AdminStatusBadge tone={status.tone} dot>{status.label}</AdminStatusBadge>
                  <strong style={{ color: Number(appointment.price) > 0 ? "#4ade80" : "#71717a", fontSize: 13 }}>{formatCurrency(Number(appointment.price ?? 0))}</strong>
                </div>
              );
            })}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
