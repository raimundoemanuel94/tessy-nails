// @ts-nocheck
"use client";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, DollarSign, Clock, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const C = {
  card:"rgba(255,255,255,0.03)", border:"rgba(255,255,255,0.08)",
  sep:"rgba(255,255,255,0.05)", text:"#f4f4f5", sub:"#a1a1aa", muted:"#52525b",
};
const fmtBRL = (n: number) => n===0 ? "R$ 0,00" : `R$ ${n.toLocaleString("pt-BR",{minimumFractionDigits:2})}`;

// ⚠️ APROXIMAÇÃO: atraso calculado de next_billing_date (data esperada, não gateway real)
function daysLate(d: string|null): number {
  if (!d) return 0;
  const dt=new Date(d); dt.setHours(0,0,0,0);
  const now=new Date(); now.setHours(0,0,0,0);
  const diff = Math.round((now.getTime()-dt.getTime())/86400000);
  return Math.max(0,diff);
}

function SeverityDot({ days }: { days:number }) {
  const color = days>=7 ? "#f87171" : days>=1 ? "#fbbf24" : "#71717a";
  return <div style={{ width:6,height:6,borderRadius:"50%",background:color,boxShadow:days>=7?`0 0 6px ${color}66`:"none",flexShrink:0 }}/>;
}

