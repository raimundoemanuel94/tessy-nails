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
  pro:     { bg: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "rgba(167,139,250,0.30)" },
  starter: { bg: "rgba(96,165,250,0.15)",  color: "#60a5fa", border: "rgba(96,165,250,0.30)"  },
  free:    { bg: "rgba(107,107,154,0.12)", color: "#7a7a9a", border: "rgba(107,107,154,0.25)" },
  studio:  { bg: "rgba(244,114,182,0.15)", color: "#f472b6", border: "rgba(244,114,182,0.30)" },
};

function relTime(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff/60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h atrás`;
  if (diff < 2592000) return `${Math.floor(diff/86400)}d atrás`;
  return new Date(d).toLocaleDateString("pt-BR", { day:"numeric", month:"short" });
}

const C = {
  card:   "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.10)",
  sep:    "rgba(255,255,255,0.06)",
  text:   "#ede9fe",
  muted:  "#6b6585",
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
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1040, position: "relative", zIndex: 1 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.10em",
            textTransform: "uppercase", marginBottom: 6 }}>Admin Console</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: C.text, margin: 0, letterSpacing: "-0.03em" }}>Studios</h1>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            {[
              { label: "Total",    value: studios.length, color: C.text,    bg: "rgba(255,255,255,0.06)" },
              { label: "Ativos",   value: active,         color: "#34d399", bg: "rgba(52,211,153,0.10)"  },
              ...(inactive > 0 ? [{ label: "Inativos", value: inactive, color: "#f87171", bg: "rgba(248,113,113,0.10)" }] : []),
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 11px", borderRadius: 20,
                background: bg, border: `1px solid ${color}22`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 900, color }}>{value}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => setOpen(true)} style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "11px 20px", borderRadius: 10,
          background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.35)",
          fontSize: 13, fontWeight: 800, color: "#f59e0b", cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 2px 12px rgba(245,158,11,0.12)",
        }}>
          <Plus size={14}/> Novo Studio
        </button>
      </div>

      {/* Search */}
      {studios.length > 0 && (
        <div style={{ position: "relative" }}>
          <Search size={14} color={C.muted} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou slug…"
            style={{
              width: "100%", height: 42, paddingLeft: 40, paddingRight: 14,
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit",
            }}
            onFocus={(e: any) => { e.target.style.borderColor = "rgba(245,158,11,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.10)"; }}
            onBlur={(e: any) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = "none"; }}
          />
        </div>
      )}

      {/* Table */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 16, overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 size={28} color="#f59e0b" className="spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center" }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, margin: "0 auto 18px",
              background: "rgba(245,158,11,0.07)", border: "1px dashed rgba(245,158,11,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Building2 size={26} color="#f59e0b" style={{ opacity: .5 }}/>
            </div>
            <p style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 7 }}>
              {search ? "Nenhum resultado" : "Nenhum studio ainda"}
            </p>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 22 }}>
              {search ? `Sem resultados para "${search}"` : "Crie o primeiro studio da plataforma"}
            </p>
            {!search && (
              <button onClick={() => setOpen(true)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 20px", borderRadius: 9,
                background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.30)",
                fontSize: 13, fontWeight: 800, color: "#f59e0b", cursor: "pointer", fontFamily: "inherit",
              }}>+ Criar studio</button>
            )}
          </div>
        ) : (
          <>
            {/* Col headers */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 140px 90px 90px 80px",
              padding: "8px 22px", borderBottom: `1px solid ${C.sep}`,
              background: "rgba(255,255,255,0.02)",
            }}>
              {["Studio", "Profissional", "Plano", "Status", ""].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 800, color: C.muted,
                  letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</span>
              ))}
            </div>

            {filtered.map((s, i) => {
              const pc = PC[s.plan] ?? PC.free;
              return (
                <div key={s.id}
                  className="a-row"
                  style={{
                    display: "grid", gridTemplateColumns: "1fr 140px 90px 90px 80px",
                    alignItems: "center", padding: "15px 22px",
                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.sep}` : "none",
                    opacity: s.is_active ? 1 : 0.55,
                  }}
                >
                  {/* Studio info */}
                  <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: "linear-gradient(135deg,#f59e0b,#fcd34d)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 900, color: "#000",
                      boxShadow: "0 2px 10px rgba(245,158,11,0.28)",
                    }}>{s.name.charAt(0).toUpperCase()}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <code style={{ fontSize: 10, color: C.muted }}>/{s.slug}</code>
                        <span style={{ fontSize: 9, color: "#4a4a6a" }}>·</span>
                        <span style={{ fontSize: 10, color: "#4a4a6a" }}>{relTime(s.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner */}
                  <div style={{ minWidth: 0 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: s.profiles?.name ? "#34d399" : "#f59e0b",
                    }}>
                      {s.profiles?.name ?? "Sem vínculo"}
                    </span>
                  </div>

                  {/* Plan */}
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 6,
                      background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`,
                      textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>{s.plan}</span>
                  </div>

                  {/* Status */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className={s.is_active ? "dot-active" : ""} style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: s.is_active ? "#34d399" : "#4a4a6a",
                      flexShrink: 0,
                    }}/>
                    <span style={{ fontSize: 12, fontWeight: 600,
                      color: s.is_active ? "#34d399" : C.muted }}>
                      {s.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" }}>
                    <Link href={`/admin/studios/${s.id}`} style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 30, height: 30, borderRadius: 8,
                      background: "rgba(255,255,255,0.06)", border: `1px solid ${C.sep}`,
                      color: C.muted, textDecoration: "none", transition: "all .12s",
                    }}
                      onMouseEnter={(e: any) => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                      onMouseLeave={(e: any) => { e.currentTarget.style.color = C.muted; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    ><Pencil size={12}/></Link>
                    <button onClick={() => toggleActive(s.id, s.is_active)} style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 30, height: 30, borderRadius: 8,
                      background: "rgba(255,255,255,0.06)", border: `1px solid ${C.sep}`,
                      color: s.is_active ? "#34d399" : C.muted,
                      cursor: "pointer", fontFamily: "inherit", transition: "all .12s",
                    }}
                      onMouseEnter={(e: any) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
                      onMouseLeave={(e: any) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    ><Power size={12}/></button>
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
          background: "rgba(0,0,0,0.80)", backdropFilter: "blur(12px)",
        }}>
          <div style={{
            width: "100%", maxWidth: 460,
            background: "#0a0a1a", border: `1px solid ${C.border}`,
            borderRadius: 20, padding: "28px 28px 24px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>
                  Novo Studio
                </h2>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                  Inclui 8 serviços padrão automaticamente
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: "rgba(255,255,255,0.06)", border: `1px solid ${C.sep}`,
                borderRadius: 9, padding: "7px", cursor: "pointer", color: C.muted,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><X size={15}/></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, display: "block",
                  marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.09em" }}>Nome *</label>
                <input className="input-base" value={nome}
                  onChange={e => handleNome(e.target.value)} placeholder="Ex: Tessy Nails"/>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, display: "block",
                  marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.09em" }}>Slug (URL) *</label>
                <input className="input-base" value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))}
                  placeholder="tessy-nails"/>
                {slug && (
                  <p style={{ fontSize: 10, color: "#a78bfa", marginTop: 6, fontFamily: "monospace" }}>
                    nailit.com.br/agendar/{slug}
                  </p>
                )}
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, display: "block",
                  marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.09em" }}>Telefone</label>
                <input className="input-base" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999"/>
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, color: C.muted, display: "block",
                  marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.09em" }}>Plano</label>
                <select className="input-base" value={plan} onChange={e => setPlan(e.target.value)}>
                  <option value="free">Free — Gratuito</option>
                  <option value="starter">Starter — R$19/mês</option>
                  <option value="pro">Pro — R$29/mês</option>
                  <option value="studio">Studio — R$59/mês</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={criar} disabled={saving} style={{
                flex: 1, height: 44, borderRadius: 10,
                background: "rgba(245,158,11,0.16)", border: "1px solid rgba(245,158,11,0.38)",
                color: "#f59e0b", fontSize: 13, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                fontFamily: "inherit", opacity: saving ? .6 : 1,
                boxShadow: "0 2px 16px rgba(245,158,11,0.12)",
              }}>
                {saving ? <Loader2 size={14} className="spin"/> : <Plus size={14}/>}
                Criar Studio
              </button>
              <button onClick={() => setOpen(false)} style={{
                height: 44, padding: "0 18px", borderRadius: 10,
                background: "rgba(255,255,255,0.05)", border: `1px solid ${C.sep}`,
                color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
