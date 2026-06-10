// @ts-nocheck
"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2, Pencil, Trash2, Plus, Check, X, Clock, DollarSign, RefreshCw, Power, Link as LinkIcon, Phone, Instagram } from "lucide-react";
import { formatCurrency, formatDuration } from "@/lib/utils";

const DAYS = [["monday","Seg"],["tuesday","Ter"],["wednesday","Qua"],["thursday","Qui"],["friday","Sex"],["saturday","Sáb"],["sunday","Dom"]];
const PLANS = ["free","starter","pro","studio"];
function hexToRgb(hex: string) { try { const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16); return `${r},${g},${b}`; } catch { return "124,92,191"; } }

function Field({ label, value, onChange, placeholder, type="text", mono=false }: any) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:12 }}>
      <label style={{ fontSize:10, color:"var(--muted)", fontWeight:700, letterSpacing:".12em", textTransform:"uppercase" }}>{label}</label>
      <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ height:44, padding:"0 14px", background:"var(--bg)", border:"1px solid var(--border2)", borderRadius:11, color:"var(--text)", fontSize:13, fontFamily:mono?"monospace":"inherit", outline:"none" }}/>
    </div>
  );
}

function Section({ title, icon, action, children }: any) {
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:20, overflow:"hidden" }}>
      <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(124,92,191,.04)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          {icon && <span style={{ color:"var(--brand-light)" }}>{icon}</span>}
          <span style={{ fontSize:13, fontWeight:800, color:"var(--text)", letterSpacing:".02em" }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding:20 }}>{children}</div>
    </div>
  );
}