export default function InadimplenciaPage() {
  const [studios, setStudios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const sb = createClient();

  useEffect(() => {
    sb.from("studios")
      .select("id,name,slug,plan,is_active,subscription_status,mrr,next_billing_date")
      .then(({ data }) => { setStudios(data ?? []); setLoading(false); });
  }, []);

  async function suspend(id: string) {
    if (!confirm("Suspender acesso deste studio?")) return;
    await sb.from("studios").update({ is_active:false }).eq("id",id);
    setStudios(p => p.map(s => s.id===id ? {...s,is_active:false} : s));
  }

  const overdue = useMemo(() => {
    return studios
      .filter(s => s.subscription_status==="past_due")
      .map(s => ({ ...s, daysLate: daysLate(s.next_billing_date) }))
      .sort((a,b) => b.daysLate-a.daysLate); // mais atrasado no topo
  }, [studios]);

  const mrrAtRisk = overdue.reduce((s,x) => s+Number(x.mrr||0), 0);
  const avgLate   = overdue.length ? Math.round(overdue.reduce((s,x)=>s+x.daysLate,0)/overdue.length) : 0;

  const KPIS = [
    { label:"MRR em risco",     value:fmtBRL(mrrAtRisk), sub:"receita comprometida",  icon:DollarSign,    color:"#f87171" },
    { label:"Inadimplentes",    value:String(overdue.length), sub:"salões com atraso", icon:AlertTriangle, color:"#fbbf24" },
    { label:"Atraso médio",     value:`${avgLate}d`,     sub:"via next_billing_date ⚠", icon:Clock,       color:"#a1a1aa" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:1100 }}>
      {/* Header */}
      <div>
        <p style={{ fontSize:11, fontWeight:500, color:C.muted, letterSpacing:"0.07em", textTransform:"uppercase", margin:"0 0 5px" }}>Financeiro</p>
        <h1 style={{ fontSize:22, fontWeight:700, color:"#f4f4f5", margin:0, letterSpacing:"-0.025em" }}>Inadimplência</h1>
        <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>Quem está atrasado, há quanto tempo e o valor em risco</p>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
        {KPIS.map(({ label,value,sub,icon:Icon,color }) => (
          <div key={label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"16px 18px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute",top:0,left:8,right:8,height:1,background:`linear-gradient(90deg,transparent,${color}44,transparent)` }}/>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ fontSize:10, fontWeight:500, color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</span>
              <Icon size={14} color={color}/>
            </div>
            <div style={{ fontSize:24, fontWeight:700, color:"#f4f4f5", letterSpacing:"-0.02em" }}>{value}</div>
            <div style={{ fontSize:11, color, marginTop:6, fontWeight:500 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Lista ou estado vazio */}
      {loading ? (
        <div style={{ display:"flex",justifyContent:"center",alignItems:"center",padding:"48px 0",gap:10 }}>
          <Loader2 size={15} color={C.muted} style={{ animation:"admin-spin 1s linear infinite" }}/>
          <span style={{ fontSize:13, color:C.muted }}>Carregando…</span>
        </div>
      ) : overdue.length===0 ? (
        /* Estado vazio POSITIVO */
        <div style={{ background:C.card, border:`1px solid rgba(74,222,128,0.20)`, borderRadius:12, padding:"52px 24px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
          <div style={{ width:48,height:48,borderRadius:14,background:"rgba(74,222,128,0.10)",border:"1px solid rgba(74,222,128,0.20)",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <CheckCircle2 size={22} color="#4ade80"/>
          </div>
          <div>
            <p style={{ fontSize:15, fontWeight:600, color:"#f4f4f5", margin:"0 0 4px" }}>Nenhuma inadimplência</p>
            <p style={{ fontSize:13, color:C.muted, margin:0 }}>Todos os salões estão em dia 🎉</p>
          </div>
        </div>
      ) : (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
          {/* Table header */}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:12, padding:"8px 18px", borderBottom:`1px solid ${C.sep}` }}>
            {["Salão","Plano","Venceu em","Atraso","MRR em risco","Ações"].map(h=>(
              <span key={h} style={{ fontSize:10, fontWeight:500, color:C.muted, letterSpacing:"0.06em", textTransform:"uppercase" }}>{h}</span>
            ))}
          </div>

          {overdue.map((s:any,i:number)=>{
            const severity = s.daysLate>=7 ? "crítico" : s.daysLate>=1 ? "atenção" : "";
            const rowColor = s.daysLate>=7 ? "rgba(248,113,113,0.04)" : s.daysLate>=1 ? "rgba(251,191,36,0.03)" : "transparent";
            const mrr = Number(s.mrr||0);
            return (
              <div key={s.id} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr auto", gap:12, alignItems:"center", padding:"13px 18px", background:rowColor, borderBottom:i<overdue.length-1?`1px solid ${C.sep}`:"none" }}>
                {/* Salão */}
                <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                  <SeverityDot days={s.daysLate}/>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:500,color:"#f4f4f5",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.name}</div>
                    {severity && <span style={{ fontSize:9,fontWeight:600,padding:"1px 6px",borderRadius:4,background:s.daysLate>=7?"rgba(248,113,113,0.12)":"rgba(251,191,36,0.12)",color:s.daysLate>=7?"#f87171":"#fbbf24" }}>{severity}</span>}
                  </div>
                </div>
                {/* Plano */}
                <div style={{ fontSize:12, color:C.sub, textTransform:"capitalize" }}>{s.plan}</div>
                {/* Venceu em */}
                <div style={{ fontSize:12, color:C.sub }}>
                  {s.next_billing_date ? new Date(s.next_billing_date).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}) : "—"}
                </div>
                {/* Atraso */}
                <div style={{ fontSize:13, fontWeight:600, color:s.daysLate>=7?"#f87171":s.daysLate>=1?"#fbbf24":C.muted }}>
                  {s.daysLate>0 ? `${s.daysLate}d` : "—"}
                </div>
                {/* MRR */}
                <div style={{ fontSize:13, fontWeight:600, color:"#f87171" }}>{mrr>0?fmtBRL(mrr):"—"}</div>
                {/* Ações */}
                <div style={{ display:"flex", gap:6 }}>
                  <button
                    title="Requer integração de pagamento"
                    disabled
                    style={{ padding:"5px 10px",borderRadius:6,border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.03)",color:C.muted,fontSize:11,fontWeight:500,cursor:"not-allowed",fontFamily:"inherit" }}>
                    Cobrar
                  </button>
                  <button
                    onClick={()=>suspend(s.id)}
                    style={{ padding:"5px 10px",borderRadius:6,border:"1px solid rgba(248,113,113,0.25)",background:"rgba(248,113,113,0.08)",color:"#f87171",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"inherit" }}>
                    Suspender
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Nota sobre dados */}
      <p style={{ fontSize:11, color:C.muted, margin:0 }}>
        ⚠ Atraso calculado a partir de <code style={{ fontFamily:"monospace" }}>next_billing_date</code> — data esperada de cobrança, não confirmada por gateway.
        O botão "Cobrar" requer integração com Stripe / Pagar.me.
      </p>
    </div>
  );
}
