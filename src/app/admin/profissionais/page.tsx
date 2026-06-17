import { createClient } from "@/lib/supabase/server";
import { Building2, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ROLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  superadmin:   { bg: "rgba(99,102,241,0.10)",  color: "#818cf8", border: "rgba(99,102,241,0.22)",  label: "Superadmin"   },
  owner:        { bg: "rgba(34,197,94,0.08)",   color: "#4ade80", border: "rgba(34,197,94,0.20)",   label: "Owner"        },
  professional: { bg: "rgba(161,161,170,0.08)", color: "#a1a1aa", border: "rgba(161,161,170,0.18)", label: "Profissional" },
};

const C = {
  card:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  sep:    "rgba(255,255,255,0.05)",
  text:   "#f4f4f5",
  sub:    "#a1a1aa",
  muted:  "#52525b",
  r:      10,
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
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>
      <style>{`.hover-row:hover { background: rgba(255,255,255,0.03) !important; }`}</style>

      {/* Header */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 500, color: C.muted, letterSpacing: "0.06em",
          textTransform: "uppercase", marginBottom: 6 }}>Admin Console</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.025em" }}>Usuários</h1>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 5 }}>
          {all.length} conta{all.length !== 1 ? "s" : ""} na plataforma
        </p>
      </div>

      {/* Summary chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { label: "Total",         value: all.length,  color: C.sub  },
          { label: "Superadmin",    value: admins,       color: "#818cf8" },
          { label: "Owners",        value: owners,       color: "#4ade80" },
          { label: "Profissionais", value: profs,        color: C.sub  },
          ...(noStudio > 0 ? [{ label: "Sem studio", value: noStudio, color: "#f87171" }] : []),
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 10px", borderRadius: 20,
            background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
            <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, overflow: "hidden" }}>
        {all.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <Users size={24} color={C.muted} style={{ opacity: 0.4, marginBottom: 12 }}/>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.sub, marginBottom: 5 }}>Nenhum usuário</p>
            <p style={{ fontSize: 12, color: C.muted }}>Usuários aparecem aqui após criar conta em /login</p>
          </div>
        ) : (
          <>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 100px 180px",
              padding: "7px 18px", borderBottom: `1px solid ${C.sep}`,
            }}>
              {["Usuário", "Role", "Studio vinculado"].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>

            {all.map((p, i) => {
              const rs = ROLE[p.role] ?? ROLE.professional;
              const isAdmin = p.role === "superadmin";
              return (
                <div key={p.id}
                  className="hover-row"
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 100px 180px",
                    alignItems: "center", padding: "13px 18px",
                    borderBottom: i < all.length - 1 ? `1px solid ${C.sep}` : "none",
                    transition: "background .1s",
                  }}
                >
                  {/* User info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      background: isAdmin ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.06)",
                      border: isAdmin ? "1px solid rgba(99,102,241,0.30)" : `1px solid ${C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                      color: isAdmin ? "#818cf8" : C.sub,
                    }}>
                      {(p.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name || "—"}
                      </div>
                      <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                        {p.email}
                      </div>
                    </div>
                  </div>

                  {/* Role badge */}
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
                      background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`,
                    }}>{rs.label}</span>
                  </div>

                  {/* Studio */}
                  <div>
                    {isAdmin ? (
                      <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>—</span>
                    ) : p.studios ? (
                      <Link href={`/admin/studios/${p.studios.id}`} style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 12, color: "#818cf8", fontWeight: 500, textDecoration: "none",
                      }}>
                        <Building2 size={11}/> {p.studios.name}
                      </Link>
                    ) : (
                      <span style={{ fontSize: 12, color: "#f87171", fontWeight: 500 }}>Sem studio</span>
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
        padding: "14px 16px", borderRadius: C.r,
        background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`,
      }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6 }}>
          Como adicionar um profissional
        </p>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
          1. Peça para ela criar uma conta em{" "}
          <strong style={{ color: C.sub }}>/login</strong>
          {" "}· 2. Vá em{" "}
          <Link href="/admin/studios" style={{ color: "#818cf8" }}>Studios</Link>
          {" "}→ crie o studio · 3. Edite o studio → vincule pelo owner_id
        </p>
      </div>
    </div>
  );
}
