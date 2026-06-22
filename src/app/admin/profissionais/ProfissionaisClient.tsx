"use client";
import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Building2, UserCheck, UserX, Crown, Link2, Loader2, X, Check, Search, Unlink } from "lucide-react";
import { toast } from "sonner";

function hexToRgb(hex: string) { try { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `${r},${g},${b}`; } catch { return "124,92,191"; } }

export function ProfissionaisClient({ initialProfiles, studios: initialStudios }: any) {
  const sb = createClient();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [studios, setStudios]   = useState(initialStudios);
  const [search, setSearch]     = useState("");
  const [linkModal, setLinkModal] = useState<any>(null); // profile being linked
  const [selStudio, setSelStudio] = useState("");
  const [saving, setSaving]     = useState(false);

  const studioById = useMemo(() => Object.fromEntries(studios.map((s: any) => [s.id, s])), [studios]);
  const ownerToStudio = useMemo(() => {
    const m: Record<string, any> = {};
    studios.forEach((s: any) => { if (s.owner_id) m[s.owner_id] = s; });
    return m;
  }, [studios]);

  const pros   = profiles.filter((p: any) => p.role === "professional");
  const admins = profiles.filter((p: any) => p.role === "superadmin");
  const linked   = pros.filter((p: any) => ownerToStudio[p.id]);
  const unlinked = pros.filter((p: any) => !ownerToStudio[p.id]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return profiles;
    return profiles.filter((p: any) => (p.name||"").toLowerCase().includes(q) || (p.email||"").toLowerCase().includes(q));
  }, [profiles, search]);

  const availableStudios = studios.filter((s: any) => !s.owner_id);

  async function linkProfessional() {
    if (!linkModal || !selStudio) return;
    // Se já tem studio_id, pedir confirmação
    if (linkModal.studio_id) {
      const prev = studios.find((s: any) => s.id === linkModal.studio_id);
      if (!confirm(`${linkModal.name} já está vinculado a "${prev?.name ?? linkModal.studio_id}". Deseja substituir o vínculo?`)) return;
    }
    setSaving(true);
    try {
      const { error: studioError } = await sb.from("studios").update({ owner_id: linkModal.id }).eq("id", selStudio);
      if (studioError) throw studioError;

      const { error: profileError } = await sb.from("profiles").update({ studio_id: selStudio }).eq("id", linkModal.id);
      if (profileError) {
        await sb.from("studios").update({ owner_id: null }).eq("id", selStudio);
        throw profileError;
      }

      setStudios((prev: any) => prev.map((s: any) => s.id === selStudio ? { ...s, owner_id: linkModal.id } : s));
      setProfiles((prev: any) => prev.map((p: any) => p.id === linkModal.id ? { ...p, studio_id: selStudio } : p));
      toast.success("Profissional vinculado ao studio.");
      setLinkModal(null);
      setSelStudio("");
    } catch (err: any) {
      toast.error(err?.message ?? "Não foi possível vincular profissional.");
    } finally {
      setSaving(false);
    }
  }

  async function unlink(profile: any, studio: any) {
    if (!confirm(`Desvincular ${profile.name} de ${studio.name}?`)) return;
    const previousStudioId = profile.studio_id;
    const { error: studioError } = await sb.from("studios").update({ owner_id: null }).eq("id", studio.id);
    if (studioError) {
      toast.error(studioError.message);
      return;
    }

    const { error: profileError } = await sb.from("profiles").update({ studio_id: null }).eq("id", profile.id);
    if (profileError) {
      await sb.from("studios").update({ owner_id: profile.id }).eq("id", studio.id);
      await sb.from("profiles").update({ studio_id: previousStudioId }).eq("id", profile.id);
      toast.error(profileError.message);
      return;
    }

    setStudios((prev: any) => prev.map((s: any) => s.id === studio.id ? { ...s, owner_id: null } : s));
    setProfiles((prev: any) => prev.map((p: any) => p.id === profile.id ? { ...p, studio_id: null } : p));
    toast.success("Profissional desvinculado.");
  }

  const KPIS = [
    { label: "Total profissionais", value: pros.length,    icon: Users,     color: "var(--brand-light)" },
    { label: "Vinculados",          value: linked.length,  icon: UserCheck, color: "var(--green)" },
    { label: "Sem studio",          value: unlinked.length,icon: UserX,     color: unlinked.length > 0 ? "var(--yellow)" : "var(--muted)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>⚡ Profissionais</div>
          <h1 style={{ fontSize: 27, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: "-.02em" }}>Contas & Vínculos</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>{profiles.length} contas na plataforma</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {KPIS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 12, right: 12, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)`, opacity: .7 }}/>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</span>
              <Icon size={16} color={color}/>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", letterSpacing: "-.02em" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Alerta de não-vinculados */}
      {unlinked.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(245,200,66,.08)", border: "1px solid rgba(245,200,66,.25)", borderRadius: 14, padding: "14px 18px" }}>
          <UserX size={18} color="var(--yellow)"/>
          <span style={{ fontSize: 13, color: "var(--text)" }}>
            <b>{unlinked.length}</b> profissional{unlinked.length > 1 ? "is" : ""} sem studio vinculado. Clique em <b style={{ color: "var(--yellow)" }}>Vincular</b> para conectar a um salão.
          </span>
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={15} color="var(--muted)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou email..."
          style={{ width: "100%", height: 44, padding: "0 14px 0 40px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 13, color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}/>
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((p: any) => {
          const studio = ownerToStudio[p.id];
          const isSuperadmin = p.role === "superadmin";
          const rgb = studio ? hexToRgb(studio.brand_color || "#7C5CBF") : "124,92,191";
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 18px" }}>
              {/* Avatar */}
              <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800,
                background: isSuperadmin ? "linear-gradient(135deg,#f59e0b,#f0b64a)" : "linear-gradient(140deg,var(--brand),var(--brand-light))",
                color: isSuperadmin ? "#1a1208" : "#fff" }}>
                {p.avatar_url ? <img src={p.avatar_url} style={{ width: "100%", height: "100%", borderRadius: 12, objectFit: "cover" }} alt=""/> : (p.name || "?").charAt(0).toUpperCase()}
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{p.name || "—"}</span>
                  {isSuperadmin
                    ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 6, background: "rgba(245,158,11,.15)", color: "var(--gold)", border: "1px solid rgba(245,158,11,.3)", textTransform: "uppercase" }}><Crown size={10}/> Superadmin</span>
                    : <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 6, background: "rgba(124,92,191,.15)", color: "var(--brand-light)", border: "1px solid rgba(124,92,191,.3)", textTransform: "uppercase" }}>Profissional</span>
                  }
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email}</div>
              </div>
              {/* Studio vínculo */}
              <div style={{ flexShrink: 0 }}>
                {isSuperadmin ? (
                  <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600 }}>Admin geral</span>
                ) : studio ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 10, background: `rgba(${rgb},.1)`, border: `1px solid rgba(${rgb},.25)` }}>
                      <div style={{ width: 22, height: 22, borderRadius: 7, background: `linear-gradient(140deg,${studio.brand_color||"#7C5CBF"},rgba(0,0,0,.3))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>
                        {studio.name.slice(0,2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{studio.name}</span>
                    </div>
                    <button onClick={() => unlink(p, studio)} title="Desvincular"
                      style={{ width: 32, height: 32, borderRadius: 9, border: "1px solid rgba(245,90,90,.2)", background: "none", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Unlink size={14}/>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setLinkModal(p); setSelStudio(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 16px", borderRadius: 10, border: "1px solid rgba(245,200,66,.3)", background: "rgba(245,200,66,.1)", color: "var(--yellow)", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>
                    <Link2 size={14}/> Vincular studio
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de vínculo */}
      {linkModal && (
        <div onClick={e => e.target === e.currentTarget && setLinkModal(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border2)", borderRadius: 22, padding: 26, width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 18, boxShadow: "0 24px 60px rgba(0,0,0,.6)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: "var(--text)" }}>Vincular profissional</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{linkModal.name} · {linkModal.email}</div>
              </div>
              <button onClick={() => setLinkModal(null)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 22, cursor: "pointer" }}>×</button>
            </div>

            {availableStudios.length === 0 ? (
              <div style={{ padding: 16, background: "rgba(245,200,66,.08)", border: "1px solid rgba(245,200,66,.25)", borderRadius: 12, fontSize: 13, color: "var(--text)" }}>
                ⚠ Todos os studios já têm proprietário. Crie um novo studio primeiro em <b style={{ color: "var(--yellow)" }}>Studios</b>.
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>Escolha o studio (sem proprietário)</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflow: "auto" }}>
                    {availableStudios.map((s: any) => {
                      const rgb = hexToRgb(s.brand_color || "#7C5CBF");
                      const sel = selStudio === s.id;
                      return (
                        <button key={s.id} onClick={() => setSelStudio(s.id)}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                            border: `1px solid ${sel ? `rgba(${rgb},.5)` : "var(--border)"}`, background: sel ? `rgba(${rgb},.1)` : "var(--surface2)" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(140deg,${s.brand_color||"#7C5CBF"},rgba(0,0,0,.35))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>
                            {s.name.slice(0,2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>/{s.slug}</div>
                          </div>
                          {sel && <Check size={16} color={s.brand_color || "var(--brand-light)"}/>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={linkProfessional} disabled={saving || !selStudio}
                    style={{ flex: 1, height: 44, borderRadius: 12, background: "linear-gradient(135deg,var(--brand-light),var(--brand))", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 18px var(--brand-glow)", opacity: (saving || !selStudio) ? 0.5 : 1 }}>
                    {saving ? <><Loader2 size={14} style={{ animation: "spin .8s linear infinite" }}/> Vinculando...</> : <><Link2 size={14}/> Vincular</>}
                  </button>
                  <button onClick={() => setLinkModal(null)} style={{ height: 44, padding: "0 18px", borderRadius: 12, border: "1px solid var(--border2)", background: "none", color: "var(--muted)", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, fontSize: 13 }}>Cancelar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
