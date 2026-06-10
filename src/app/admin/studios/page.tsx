// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Loader2, Pencil, Power, Building2, Users, CalendarDays } from "lucide-react";
import Link from "next/link";

const PLAN_PRICES: Record<string,string> = { free: "Grátis", starter: "R$19/mês", pro: "R$29/mês", studio: "R$59/mês" };
const DEFAULT_SVCS = [
  { name:"Manicure simples",   price:35,  duration_minutes:45  },
  { name:"Pedicure simples",   price:40,  duration_minutes:60  },
  { name:"Manicure em gel",    price:80,  duration_minutes:90  },
  { name:"Pedicure em gel",    price:90,  duration_minutes:90  },
  { name:"Alongamento em gel", price:150, duration_minutes:120 },
  { name:"Esmaltação em gel",  price:60,  duration_minutes:60  },
  { name:"Spa dos pés",        price:70,  duration_minutes:75  },
  { name:"Nail art",           price:15,  duration_minutes:30  },
];

function hexToRgb(hex: string) {
  try { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `${r},${g},${b}`; }
  catch { return "124,92,191"; }
}

function Inp({ label, value, onChange, placeholder, type="text", mono=false }: any) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:10, color:"var(--muted)", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase" }}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ height:44, padding:"0 14px", background:"var(--bg)", border:"1px solid var(--border2)", borderRadius:11, color:"var(--text)", fontSize:13, fontFamily:mono?"monospace":"inherit", fontWeight:500, outline:"none" }}/>
    </div>
  );
}

