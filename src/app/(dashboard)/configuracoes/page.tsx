"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  AtSign, Camera, Check, Clock, Globe, Loader2,
  Palette, Phone, Save, Scissors,
} from "lucide-react";

const DAYS = [
  { key: "monday",    label: "Segunda" },
  { key: "tuesday",   label: "Terça"   },
  { key: "wednesday", label: "Quarta"  },
  { key: "thursday",  label: "Quinta"  },
  { key: "friday",    label: "Sexta"   },
  { key: "saturday",  label: "Sábado"  },
  { key: "sunday",    label: "Domingo" },
];

const DEFAULT_HOURS: Record<string, { is_open: boolean; open: string; close: string }> = {
  monday:    { is_open: true,  open: "09:00", close: "18:00" },
  tuesday:   { is_open: true,  open: "09:00", close: "18:00" },
  wednesday: { is_open: true,  open: "09:00", close: "18:00" },
  thursday:  { is_open: true,  open: "09:00", close: "18:00" },
  friday:    { is_open: true,  open: "09:00", close: "18:00" },
  saturday:  { is_open: true,  open: "08:00", close: "13:00" },
  sunday:    { is_open: false, open: "09:00", close: "13:00" },
};

type SaveState = "idle" | "saving" | "saved" | "error";

function useSaveState() {
  const [state, setState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  function setSaved() {
    setState("saved");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2500);
  }
  return { state, setSaving: () => setState("saving"), setSaved, setError: () => setState("error"), setIdle: () => setState("idle") };
}

function SaveBtn({ state, onClick, label = "Salvar" }: { state: SaveState; onClick: () => void; label?: string }) {
  const isLoading = state === "saving";
  const isSaved = state === "saved";
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "10px 18px", borderRadius: 10, border: "none", cursor: isLoading ? "wait" : "pointer",
        fontFamily: "inherit", fontSize: 13, fontWeight: 800,
        background: isSaved ? "rgba(52,211,153,0.15)" : "var(--brand)",
        color: isSaved ? "#34d399" : "#fff",
        outline: isSaved ? "1px solid rgba(52,211,153,0.3)" : "none",
        transition: "all .2s ease",
      }}
    >
      {isLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> :
       isSaved  ? <Check size={14} /> : <Save size={14} />}
      {isLoading ? "Salvando…" : isSaved ? "Salvo!" : label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{label}</label>
      {children}
    </div>
  );
}

function Section({ icon: Icon, title, children, action }: { icon: any; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section style={{
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 16,
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderBottom: "1px solid var(--border)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(124,92,191,0.15)", border: "1px solid rgba(124,92,191,0.25)", display: "grid", placeItems: "center" }}>
            <Icon size={15} color="var(--brand-light)" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </section>
  );
}

