"use client";
import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Building2, Check, Crown, ExternalLink, Key, Loader2,
  Plus, Search, Shield, Unlink, UserCheck, Users, UserX, X, Clock,
} from "lucide-react";

const C = {
  bg: "#f4f5fb", card: "#ffffff", border: "#e2e8f0",
  sep: "#f0f0f8", text: "#0f172a", sub: "#64748b", muted: "#94a3b8",
};

const ROLE_INFO: Record<string, any> = {
  superadmin:   { label: "Superadmin",   color: "#7c3aed", bg: "rgba(124,58,237,0.10)",  border: "rgba(124,58,237,0.22)"  },
  owner:        { label: "Responsável",  color: "#10b981", bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.20)"  },
  professional: { label: "Profissional", color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.18)" },
};

function Modal({ title, onClose, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: C.muted }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({ label, ...props }: any) {
  return (
    <label style={{ display: "grid", gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
      <input {...props} className="input-base" />
    </label>
  );
}

export function ProfissionaisClient({ initialProfiles, studios: initialStudios }: any) {
  const sb = createClient();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [studios, setStudios] = useState(initialStudios);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type?: string } | null>(null);

  // Modals
  const [createAdminModal, setCreateAdminModal] = useState(false);
  const [resetModal, setResetModal] = useState<any>(null);
  const [trialModal, setTrialModal] = useState<any>(null);
  const [impersonateModal, setImpersonateModal] = useState<any>(null);
  const [linkModal, setLinkModal] = useState<any>(null);

  // Forms
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [trialDays, setTrialDays] = useState("7");
  const [trialStatus, setTrialStatus] = useState("trial");
  const [selStudio, setSelStudio] = useState("");

  function showToast(msg: string, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function callAction(payload: any) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      return data;
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAdmin() {
    if (!adminForm.name || !adminForm.email || !adminForm.password) return showToast("Preencha todos os campos", "error");
    try {
      await callAction({ action: "create_admin", ...adminForm });
      showToast("Admin criado com sucesso!");
      setCreateAdminModal(false);
      setAdminForm({ name: "", email: "", password: "" });
      window.location.reload();
    } catch (e: any) { showToast(e.message, "error"); }
  }

  async function handleResetPassword() {
    try {
      await callAction({ action: "reset_password", email: resetModal.email });
      showToast(`Email de reset enviado para ${resetModal.email}`);
      setResetModal(null);
    } catch (e: any) { showToast(e.message, "error"); }
  }

  async function handleUpdateTrial() {
    try {
      await callAction({ action: "update_trial", studioId: trialModal.id, days: Number(trialDays), status: trialStatus });
      showToast("Trial atualizado!");
      setTrialModal(null);
      window.location.reload();
    } catch (e: any) { showToast(e.message, "error"); }
  }

  async function handleImpersonate() {
    try {
      const data = await callAction({ action: "impersonate", ownerEmail: impersonateModal.email, studioId: impersonateModal.studioId });
      if (data.link) {
        navigator.clipboard.writeText(data.link);
        showToast("Link de acesso copiado! Cole em aba anônima.");
      }
      setImpersonateModal(null);
    } catch (e: any) { showToast(e.message, "error"); }
  }

  async function handleLink() {
    if (!linkModal || !selStudio) return;
    setSaving(true);
    try {
      await sb.from("studios").update({ owner_id: linkModal.id }).eq("id", selStudio);
      await sb.from("profiles").update({ studio_id: selStudio }).eq("id", linkModal.id);
      showToast("Vinculado com sucesso!");
      setLinkModal(null);
      window.location.reload();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  }

  async function handleUnlink(profile: any) {
    if (!confirm(`Desvincular ${profile.name} do salão?`)) return;
    setSaving(true);
    const studio = studios.find((s: any) => s.owner_id === profile.id);
    if (studio) await sb.from("studios").update({ owner_id: null }).eq("id", studio.id);
    await sb.from("profiles").update({ studio_id: null }).eq("id", profile.id);
    showToast("Desvinculado");
    setSaving(false);
    window.location.reload();
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p: any) => (p.name ?? "").toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q));
  }, [profiles, search]);

  const ownerToStudio = useMemo(() => {
    const m: Record<string, any> = {};
    studios.forEach((s: any) => { if (s.owner_id) m[s.owner_id] = s; });
    return m;
  }, [studios]);

  const admins = profiles.filter((p: any) => p.role === "superadmin").length;
  const owners = profiles.filter((p: any) => p.role === "owner").length;
  const profs = profiles.filter((p: any) => p.role === "professional").length;
  const noStudio = profiles.filter((p: any) => p.role !== "superadmin" && !p.studio_id).length;
  const freeStudios = studios.filter((s: any) => !s.owner_id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 960 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, padding: "12px 18px", borderRadius: 10, background: toast.type === "error" ? "#ef4444" : "#10b981", color: "#fff", fontSize: 13, fontWeight: 600, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4 }}>Equipe</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0, letterSpacing: "-.03em" }}>Usuários & Profissionais</h1>
          <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>{profiles.length} contas na plataforma</p>
        </div>
        <button onClick={() => setCreateAdminModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={15} /> Criar Superadmin
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { label: "Total", value: profiles.length, color: C.sub },
          { label: "Superadmins", value: admins, color: "#7c3aed" },
          { label: "Responsáveis", value: owners, color: "#10b981" },
          { label: "Profissionais", value: profs, color: C.sub },
          ...(noStudio > 0 ? [{ label: "Sem salão", value: noStudio, color: "#ef4444" }] : []),
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 20, background: C.card, border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
            <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative" }}>
        <Search size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou email..."
          className="input-base" style={{ paddingLeft: 36, width: "100%", boxSizing: "border-box" }} />
      </div>

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 160px 200px", padding: "9px 16px", background: "#f8fafc", borderBottom: `1px solid ${C.sep}` }}>
          {["Usuário", "Perfil", "Salão", "Ações"].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em" }}>{h}</span>
          ))}
        </div>

        {filtered.map((p: any, i: number) => {
          const role = ROLE_INFO[p.role] ?? ROLE_INFO.professional;
          const isAdmin = p.role === "superadmin";
          const linkedStudio = ownerToStudio[p.id];
          const avatar = (p.name ?? "?").charAt(0).toUpperCase();

          return (
            <div key={p.id} style={{
              display: "grid", gridTemplateColumns: "1fr 110px 160px 200px",
              alignItems: "center", padding: "13px 16px",
              borderBottom: i < filtered.length - 1 ? `1px solid ${C.sep}` : "none",
              transition: "background .1s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}>

              {/* User */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: isAdmin ? "rgba(124,58,237,0.12)" : "#f1f5f9", border: isAdmin ? "1px solid rgba(124,58,237,0.25)" : `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: isAdmin ? "#7c3aed" : C.sub }}>
                  {avatar}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name ?? "—"}</div>
                  <div style={{ fontSize: 11, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.email}</div>
                </div>
              </div>

              {/* Role */}
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: role.bg, color: role.color, border: `1px solid ${role.border}`, display: "inline-block" }}>
                {role.label}
              </span>

              {/* Studio */}
              <div>
                {isAdmin ? <span style={{ fontSize: 12, color: C.muted }}>—</span>
                  : linkedStudio ? (
                    <a href={`/admin/studios/${linkedStudio.id}`} style={{ fontSize: 12, color: "#7c3aed", fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                      <Building2 size={11} /> {linkedStudio.name}
                    </a>
                  ) : (
                    <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 500 }}>Sem salão</span>
                  )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {/* Reset senha */}
                {!isAdmin && (
                  <button title="Resetar senha" onClick={() => setResetModal(p)}
                    style={{ padding: "4px 8px", borderRadius: 7, border: `1px solid ${C.border}`, background: "#f8fafc", color: C.sub, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                    <Key size={11} /> Senha
                  </button>
                )}
                {/* Trial */}
                {linkedStudio && (
                  <button title="Controlar trial" onClick={() => { setTrialModal(linkedStudio); setTrialDays("7"); setTrialStatus(linkedStudio.subscription_status ?? "trial"); }}
                    style={{ padding: "4px 8px", borderRadius: 7, border: `1px solid ${C.border}`, background: "#f8fafc", color: C.sub, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} /> Trial
                  </button>
                )}
                {/* Impersonar */}
                {p.role === "owner" && linkedStudio && (
                  <button title="Entrar como este salão" onClick={() => setImpersonateModal({ email: p.email, name: p.name, studioId: linkedStudio.id, studioName: linkedStudio.name })}
                    style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid rgba(124,58,237,0.25)", background: "rgba(124,58,237,0.06)", color: "#7c3aed", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                    <ExternalLink size={11} /> Entrar
                  </button>
                )}
                {/* Vincular */}
                {!isAdmin && !linkedStudio && (
                  <button title="Vincular a salão" onClick={() => { setLinkModal(p); setSelStudio(""); }}
                    style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.06)", color: "#10b981", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                    <UserCheck size={11} /> Vincular
                  </button>
                )}
                {/* Desvincular */}
                {!isAdmin && linkedStudio && (
                  <button title="Desvincular" onClick={() => handleUnlink(p)}
                    style={{ padding: "4px 8px", borderRadius: 7, border: "1px solid rgba(239,68,68,0.20)", background: "rgba(239,68,68,0.06)", color: "#ef4444", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                    <Unlink size={11} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: C.muted }}>
            <Users size={24} style={{ opacity: 0.3, marginBottom: 10 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: C.sub }}>Nenhum usuário encontrado</p>
          </div>
        )}
      </div>

      {/* MODAL: Criar admin */}
      {createAdminModal && (
        <Modal title="Criar Superadmin" onClose={() => setCreateAdminModal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <InputField label="Nome" value={adminForm.name} onChange={(e: any) => setAdminForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: João Admin" />
            <InputField label="Email" type="email" value={adminForm.email} onChange={(e: any) => setAdminForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@nailit.app" />
            <InputField label="Senha" type="password" value={adminForm.password} onChange={(e: any) => setAdminForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 8 caracteres" />
            <p style={{ fontSize: 11, color: C.muted, margin: "4px 0 0" }}>⚠️ Este usuário terá acesso total à plataforma.</p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={handleCreateAdmin} disabled={saving}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                {saving ? <Loader2 size={14} className="spin" /> : <Shield size={14} />} Criar Admin
              </button>
              <button onClick={() => setCreateAdminModal(false)} style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: "#f8fafc", color: C.sub, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Reset senha */}
      {resetModal && (
        <Modal title="Resetar senha" onClose={() => setResetModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: C.sub, margin: 0 }}>
              Um email de redefinição de senha será enviado para <strong style={{ color: C.text }}>{resetModal.email}</strong>.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleResetPassword} disabled={saving}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                {saving ? <Loader2 size={14} className="spin" /> : <Key size={14} />} Enviar email de reset
              </button>
              <button onClick={() => setResetModal(null)} style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: "#f8fafc", color: C.sub, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Trial */}
      {trialModal && (
        <Modal title={`Trial — ${trialModal.name}`} onClose={() => setTrialModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
              Status atual: <strong style={{ color: C.text }}>{trialModal.subscription_status}</strong>
              {trialModal.trial_ends_at && <> · Expira: <strong>{new Date(trialModal.trial_ends_at).toLocaleDateString("pt-BR")}</strong></>}
            </p>
            <InputField label="Estender trial (dias a partir de hoje)" type="number" min="1" max="365" value={trialDays} onChange={(e: any) => setTrialDays(e.target.value)} />
            <label style={{ display: "grid", gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: ".06em" }}>Status</span>
              <select value={trialStatus} onChange={e => setTrialStatus(e.target.value)} className="input-base">
                <option value="trial">Trial</option>
                <option value="active">Ativo (pago)</option>
                <option value="past_due">Inadimplente</option>
                <option value="cancelled">Cancelado</option>
                <option value="suspended">Suspenso</option>
              </select>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleUpdateTrial} disabled={saving}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                {saving ? <Loader2 size={14} className="spin" /> : <Clock size={14} />} Salvar
              </button>
              <button onClick={() => setTrialModal(null)} style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: "#f8fafc", color: C.sub, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Impersonar */}
      {impersonateModal && (
        <Modal title={`Entrar como ${impersonateModal.studioName}`} onClose={() => setImpersonateModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
              <p style={{ fontSize: 12, color: "#92400e", margin: 0 }}>
                ⚠️ Isso vai gerar um link de acesso único para <strong>{impersonateModal.email}</strong>. O link será copiado — abra em aba anônima. Todas as ações serão logadas.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleImpersonate} disabled={saving}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                {saving ? <Loader2 size={14} className="spin" /> : <ExternalLink size={14} />} Gerar link & Copiar
              </button>
              <button onClick={() => setImpersonateModal(null)} style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: "#f8fafc", color: C.sub, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Vincular */}
      {linkModal && (
        <Modal title={`Vincular ${linkModal.name}`} onClose={() => setLinkModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ display: "grid", gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: ".06em" }}>Salão sem responsável</span>
              <select value={selStudio} onChange={e => setSelStudio(e.target.value)} className="input-base">
                <option value="">Selecionar...</option>
                {freeStudios.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} (/{s.slug})</option>
                ))}
              </select>
            </label>
            {freeStudios.length === 0 && <p style={{ fontSize: 12, color: "#f59e0b" }}>Todos os salões já têm responsável.</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleLink} disabled={saving || !selStudio}
                style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: selStudio ? "#10b981" : "#e2e8f0", color: selStudio ? "#fff" : C.muted, fontSize: 13, fontWeight: 600, cursor: selStudio ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                {saving ? <Loader2 size={14} className="spin" /> : <UserCheck size={14} />} Vincular
              </button>
              <button onClick={() => setLinkModal(null)} style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: "#f8fafc", color: C.sub, cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