export default function AdminStudioDetailPage() {
  const { studioId } = useParams() as { studioId: string };
  const router = useRouter();
  const sb = createClient();

  const [studio, setStudio]     = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [owner, setOwner]       = useState<any>(null);
  const [stats, setStats]       = useState({ appts:0, clients:0, revenue:0 });
  const [loading, setLoading]   = useState(true);

  // Edit studio state
  const [editing, setEditing]     = useState(false);
  const [eName, setEName]         = useState("");
  const [eSlug, setESlug]         = useState("");
  const [ePlan, setEPlan]         = useState("");
  const [eActive, setEActive]     = useState(true);
  const [eColor, setEColor]       = useState("#7C5CBF");
  const [eWhats, setEWhats]       = useState("");
  const [eInsta, setEInsta]       = useState("");
  const [ePhone, setEPhone]       = useState("");
  const [eAddr, setEAddr]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [savedOk, setSavedOk]     = useState(false);

  // Service state
  const [editSvcId, setEditSvcId]   = useState<string|null>(null);
  const [svcName, setSvcName]       = useState("");
  const [svcPrice, setSvcPrice]     = useState("");
  const [svcDur, setSvcDur]         = useState("");
  const [addingSvc, setAddingSvc]   = useState(false);
  const [newSvcName, setNewSvcName] = useState("");
  const [newSvcPrice, setNewSvcPrice] = useState("");
  const [newSvcDur, setNewSvcDur]   = useState("");
  const [savingSvc, setSavingSvc]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: s }, { data: svcs }, { data: cfg }, { data: apts }, { data: cls }] = await Promise.all([
      sb.from("studios").select("*").eq("id", studioId).single(),
      sb.from("services").select("*").eq("studio_id", studioId).order("name"),
      sb.from("salon_settings").select("*").eq("studio_id", studioId).single(),
      sb.from("appointments").select("price, status").eq("studio_id", studioId),
      sb.from("clients").select("id").eq("studio_id", studioId),
    ]);
    setStudio(s); setServices(svcs||[]); setSettings(cfg);
    if (s?.owner_id) {
      const { data: ow } = await sb.from("profiles").select("id, name, email, phone").eq("id", s.owner_id).single();
      setOwner(ow);
    }
    const revenue = (apts||[]).filter((a:any)=>a.status==="completed").reduce((sum:number,a:any)=>sum+(a.price||0),0);
    setStats({ appts:(apts||[]).length, clients:(cls||[]).length, revenue });
    setLoading(false);
  }, [studioId]);

  useEffect(() => { load(); }, [load]);

  function openEdit() {
    if (!studio) return;
    setEName(studio.name); setESlug(studio.slug); setEPlan(studio.plan);
    setEActive(studio.is_active); setEColor(studio.brand_color||"#7C5CBF");
    setEWhats(studio.whatsapp||""); setEInsta(studio.instagram||"");
    setEPhone(studio.phone||""); setEAddr(studio.address||"");
    setEditing(true);
  }

  async function saveStudio() {
    setSaving(true);
    // Recalcula MRR e status com base no plano selecionado
    const { data: pp } = await sb.from("plan_prices").select("price").eq("plan", ePlan).single();
    const newMrr = pp?.price ?? 0;
    const newStatus = !eActive ? "canceled" : (ePlan === "free" ? "trial" : "active");
    await sb.from("studios").update({
      name:eName, slug:eSlug, plan:ePlan, is_active:eActive,
      brand_color:eColor, whatsapp:eWhats||null, instagram:eInsta||null,
      phone:ePhone||null, address:eAddr||null,
      mrr: newMrr, subscription_status: newStatus,
    }).eq("id", studioId);
    await load();
    setSaving(false); setEditing(false); setSavedOk(true);
    setTimeout(()=>setSavedOk(false), 2000);
  }

  async function toggleSvc(svc: any) {
    await sb.from("services").update({ is_active: !svc.is_active }).eq("id", svc.id);
    setServices(p=>p.map(s=>s.id===svc.id?{...s,is_active:!s.is_active}:s));
  }

  function openEditSvc(svc: any) {
    setEditSvcId(svc.id); setSvcName(svc.name); setSvcPrice(String(svc.price)); setSvcDur(String(svc.duration_minutes));
  }

  async function saveSvc(id: string) {
    setSavingSvc(true);
    await sb.from("services").update({ name:svcName, price:Number(svcPrice), duration_minutes:Number(svcDur) }).eq("id",id);
    setServices(p=>p.map(s=>s.id===id?{...s,name:svcName,price:Number(svcPrice),duration_minutes:Number(svcDur)}:s));
    setEditSvcId(null); setSavingSvc(false);
  }

  async function delSvc(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    await sb.from("services").delete().eq("id",id);
    setServices(p=>p.filter(s=>s.id!==id));
  }

  async function addSvc() {
    if (!newSvcName||!newSvcPrice||!newSvcDur) return;
    setSavingSvc(true);
    const { data } = await sb.from("services").insert({ studio_id:studioId, name:newSvcName, price:Number(newSvcPrice), duration_minutes:Number(newSvcDur), is_active:true }).select().single();
    if (data) setServices(p=>[...p,data].sort((a:any,b:any)=>a.name.localeCompare(b.name)));
    setAddingSvc(false); setNewSvcName(""); setNewSvcPrice(""); setNewSvcDur("");
    setSavingSvc(false);
  }

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh", flexDirection:"column", gap:12 }}>
      <div style={{ width:34,height:34,borderRadius:"50%",border:"3px solid var(--brand)",borderTopColor:"transparent",animation:"spin .8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!studio) return <div style={{ color:"var(--muted)", padding:20 }}>Studio não encontrado.</div>;

  const rgb = hexToRgb(studio.brand_color||"#7C5CBF");
  const wh = settings?.working_hours || {};

  return (
    <div style={{ maxWidth:860, margin:"0 auto", display:"flex", flexDirection:"column", gap:20 }}>

      {/* Back + header */}
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        <button onClick={()=>router.back()} style={{ width:38,height:38,borderRadius:11,background:"none",border:"1px solid var(--border)",color:"var(--muted)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s" }}
          onMouseEnter={(e:any)=>{e.currentTarget.style.borderColor="var(--brand)";e.currentTarget.style.color="var(--brand-light)";}}
          onMouseLeave={(e:any)=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)";}}>
          <ArrowLeft size={17}/>
        </button>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <h1 style={{ fontSize:20, fontWeight:900, color:"var(--text)", margin:0 }}>{studio.name}</h1>
            {!studio.is_active && <span style={{ fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:6,background:"rgba(248,113,113,.1)",color:"#f87171",border:"1px solid rgba(248,113,113,.2)" }}>INATIVO</span>}
            {savedOk && <span style={{ fontSize:11,color:"var(--green)" }}>✓ Salvo!</span>}
          </div>
          <div style={{ fontSize:11,color:"var(--muted)",fontFamily:"monospace",marginTop:2 }}>{studio.slug}.nailit.app</div>
        </div>
        <button onClick={()=>load()} style={{ width:36,height:36,borderRadius:10,background:"none",border:"1px solid var(--border)",color:"var(--muted)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <RefreshCw size={14}/>
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {[["Agendamentos",stats.appts,"var(--brand-light)"],["Clientes",stats.clients,"var(--green)"],["Receita",formatCurrency(stats.revenue),"var(--gold)"]].map(([l,v,c])=>(
          <div key={l as string} style={{ background:"var(--surface)", border:`1px solid var(--border)`, borderRadius:16, padding:"16px 18px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute",top:0,left:10,right:10,height:2,background:`linear-gradient(90deg,transparent,${c as string},transparent)`,opacity:.7 }}/>
            <div style={{ fontSize:9,fontWeight:700,letterSpacing:".12em",textTransform:"uppercase",color:"var(--muted)",marginBottom:8 }}>{l as string}</div>
            <div style={{ fontSize:24,fontWeight:900,color:c as string,letterSpacing:"-.02em" }}>{v as any}</div>
          </div>
        ))}
      </div>

      {/* Studio info/edit */}
      <Section title="Informações do Studio" icon={<LinkIcon size={14}/>}
        action={!editing
          ? <div style={{ display:"flex", gap:8 }}>
              <button onClick={openEdit} style={{ display:"flex",alignItems:"center",gap:6,height:34,padding:"0 14px",borderRadius:10,border:"1px solid var(--border2)",background:"none",color:"var(--muted)",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",transition:"all .15s" }}
                onMouseEnter={(e:any)=>{e.currentTarget.style.borderColor="var(--brand)";e.currentTarget.style.color="var(--brand-light)";}}
                onMouseLeave={(e:any)=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--muted)";}}>
                <Pencil size={13}/> Editar
              </button>
              <button onClick={()=>sb.from("studios").update({is_active:!studio.is_active}).eq("id",studioId).then(()=>load())} style={{ display:"flex",alignItems:"center",gap:6,height:34,padding:"0 14px",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit", border:`1px solid ${studio.is_active?"rgba(34,212,123,.3)":"rgba(248,113,113,.25)"}`, background:studio.is_active?"rgba(34,212,123,.08)":"rgba(248,113,113,.06)", color:studio.is_active?"var(--green)":"#f87171" }}>
                <Power size={13}/> {studio.is_active?"Ativo":"Inativo"}
              </button>
            </div>
          : null}
      >
        {editing ? (
          <div>
            {/* Brand color */}
            <div style={{ position:"relative",overflow:"hidden",borderRadius:16,padding:16,marginBottom:16, background:`linear-gradient(135deg,rgba(${hexToRgb(eColor)},.22),var(--surface2))`, border:`1px solid rgba(${hexToRgb(eColor)},.3)` }}>
              <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                <div style={{ width:52,height:52,borderRadius:16, background:`linear-gradient(140deg,${eColor},rgba(0,0,0,.4))`, display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff" }}>{eName.slice(0,2).toUpperCase()||"??"}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:16,fontWeight:800,color:"var(--text)" }}>{eName||"—"}</div>
                  <div style={{ fontSize:11,color:"var(--muted)",marginTop:2 }}>{eSlug}.nailit.app</div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <input type="color" value={eColor} onChange={e=>setEColor(e.target.value)} style={{ width:42,height:42,border:"none",background:"none",cursor:"pointer",borderRadius:10,padding:0 }}/>
                  <div><div style={{ fontSize:12,fontFamily:"monospace",fontWeight:700,color:"var(--text)" }}>{eColor.toUpperCase()}</div><div style={{ fontSize:10,color:"var(--muted)" }}>Cor da marca</div></div>
                </div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0 }}>
              <div style={{ gridColumn:"1/-1" }}><Field label="Nome" value={eName} onChange={setEName}/></div>
              <Field label="Slug (URL)" value={eSlug} onChange={setESlug} mono/>
              <div style={{ display:"flex",flexDirection:"column",gap:5,marginBottom:12 }}>
                <label style={{ fontSize:10,color:"var(--muted)",fontWeight:700,letterSpacing:".12em",textTransform:"uppercase" }}>Plano</label>
                <select value={ePlan} onChange={e=>setEPlan(e.target.value)} style={{ height:44,padding:"0 14px",background:"var(--bg)",border:"1px solid var(--border2)",borderRadius:11,color:"var(--text)",fontSize:13,fontFamily:"inherit",outline:"none" }}>
                  {PLANS.map(p=><option key={p} value={p} style={{ background:"var(--surface2)" }}>{p}</option>)}
                </select>
              </div>
              <Field label="WhatsApp" value={eWhats} onChange={setEWhats} placeholder="(66) 99999-0000"/>
              <Field label="Instagram" value={eInsta} onChange={setEInsta} placeholder="@seustudio"/>
              <Field label="Telefone" value={ePhone} onChange={setEPhone}/>
              <div style={{ gridColumn:"1/-1" }}><Field label="Endereço" value={eAddr} onChange={setEAddr}/></div>
              <div style={{ gridColumn:"1/-1", display:"flex",alignItems:"center",gap:14,padding:14,background:"var(--surface2)",borderRadius:12,marginBottom:12 }}>
                <button onClick={()=>setEActive(v=>!v)} style={{ padding:"6px 16px",borderRadius:9,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700, border:`1px solid ${eActive?"rgba(34,212,123,.3)":"rgba(248,113,113,.25)"}`, background:eActive?"rgba(34,212,123,.1)":"rgba(248,113,113,.08)", color:eActive?"var(--green)":"#f87171" }}>
                  {eActive?"● Ativo":"○ Inativo"}
                </button>
                <span style={{ fontSize:12,color:"var(--muted)" }}>Clique para alternar o status do studio</span>
              </div>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={saveStudio} disabled={saving} style={{ display:"flex",alignItems:"center",gap:7,height:42,padding:"0 20px",borderRadius:12,background:"linear-gradient(135deg,var(--brand-light),var(--brand))",color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:13,boxShadow:"0 4px 18px var(--brand-glow)",opacity:saving?0.6:1 }}>
                {saving?<><Loader2 size={13} style={{ animation:"spin .8s linear infinite" }}/> Salvando...</>:<><Check size={13}/> Salvar alterações</>}
              </button>
              <button onClick={()=>setEditing(false)} style={{ height:42,padding:"0 18px",borderRadius:12,border:"1px solid var(--border2)",background:"none",color:"var(--muted)",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:13 }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <div>
            {/* Brand preview */}
            <div style={{ position:"relative",overflow:"hidden",borderRadius:16,padding:16,marginBottom:18, background:`linear-gradient(135deg,rgba(${rgb},.14),var(--surface2))`, border:`1px solid rgba(${rgb},.25)` }}>
              <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                <div style={{ width:52,height:52,borderRadius:16, background:`linear-gradient(140deg,${studio.brand_color||"#7C5CBF"},rgba(0,0,0,.4))`, display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff",boxShadow:`0 6px 20px rgba(${rgb},.4)` }}>
                  {studio.avatar_url?<img src={studio.avatar_url} style={{ width:"100%",height:"100%",borderRadius:14,objectFit:"cover" }} alt=""/>:studio.name.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:16,fontWeight:800,color:"var(--text)" }}>{studio.name}</div>
                  <div style={{ fontSize:11,color:`rgba(${rgb},.8)`,fontFamily:"monospace",marginTop:2 }}>{studio.slug}.nailit.app</div>
                </div>
                <div style={{ marginLeft:"auto",display:"flex",flexDirection:"column",gap:3 }}>
                  <span style={{ fontSize:10,fontWeight:700,padding:"2px 10px",borderRadius:6,background:`rgba(${rgb},.15)`,color:studio.brand_color||"var(--brand-light)",border:`1px solid rgba(${rgb},.25)`,textTransform:"uppercase",letterSpacing:".05em" }}>{studio.plan}</span>
                </div>
              </div>
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10 }}>
              {[
                ["WhatsApp",studio.whatsapp||"—","var(--green)"],
                ["Instagram",studio.instagram||"—","#f472b6"],
                ["Telefone",studio.phone||"—","var(--muted)"],
                ["Endereço",studio.address||"—","var(--muted)"],
                ["Cor da marca",<span style={{ fontFamily:"monospace",fontWeight:700,fontSize:12 }}>{studio.brand_color||"#7C5CBF"}</span>,"var(--text)"],
                ["Trial até",studio.trial_ends_at?new Date(studio.trial_ends_at).toLocaleDateString("pt-BR"):"—","var(--gold)"],
              ].map(([l,v,c]:any)=>(
                <div key={l} style={{ background:"var(--surface2)",borderRadius:11,padding:"11px 13px" }}>
                  <div style={{ fontSize:9,color:"var(--muted)",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",marginBottom:5 }}>{l}</div>
                  <div style={{ fontSize:12,fontWeight:600,color:c }}>{v}</div>
                </div>
              ))}
            </div>
            {owner && (
              <div style={{ marginTop:14,padding:14,background:"var(--surface2)",borderRadius:12,border:"1px solid var(--border)",display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,var(--brand),var(--brand-light))",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,color:"#fff",fontSize:15,flexShrink:0 }}>{owner.name?.charAt(0)||"?"}</div>
                <div>
                  <div style={{ fontSize:13,fontWeight:700,color:"var(--text)" }}>{owner.name}</div>
                  <div style={{ fontSize:11,color:"var(--muted)" }}>{owner.email}</div>
                </div>
                <div style={{ marginLeft:"auto",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:6,background:"rgba(124,92,191,.15)",color:"var(--brand-light)",border:"1px solid rgba(124,92,191,.25)" }}>Proprietário</div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Serviços */}
      <Section title={`Serviços (${services.length})`} icon={<span style={{ fontSize:14 }}>✦</span>}
        action={!addingSvc && <button onClick={()=>setAddingSvc(true)} style={{ display:"flex",alignItems:"center",gap:6,height:32,padding:"0 13px",borderRadius:9,border:"1px solid rgba(124,92,191,.3)",background:"rgba(124,92,191,.1)",color:"var(--brand-light)",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit" }}><Plus size={12}/> Adicionar</button>}>
        {addingSvc && (
          <div style={{ marginBottom:14,padding:16,borderRadius:14,background:"var(--surface2)",border:"1px solid var(--border2)" }}>
            <div style={{ fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--brand-light)",marginBottom:12 }}>Novo serviço</div>
            <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10,marginBottom:12 }}>
              <Field label="Nome *" value={newSvcName} onChange={setNewSvcName} placeholder="Ex: Manicure simples"/>
              <Field label="Preço (R$) *" value={newSvcPrice} onChange={setNewSvcPrice} type="number" placeholder="35"/>
              <Field label="Duração (min) *" value={newSvcDur} onChange={setNewSvcDur} type="number" placeholder="45"/>
            </div>
            <div style={{ display:"flex",gap:8 }}>
              <button onClick={addSvc} disabled={savingSvc||!newSvcName||!newSvcPrice||!newSvcDur} style={{ display:"flex",alignItems:"center",gap:6,height:36,padding:"0 16px",borderRadius:10,background:"linear-gradient(135deg,var(--brand-light),var(--brand))",color:"#fff",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12,opacity:savingSvc?0.6:1 }}>
                {savingSvc?<Loader2 size={12} style={{ animation:"spin .8s linear infinite" }}/>:<Check size={12}/>} Criar serviço
              </button>
              <button onClick={()=>{setAddingSvc(false);setNewSvcName("");setNewSvcPrice("");setNewSvcDur("");}} style={{ height:36,padding:"0 14px",borderRadius:10,border:"1px solid var(--border2)",background:"none",color:"var(--muted)",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:12 }}>Cancelar</button>
            </div>
          </div>
        )}
        {services.length===0 ? (
          <div style={{ textAlign:"center",padding:"30px 0",color:"var(--muted)" }}>Nenhum serviço cadastrado.</div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {services.map(svc => (
              <div key={svc.id} style={{ background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:13,padding:14,opacity:svc.is_active?1:0.5,transition:"opacity .2s" }}>
                {editSvcId===svc.id ? (
                  <div>
                    <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10,marginBottom:10 }}>
                      <Field label="Nome" value={svcName} onChange={setSvcName}/>
                      <Field label="Preço (R$)" value={svcPrice} onChange={setSvcPrice} type="number"/>
                      <Field label="Duração (min)" value={svcDur} onChange={setSvcDur} type="number"/>
                    </div>
                    <div style={{ display:"flex",gap:8 }}>
                      <button onClick={()=>saveSvc(svc.id)} disabled={savingSvc} style={{ display:"flex",alignItems:"center",gap:6,height:34,padding:"0 14px",borderRadius:9,background:"rgba(124,92,191,.15)",color:"var(--brand-light)",border:"1px solid rgba(124,92,191,.3)",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:12 }}><Check size={12}/> Salvar</button>
                      <button onClick={()=>setEditSvcId(null)} style={{ height:34,padding:"0 13px",borderRadius:9,border:"1px solid var(--border2)",background:"none",color:"var(--muted)",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:12 }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:700,color:"var(--text)",display:"flex",alignItems:"center",gap:8 }}>
                        {svc.name}
                        {!svc.is_active && <span style={{ fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:5,background:"rgba(255,255,255,.05)",color:"var(--muted)",border:"1px solid var(--border)" }}>INATIVO</span>}
                      </div>
                      <div style={{ display:"flex",gap:12,marginTop:3 }}>
                        <span style={{ fontSize:12,fontWeight:700,color:"var(--green)",display:"flex",alignItems:"center",gap:4 }}><DollarSign size={10}/>{formatCurrency(svc.price)}</span>
                        <span style={{ fontSize:12,color:"var(--muted)",display:"flex",alignItems:"center",gap:4 }}><Clock size={10}/>{formatDuration(svc.duration_minutes)}</span>
                      </div>
                    </div>
                    <div style={{ display:"flex",gap:6 }}>
                      <button onClick={()=>toggleSvc(svc)} style={{ height:30,padding:"0 11px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,fontFamily:"inherit",transition:"all .15s", border:svc.is_active?"1px solid rgba(245,200,66,.3)":"1px solid rgba(34,212,123,.3)", background:svc.is_active?"rgba(245,200,66,.08)":"rgba(34,212,123,.08)", color:svc.is_active?"var(--yellow)":"var(--green)" }}>
                        {svc.is_active?"Desativar":"Ativar"}
                      </button>
                      <button onClick={()=>openEditSvc(svc)} style={{ width:30,height:30,borderRadius:8,border:"1px solid var(--border2)",background:"none",color:"var(--muted)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}><Pencil size={12}/></button>
                      <button onClick={()=>delSvc(svc.id)} style={{ width:30,height:30,borderRadius:8,border:"1px solid rgba(248,113,113,.2)",background:"none",color:"#f87171",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}><Trash2 size={12}/></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Horários */}
      {settings && (
        <Section title="Horários de Funcionamento" icon={<Clock size={14}/>}>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,marginBottom:14 }}>
            {DAYS.map(([key,label])=>{
              const h = wh[key] || { is_open:false, open:"09:00", close:"18:00" };
              return (
                <div key={key} style={{ borderRadius:12,padding:"11px 6px",textAlign:"center", background:h.is_open?"rgba(124,92,191,.1)":"var(--surface2)", border:`1px solid ${h.is_open?"rgba(124,92,191,.25)":"var(--border)"}`, opacity:h.is_open?1:0.5 }}>
                  <div style={{ fontSize:9,fontWeight:800,letterSpacing:".1em",textTransform:"uppercase",color:h.is_open?"var(--brand-light)":"var(--muted)",marginBottom:5 }}>{label}</div>
                  {h.is_open ? (
                    <><div style={{ fontSize:11,fontWeight:700,color:"var(--text)" }}>{h.open}</div><div style={{ fontSize:9,color:"var(--muted)" }}>–</div><div style={{ fontSize:11,fontWeight:700,color:"var(--text)" }}>{h.close}</div></>
                  ) : <div style={{ fontSize:10,color:"var(--muted)",fontWeight:600 }}>Fechado</div>}
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex",gap:16,flexWrap:"wrap" }}>
            {[["Slot",`${settings.slot_duration}min`],["Antecedência",`${settings.advance_days} dias`],["Cancelar até",`${settings.cancel_hours}h antes`],["Auto-confirmar",settings.auto_confirm?"Sim":"Não"]].map(([l,v])=>(
              <div key={l} style={{ padding:"7px 13px",borderRadius:9,background:"var(--surface2)",border:"1px solid var(--border)" }}>
                <span style={{ fontSize:10,color:"var(--muted)",fontWeight:700 }}>{l}: </span>
                <span style={{ fontSize:12,color:"var(--text)",fontWeight:700 }}>{v}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
