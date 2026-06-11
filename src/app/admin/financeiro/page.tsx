// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DollarSign, TrendingUp, TrendingDown, Users, Layers, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

/* ── tokens (mesmo padrão do /admin) ── */
const C = {
  bg: "#0d0d10", card: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)",
  sep: "rgba(255,255,255,0.05)", text: "#f4f4f5", sub: "#a1a1aa", muted: "#52525b",
};
const PLAN_C: Record<string,{color:string;bg:string;border:string}> = {
  pro:     { color:"#818cf8", bg:"rgba(99,102,241,0.10)",  border:"rgba(99,102,241,0.22)"  },
  starter: { color:"#60a5fa", bg:"rgba(96,165,250,0.10)",  border:"rgba(96,165,250,0.22)"  },
  free:    { color:"#71717a", bg:"rgba(113,113,122,0.10)", border:"rgba(113,113,122,0.20)" },
  studio:  { color:"#f472b6", bg:"rgba(244,114,182,0.10)", border:"rgba(244,114,182,0.22)" },
};

const fmtBRL = (n: number) =>
  n === 0 ? "R$ 0,00" : `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

function fmtK(n: number) {
  if (n >= 1000) return `R$ ${(n/1000).toFixed(1)}k`;
  return fmtBRL(n);
}

/* ── SVG Area Chart ── */
function AreaChart({ pts, color, h=110 }: { pts:{x:number;y:number;label:string;v:number}[]; color:string; h?:number }) {
  if (!pts.length) return null;
  const path = pts.map((p,i) => `${i===0?"M":"L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${pts[pts.length-1].x} ${h-20} L ${pts[0].x} ${h-20} Z`;
  return (
    <svg viewBox={`0 0 300 ${h}`} style={{ width:"100%", height:"auto" }}>
      <defs>
        <linearGradient id={`g-${color.replace(/[^a-z]/gi,"")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g-${color.replace(/[^a-z]/gi,"")})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#0d0d10" stroke={color} strokeWidth="1.8"/>
          <text x={p.x} y={h-4} textAnchor="middle" fontSize="9" fill={C.muted}>{p.label}</text>
        </g>
      ))}
      <text x={pts[pts.length-1].x} y={pts[pts.length-1].y-7} textAnchor="end" fontSize="10" fontWeight="700" fill={color}>
        {fmtK(pts[pts.length-1].v)}
      </text>
    </svg>
  );
}

/* ── Bar Chart ── */
function BarChart({ data, color }: { data:{label:string;v:number}[]; color:string }) {
  const W=300, H=90, PB=18, max=Math.max(...data.map(d=>d.v),1);
  const gap = W / data.length, bw = gap * 0.5;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"auto" }}>
      {data.map((d,i) => {
        const bh = (d.v/max)*(H-PB-8);
        const x = i*gap+(gap-bw)/2, y = H-PB-bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={Math.max(bh,2)} rx="3" fill={color} opacity="0.8"/>
            <text x={x+bw/2} y={H-4} textAnchor="middle" fontSize="9" fill={C.muted}>{d.label}</text>
            {d.v>0 && <text x={x+bw/2} y={y-4} textAnchor="middle" fontSize="9" fontWeight="700" fill={color}>{d.v}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export default async function FinanceiroPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "superadmin") redirect("/dashboard");

  const [{ data: studios }, { data: prices }] = await Promise.all([
    sb.from("studios").select("id,name,slug,plan,is_active,subscription_status,mrr,created_at"),
    sb.from("plan_prices").select("plan,price,label").order("price"),
  ]);

  const list   = studios ?? [];
  const pList  = prices  ?? [];

  /* ── Métricas (REAIS via subscription_status + mrr) ── */
  const active  = list.filter(s => s.subscription_status === "active");
  const mrr     = active.reduce((s,x) => s + Number(x.mrr||0), 0);
  const arr     = mrr * 12;
  const arpu    = active.length ? mrr / active.length : 0;

  // Crescimento 30d vs 30-60d (REAL via created_at)
  const now=Date.now(), d30=now-30*864e5, d60=now-60*864e5;
  const new30  = list.filter(s => new Date(s.created_at).getTime()>=d30).length;
  const prev30 = list.filter(s => { const t=new Date(s.created_at).getTime(); return t>=d60&&t<d30; }).length;
  const growPct = prev30===0 ? (new30>0?100:0) : Math.round(((new30-prev30)/prev30)*100);

  // Receita por plano (REAL)
  const byPlan = pList.map(p => {
    const inPlan = list.filter(s => s.plan===p.plan && s.subscription_status==="active");
    const rev = inPlan.reduce((s,x) => s+Number(x.mrr||0), 0);
    return { plan:p.plan, label:p.label, price:Number(p.price), count:inPlan.length, rev };
  });

  // Série mensal — ⚠️ APROXIMAÇÃO: recalculada de created_at, não snapshot histórico
  const series: {label:string;mrr:number;newStudios:number}[] = [];
  for (let i=5;i>=0;i--) {
    const dt=new Date(); dt.setMonth(dt.getMonth()-i); dt.setDate(1); dt.setHours(0,0,0,0);
    const end=new Date(dt); end.setMonth(end.getMonth()+1);
    const cum = list.filter(s => new Date(s.created_at)<end);
    const newM= list.filter(s => { const t=new Date(s.created_at); return t>=dt&&t<end; }).length;
    series.push({
      label: dt.toLocaleDateString("pt-BR",{month:"short"}),
      mrr:   cum.filter(s=>s.subscription_status==="active").reduce((s,x)=>s+Number(x.mrr||0),0),
      newStudios: newM,
    });
  }

  // Chart points helper
  function toPoints(data:{v:number}[], W=300, H=110, PB=20) {
    const vals=data.map(d=>d.v), max=Math.max(...vals,1);
    const stepX=(W-16)/(data.length-1||1);
    return data.map((d,i)=>({ x:8+i*stepX, y:H-PB-(d.v/max)*(H-PB-10), v:d.v, label:(series[i]||{label:""}).label }));
  }

  const mrrPts = toPoints(series.map(s=>({v:s.mrr})));
  const newPts = series.map(s=>({label:s.label,v:s.newStudios}));
  const mrrGrowth = series.length>=2 ? series[series.length-1].mrr-series[0].mrr : 0;

  const KPIS = [
    { label:"Receita Mensal (MRR)", value:fmtBRL(mrr), sub:`ARR: ${fmtBRL(arr)}`, icon:DollarSign, color:"#4ade80", accent:"rgba(74,222,128,0.10)", big:true },
    { label:"Crescimento (30d)",    value:`${growPct>=0?"+":""}${growPct}%`, sub:`${new30} novos salões`, icon:growPct>=0?TrendingUp:TrendingDown, color:growPct>=0?"#4ade80":"#f87171", accent:growPct>=0?"rgba(74,222,128,0.08)":"rgba(248,113,113,0.08)" },
    { label:"ARPU",  value:fmtBRL(arpu),  sub:"receita média/salão",   icon:Users,  color:"#818cf8", accent:"rgba(99,102,241,0.08)" },
    { label:"Pagantes", value:String(active.length), sub:`de ${list.length} salões`, icon:Layers, color:"#60a5fa", accent:"rgba(96,165,250,0.08)" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20, maxWidth:1100 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
        <div>
          <p style={{ fontSize:11, fontWeight:500, color:C.muted, letterSpacing:"0.07em", textTransform:"uppercase", margin:"0 0 5px" }}>Financeiro</p>
          <h1 style={{ fontSize:22, fontWeight:700, color:C.text, margin:0, letterSpacing:"-0.025em" }}>Receita</h1>
          <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>Quanto você fatura, de onde vem e como cresce</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {[{href:"/admin/financeiro/assinaturas",l:"Assinaturas"},{href:"/admin/financeiro/inadimplencia",l:"Inadimplência"}].map(x=>(
            <Link key={x.href} href={x.href} style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.sub, fontSize:12, fontWeight:500, textDecoration:"none" }}>
              {x.l} <ArrowRight size={12}/>
            </Link>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr 1fr 1fr", gap:12 }}>
        {KPIS.map(({label,value,sub,icon:Icon,color,accent,big})=>(
          <div key={label} style={{ position:"relative", overflow:"hidden", background:big?`linear-gradient(135deg,${accent},${C.card})`:`${C.card}`, border:`1px solid ${big?color+"33":C.border}`, borderRadius:12, padding:"18px 16px" }}>
            <div style={{ position:"absolute",top:0,left:10,right:10,height:1,background:`linear-gradient(90deg,transparent,${color}44,transparent)` }}/>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <span style={{ fontSize:10, fontWeight:500, color:C.muted, letterSpacing:"0.07em", textTransform:"uppercase" }}>{label}</span>
              <div style={{ width:30,height:30,borderRadius:8,background:accent,display:"flex",alignItems:"center",justifyContent:"center" }}>
                <Icon size={14} color={color}/>
              </div>
            </div>
            <div style={{ fontSize:big?30:24, fontWeight:700, color:C.text, letterSpacing:"-0.03em", lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:11, color, fontWeight:500, marginTop:8 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:12 }}>
        {/* MRR evolution */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, fontWeight:600, color:C.text }}>Evolução do MRR</span>
                <span title="Recalculado de created_at — não é snapshot histórico real" style={{ fontSize:9, fontWeight:600, padding:"1px 6px", borderRadius:4, background:"rgba(234,179,8,0.10)", color:"#fbbf24", border:"1px solid rgba(234,179,8,0.20)", cursor:"help" }}>aprox.</span>
              </div>
              <p style={{ fontSize:11, color:C.muted, margin:"3px 0 0" }}>últimos 6 meses</p>
            </div>
            {mrrGrowth!==0 && <span style={{ fontSize:12, fontWeight:600, color:mrrGrowth>0?"#4ade80":"#f87171" }}>{mrrGrowth>0?"+":""}{fmtK(mrrGrowth)}</span>}
          </div>
          <AreaChart pts={mrrPts} color="#4ade80"/>
        </div>

        {/* Novos salões */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ marginBottom:16 }}>
            <span style={{ fontSize:13, fontWeight:600, color:C.text }}>Novos salões / mês</span>
            <p style={{ fontSize:11, color:C.muted, margin:"3px 0 0" }}>aquisição</p>
          </div>
          <BarChart data={newPts} color="#818cf8"/>
        </div>
      </div>

      {/* Receita por plano */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.sep}`, display:"flex", alignItems:"center", gap:10 }}>
          <Layers size={15} color="#818cf8"/>
          <span style={{ fontSize:13, fontWeight:600, color:C.text }}>Receita por Plano</span>
          <span style={{ marginLeft:"auto", fontSize:11, color:C.muted }}>qual plano vende mais</span>
        </div>
        <div style={{ padding:18, display:"flex", flexDirection:"column", gap:13 }}>
          {byPlan.map(p=>{
            const pct = mrr>0 ? Math.round((p.rev/mrr)*100) : 0;
            const pc  = PLAN_C[p.plan]||PLAN_C.free;
            return (
              <div key={p.plan}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:13, fontWeight:500, color:C.text, minWidth:60 }}>{p.label}</span>
                    <span style={{ fontSize:11, color:C.muted }}>{p.count} {p.count===1?"salão":"salões"} · {fmtBRL(p.price)}/mês</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:11, color:C.muted }}>{pct}%</span>
                    <span style={{ fontSize:13, fontWeight:600, color:pc.color, minWidth:72, textAlign:"right" }}>{fmtBRL(p.rev)}</span>
                  </div>
                </div>
                <div style={{ height:6, borderRadius:3, background:"rgba(255,255,255,0.05)" }}>
                  <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${pc.color},${pc.color}88)`, borderRadius:3 }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
