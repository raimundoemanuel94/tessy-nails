// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Building2, Loader2, Pencil, Power, X, Search } from "lucide-react";
import Link from "next/link";

const SERVICES_DEFAULT = [
  { name: "Manicure simples",   price: 35,  duration_minutes: 45  },
  { name: "Pedicure simples",   price: 40,  duration_minutes: 60  },
  { name: "Manicure em gel",    price: 80,  duration_minutes: 90  },
  { name: "Pedicure em gel",    price: 90,  duration_minutes: 90  },
  { name: "Alongamento em gel", price: 150, duration_minutes: 120 },
  { name: "Esmaltação em gel",  price: 60,  duration_minutes: 60  },
  { name: "Spa dos pés",        price: 70,  duration_minutes: 75  },
  { name: "Nail art",           price: 15,  duration_minutes: 30  },
];

const PC: Record<string, { bg: string; color: string; border: string }> = {
  pro:     { bg: "rgba(99,102,241,0.10)",  color: "#818cf8", border: "rgba(99,102,241,0.22)"  },
  starter: { bg: "rgba(96,165,250,0.10)",  color: "#60a5fa", border: "rgba(96,165,250,0.22)"  },
  free:    { bg: "rgba(113,113,122,0.10)", color: "#71717a", border: "rgba(113,113,122,0.20)" },
  studio:  { bg: "rgba(244,114,182,0.10)", color: "#f472b6", border: "rgba(244,114,182,0.22)" },
};

