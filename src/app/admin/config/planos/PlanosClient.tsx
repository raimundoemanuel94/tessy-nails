// @ts-nocheck
"use client";
import { useState } from "react";
import { Pencil, X, Check, Lock, Tag, Users, DollarSign, TrendingUp } from "lucide-react";

const C = {
  bg: "#0d0d10", card: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)",
  sep: "rgba(255,255,255,0.05)", text: "#f4f4f5", sub: "#a1a1aa", muted: "#52525b",
};
const PLAN_C: Record<string, { color: string; bg: string; border: string }> = {
  pro:     { color: "#818cf8", bg: "rgba(99,102,241,0.10)",  border: "rgba(99,102,241,0.22)"  },
  starter: { color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  border: "rgba(96,165,250,0.22)"  },
  free:    { color: "#71717a", bg: "rgba(113,113,122,0.10)", border: "rgba(113,113,122,0.20)" },
  studio:  { color: "#f472b6", bg: "rgba(244,114,182,0.10)", border: "rgba(244,114,182,0.22)" },
};
const fmtBRL = (n: number) =>
  n === 0 ? "R$ 0,00" : `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const PLAN_DESC: Record<string, string> = {
  free:    "Acesso básico sem cobrança. Ideal para testar a plataforma.",
  starter: "Funcionalidades essenciais para salões que estão começando.",
  pro:     "Plano completo para profissionais. O mais popular.",
  studio:  "Para redes de salões com múltiplos profissionais e locais.",
};

export function PlanosClient({ planos }: { planos: any[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editPrice, setEditPrice] = useState("");

  const totalMrr = planos.reduce((s, p) => s + p.mrr, 0);

  function openEdit(p: any) {
    setEditing(p.plan);
    setEditLabel(p.label);
    setEditPrice(String(p.price));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
      {/* Header */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 500, color: C.muted, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 5px" }}>Plataforma</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.025em" }}>Planos & Preços</h1>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Visão de cada plano e quantos salões estão em cada um</p>
      </div>

      {/* MRR total strip */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <TrendingUp size={16} color="#4ade80" />
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 500 }}>MRR total da plataforma</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>{fmtBRL(totalMrr)}</div>
        </div>
        {/* RLS warning */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: 8, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.18)" }}>
          <Lock size={12} color="#fbbf24" />
          <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 500 }}>Edição desabilitada — RLS não configurada</span>
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {planos.map(p => {
          const pc  = PLAN_C[p.plan] || PLAN_C.free;
          const pct = totalMrr > 0 ? Math.round((p.mrr / totalMrr) * 100) : 0;
          const isEdit = editing === p.plan;

          return (
            <div key={p.plan} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              {/* Top accent line */}
              <div style={{ height: 2, background: `linear-gradient(90deg, ${pc.color}, ${pc.color}00)` }} />

              <div style={{ padding: "16px 20px" }}>
                {isEdit ? (
                  /* Edit mode */
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 180 }}>
                      <label style={{ fontSize: 10, fontWeight: 500, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Nome do plano</label>
                      <input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="input-base"
                        style={{ height: 36, fontSize: 13 }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 140 }}>
                      <label style={{ fontSize: 10, fontWeight: 500, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Preço (R$/mês)</label>
                      <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="input-base"
                        style={{ height: 36, fontSize: 13 }} />
                    </div>
                    {/* Save disabled — RLS needed */}
                    <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                      <button
                        title="Requer configuração de RLS no Supabase antes de salvar"
                        disabled
                        style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.sep}`, color: C.muted, fontSize: 12, fontWeight: 500, cursor: "not-allowed", fontFamily: "inherit" }}>
                        <Lock size={12} /> Salvar
                      </button>
                      <button onClick={() => setEditing(null)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 7, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.sep}`, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}>
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {/* Plan badge + name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5, textTransform: "uppercase", letterSpacing: "0.04em", background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>
                          {p.plan}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.label}</span>
                      </div>
                      <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{PLAN_DESC[p.plan] ?? ""}</p>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: 24, flexShrink: 0 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>{fmtBRL(Number(p.price))}</div>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>por mês</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: pc.color }}>{p.paying}</div>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>pagantes</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: p.mrr > 0 ? "#4ade80" : C.muted }}>{fmtBRL(p.mrr)}</div>
                        <div style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>MRR</div>
                      </div>
                    </div>

                    {/* Edit button */}
                    <button
                      onClick={() => openEdit(p)}
                      title="UI pronta — salvar requer configuração de RLS"
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.sep}`, color: C.muted, cursor: "pointer", fontSize: 12, fontWeight: 500, fontFamily: "inherit", flexShrink: 0 }}>
                      <Pencil size={12} /> Editar
                    </button>
                  </div>
                )}

                {/* Progress bar MRR contribution */}
                {!isEdit && p.mrr > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: C.muted }}>contribuição no MRR</span>
                      <span style={{ fontSize: 10, color: pc.color, fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${pc.color}, ${pc.color}88)`, borderRadius: 2 }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* RLS info box */}
      <div style={{ display: "flex", gap: 12, padding: "14px 18px", background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 10 }}>
        <Lock size={15} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24", marginBottom: 3 }}>Edição de preços aguarda configuração de segurança</div>
          <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6 }}>
            A tabela <code style={{ fontFamily: "monospace", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 3 }}>plan_prices</code> não tem políticas RLS configuradas.
            Para habilitar a edição com segurança, o Codex precisa rodar a migration de RLS antes de salvar pelo frontend.
          </p>
        </div>
      </div>
    </div>
  );
}
