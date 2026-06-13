// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Clock, Palette, Phone, AtSign, Globe } from "lucide-react";

const DAYS = [
  { key: "monday",    label: "Segunda-feira" },
  { key: "tuesday",   label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday",  label: "Quinta-feira" },
  { key: "friday",    label: "Sexta-feira" },
  { key: "saturday",  label: "Sábado" },
  { key: "sunday",    label: "Domingo" },
];

const DEFAULT_HOURS = {
  monday:    { is_open: true,  open: "09:00", close: "18:00" },
  tuesday:   { is_open: true,  open: "09:00", close: "18:00" },
  wednesday: { is_open: true,  open: "09:00", close: "18:00" },
  thursday:  { is_open: true,  open: "09:00", close: "18:00" },
  friday:    { is_open: true,  open: "09:00", close: "18:00" },
  saturday:  { is_open: true,  open: "09:00", close: "13:00" },
  sunday:    { is_open: false, open: "09:00", close: "13:00" },
};

export default function ConfiguracoesPage() {
  const supabase = createClient();

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [studioId, setStudioId]   = useState<string | null>(null);

  // Studio fields
  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [address, setAddress]     = useState("");
  const [whatsapp, setWhatsapp]   = useState("");
  const [instagram, setInstagram] = useState("");
  const [brandColor, setBrandColor] = useState("#7C5CBF");

  // Salon settings
  const [slotDuration, setSlotDuration] = useState(30);
  const [advanceDays, setAdvanceDays]   = useState(30);
  const [autoConfirm, setAutoConfirm]   = useState(true);
  const [workingHours, setWorkingHours] = useState<Record<string, { is_open: boolean; open: string; close: string }>>(DEFAULT_HOURS);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles").select("studio_id").eq("id", user.id).single();
      if (!profile?.studio_id) { setLoading(false); return; }

      setStudioId(profile.studio_id);

      const [{ data: studio }, { data: settings }] = await Promise.all([
        supabase.from("studios")
          .select("name, phone, address, whatsapp, instagram, brand_color")
          .eq("id", profile.studio_id).single(),
        supabase.from("salon_settings")
          .select("working_hours, slot_duration, advance_days, auto_confirm")
          .eq("studio_id", profile.studio_id).single(),
      ]);

      if (studio) {
        setName(studio.name ?? "");
        setPhone(studio.phone ?? "");
        setAddress(studio.address ?? "");
        setWhatsapp(studio.whatsapp ?? "");
        setInstagram(studio.instagram ?? "");
        setBrandColor(studio.brand_color ?? "#7C5CBF");
      }

      if (settings) {
        setSlotDuration(settings.slot_duration ?? 30);
        setAdvanceDays(settings.advance_days ?? 30);
        setAutoConfirm(settings.auto_confirm ?? true);

        // Merge: respects existing keys, fills missing with defaults
        if (settings.working_hours) {
          setWorkingHours(prev => {
            const merged = { ...prev };
            for (const day of DAYS) {
              const existing = settings.working_hours[day.key];
              if (existing) {
                merged[day.key] = {
                  is_open: existing.is_open ?? prev[day.key].is_open,
                  open:    existing.open    ?? prev[day.key].open,
                  close:   existing.close   ?? prev[day.key].close,
                };
              }
            }
            return merged;
          });
        }
      }

      setLoading(false);
    }
    load();
  }, []);

  function setDay(key: string, field: "is_open" | "open" | "close", value: any) {
    setWorkingHours(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }

  async function saveStudio() {
    if (!studioId) return;
    setSaving(true);
    const { error } = await supabase.from("studios").update({
      name, phone: phone || null, address: address || null,
      whatsapp: whatsapp || null, instagram: instagram || null,
      brand_color: brandColor,
      updated_at: new Date().toISOString(),
    }).eq("id", studioId);
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success("Studio salvo!");
    setSaving(false);
  }

  async function saveSettings() {
    if (!studioId) return;
    setSaving(true);

    // Upsert preserves working_hours structure (is_open, open, close)
    const { error } = await supabase.from("salon_settings").upsert({
      studio_id: studioId,
      slot_duration: slotDuration,
      advance_days: advanceDays,
      auto_confirm: autoConfirm,
      working_hours: workingHours,
      updated_at: new Date().toISOString(),
    }, { onConflict: "studio_id" });

    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success("Configurações salvas!");
    setSaving(false);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--muted)" }} />
      </div>
    );
  }

  return (
    <div className="studio-settings-page" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="studio-page-header" style={{ marginBottom: 22 }}>
        <div>
          <span className="studio-eyebrow">Preferências</span>
          <h1>Configurações</h1>
          <p>Ajustes do studio, agendamento online e horários de funcionamento.</p>
        </div>
      </div>

      {/* Studio info */}
      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Globe size={15} style={{ color: "var(--brand-light)" }} /> Dados do Studio
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>Nome do studio</label>
            <input className="input-base" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Tessy Nails" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>Telefone</label>
              <input className="input-base" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                <Phone size={12} style={{ display: "inline", marginRight: 4 }} />WhatsApp
              </label>
              <input className="input-base" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="5511999999999" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                <AtSign size={12} style={{ display: "inline", marginRight: 4 }} />Instagram
              </label>
              <input className="input-base" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@tessystudio" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>
                <Palette size={12} style={{ display: "inline", marginRight: 4 }} />Cor da marca
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                  style={{ width: 40, height: 40, borderRadius: 8, border: "1px solid var(--border)", background: "none", cursor: "pointer", padding: 2 }} />
                <input className="input-base" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                  style={{ flex: 1, fontFamily: "monospace" }} placeholder="#7C5CBF" />
              </div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>Endereço</label>
            <input className="input-base" value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro" />
          </div>
          <button className="btn-primary" onClick={saveStudio} disabled={saving} style={{ alignSelf: "flex-end", display: "flex", alignItems: "center", gap: 8 }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar dados
          </button>
        </div>
      </section>

      {/* Agendamento settings */}
      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={15} style={{ color: "var(--brand-light)" }} /> Agendamento Online
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>Slot (min)</label>
            <select className="input-base" value={slotDuration} onChange={e => setSlotDuration(Number(e.target.value))}>
              {[15, 20, 30, 45, 60].map(v => <option key={v} value={v}>{v} min</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 6 }}>Antecedência (dias)</label>
            <input className="input-base" type="number" min={1} max={90} value={advanceDays}
              onChange={e => setAdvanceDays(Number(e.target.value))} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "var(--text)", fontWeight: 600, paddingBottom: 10 }}>
              <input type="checkbox" checked={autoConfirm} onChange={e => setAutoConfirm(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--brand)" }} />
              Confirmar automaticamente
            </label>
          </div>
        </div>

        {/* Working hours */}
        <h3 style={{ fontSize: 12, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Horário de funcionamento
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {DAYS.map(({ key, label }) => {
            const day = workingHours[key] ?? DEFAULT_HOURS[key];
            return (
              <div key={key} className="working-hours-row" style={{
                display: "grid", gridTemplateColumns: "140px 40px minmax(0,1fr) minmax(0,1fr)", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                background: day.is_open ? "rgba(124,92,191,0.06)" : "var(--surface3)",
                border: `1px solid ${day.is_open ? "rgba(124,92,191,0.2)" : "var(--border)"}`,
                transition: "all .15s"
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: day.is_open ? "var(--text)" : "var(--muted)" }}>{label}</span>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input type="checkbox" checked={day.is_open} onChange={e => setDay(key, "is_open", e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "var(--brand)" }} />
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: day.is_open ? 1 : 0.4 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>Abre</span>
                  <input className="input-base" type="time" value={day.open} disabled={!day.is_open}
                    onChange={e => setDay(key, "open", e.target.value)}
                    style={{ fontSize: 13, padding: "6px 10px" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: day.is_open ? 1 : 0.4 }}>
                  <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>Fecha</span>
                  <input className="input-base" type="time" value={day.close} disabled={!day.is_open}
                    onChange={e => setDay(key, "close", e.target.value)}
                    style={{ fontSize: 13, padding: "6px 10px" }} />
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn-primary" onClick={saveSettings} disabled={saving}
          style={{ marginTop: 16, alignSelf: "flex-end", display: "flex", alignItems: "center", gap: 8 }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar configurações
        </button>
      </section>
    </div>
  );
}
