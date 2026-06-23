"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, DollarSign, Loader2, PauseCircle, Send } from "lucide-react";
import {
  AdminActionButton,
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from "@/components/admin/AdminUI";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

function daysLate(date: string | null): number {
  if (!date) return 0;
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((now.getTime() - target.getTime()) / 86400000));
}

function severity(days: number) {
  if (days >= 14) return { label: "Crítico", tone: "danger" };
  if (days >= 7) return { label: "Alto", tone: "danger" };
  if (days >= 1) return { label: "Atenção", tone: "warning" };
  return { label: "Monitorar", tone: "muted" };
}

export default function InadimplenciaPage() {
  const [studios, setStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suspendTarget, setSuspendTarget] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const sb = createClient();

  useEffect(() => {
    sb.from("studios")
      .select("id,name,slug,plan,is_active,subscription_status,mrr,next_billing_date")
      .then(({ data }) => {
        setStudios(data ?? []);
        setLoading(false);
      });
  }, []);

  const overdue = useMemo(() => {
    return studios
      .filter((studio) => studio.subscription_status === "past_due")
      .map((studio) => ({ ...studio, daysLate: daysLate(studio.next_billing_date) }))
      .sort((a, b) => b.daysLate - a.daysLate);
  }, [studios]);

  const mrrAtRisk = overdue.reduce((sum, studio) => sum + Number(studio.mrr ?? 0), 0);
  const avgLate = overdue.length ? Math.round(overdue.reduce((sum, studio) => sum + studio.daysLate, 0) / overdue.length) : 0;
  const critical = overdue.filter((studio) => studio.daysLate >= 14);

  async function suspend() {
    if (!suspendTarget) return;
    setSaving(true);
    await sb.from("studios").update({ is_active: false }).eq("id", suspendTarget.id);
    setStudios((rows) => rows.map((studio) => studio.id === suspendTarget.id ? { ...studio, is_active: false } : studio));
    setSuspendTarget(null);
    setSaving(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1120 }}>
      <AdminPageHeader
        eyebrow="Financeiro"
        title="Inadimplência"
        description="Fila de cobrança para proteger a receita recorrente, priorizar contatos e controlar suspensão de acesso."
        actions={
          <>
            <AdminActionButton href="/admin/financeiro" tone="muted">Resumo financeiro</AdminActionButton>
            <AdminActionButton href="/admin/financeiro/assinaturas" tone="brand">Assinaturas <ArrowRight size={13} /></AdminActionButton>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <AdminMetricCard label="Receita em risco" value={formatCurrency(mrrAtRisk)} sub="MRR de contas atrasadas" icon={DollarSign} tone={mrrAtRisk ? "danger" : "muted"} />
        <AdminMetricCard label="Contas atrasadas" value={overdue.length} sub="assinaturas pendentes" icon={AlertTriangle} tone={overdue.length ? "warning" : "success"} />
        <AdminMetricCard label="Casos críticos" value={critical.length} sub="14 dias ou mais" icon={PauseCircle} tone={critical.length ? "danger" : "muted"} />
        <AdminMetricCard label="Atraso médio" value={`${avgLate}d`} sub="dias após vencimento" icon={Clock} tone={avgLate >= 7 ? "danger" : avgLate > 0 ? "warning" : "muted"} />
      </div>

      <AdminPanel title="Fila de cobrança" description="Priorize pelo atraso e pela receita em risco. A cobrança automática ainda depende da integração com gateway." tone={overdue.length ? "danger" : "success"}>
        {loading ? (
          <div style={{ padding: 50, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#94a3b8" }}>
            <Loader2 size={16} className="spin" /> Carregando
          </div>
        ) : overdue.length === 0 ? (
          <AdminEmptyState
            title="Nenhuma inadimplência"
            description="Todos os salões estão em dia. A carteira está saudável neste momento."
            tone="success"
          />
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr .8fr .9fr .8fr 1fr auto", gap: 12, padding: "9px 16px", borderBottom: "1px solid #e8e8f0" }}>
              {["Salão", "Plano", "Vencimento", "Atraso", "MRR", "Ações"].map((heading) => (
                <span key={heading} style={{ color: "#94a3b8", fontSize: 10, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase" }}>{heading}</span>
              ))}
            </div>
            {overdue.map((studio) => {
              const sev = severity(studio.daysLate);
              return (
                <div key={studio.id} style={{ display: "grid", gridTemplateColumns: "2fr .8fr .9fr .8fr 1fr auto", gap: 12, alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #e8e8f0", background: studio.daysLate >= 14 ? "rgba(248,113,113,0.04)" : "transparent" }}>
                  <div style={{ minWidth: 0 }}>
                    <Link href={`/admin/studios/${studio.id}`} style={{ color: "#1a1a2e", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>{studio.name}</Link>
                    <p style={{ color: "#94a3b8", fontSize: 11, margin: "4px 0 0", fontFamily: "monospace" }}>/{studio.slug}</p>
                  </div>
                  <AdminStatusBadge tone="brand">{studio.plan}</AdminStatusBadge>
                  <span style={{ color: "#64748b", fontSize: 12 }}>{studio.next_billing_date ? new Date(studio.next_billing_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "-"}</span>
                  <AdminStatusBadge tone={sev.tone as any} dot>{studio.daysLate}d · {sev.label}</AdminStatusBadge>
                  <strong style={{ color: "#f87171", fontSize: 13 }}>{Number(studio.mrr ?? 0) > 0 ? formatCurrency(Number(studio.mrr)) : "-"}</strong>
                  <div style={{ display: "flex", gap: 7, justifyContent: "flex-end" }}>
                    <AdminActionButton tone="warning" disabled>
                      <Send size={12} /> Gateway pendente
                    </AdminActionButton>
                    <AdminActionButton onClick={() => setSuspendTarget(studio)} tone="danger">
                      Suspender
                    </AdminActionButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminPanel>

      <p style={{ color: "#94a3b8", fontSize: 11, margin: 0 }}>
        A cobrança automática depende de integração com Stripe, Pagar.me ou outro gateway. Enquanto isso, esta fila serve para priorização manual e suspensão controlada.
      </p>

      {suspendTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <AdminPanel title="Suspender acesso?" description={`O salão ${suspendTarget.name} ficará inativo até a reativação manual.`} tone="danger">
            <div style={{ padding: 18, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <AdminActionButton onClick={() => setSuspendTarget(null)} tone="muted">Cancelar</AdminActionButton>
              <AdminActionButton onClick={suspend} tone="danger" disabled={saving}>
                {saving ? <Loader2 size={13} className="spin" /> : <PauseCircle size={13} />} Suspender
              </AdminActionButton>
            </div>
          </AdminPanel>
        </div>
      )}
    </div>
  );
}
