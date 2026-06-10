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
  pro:     { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "rgba(167,139,250,0.25)" },
  starter: { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa", border: "rgba(96,165,250,0.25)"  },
  free:    { bg: "rgba(107,107,154,0.12)", color: "#6b6b9a", border: "rgba(107,107,154,0.25)" },
  studio:  { bg: "rgba(244,114,182,0.12)", color: "#f472b6", border: "rgba(244,114,182,0.25)" },
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

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:1000 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:900, color:"#f0f0ff", margin:0 }}>Studios</h1>
          <p style={{ fontSize:12, color:"#6b6585", marginTop:4 }}>
            {studios.length} studio{studios.length!==1?"s":""} na plataforma
          </p>
        </div>
        <button onClick={()=>setOpen(true)} style={{
          display:"inline-flex", alignItems:"center", gap:7,
          padding:"10px 18px", borderRadius:10,
          background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.3)",
          fontSize:12, fontWeight:800, color:"#f59e0b", cursor:"pointer", fontFamily:"inherit",
        }}>
          <Plus size={14}/> Novo Studio
        </button>
      </div>

      {/* Search */}
      {studios.length > 0 && (
        <div style={{ position:"relative" }}>
          <Search size={14} color="#6b6585" style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)" }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar por nome ou slug…"
            style={{
              width:"100%", height:40, paddingLeft:36, paddingRight:14,
              background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:10, color:"#f0f0ff", fontSize:13, outline:"none", fontFamily:"inherit",
            }}
          />
        </div>
      )}

      {/* Table */}
      <div style={{
        background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)",
        borderRadius:16, overflow:"hidden",
      }}>
        {loading ? (
          <div style={{ display:"flex", justifyContent:"center", padding:"52px 0" }}>
            <Loader2 size={26} color="#f59e0b" style={{ animation:"spin 1s linear infinite" }}/>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:"56px 24px", textAlign:"center" }}>
            <div style={{
              width:52, height:52, borderRadius:14, margin:"0 auto 16px",
              background:"rgba(245,158,11,0.07)", border:"1px dashed rgba(245,158,11,0.2)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Building2 size={22} color="#f59e0b" style={{ opacity:.5 }}/>
            </div>
            <p style={{ fontSize:14, fontWeight:800, color:"#f0f0ff", marginBottom:6 }}>
              {search ? "Nenhum resultado" : "Nenhum studio ainda"}
            </p>
            <p style={{ fontSize:12, color:"#6b6585", marginBottom:18 }}>
              {search ? `Sem resultados para "${search}"` : "Crie o primeiro studio da plataforma"}
            </p>
            {!search && (
              <button onClick={()=>setOpen(true)} style={{
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"9px 18px", borderRadius:9,
                background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.3)",
                fontSize:12, fontWeight:800, color:"#f59e0b", cursor:"pointer", fontFamily:"inherit",
              }}>
                + Criar studio
              </button>
            )}
          </div>
        ) : (
          <>
            {/* col headers */}
            <div style={{
              display:"grid", gridTemplateColumns:"1fr 130px 80px 80px 72px",
              padding:"7px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)",
            }}>
              {["Studio","Profissional","Plano","Status",""].map(h => (
                <span key={h} style={{ fontSize:10, fontWeight:700, color:"#6b6585", letterSpacing:"0.07em", textTransform:"uppercase" }}>{h}</span>
              ))}
            </div>

            {filtered.map((s, i) => {
              const pc = PC[s.plan] ?? PC.free;
              return (
                <div key={s.id} style={{
                  display:"grid", gridTemplateColumns:"1fr 130px 80px 80px 72px",
                  alignItems:"center", padding:"13px 20px",
                  borderBottom: i<filtered.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  opacity: s.is_active ? 1 : .5, transition:"background .1s",
                }}
                  onMouseEnter={(e:any)=>e.currentTarget.style.background="rgba(255,255,255,0.025)"}
                  onMouseLeave={(e:any)=>e.currentTarget.style.background="transparent"}
                >
                  {/* name */}
                  <div style={{ display:"flex", alignItems:"center", gap:11, minWidth:0 }}>
                    <div style={{
                      width:32, height:32, borderRadius:8, flexShrink:0,
                      background:"linear-gradient(135deg,#f59e0b,#fcd34d)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:13, fontWeight:900, color:"#000",
                    }}>{s.name.charAt(0)}</div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#f0f0ff",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.name}</div>
                      <div style={{ fontSize:10, color:"#6b6585", fontFamily:"monospace" }}>/{s.slug}</div>
                    </div>
                  </div>

                  {/* owner */}
                  <div style={{ minWidth:0 }}>
                    <span style={{ fontSize:11, fontWeight:600,
                      color: s.profiles?.name ? "#34d399" : "#f59e0b",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }}>
                      {s.profiles?.name ?? "Sem vínculo"}
                    </span>
                  </div>

                  {/* plan */}
                  <div>
                    <span style={{
                      fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:6,
                      background:pc.bg, color:pc.color, border:`1px solid ${pc.border}`,
                      textTransform:"uppercase",
                    }}>{s.plan}</span>
                  </div>

                  {/* status */}
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{
                      width:5, height:5, borderRadius:"50%",
                      background: s.is_active ? "#34d399" : "#6b6585",
                      boxShadow: s.is_active ? "0 0 5px #34d39960" : "none",
                    }}/>
                    <span style={{ fontSize:11, fontWeight:600, color: s.is_active ? "#34d399" : "#6b6585" }}>
                      {s.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  {/* actions */}
                  <div style={{ display:"flex", alignItems:"center", gap:4, justifyContent:"flex-end" }}>
                    <Link href={`/admin/studios/${s.id}`} style={{
                      display:"flex", alignItems:"center", justifyContent:"center",
                      width:28, height:28, borderRadius:7,
                      background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
                      color:"#6b6585", textDecoration:"none", transition:"all .12s",
                    }}
                      onMouseEnter={(e:any)=>{e.currentTarget.style.color="#f0f0ff";e.currentTarget.style.background="rgba(255,255,255,0.1)";}}
                      onMouseLeave={(e:any)=>{e.currentTarget.style.color="#6b6585";e.currentTarget.style.background="rgba(255,255,255,0.05)";}}
                    ><Pencil size={12}/></Link>
                    <button onClick={()=>toggleActive(s.id,s.is_active)} style={{
                      display:"flex", alignItems:"center", justifyContent:"center",
                      width:28, height:28, borderRadius:7,
                      background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
                      color: s.is_active ? "#34d399" : "#6b6585",
                      cursor:"pointer", fontFamily:"inherit", transition:"all .12s",
                    }}><Power size={12}/></button>
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
          position:"fixed", inset:0, zIndex:50,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20,
          background:"rgba(0,0,0,0.75)", backdropFilter:"blur(8px)",
        }}>
          <div style={{
            width:"100%", maxWidth:440,
            background:"#0f0e1a", border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:18, padding:24,
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <h2 style={{ fontSize:16, fontWeight:900, color:"#f0f0ff", margin:0 }}>Novo Studio</h2>
                <p style={{ fontSize:11, color:"#6b6585", marginTop:3 }}>Inclui 8 serviços padrão automaticamente</p>
              </div>
              <button onClick={()=>setOpen(false)} style={{
                background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:8, padding:6, cursor:"pointer", color:"#6b6585",
              }}><X size={14}/></button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { label:"Nome *", value:nome, onChange:handleNome, placeholder:"Ex: Tessy Nails" },
              ].map(f=>(
                <div key={f.label}>
                  <label style={{ fontSize:10, fontWeight:700, color:"#6b6585", display:"block", marginBottom:6,
                    textTransform:"uppercase", letterSpacing:"0.08em" }}>{f.label}</label>
                  <input className="input-base" value={f.value}
                    onChange={e=>f.onChange(e.target.value)} placeholder={f.placeholder}/>
                </div>
              ))}

              <div>
                <label style={{ fontSize:10, fontWeight:700, color:"#6b6585", display:"block", marginBottom:6,
                  textTransform:"uppercase", letterSpacing:"0.08em" }}>Slug (URL) *</label>
                <input className="input-base" value={slug}
                  onChange={e=>setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))}
                  placeholder="tessy-nails"/>
                {slug && <p style={{ fontSize:10, color:"#a78bfa", marginTop:5 }}>nailit.com.br/agendar/{slug}</p>}
              </div>

              <div>
                <label style={{ fontSize:10, fontWeight:700, color:"#6b6585", display:"block", marginBottom:6,
                  textTransform:"uppercase", letterSpacing:"0.08em" }}>Telefone</label>
                <input className="input-base" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(11) 99999-9999"/>
              </div>

              <div>
                <label style={{ fontSize:10, fontWeight:700, color:"#6b6585", display:"block", marginBottom:6,
                  textTransform:"uppercase", letterSpacing:"0.08em" }}>Plano</label>
                <select className="input-base" value={plan} onChange={e=>setPlan(e.target.value)}>
                  <option value="free">Free — Gratuito</option>
                  <option value="starter">Starter — R$19/mês</option>
                  <option value="pro">Pro — R$29/mês</option>
                  <option value="studio">Studio — R$59/mês</option>
                </select>
              </div>
            </div>

            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button onClick={criar} disabled={saving} style={{
                flex:1, height:42, borderRadius:10,
                background:"rgba(245,158,11,0.15)", border:"1px solid rgba(245,158,11,0.35)",
                color:"#f59e0b", fontSize:13, fontWeight:800, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                fontFamily:"inherit", opacity:saving?.6:1,
              }}>
                {saving ? <Loader2 size={14} style={{ animation:"spin 1s linear infinite" }}/> : <Plus size={14}/>}
                Criar Studio
              </button>
              <button onClick={()=>setOpen(false)} style={{
                height:42, padding:"0 16px", borderRadius:10,
                background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
                color:"#6b6585", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
