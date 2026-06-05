// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Building2, Clock } from "lucide-react";

const DAYS = [
  { key: "monday",    label: "Segunda" },
  { key: "tuesday",   label: "Terça"   },
  { key: "wednesday", label: "Quarta"  },
  { key: "thursday",  label: "Quinta"  },
  { key: "friday",    label: "Sexta"   },
  { key: "saturday",  label: "Sábado"  },
  { key: "sunday",    label: "Domingo" },
];

type DayConfig = { open: string; close: string; is_open: boolean };
type WorkingHours = Record<string, DayConfig>;

const DEFAULT_WH: WorkingHours = Object.fromEntries(
  DAYS.map(({ key }) => [key, { open: "09:00", close: "18:00", is_open: key !== "sunday" }])
);

export default function ConfiguracoesPage() {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [studioId, setStudioId] = useState<string | null>(null);

  const [studioName, setStudioName] = useState("");
  const [studioSlug, setStudioSlug] = useState("");
  const [phone, setPhone]           = useState("");
  const [address, setAddress]       = useState("");
  const [slotDuration, setSlot]     = useState(30);
  const [advanceDays, setAdvance]   = useState(30);
  const [wh, setWh]                 = useState<WorkingHours>(DEFAULT_WH);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error: pErr } = await supabase
          .from("profiles").select("studio_id").eq("id", user.id).single();

        if (pErr || !profile?.studio_id) {
          setLoading(false);
          return;
        }

        const sid = profile.studio_id;
        setStudioId(sid);

        const [{ data: studio }, { data: settings }] = await Promise.all([
          supabase.from("studios").select("*").eq("id", sid).single(),
          supabase.from("salon_settings").select("*").eq("studio_id", sid).single(),
        ]);

        if (studio) {
          setStudioName(studio.name ?? "");
          setStudioSlug(studio.slug ?? "");
          setPhone(studio.phone ?? "");
          setAddress(studio.address ?? "");
        }

        if (settings) {
          setSlot(settings.slot_duration ?? 30);
          setAdvance(settings.advance_days ?? 30);
          setWh({ ...DEFAULT_WH, ...(settings.working_hours as WorkingHours) });
        }
      } catch (e) {
        console.error("[configuracoes] load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function setDay(key: string, field: keyof DayConfig, value: string | boolean) {
    setWh(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  async function save() {
    if (!studioId) {
      toast.error("Studio não carregado. Recarregue a página.");
      return;
    }
    setSaving(true);
    try {
      const [studioRes, settingsRes] = await Promise.all([
        supabase.from("studios")
          .update({ name: studioName, slug: studioSlug, phone: phone || null, address: address || null })
          .eq("id", studioId),
        supabase.from("salon_settings")
          .upsert(
            { studio_id: studioId, slot_duration: slotDuration, advance_days: advanceDays, working_hours: wh },
            { onConflict: "studio_id" }
          ),
      ]);

      if (studioRes.error) {
        const msg = studioRes.error.message.includes("unique")
          ? "Este slug já está em uso. Escolha outro."
          : `Erro no studio: ${studioRes.error.message}`;
        toast.error(msg);
        return;
      }
      if (settingsRes.error) {
        toast.error(`Erro nos horários: ${settingsRes.error.message}`);
        return;
      }
      toast.success("Configurações salvas!");
    } catch (e) {
      console.error("[configuracoes] save error:", e);
      toast.error("Erro inesperado. Veja o console.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="animate-spin" size={28} style={{ color: "var(--brand)" }} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>Configurações</h1>

      {!studioId && (
        <div className="card" style={{ borderColor: "#f87171" }}>
          <p className="text-sm font-bold" style={{ color: "#f87171" }}>
            Studio não encontrado. Seu perfil pode não ter um studio vinculado.
          </p>
        </div>
      )}

      {/* Studio info */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 size={16} style={{ color: "var(--brand-light)" }} />
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text)" }}>Studio</h2>
        </div>
        <input className="input-base" placeholder="Nome do studio" value={studioName} onChange={e => setStudioName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className="input-base" placeholder="Slug (ex: tessy-nails)" value={studioSlug}
            onChange={e => setStudioSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
          <input className="input-base" placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <input className="input-base" placeholder="Endereço" value={address} onChange={e => setAddress(e.target.value)} />
        {studioSlug && (
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Link público: <span style={{ color: "var(--brand-light)" }}>/agendar/{studioSlug}</span>
          </p>
        )}
      </div>

      {/* Working hours */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={16} style={{ color: "var(--brand-light)" }} />
          <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text)" }}>Horários</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: "var(--muted)" }}>Slot (minutos)</label>
            <select className="input-base" value={slotDuration} onChange={e => setSlot(Number(e.target.value))}>
              {[15, 20, 30, 45, 60].map(v => <option key={v} value={v}>{v} min</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold mb-1 block" style={{ color: "var(--muted)" }}>Antecedência (dias)</label>
            <input className="input-base" type="number" min={1} max={90} value={advanceDays}
              onChange={e => setAdvance(Number(e.target.value))} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {DAYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
              <label className="flex items-center gap-2 w-24 shrink-0 cursor-pointer">
                <input type="checkbox" checked={wh[key]?.is_open ?? false}
                  onChange={e => setDay(key, "is_open", e.target.checked)}
                  className="w-4 h-4 accent-purple-500" />
                <span className="text-sm font-bold"
                  style={{ color: wh[key]?.is_open ? "var(--text)" : "var(--muted)" }}>{label}</span>
              </label>
              {wh[key]?.is_open && (
                <div className="flex items-center gap-2 flex-1">
                  <input type="time" className="input-base h-9 text-sm" style={{ flex: 1 }}
                    value={wh[key]?.open ?? "09:00"} onChange={e => setDay(key, "open", e.target.value)} />
                  <span style={{ color: "var(--muted)" }}>–</span>
                  <input type="time" className="input-base h-9 text-sm" style={{ flex: 1 }}
                    value={wh[key]?.close ?? "18:00"} onChange={e => setDay(key, "close", e.target.value)} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button onClick={save} className="btn-primary w-full" disabled={saving || !studioId}>
        {saving
          ? <><Loader2 size={16} className="animate-spin" /> Salvando...</>
          : <><Save size={16} /> Salvar configurações</>}
      </button>
    </div>
  );
}