function relTime(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff/60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h atrás`;
  if (diff < 2592000) return `${Math.floor(diff/86400)}d atrás`;
  return new Date(d).toLocaleDateString("pt-BR", { day:"numeric", month:"short" });
}

const C = {
  card:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  sep:    "rgba(255,255,255,0.05)",
  text:   "#f4f4f5",
  sub:    "#a1a1aa",
  muted:  "#52525b",
  r:      10,
};

export default function AdminStudiosPage() {
  const [studios, setStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState("");
  const [nome, setNome]       = useState("");
  const [slug, setSlug]       = useState("");
  const [phone, setPhone]     = useState("");
  const [plan, setPlan]       = useState("pro");
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase
      .from("studios")
      .select("id, name, slug, plan, is_active, created_at, profiles!studios_owner_id_fkey(name, email)")
      .order("created_at", { ascending: false });
    setStudios(data ?? []); setLoading(false);
  }

  function handleNome(v: string) {
    setNome(v);
    setSlug(v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));
  }

  async function criar() {
    if (!nome || !slug) { toast.error("Nome e slug são obrigatórios."); return; }
    setSaving(true);
    try {
      const { data: studio, error } = await supabase
        .from("studios").insert({ name: nome, slug, phone: phone||null, plan, is_active: true })
        .select("id").single();
      if (error) { toast.error(error.message.includes("unique") ? "Slug já em uso." : error.message); return; }
      await supabase.from("salon_settings").insert({ studio_id: studio.id });
      await supabase.from("services").insert(SERVICES_DEFAULT.map(s => ({ ...s, studio_id: studio.id, is_active: true })));
      toast.success(`"${nome}" criado com 8 serviços!`);
      setOpen(false); setNome(""); setSlug(""); setPhone("");
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  async function toggleActive(id: string, cur: boolean) {
    await supabase.from("studios").update({ is_active: !cur }).eq("id", id);
    setStudios(s => s.map(x => x.id===id ? {...x, is_active:!cur} : x));
    toast.success(cur ? "Studio desativado." : "Studio ativado.");
  }

  const filtered = studios.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  const active   = studios.filter(s => s.is_active).length;
  const inactive = studios.filter(s => !s.is_active).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1040 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: C.muted, letterSpacing: "0.06em",
            textTransform: "uppercase", marginBottom: 6 }}>Admin Console</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.025em" }}>Studios</h1>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {[
              { label: "Total",    value: studios.length, color: C.sub  },
              { label: "Ativos",   value: active,         color: "#4ade80" },
              ...(inactive > 0 ? [{ label: "Inativos", value: inactive, color: "#f87171" }] : []),
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "3px 10px", borderRadius: 20,
                background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setOpen(true)} style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "9px 16px", borderRadius: 8,
          background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
          fontSize: 13, fontWeight: 600, color: "#818cf8", cursor: "pointer", fontFamily: "inherit",
        }}>
          <Plus size={13}/> Novo Studio
        </button>
      </div>

      {/* Search */}
      {studios.length > 0 && (
        <div style={{ position: "relative" }}>
          <Search size={13} color={C.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou slug…"
            style={{
              width: "100%", height: 38, paddingLeft: 36, paddingRight: 12,
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit",
            }}
          />
        </div>
      )}

      {/* Table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.r, overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 size={20} color={C.muted} className="spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <Building2 size={24} color={C.muted} style={{ opacity: 0.4, marginBottom: 12 }}/>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.sub, marginBottom: 5 }}>
              {search ? "Nenhum resultado" : "Nenhum studio ainda"}
            </p>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
              {search ? `Sem resultados para "${search}"` : "Crie o primeiro studio da plataforma"}
            </p>
            {!search && (
              <button onClick={() => setOpen(true)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.22)",
                fontSize: 13, fontWeight: 600, color: "#818cf8", cursor: "pointer", fontFamily: "inherit",
              }}>+ Criar studio</button>
            )}
          </div>
        ) : (
          <>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 150px 90px 90px 72px",
              padding: "7px 18px", borderBottom: `1px solid ${C.sep}`,
            }}>
              {["Studio", "Responsável", "Plano", "Status", ""].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 500, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>

            {filtered.map((s, i) => {
              const pc = PC[s.plan] ?? PC.free;
              return (
                <div key={s.id}
                  className="a-row"
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 150px 90px 90px 72px",
                    alignItems: "center", padding: "13px 18px",
                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.sep}` : "none",
                    opacity: s.is_active ? 1 : 0.5,
                  }}
                >
                  {/* Studio info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                      background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#818cf8",
                    }}>{s.name.charAt(0).toUpperCase()}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                        <code style={{ fontSize: 10, color: C.muted }}>/{s.slug}</code>
                        <span style={{ fontSize: 9, color: C.muted }}>·</span>
                        <span style={{ fontSize: 10, color: C.muted }}>{relTime(s.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner */}
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 12, color: s.profiles?.name ? C.sub : C.muted, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {s.profiles?.name ?? "—"}
                    </span>
                  </div>

                  {/* Plan */}
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
                      background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`,
                    }}>{s.plan}</span>
                  </div>

                  {/* Status */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: s.is_active ? "#22c55e" : "#3f3f46", flexShrink: 0,
                    }}/>
                    <span style={{ fontSize: 11, color: s.is_active ? "#4ade80" : C.muted }}>
                      {s.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                    <Link href={`/admin/studios/${s.id}`} style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 28, height: 28, borderRadius: 6,
                      background: "rgba(255,255,255,0.04)", border: `1px solid ${C.sep}`,
                      color: C.muted, textDecoration: "none",
                    }}
                      onMouseEnter={(e: any) => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                      onMouseLeave={(e: any) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    ><Pencil size={11}/></Link>
                    <button onClick={() => toggleActive(s.id, s.is_active)} style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 28, height: 28, borderRadius: 6,
                      background: "rgba(255,255,255,0.04)", border: `1px solid ${C.sep}`,
                      color: s.is_active ? "#4ade80" : C.muted,
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                      onMouseEnter={(e: any) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                      onMouseLeave={(e: any) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    ><Power size={11}/></button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Modal */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
        }}>
          <div style={{
            width: "100%", maxWidth: 440,
            background: "#111113", border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 14, padding: "24px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>
                  Novo Studio
                </h2>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                  Inclui 8 serviços padrão automaticamente
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: "rgba(255,255,255,0.05)", border: `1px solid ${C.sep}`,
                borderRadius: 7, padding: "6px", cursor: "pointer", color: C.muted,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><X size={14}/></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: C.muted, display: "block",
                  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Nome *</label>
                <input className="input-base" value={nome}
                  onChange={e => handleNome(e.target.value)} placeholder="Ex: Tessy Nails"/>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: C.muted, display: "block",
                  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Slug (URL) *</label>
                <input className="input-base" value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))}
                  placeholder="tessy-nails"/>
                {slug && (
                  <p style={{ fontSize: 11, color: "#818cf8", marginTop: 5, fontFamily: "monospace" }}>
                    nailit.com.br/agendar/{slug}
                  </p>
                )}
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: C.muted, display: "block",
                  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Telefone</label>
                <input className="input-base" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999"/>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: C.muted, display: "block",
                  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>Plano</label>
                <select className="input-base" value={plan} onChange={e => setPlan(e.target.value)}>
                  <option value="free">Free — Gratuito</option>
                  <option value="starter">Starter — R$19/mês</option>
                  <option value="pro">Pro — R$29/mês</option>
                  <option value="studio">Studio — R$59/mês</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
              <button onClick={criar} disabled={saving} style={{
                flex: 1, height: 40, borderRadius: 8,
                background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.30)",
                color: "#818cf8", fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "inherit", opacity: saving ? .6 : 1,
              }}>
                {saving ? <Loader2 size={13} className="spin"/> : <Plus size={13}/>}
                Criar Studio
              </button>
              <button onClick={() => setOpen(false)} style={{
                height: 40, padding: "0 16px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: `1px solid ${C.sep}`,
                color: C.muted, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
