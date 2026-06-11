// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { Building2, Users, Shield, User } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ROLE_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  superadmin:   { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "rgba(245,158,11,0.30)", label: "Superadmin"   },
  owner:        { bg: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "rgba(167,139,250,0.30)", label: "Owner"       },
  professional: { bg: "rgba(52,211,153,0.12)",  color: "#34d399", border: "rgba(52,211,153,0.28)",  label: "Profissional" },
};

const C = {
  card:   "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.10)",
  sep:    "rgba(255,255,255,0.06)",
  text:   "#ede9fe",
  muted:  "#6b6585",
};

export default async function AdminProfissionaisPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, role, studio_id, studios!studios_owner_id_fkey(id, name, slug)")
    .order("created_at", { ascending: false });

  const all      = profiles ?? [];
  const admins   = all.filter(p => p.role === "superadmin").length;
  const owners   = all.filter(p => p.role === "owner").length;
  const profs    = all.filter(p => p.role === "professional").length;
  const noStudio = all.filter(p => p.role !== "superadmin" && !p.studio_id).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900, position: "relative", zIndex: 1 }}>
      <style>{`.hover-row:hover { background: rgba(255,255,255,0.04) !important; }`}</style>

      {/* Header */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.10em",
          textTransform: "uppercase", marginBottom: 6 }}>Admin Console</p>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text, margin: 0, letterSpacing: "-0.03em" }}>Usuários</h1>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
          {all.length} conta{all.length !== 1 ? "s" : ""} na plataforma
        </p>
      </div>

      {/* Summary chips */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Total",         value: all.length,  color: C.text,    bg: "rgba(255,255,255,0.06)",  border: "rgba(255,255,255,0.10)" },
          { label: "Superadmin",    value: admins,       color: "#f59e0b", bg: "rgba(245,158,11,0.10)",   border: "rgba(245,158,11,0.20)"  },
          { label: "Owners",        value: owners,       color: "#a78bfa", bg: "rgba(167,139,250,0.10)",  border: "rgba(167,139,250,0.20)" },
          { label: "Profissionais", value: profs,        color: "#34d399", bg: "rgba(52,211,153,0.10)",   border: "rgba(52,211,153,0.20)"  },
          ...(noStudio > 0 ? [{ label: "Sem studio", value: noStudio, color: "#f87171", bg: "rgba(248,113,113,0.10)", border: "rgba(248,113,113,0.20)" }] : []),
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "7px 14px", borderRadius: 10,
            background: bg, border: `1px solid ${border}`,
          }}>
            <span style={{ fontSize: 16, fontWeight: 900, color, lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16, overflow: "hidden",
      }}>
        {all.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center" }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, margin: "0 auto 18px",
              background: "rgba(167,139,250,0.07)", border: "1px dashed rgba(167,139,250,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Users size={26} color="#a78bfa" style={{ opacity: 0.5 }}/>
            </div>
            <p style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 7 }}>Nenhum usuário</p>
            <p style={{ fontSize: 13, color: C.muted }}>
              Usuários aparecem aqui após criar conta em /login
            </p>
          </div>
        ) : (
          <>
            {/* Col headers */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 110px 180px",
              padding: "8px 22px", borderBottom: `1px solid ${C.sep}`,
              background: "rgba(255,255,255,0.02)",
            }}>
              {["Usuário", "Role", "Studio vinculado"].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 800, color: C.muted,
                  letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>

            {all.map((p, i) => {
              const rs = ROLE_STYLE[p.role] ?? ROLE_STYLE.professional;
              const isAdmin = p.role === "superadmin";
              return (
                <div key={p.id}
                  className="hover-row"
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 110px 180px",
                    alignItems: "center", padding: "14px 22px",
                    borderBottom: i < all.length - 1 ? `1px solid ${C.sep}` : "none",
                    transition: "background .1s",
                  }}
                >
                  {/* User info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                      background: isAdmin
                        ? "linear-gradient(135deg,#f59e0b,#fcd34d)"
                        : "linear-gradient(135deg,#7c5cbf,#a78bfa)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 900,
                      color: isAdmin ? "#000" : "#fff",
                      boxShadow: isAdmin
                        ? "0 2px 10px rgba(245,158,11,0.25)"
                        : "0 2px 10px rgba(124,92,191,0.25)",
                    }}>
                      {isAdmin ? <Shield size={14}/> : (p.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name || "—"}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                        {p.email}
                      </div>
                    </div>
                  </div>

                  {/* Role badge */}
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 6,
                      background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`,
                      letterSpacing: "0.04em",
                    }}>{rs.label}</span>
                  </div>

                  {/* Studio */}
                  <div>
                    {isAdmin ? (
                      <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>
                        Admin geral
                      </span>
                    ) : p.studios ? (
                      <Link href={`/admin/studios/${p.studios.id}`} style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 12, color: "#34d399", fontWeight: 600, textDecoration: "none",
                      }}>
                        <Building2 size={11}/> {p.studios.name}
                      </Link>
                    ) : (
                      <span style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                        Sem studio
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Tip */}
      <div style={{
        padding: "16px 20px", borderRadius: 12,
        background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)",
      }}>
        <p style={{ fontSize: 12, color: "#a78bfa", fontWeight: 700, marginBottom: 8 }}>
          💡 Como adicionar um novo profissional
        </p>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.9 }}>
          1. Peça para ela criar uma conta em{" "}
          <strong style={{ color: "#a78bfa" }}>/login</strong>
          {" "}— 2. Vá em{" "}
          <Link href="/admin/studios" style={{ color: "#f59e0b", fontWeight: 700 }}>Studios</Link>
          {" "}→ crie o studio — 3. Edite o studio → vincule pelo owner_id
        </div>
      </div>
    </div>
  );
}
