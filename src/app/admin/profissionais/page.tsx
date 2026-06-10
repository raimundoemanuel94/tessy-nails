// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { Building2, Users, Shield, User } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ROLE_STYLE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  superadmin:   { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "rgba(245,158,11,0.28)", label: "Superadmin"   },
  owner:        { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.28)", label: "Owner"       },
  professional: { bg: "rgba(52,211,153,0.12)",  color: "#34d399", border: "rgba(52,211,153,0.28)",  label: "Profissional" },
};

export default async function AdminProfissionaisPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, role, studio_id, studios!studios_owner_id_fkey(id, name, slug)")
    .order("created_at", { ascending: false });

  const all       = profiles ?? [];
  const admins    = all.filter(p => p.role === "superadmin").length;
  const owners    = all.filter(p => p.role === "owner").length;
  const profs     = all.filter(p => p.role === "professional").length;
  const noStudio  = all.filter(p => p.role !== "superadmin" && !p.studio_id).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#f0f0ff", margin: 0 }}>Usuários</h1>
        <p style={{ fontSize: 12, color: "#6b6585", marginTop: 4 }}>
          {all.length} conta{all.length !== 1 ? "s" : ""} na plataforma
        </p>
      </div>

      {/* Summary chips */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {[
          { label: "Total",        value: all.length,  color: "#f0f0ff", bg: "rgba(255,255,255,0.05)" },
          { label: "Admins",       value: admins,       color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
          { label: "Profissionais",value: profs,        color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
          ...(noStudio > 0 ? [{ label: "Sem studio", value: noStudio, color: "#f87171", bg: "rgba(248,113,113,0.1)" }] : []),
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8,
            background: bg, border: `1px solid ${color}20`,
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color }}>{value}</span>
            <span style={{ fontSize: 11, color: "#6b6585" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, overflow: "hidden",
      }}>
        {all.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px",
              background: "rgba(167,139,250,0.08)", border: "1px dashed rgba(167,139,250,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Users size={22} color="#a78bfa" style={{ opacity: 0.5 }}/>
            </div>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#f0f0ff", marginBottom: 6 }}>Nenhum usuário</p>
            <p style={{ fontSize: 12, color: "#6b6585" }}>
              Usuários aparecem aqui após criar conta em /login
            </p>
          </div>
        ) : (
          <>
            {/* col headers */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 100px 160px",
              padding: "7px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              {["Usuário", "Role", "Studio vinculado"].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#6b6585",
                  letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>

            {all.map((p, i) => {
              const rs = ROLE_STYLE[p.role] ?? ROLE_STYLE.professional;
              const isAdmin = p.role === "superadmin";
              return (
                <div key={p.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 100px 160px",
                  alignItems: "center", padding: "12px 20px",
                  borderBottom: i < all.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  transition: "background .1s",
                  background: "transparent",
                }}>
                  {/* user info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      background: isAdmin
                        ? "linear-gradient(135deg,#f59e0b,#fcd34d)"
                        : "linear-gradient(135deg,#7c5cbf,#a78bfa)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 900, color: isAdmin ? "#000" : "#fff",
                    }}>
                      {isAdmin ? <Shield size={14}/> : (p.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0ff",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name || "—"}
                      </div>
                      <div style={{ fontSize: 10, color: "#6b6585",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.email}
                      </div>
                    </div>
                  </div>

                  {/* role badge */}
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
                      background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`,
                    }}>{rs.label}</span>
                  </div>

                  {/* studio */}
                  <div>
                    {isAdmin ? (
                      <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>
                        Admin geral
                      </span>
                    ) : p.studios ? (
                      <Link href={`/admin/studios/${p.studios.id}`} style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 11, color: "#34d399", fontWeight: 600, textDecoration: "none",
                      }}>
                        <Building2 size={11}/> {p.studios.name}
                      </Link>
                    ) : (
                      <span style={{ fontSize: 11, color: "#f87171", fontWeight: 600 }}>
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

      {/* Tip box */}
      <div style={{
        padding: "14px 18px", borderRadius: 12,
        background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)",
      }}>
        <p style={{ fontSize: 12, color: "#a78bfa", fontWeight: 700, marginBottom: 6 }}>
          💡 Como adicionar um novo profissional
        </p>
        <ol style={{ fontSize: 12, color: "#6b6585", paddingLeft: 16, margin: 0, lineHeight: 1.8 }}>
          <li>Peça para ela criar uma conta em <strong style={{ color: "#a78bfa" }}>/login</strong></li>
          <li>Vá em <Link href="/admin/studios" style={{ color: "#f59e0b", fontWeight: 700 }}>Studios</Link> → crie o studio dela</li>
          <li>Edite o studio → vincule o profissional pelo owner_id</li>
        </ol>
      </div>
    </div>
  );
}
