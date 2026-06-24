import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Activity, Building2, Key, Clock, UserPlus, ExternalLink, DollarSign, Settings } from "lucide-react";

export const dynamic = "force-dynamic";

const ACTION_INFO: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  create_admin:          { label: "Criou admin",        color: "#7c3aed", bg: "rgba(124,58,237,0.08)", icon: UserPlus    },
  reset_password:        { label: "Resetou senha",      color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: Key         },
  update_trial:          { label: "Alterou trial",      color: "#3b82f6", bg: "rgba(59,130,246,0.08)", icon: Clock       },
  impersonate:           { label: "Impersonou salão",   color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: ExternalLink},
  manual_charge_attempt: { label: "Tentou cobrar",      color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: DollarSign  },
  create_studio:         { label: "Criou salão",        color: "#10b981", bg: "rgba(16,185,129,0.08)", icon: Building2   },
  update_studio:         { label: "Editou salão",       color: "#64748b", bg: "rgba(100,116,139,0.08)", icon: Settings   },
};

const C = { card: "#ffffff", border: "#e2e8f0", sep: "#f0f0f8", text: "#0f172a", sub: "#64748b", muted: "#94a3b8" };

function fmt(date: string) {
  return new Date(date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function AdminLogsPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "superadmin") redirect("/dashboard");

  const { data: logs } = await sb.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);

  const all = logs ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Sistema</p>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-.03em" }}>Logs de Atividade</h1>
        <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>{all.length} eventos registrados</p>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "140px 140px 1fr 1fr", padding: "9px 16px", background: "#f8fafc", borderBottom: `1px solid ${C.sep}` }}>
          {["Data", "Ação", "Quem", "Detalhes"].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>{h}</span>
          ))}
        </div>

        {all.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Activity size={24} style={{ opacity: 0.3, marginBottom: 10, color: C.muted }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: C.sub }}>Nenhum evento ainda</p>
            <p style={{ fontSize: 12, color: C.muted }}>Ações como criar admins, resetar senhas e alterações de trial aparecerão aqui.</p>
          </div>
        ) : all.map((log: any, i: number) => {
          const info = ACTION_INFO[log.action] ?? { label: log.action, color: C.muted, bg: "#f8fafc", icon: Activity };
          const Icon = info.icon;
          return (
            <div key={log.id} style={{
              display: "grid", gridTemplateColumns: "140px 140px 1fr 1fr",
              alignItems: "center", padding: "12px 16px",
              borderBottom: i < all.length - 1 ? `1px solid ${C.sep}` : "none",
            }}>
              <span style={{ fontSize: 11, color: C.muted }}>{fmt(log.created_at)}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: info.bg }}>
                  <Icon size={12} color={info.color} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: info.color }}>{info.label}</span>
              </div>
              <span style={{ fontSize: 12, color: C.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.actor_email ?? "—"}</span>
              <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {log.entity}: {log.entity_id?.slice(0, 16)}
                {log.details && Object.keys(log.details).length > 0 && (
                  <span style={{ marginLeft: 6, color: "#94a3b8" }}>· {JSON.stringify(log.details).slice(0, 50)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
