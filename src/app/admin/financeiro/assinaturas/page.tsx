"use client";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Clock, AlertTriangle, XCircle, Search, Loader2, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const C = {
  bg:"#0d0d10", card:"rgba(255,255,255,0.03)", border:"rgba(255,255,255,0.08)",
  sep:"rgba(255,255,255,0.05)", text:"#f4f4f5", sub:"#a1a1aa", muted:"#52525b",
};
const PLAN_C: Record<string,{color:string;bg:string;border:string}> = {
  pro:     { color:"#818cf8", bg:"rgba(99,102,241,0.10)",  border:"rgba(99,102,241,0.22)"  },
  starter: { color:"#60a5fa", bg:"rgba(96,165,250,0.10)",  border:"rgba(96,165,250,0.22)"  },
  free:    { color:"#71717a", bg:"rgba(113,113,122,0.10)", border:"rgba(113,113,122,0.20)" },
  studio:  { color:"#f472b6", bg:"rgba(244,114,182,0.10)", border:"rgba(244,114,182,0.22)" },
};
const STATUS_S: Record<string,{label:string;color:string;bg:string;border:string}> = {
  active:   { label:"Ativo",        color:"#4ade80", bg:"rgba(74,222,128,0.08)",  border:"rgba(74,222,128,0.20)"  },
  trial:    { label:"Teste",        color:"#818cf8", bg:"rgba(99,102,241,0.08)",  border:"rgba(99,102,241,0.20)"  },
  past_due: { label:"Inadimplente", color:"#f87171", bg:"rgba(248,113,113,0.08)", border:"rgba(248,113,113,0.20)" },
  canceled: { label:"Cancelado",    color:"#52525b", bg:"rgba(82,82,91,0.08)",    border:"rgba(82,82,91,0.18)"    },
};