export default function AdminStudiosPage() {
  const [studios, setStudios] = useState<any[]>([]);
  const [counts, setCounts]   = useState<Record<string,{appts:number,clients:number}>>({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [saving, setSaving]   = useState(false);

  const [nome, setNome]   = useState("");
  const [slug, setSlug]   = useState("");
  const [phone, setPhone] = useState("");
  const [whats, setWhats] = useState("");
  const [insta, setInsta] = useState("");
  const [addr, setAddr]   = useState("");
  const [plan, setPlan]   = useState("pro");
  const [color, setColor] = useState("#7C5CBF");
  const [slugErr, setSlugErr] = useState("");

  const sb = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: s } = await sb.from("studios")
      .select("id, name, slug, plan, is_active, brand_color, avatar_url, created_at, whatsapp, instagram")
      .order("created_at", { ascending: false });
    setStudios(s || []);

    if (s?.length) {
      const ids = s.map((x:any) => x.id);
      const [{ data: a }, { data: c }] = await Promise.all([
        sb.from("appointments").select("studio_id").in("studio_id", ids),
        sb.from("clients").select("studio_id").in("studio_id", ids),
      ]);
      const m: Record<string,{appts:number,clients:number}> = {};
      ids.forEach((id:string) => {
        m[id] = {
          appts:   (a||[]).filter((x:any)=>x.studio_id===id).length,
          clients: (c||[]).filter((x:any)=>x.studio_id===id).length,
        };
      });
      setCounts(m);
    }
    setLoading(false);
  }

  function handleNome(v: string) {
    setNome(v);
    setSlug(v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));
    setSlugErr("");
  }

  async function criar() {
    if (!nome || !slug) return;
    setSaving(true); setSlugErr("");
    const { data: studio, error } = await sb.from("studios")
      .insert({ name:nome, slug, phone:phone||null, whatsapp:whats||null, instagram:insta||null, address:addr||null, plan, brand_color:color, is_active:true })
      .select("id").single();
    if (error) {
      if (error.message.includes("unique")) setSlugErr("Este slug já está em uso.");
      else alert(error.message);
      setSaving(false); return;
    }
    await sb.from("salon_settings").insert({ studio_id: studio.id });
    await sb.from("services").insert(DEFAULT_SVCS.map(s => ({ ...s, studio_id: studio.id, is_active: true })));
    setModal(false); setNome(""); setSlug(""); setPhone(""); setWhats(""); setInsta(""); setAddr(""); setColor("#7C5CBF");
    setSaving(false); await load();
  }

  async function toggle(id: string, cur: boolean) {
    await sb.from("studios").update({ is_active: !cur }).eq("id", id);
    setStudios(p => p.map(s => s.id===id ? {...s,is_active:!cur} : s));
  }

  const PLANS = [["free","Free","var(--muted)"],["starter","Starter","#818cf8"],["pro","Pro","var(--brand-light)"],["studio","Studio","var(--gold)"]];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, color:"var(--text)", margin:0, letterSpacing:"-.02em" }}>Studios</h1>
          <p style={{ color:"var(--muted)", fontSize:13, marginTop:3 }}>{studios.length} studios na plataforma</p>
        </div>
        <button onClick={()=>setModal(true)} style={{
          display:"flex", alignItems:"center", gap:8, height:44, padding:"0 20px",
          borderRadius:13, background:"linear-gradient(135deg,var(--brand-light),var(--brand))",
          color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor:"pointer", fontFamily:"inherit",
          boxShadow:"0 4px 20px var(--brand-glow)",
        }}><Plus size={15}/> Novo Studio</button>
      </div>

      {loading ? (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:200 }}>
          <Loader2 size={28} style={{ color:"var(--brand-light)", animation:"spin .8s linear infinite" }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : studios.length === 0 ? (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:22, padding:"60px 20px", textAlign:"center" }}>
          <div style={{ fontSize:40, opacity:.3, marginBottom:12 }}>🏠</div>
          <p style={{ color:"var(--muted)", fontSize:14 }}>Nenhum studio cadastrado</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {studios.map(s => {
            const rgb = hexToRgb(s.brand_color || "#7C5CBF");
            const c = counts[s.id] || { appts:0, clients:0 };
            return (
              <div key={s.id} style={{
                position:"relative", overflow:"hidden",
                background:"var(--surface)", border:"1px solid var(--border)",
                borderRadius:18, padding:"0",
                opacity: s.is_active ? 1 : 0.6, transition:"opacity .2s",
              }}>
                {/* Brand color top stripe */}
                <div style={{ height:3, background:`linear-gradient(90deg,${s.brand_color||"#7C5CBF"},transparent 70%)` }}/>
                <div style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px" }}>
                  {/* Avatar */}
                  <div style={{
                    width:50, height:50, borderRadius:15, flexShrink:0,
                    background:`linear-gradient(140deg,${s.brand_color||"#7C5CBF"},rgba(0,0,0,.4))`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:18, fontWeight:900, color:"#fff",
                    boxShadow:`0 4px 18px rgba(${rgb},.38)`,
                  }}>
                    {s.avatar_url
                      ? <img src={s.avatar_url} style={{ width:"100%", height:"100%", borderRadius:13, objectFit:"cover" }} alt=""/>
                      : s.name.slice(0,2).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                      <span style={{ fontSize:15, fontWeight:800, color:"var(--text)" }}>{s.name}</span>
                      <span style={{
                        fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:6, textTransform:"uppercase", letterSpacing:".05em",
                        background:`rgba(${rgb},.15)`, color:s.brand_color||"var(--brand-light)", border:`1px solid rgba(${rgb},.25)`,
                      }}>{s.plan}</span>
                      {!s.is_active && <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:6, background:"rgba(248,113,113,.1)", color:"#f87171", border:"1px solid rgba(248,113,113,.2)" }}>INATIVO</span>}
                    </div>
                    <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, color:`rgba(${rgb},.8)`, fontFamily:"monospace" }}>/agendar/{s.slug}</span>
                      {s.whatsapp && <span style={{ fontSize:11, color:"var(--muted)" }}>📱 {s.whatsapp}</span>}
                      {s.instagram && <span style={{ fontSize:11, color:"var(--muted)" }}>📷 {s.instagram}</span>}
                    </div>
                  </div>
                  {/* Stats */}
                  <div style={{ display:"flex", gap:18, flexShrink:0 }}>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:18, fontWeight:800, color:"var(--brand-light)" }}>{c.appts}</div>
                      <div style={{ fontSize:9, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".08em" }}>Agend.</div>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontSize:18, fontWeight:800, color:"var(--green)" }}>{c.clients}</div>
                      <div style={{ fontSize:9, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".08em" }}>Clientes</div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                    <Link href={`/admin/studios/${s.id}`} style={{
                      display:"flex", alignItems:"center", gap:6, height:36, padding:"0 14px",
                      borderRadius:10, border:"1px solid var(--border2)", background:"none",
                      color:"var(--muted)", fontSize:12, fontWeight:600, textDecoration:"none", transition:"all .15s",
                    }}
                      onMouseEnter={(e:any)=>{e.currentTarget.style.borderColor="var(--brand)";e.currentTarget.style.color="var(--brand-light)";}}
                      onMouseLeave={(e:any)=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--muted)";}}>
                      <Pencil size={13}/> Editar
                    </Link>
                    <button onClick={()=>toggle(s.id,s.is_active)} style={{
                      display:"flex", alignItems:"center", gap:6, height:36, padding:"0 14px",
                      borderRadius:10, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:600, transition:"all .15s",
                      border:`1px solid ${s.is_active?"rgba(34,212,123,.3)":"rgba(248,113,113,.25)"}`,
                      background:s.is_active?"rgba(34,212,123,.1)":"rgba(248,113,113,.08)",
                      color:s.is_active?"var(--green)":"#f87171",
                    }}>
                      <Power size={13}/> {s.is_active?"Ativo":"Inativo"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal criar studio */}
      {modal && (
        <div onClick={e=>e.target===e.currentTarget&&setModal(false)} style={{
          position:"fixed", inset:0, zIndex:1000, background:"rgba(0,0,0,.75)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:16,
        }}>
          <div style={{
            background:"var(--surface)", border:"1px solid var(--border2)",
            borderRadius:24, padding:28, width:"100%", maxWidth:520,
            display:"flex", flexDirection:"column", gap:16, maxHeight:"90vh", overflow:"auto",
            boxShadow:"0 24px 60px rgba(0,0,0,.6)",
          }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontSize:18, fontWeight:900, color:"var(--text)" }}>Novo Studio</div>
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>Cria com 8 serviços padrão</div>
              </div>
              <button onClick={()=>setModal(false)} style={{ background:"none", border:"none", color:"var(--muted)", fontSize:22, cursor:"pointer" }}>×</button>
            </div>

            {/* Brand color preview */}
            <div style={{
              position:"relative", overflow:"hidden", borderRadius:16, padding:16,
              background:`linear-gradient(135deg,rgba(${hexToRgb(color)},.25),var(--surface2))`,
              border:`1px solid rgba(${hexToRgb(color)},.3)`,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{
                  width:52, height:52, borderRadius:16,
                  background:`linear-gradient(140deg,${color},rgba(0,0,0,.4))`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:20, fontWeight:900, color:"#fff",
                  boxShadow:`0 6px 20px rgba(${hexToRgb(color)},.5)`,
                }}>{nome.slice(0,2).toUpperCase()||"??"}
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:"var(--text)" }}>{nome||"Nome do Studio"}</div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{slug||"slug"}.nailit.app</div>
                </div>
                <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10 }}>
                  <input type="color" value={color} onChange={e=>setColor(e.target.value)}
                    style={{ width:42, height:42, border:"none", background:"none", cursor:"pointer", borderRadius:10, padding:0 }}/>
                  <div>
                    <div style={{ fontSize:12, fontFamily:"monospace", fontWeight:700, color:"var(--text)" }}>{color.toUpperCase()}</div>
                    <div style={{ fontSize:10, color:"var(--muted)" }}>Cor da marca</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={{ gridColumn:"1/-1" }}><Inp label="Nome do studio *" value={nome} onChange={handleNome} placeholder="Ex: Tessy Nails"/></div>
              <Inp label="Slug (URL) *" value={slug} onChange={v=>{setSlug(v.toLowerCase().replace(/[^a-z0-9-]/g,""));setSlugErr("");}} placeholder="tessy-nails" mono/>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                <label style={{ fontSize:10, color:"var(--muted)", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase" }}>Plano</label>
                <select value={plan} onChange={e=>setPlan(e.target.value)} style={{ height:44, padding:"0 14px", background:"var(--bg)", border:"1px solid var(--border2)", borderRadius:11, color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none" }}>
                  {PLANS.map(([v,l,c])=><option key={v as string} value={v as string} style={{ background:"var(--surface2)" }}>{l as string} — {PLAN_PRICES[v as string]}</option>)}
                </select>
              </div>
              <Inp label="WhatsApp" value={whats} onChange={setWhats} placeholder="(66) 99999-0000"/>
              <Inp label="Instagram" value={insta} onChange={setInsta} placeholder="@seustudio"/>
              <div style={{ gridColumn:"1/-1" }}><Inp label="Telefone" value={phone} onChange={setPhone} placeholder="(66) 99999-0000"/></div>
              <div style={{ gridColumn:"1/-1" }}><Inp label="Endereço" value={addr} onChange={setAddr} placeholder="Rua, número, cidade"/></div>
            </div>
            {slugErr && <div style={{ fontSize:12, color:"#f87171", background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.2)", borderRadius:9, padding:"8px 13px" }}>⚠ {slugErr}</div>}
            <div style={{ padding:10, background:"var(--surface2)", borderRadius:12, fontSize:12, color:"var(--muted)" }}>
              💡 Após criar, vá em <b style={{ color:"var(--text)" }}>Editar Studio</b> para vincular o profissional.
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={criar} disabled={saving||!nome||!slug} style={{
                flex:1, height:46, borderRadius:13, fontFamily:"inherit", fontWeight:700, fontSize:14, border:"none", cursor:"pointer",
                background:"linear-gradient(135deg,var(--brand-light),var(--brand))", color:"#fff",
                boxShadow:"0 4px 20px var(--brand-glow)", opacity:(saving||!nome||!slug)?0.5:1,
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              }}>
                {saving ? <><Loader2 size={14} style={{ animation:"spin .8s linear infinite" }}/> Criando...</> : "Criar Studio"}
              </button>
              <button onClick={()=>setModal(false)} style={{ height:46, padding:"0 20px", borderRadius:13, border:"1px solid var(--border2)", background:"none", color:"var(--muted)", cursor:"pointer", fontFamily:"inherit", fontWeight:600, fontSize:13 }}>Cancelar</button>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        </div>
      )}
    </div>
  );
}