export default function ConfiguracoesPage() {
  const supabase = createClient();
  const [loading, setLoading]   = useState(true);
  const [studioId, setStudioId] = useState<string | null>(null);

  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [address, setAddress]     = useState("");
  const [whatsapp, setWhatsapp]   = useState("");
  const [instagram, setInstagram] = useState("");
  const [brandColor, setBrandColor] = useState("#7C5CBF");
  const [avatarUrl, setAvatarUrl]   = useState("");
  const [uploading, setUploading]   = useState(false);

  const [slotDuration, setSlotDuration] = useState(30);
  const [advanceDays, setAdvanceDays]   = useState(30);
  const [autoConfirm, setAutoConfirm]   = useState(true);
  const [workingHours, setWorkingHours] = useState<Record<string, { is_open: boolean; open: string; close: string }>>(DEFAULT_HOURS);

  const studioSave = useSaveState();
  const settingsSave = useSaveState();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: profile } = await supabase.from("profiles").select("studio_id").eq("id", user.id).single();
      if (!profile?.studio_id) { setLoading(false); return; }
      setStudioId(profile.studio_id);
      const [{ data: studio }, { data: settings }] = await Promise.all([
        supabase.from("studios").select("name, phone, address, whatsapp, instagram, brand_color, avatar_url").eq("id", profile.studio_id).single(),
        supabase.from("salon_settings").select("working_hours, slot_duration, advance_days, auto_confirm").eq("studio_id", profile.studio_id).single(),
      ]);
      if (studio) {
        setName(studio.name ?? "");
        setPhone(studio.phone ?? "");
        setAddress(studio.address ?? "");
        setWhatsapp(studio.whatsapp ?? "");
        setInstagram(studio.instagram ?? "");
        setBrandColor(studio.brand_color ?? "#7C5CBF");
        setAvatarUrl(studio.avatar_url ?? "");
      }
      if (settings) {
        setSlotDuration(settings.slot_duration ?? 30);
        setAdvanceDays(settings.advance_days ?? 30);
        setAutoConfirm(settings.auto_confirm ?? true);
        if (settings.working_hours) {
          setWorkingHours(prev => {
            const merged = { ...prev };
            for (const d of DAYS) {
              const ex = (settings.working_hours as any)[d.key];
              if (ex) merged[d.key] = { is_open: ex.is_open ?? prev[d.key].is_open, open: ex.open ?? prev[d.key].open, close: ex.close ?? prev[d.key].close };
            }
            return merged;
          });
        }
      }
      setLoading(false);
    }
    void load();
  }, []);

  function setDay(key: string, field: "is_open" | "open" | "close", value: any) {
    setWorkingHours(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  async function saveStudio() {
    if (!studioId) return;
    studioSave.setSaving();
    const { error } = await supabase.from("studios").update({
      name, phone: phone || null, address: address || null,
      whatsapp: whatsapp || null, instagram: instagram || null,
      brand_color: brandColor, avatar_url: avatarUrl || null,
    }).eq("id", studioId);
    if (error) { studioSave.setError(); toast.error(error.message); return; }
    studioSave.setSaved();
  }

  async function saveSettings() {
    if (!studioId) return;
    settingsSave.setSaving();
    const { error } = await supabase.from("salon_settings").upsert({
      studio_id: studioId, slot_duration: slotDuration,
      advance_days: advanceDays, auto_confirm: autoConfirm,
      working_hours: workingHours,
    }, { onConflict: "studio_id" });
    if (error) { settingsSave.setError(); toast.error(error.message); return; }
    settingsSave.setSaved();
  }

  async function uploadAvatar(file: File) {
    if (!studioId) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5MB."); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `studios/${studioId}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = publicUrl + "?t=" + Date.now();
      setAvatarUrl(url);
      await supabase.from("studios").update({ avatar_url: url }).eq("id", studioId);
      toast.success("Foto atualizada!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar foto.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720, margin: "0 auto" }}>
        {[200, 320, 420].map(h => (
          <div key={h} style={{ height: h, borderRadius: 16, background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div className="studio-page-header" style={{ marginBottom: 24 }}>
        <div>
          <span className="studio-eyebrow">Preferências</span>
          <h1>Configurações</h1>
          <p>Dados do studio, horários e configurações de agendamento.</p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .cfg-input { transition: border-color .15s, box-shadow .15s; }
        .cfg-input:focus { border-color: var(--brand-light) !important; box-shadow: 0 0 0 3px rgba(124,92,191,0.18); }
        .day-row { transition: background .2s, border-color .2s; }
        .day-row:hover { background: rgba(255,255,255,0.035) !important; }
      `}</style>

      {/* Seção 1: Foto e identidade */}
      <Section icon={Globe} title="Identidade do studio" action={<SaveBtn state={studioSave.state} onClick={saveStudio} />}>
        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
          <label style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "var(--surface3)", border: "2px solid var(--border)",
              overflow: "hidden", display: "grid", placeItems: "center", fontSize: 32,
              transition: "border-color .2s",
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : "💅"}
            </div>
            {uploading && (
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center" }}>
                <Loader2 size={22} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: "var(--brand)", display: "grid", placeItems: "center", border: "2px solid var(--surface2)" }}>
              <Camera size={12} color="#fff" />
            </div>
            <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) void uploadAvatar(f); e.target.value = ""; }} />
          </label>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Foto do studio</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>Aparece no link de agendamento público. JPG, PNG — máx 5MB.</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Nome do studio">
            <input className="input-base cfg-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Tessy Nails" />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Telefone">
              <input className="input-base cfg-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(66) 99999-9999" type="tel" />
            </Field>
            <Field label="WhatsApp (com DDI)">
              <input className="input-base cfg-input" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="5566999990000" type="tel" />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Instagram">
              <div style={{ position: "relative" }}>
                <AtSign size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
                <input className="input-base cfg-input" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="tessystudio" style={{ paddingLeft: 34 }} />
              </div>
            </Field>
            <Field label="Cor da marca">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                  style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid var(--border)", padding: 3, background: "none", cursor: "pointer", flexShrink: 0 }} />
                <input className="input-base cfg-input" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                  placeholder="#7C5CBF" style={{ fontFamily: "monospace", flex: 1 }} />
              </div>
            </Field>
          </div>
          <Field label="Endereço">
            <div style={{ position: "relative" }}>
              <Globe size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
              <input className="input-base cfg-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro" style={{ paddingLeft: 34 }} />
            </div>
          </Field>
        </div>
      </Section>

      {/* Seção 2: Agendamento */}
      <Section icon={Clock} title="Agendamento online" action={<SaveBtn state={settingsSave.state} onClick={saveSettings} />}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <Field label="Duração dos slots">
            <select className="input-base cfg-input" value={slotDuration} onChange={e => setSlotDuration(Number(e.target.value))}>
              {[15, 20, 30, 45, 60].map(v => <option key={v} value={v}>{v} minutos</option>)}
            </select>
          </Field>
          <Field label="Antecedência máxima">
            <div style={{ position: "relative" }}>
              <input className="input-base cfg-input" type="number" min={1} max={90} value={advanceDays}
                onChange={e => setAdvanceDays(Number(e.target.value))} style={{ paddingRight: 52 }} />
              <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--muted)", pointerEvents: "none" }}>dias</span>
            </div>
          </Field>
        </div>

        <label style={{
          display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
          borderRadius: 12, cursor: "pointer", marginBottom: 20,
          background: autoConfirm ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${autoConfirm ? "rgba(52,211,153,0.2)" : "var(--border)"}`,
          transition: "all .2s",
        }}>
          <div style={{
            width: 44, height: 26, borderRadius: 999, position: "relative", flexShrink: 0,
            background: autoConfirm ? "#34d399" : "rgba(255,255,255,0.12)",
            transition: "background .2s",
          }}>
            <div style={{
              position: "absolute", top: 3, left: autoConfirm ? 21 : 3,
              width: 20, height: 20, borderRadius: "50%", background: "#fff",
              transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }} />
            <input type="checkbox" checked={autoConfirm} onChange={e => setAutoConfirm(e.target.checked)} style={{ position: "absolute", opacity: 0, inset: 0, cursor: "pointer", margin: 0 }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Confirmar agendamentos automaticamente</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)" }}>
              {autoConfirm ? "Clientes são confirmados na hora que agendam" : "Você precisa confirmar manualmente cada agendamento"}
            </p>
          </div>
        </label>

        <p style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
          Horários de funcionamento
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {DAYS.map(({ key, label }) => {
            const day = workingHours[key] ?? DEFAULT_HOURS[key];
            return (
              <div key={key} className="day-row" style={{
                display: "grid", gridTemplateColumns: "1fr auto 1fr 1fr",
                gap: 8, alignItems: "center", padding: "10px 14px", borderRadius: 10,
                background: day.is_open ? "rgba(124,92,191,0.06)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${day.is_open ? "rgba(124,92,191,0.2)" : "var(--border)"}`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: day.is_open ? "var(--text)" : "var(--muted)" }}>{label}</span>
                <label style={{ display: "flex", alignItems: "center", gap: 0, cursor: "pointer" }}>
                  <div style={{
                    width: 36, height: 20, borderRadius: 999, position: "relative",
                    background: day.is_open ? "#a78bfa" : "rgba(255,255,255,0.1)",
                    transition: "background .2s", flexShrink: 0,
                  }}>
                    <div style={{
                      position: "absolute", top: 2, left: day.is_open ? 18 : 2,
                      width: 16, height: 16, borderRadius: "50%", background: "#fff",
                      transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    }} />
                    <input type="checkbox" checked={day.is_open} onChange={e => setDay(key, "is_open", e.target.checked)}
                      style={{ position: "absolute", opacity: 0, inset: 0, cursor: "pointer", margin: 0 }} />
                  </div>
                </label>
                <div style={{ opacity: day.is_open ? 1 : 0.35, transition: "opacity .2s" }}>
                  <input className="cfg-input" type="time" value={day.open} disabled={!day.is_open}
                    onChange={e => setDay(key, "open", e.target.value)}
                    style={{ width: "100%", background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, padding: "7px 10px", fontFamily: "monospace" }} />
                </div>
                <div style={{ opacity: day.is_open ? 1 : 0.35, transition: "opacity .2s" }}>
                  <input className="cfg-input" type="time" value={day.close} disabled={!day.is_open}
                    onChange={e => setDay(key, "close", e.target.value)}
                    style={{ width: "100%", background: "var(--surface3)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13, padding: "7px 10px", fontFamily: "monospace" }} />
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