const fmtBRL = (n: number) => n===0 ? "R$ 0,00" : `R$ ${n.toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
function daysUntil(d: string|null): number|null {
  if (!d) return null;
  const dt=new Date(d); dt.setHours(0,0,0,0);
  const now=new Date(); now.setHours(0,0,0,0);
  return Math.round((dt.getTime()-now.getTime())/86400000);
}

const FILTERS = ["all","active","trial","expiring","canceled"] as const;
const FILTER_LABELS: Record<string,string> = { all:"Todos", active:"Ativos", trial:"Em teste", expiring:"Vencendo", canceled:"Cancelados" };

export default function AssinaturasPage() {
  const [studios, setStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all");
  const [search,  setSearch]  = useState("");
  const sb = createClient();

  useEffect(() => {
    sb.from("studios")
      .select("id,name,slug,plan,is_active,subscription_status,mrr,next_billing_date,created_at,brand_color")
      .order("created_at", { ascending:false })
      .then(({ data }) => { setStudios(data ?? []); setLoading(false); });
  }, []);

  const seg = useMemo(() => {
    const active   = studios.filter(s => s.subscription_status==="active");
    const trial    = studios.filter(s => s.subscription_status==="trial");
    const canceled = studios.filter(s => s.subscription_status==="canceled"||!s.is_active);
    const expiring = active.filter(s => { const d=daysUntil(s.next_billing_date); return d!==null&&d>=0&&d<=7; });
    return { active, trial, canceled, expiring, all:studios };
  }, [studios]);

  const rows = useMemo(() => {
    const base = filter==="all" ? studios : (seg[filter as keyof typeof seg] ?? studios) as any[];
    const q = search.toLowerCase().trim();
    return q ? base.filter(s => s.name.toLowerCase().includes(q)||s.slug.toLowerCase().includes(q)) : base;
  }, [studios, filter, search, seg]);

  const SEGS = [
    { key:"active",   label:"Ativos",     sub:"pagantes",  count:seg.active.length,   icon:CheckCircle2, color:"#4ade80" },
    { key:"trial",    label:"Em teste",   sub:"testando",  count:seg.trial.length,    icon:Clock,        color:"#818cf8" },
    { key:"expiring", label:"Vencendo",   sub:"7 dias",    count:seg.expiring.length, icon:AlertTriangle,color:"#fbbf24" },
    { key:"canceled", label:"Cancelados", sub:"encerrados", count:seg.canceled.length, icon:XCircle,     color:C.muted   },
  ];

  const COLS = "2.4fr 1fr 1.2fr 1.1fr 1.1fr 0.9fr";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:1100 }}>
      {/* Header */}
      <div>
        <p style={{ fontSize:11, fontWeight:500, color:C.muted, letterSpacing:"0.07em", textTransform:"uppercase", margin:"0 0 5px" }}>Financeiro</p>
        <h1 style={{ fontSize:22, fontWeight:700, color:C.text, margin:0, letterSpacing:"-0.025em" }}>Assinaturas</h1>
        <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>Quem está ativo, em teste e quem renova em breve.</p>
      </div>

      {/* Seg cards — clicáveis como filtro */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {SEGS.map(({ key,label,sub,count,icon:Icon,color }) => {
          const on = filter===key;
          return (
            <button key={key} onClick={() => setFilter(on?"all":key)} style={{
              textAlign:"left", cursor:"pointer", fontFamily:"inherit",
              background:on?`${color}12`:C.card, border:`1px solid ${on?color+"33":C.border}`,
              borderRadius:10, padding:"14px 16px", position:"relative", overflow:"hidden", transition:"all .15s",
            }}>
              <div style={{ position:"absolute",top:0,left:8,right:8,height:1,background:`linear-gradient(90deg,transparent,${color}44,transparent)` }}/>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:10, fontWeight:500, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</span>
                <Icon size={14} color={color}/>
              </div>
              <div style={{ fontSize:26, fontWeight:700, color:C.text, letterSpacing:"-0.02em" }}>{count}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{sub}</div>
            </button>
          );
        })}
      </div>

      {/* Search + filter pills */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, minWidth:200 }}>
          <Search size={13} color={C.muted} style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar salão…"
            style={{ width:"100%", height:36, paddingLeft:32, paddingRight:12, background:C.card, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, fontSize:13, outline:"none", fontFamily:"inherit", boxSizing:"border-box" }}/>
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {FILTERS.map(f => {
            const on=filter===f;
            return (
              <button key={f} onClick={()=>setFilter(f)} style={{ padding:"6px 12px", borderRadius:20, cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:on?600:400, border:`1px solid ${on?"rgba(99,102,241,0.35)":C.border}`, background:on?"rgba(99,102,241,0.12)":C.card, color:on?"#818cf8":C.sub, transition:"all .15s" }}>
                {FILTER_LABELS[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
        {/* Header */}
        <div style={{ display:"grid", gridTemplateColumns:COLS, padding:"8px 18px", borderBottom:`1px solid ${C.sep}` }}>
          {["Salão","Plano","Status","Início","Renova","MRR"].map(h=>(
            <span key={h} style={{ fontSize:10, fontWeight:500, color:C.muted, letterSpacing:"0.06em", textTransform:"uppercase" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ display:"flex",justifyContent:"center",alignItems:"center",padding:"48px 0",gap:10 }}>
            <Loader2 size={15} color={C.muted} style={{ animation:"admin-spin 1s linear infinite" }}/>
            <span style={{ fontSize:13, color:C.muted }}>Carregando…</span>
          </div>
        ) : rows.length===0 ? (
          <div style={{ padding:"48px 24px", textAlign:"center" }}>
            <p style={{ fontSize:14, fontWeight:600, color:C.sub, margin:"0 0 4px" }}>Nenhuma assinatura</p>
            <p style={{ fontSize:12, color:C.muted, margin:0 }}>{search?`Sem resultados para "${search}"`:"Tente outro filtro"}</p>
          </div>
        ) : rows.map((s:any,i:number)=>{
          const ss  = STATUS_S[s.subscription_status]||STATUS_S.canceled;
          const pc  = PLAN_C[s.plan]||PLAN_C.free;
          const dl  = daysUntil(s.next_billing_date);
          const mrr = Number(s.mrr||0);
          return (
            <div key={s.id} style={{ display:"grid", gridTemplateColumns:COLS, alignItems:"center", padding:"13px 18px", borderBottom:i<rows.length-1?`1px solid ${C.sep}`:"none", opacity:s.is_active?1:0.55 }}>
              {/* Salão */}
              <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                <div style={{ width:32,height:32,borderRadius:8,flexShrink:0,background:"rgba(99,102,241,0.10)",border:"1px solid rgba(99,102,241,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#818cf8" }}>
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:13,fontWeight:500,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.name}</div>
                  <code style={{ fontSize:10, color:C.muted }}>/{s.slug}</code>
                </div>
              </div>
              {/* Plano */}
              <div><span style={{ fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:5,background:pc.bg,color:pc.color,border:`1px solid ${pc.border}` }}>{s.plan}</span></div>
              {/* Status */}
              <div><span style={{ display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:500,padding:"3px 9px",borderRadius:6,background:ss.bg,color:ss.color,border:`1px solid ${ss.border}` }}><span style={{ width:5,height:5,borderRadius:"50%",background:ss.color }}/>{ss.label}</span></div>
              {/* Início */}
              <div style={{ fontSize:12, color:C.sub }}>{new Date(s.created_at).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit"})}</div>
              {/* Renova */}
              <div>
                {s.next_billing_date ? (
                  <div>
                    <div style={{ fontSize:12, fontWeight:500, color:C.text }}>{new Date(s.next_billing_date).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}</div>
                    {dl!==null&&dl>=0&&dl<=7 && <div style={{ fontSize:10, color:"#fbbf24", fontWeight:600 }}>em {dl}d</div>}
                    {dl!==null&&dl<0         && <div style={{ fontSize:10, color:"#f87171", fontWeight:600 }}>atrasado</div>}
                  </div>
                ) : <span style={{ fontSize:12,color:C.muted }}>—</span>}
              </div>
              {/* MRR */}
              <div style={{ fontSize:13, fontWeight:600, color:mrr>0?"#4ade80":C.muted }}>{mrr>0?fmtBRL(mrr):"—"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
