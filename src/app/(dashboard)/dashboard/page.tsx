// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight, TrendingUp, Calendar, Users, DollarSign, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const bg     = "#07071a";
const card   = "rgba(255,255,255,0.03)";
const card2  = "rgba(255,255,255,0.055)";
const border = "rgba(255,255,255,0.07)";
const purp   = "#a78bfa";
const pink   = "#f472b6";
const grn    = "#34d399";
const amb    = "#fbbf24";
const red    = "#f87171";
const text   = "#f0f0ff";
const muted  = "#6b6b9a";

// ── Helpers ───────────────────────────────────────────────────────────────────
type Apt = {
  id: string; client_name: string; service_name: string;
  appointment_date: string; duration_minutes: number;
  price: number; status: string; notes?: string;
};

const STATUS: Record<string, {label:string;color:string;icon:any}> = {
  confirmed: { label:"Confirmado", color:grn,  icon:CheckCircle2 },
  pending:   { label:"Pendente",   color:amb,  icon:AlertCircle  },
  completed: { label:"Concluído",  color:purp, icon:CheckCircle2 },
  cancelled: { label:"Cancelado",  color:red,  icon:XCircle      },
};
const DAYS   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MONTHS = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const fmt    = (n:number) => `R$ ${n.toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
const fmtT   = (iso:string) => new Date(iso).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const fmtD   = (d:Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
const toISO  = (d:Date) => d.toISOString().slice(0,10);
const addD   = (d:Date, n:number) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({w,h,r=8}:{w:string|number;h:number;r?:number}) => (
  <div style={{width:w,height:h,borderRadius:r,background:"rgba(255,255,255,0.06)",
    animation:"shimmer 1.6s ease-in-out infinite"}}/>
);

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({icon:Icon,label,value,sub,color,gradient,loading}:{
  icon:any;label:string;value:string|number;sub?:string;
  color:string;gradient:string;loading?:boolean;
}) {
  return (
    <div style={{
      position:"relative",overflow:"hidden",
      background:`linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
      border:`1px solid ${border}`,borderRadius:18,padding:"22px 24px",
      backdropFilter:"blur(10px)",
    }}>
      {/* gradient orb */}
      <div style={{
        position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",
        background:gradient,opacity:.15,filter:"blur(30px)",pointerEvents:"none",
      }}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:muted}}>
            {label}
          </span>
          <div style={{
            width:36,height:36,borderRadius:10,
            background:`${color}18`,border:`1px solid ${color}30`,
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>
            <Icon size={16} color={color}/>
          </div>
        </div>
        {loading
          ? <><Sk w={120} h={34}/><div style={{marginTop:8}}><Sk w={80} h={12}/></div></>
          : <>
              <div style={{fontSize:30,fontWeight:900,color:text,lineHeight:1,letterSpacing:"-0.02em"}}>{value}</div>
              {sub && <div style={{fontSize:12,color:muted,marginTop:6}}>{sub}</div>}
            </>
        }
        {/* bottom accent */}
        <div style={{
          position:"absolute",bottom:-22,left:-24,right:-24,height:2,
          background:`linear-gradient(90deg,${color}60,transparent)`,
        }}/>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [apts,    setApts]    = useState<Apt[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOff, setWeekOff] = useState(0);

  const now      = new Date();
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = toISO(today);
  const mStart   = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
  const mEnd     = toISO(new Date(now.getFullYear(), now.getMonth()+1, 0));

  const wStart = (() => {
    const d = new Date(today);
    const dow = d.getDay();
    d.setDate(d.getDate() + (dow===0 ? -6 : 1-dow) + weekOff*7);
    return d;
  })();
  const weekDays = Array.from({length:7}, (_,i) => addD(wStart, i));
  const wEnd     = weekDays[6];

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data:{ user } } = await sb.auth.getUser();
      if (!user) return;
      const { data:p } = await sb.from("profiles").select("studio_id").eq("id",user.id).single();
      if (!p?.studio_id) return;
      const { data } = await sb.from("appointments").select("*")
        .eq("studio_id", p.studio_id).order("appointment_date",{ascending:true});
      if (data) setApts(data);
      setLoading(false);
    })();
  }, []);

  const todayApts  = apts.filter(a => a.appointment_date.slice(0,10) === todayStr);
  const weekApts   = apts.filter(a => { const d=a.appointment_date.slice(0,10); return d>=toISO(wStart)&&d<=toISO(wEnd); });
  const monthApts  = apts.filter(a => { const d=a.appointment_date.slice(0,10); return d>=mStart&&d<=mEnd; });
  const pendingAll = apts.filter(a => a.status==="pending");
  const mRevenue   = monthApts.filter(a=>a.status==="completed").reduce((s,a)=>s+(a.price||0),0);
  const uniqueM    = new Set(monthApts.map(a=>a.client_name)).size;

  const setStatus = async (id:string, status:string) => {
    await createClient().from("appointments").update({status}).eq("id",id);
    setApts(prev => prev.map(a => a.id===id ? {...a,status} : a));
  };

  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24,maxWidth:1400}}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <h1 style={{
            fontSize:26,fontWeight:900,color:text,margin:0,
            background:`linear-gradient(120deg,${text},${purp})`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
          }}>
            {greeting}! 💅
          </h1>
          <p style={{color:muted,margin:"4px 0 0",fontSize:13}}>
            {now.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
          </p>
        </div>
        {!loading && pendingAll.length > 0 && (
          <div style={{
            display:"flex",alignItems:"center",gap:8,
            background:`${amb}12`,border:`1px solid ${amb}30`,
            borderRadius:12,padding:"10px 16px",
          }}>
            <div style={{width:7,height:7,borderRadius:"50%",background:amb,animation:"blink 1.4s ease-in-out infinite"}}/>
            <span style={{fontSize:13,color:amb,fontWeight:700}}>
              {pendingAll.length} pendente{pendingAll.length!==1?"s":""} aguardando
            </span>
          </div>
        )}
      </div>

      {/* ── KPI GRID ────────────────────────────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
        <KpiCard loading={loading} icon={Calendar}   color={purp} gradient={purp}
          label="Hoje"          value={loading?"—":todayApts.length}
          sub={`${pendingAll.length} pendente${pendingAll.length!==1?"s":""}`}/>
        <KpiCard loading={loading} icon={DollarSign} color={grn}  gradient={grn}
          label="Faturamento mês" value={loading?"—":fmt(mRevenue)}
          sub="agendamentos concluídos"/>
        <KpiCard loading={loading} icon={Users}      color={pink} gradient={pink}
          label="Clientes mês"  value={loading?"—":uniqueM}
          sub={`${monthApts.length} atendimento${monthApts.length!==1?"s":""}`}/>
        <KpiCard loading={loading} icon={TrendingUp} color={amb}  gradient={amb}
          label="Total geral"   value={loading?"—":apts.length}
          sub={`${monthApts.length} este mês`}/>
      </div>

      {/* ── CONTENT GRID ────────────────────────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1.6fr",gap:18,alignItems:"start"}}>

        {/* AGENDA DO DIA */}
        <div style={{
          background:card,border:`1px solid ${border}`,borderRadius:18,
          overflow:"hidden",backdropFilter:"blur(10px)",
        }}>
          {/* header */}
          <div style={{
            padding:"18px 20px",borderBottom:`1px solid ${border}`,
            background:`linear-gradient(135deg, rgba(167,139,250,0.08), rgba(244,114,182,0.04))`,
            display:"flex",alignItems:"center",justifyContent:"space-between",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:purp,boxShadow:`0 0 8px ${purp}80`}}/>
              <span style={{fontSize:14,fontWeight:800,color:text}}>Agenda de Hoje</span>
            </div>
            <div style={{
              fontSize:11,fontWeight:800,padding:"4px 10px",borderRadius:20,
              background:`${purp}18`,color:purp,border:`1px solid ${purp}30`,
            }}>
              {loading?"...": `${todayApts.length} atend.`}
            </div>
          </div>

          {/* body */}
          <div style={{padding:"4px 0"}}>
            {loading ? (
              <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:14}}>
                {[1,2,3].map(i => (
                  <div key={i} style={{display:"flex",gap:12,alignItems:"center"}}>
                    <Sk w={50} h={44} r={10}/>
                    <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                      <Sk w="60%" h={12}/><Sk w="40%" h={10}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : todayApts.length === 0 ? (
              <div style={{textAlign:"center",padding:"44px 20px"}}>
                <div style={{fontSize:44,marginBottom:12,lineHeight:1}}>🌸</div>
                <div style={{fontSize:14,fontWeight:800,color:muted}}>Dia livre!</div>
                <div style={{fontSize:12,color:muted,marginTop:4,opacity:.6}}>Nenhum agendamento hoje</div>
              </div>
            ) : (
              todayApts.map((a, i) => {
                const s = STATUS[a.status] ?? {label:a.status,color:muted,icon:Clock};
                const SIcon = s.icon;
                return (
                  <div key={a.id} style={{
                    display:"flex",alignItems:"center",gap:14,
                    padding:"14px 20px",
                    borderBottom: i<todayApts.length-1 ? `1px solid ${border}` : "none",
                    transition:"background .15s",
                  }}
                    onMouseEnter={(e:any) => e.currentTarget.style.background=card2}
                    onMouseLeave={(e:any) => e.currentTarget.style.background="transparent"}
                  >
                    {/* time block */}
                    <div style={{
                      minWidth:52,padding:"8px 6px",borderRadius:10,textAlign:"center",
                      background:`${s.color}12`,border:`1px solid ${s.color}25`,flexShrink:0,
                    }}>
                      <div style={{fontSize:14,fontWeight:900,color:s.color,lineHeight:1}}>{fmtT(a.appointment_date)}</div>
                      <div style={{fontSize:9,color:muted,marginTop:3}}>{a.duration_minutes}min</div>
                    </div>

                    {/* info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.client_name}</div>
                      <div style={{fontSize:12,color:muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:2}}>{a.service_name}</div>
                    </div>

                    {/* right */}
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5,flexShrink:0}}>
                      <span style={{fontSize:14,fontWeight:800,color:grn}}>{fmt(a.price||0)}</span>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <SIcon size={11} color={s.color}/>
                        <span style={{fontSize:10,fontWeight:700,color:s.color}}>{s.label}</span>
                      </div>
                      {a.status==="pending" && (
                        <button onClick={()=>setStatus(a.id,"confirmed")} style={{
                          background:`${grn}18`,border:`1px solid ${grn}35`,color:grn,
                          borderRadius:8,padding:"4px 10px",fontSize:10,cursor:"pointer",
                          fontWeight:700,fontFamily:"inherit",
                        }}>✓ Confirmar</button>
                      )}
                      {a.status==="confirmed" && (
                        <button onClick={()=>setStatus(a.id,"completed")} style={{
                          background:`${purp}18`,border:`1px solid ${purp}35`,color:purp,
                          borderRadius:8,padding:"4px 10px",fontSize:10,cursor:"pointer",
                          fontWeight:700,fontFamily:"inherit",
                        }}>✦ Concluir</button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CALENDÁRIO SEMANAL */}
        <div style={{
          background:card,border:`1px solid ${border}`,borderRadius:18,
          overflow:"hidden",backdropFilter:"blur(10px)",
        }}>
          {/* header */}
          <div style={{
            padding:"18px 20px",borderBottom:`1px solid ${border}`,
            background:`linear-gradient(135deg, rgba(52,211,153,0.06), rgba(167,139,250,0.04))`,
            display:"flex",alignItems:"center",justifyContent:"space-between",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:grn,boxShadow:`0 0 8px ${grn}80`}}/>
              <span style={{fontSize:14,fontWeight:800,color:text}}>Semana</span>
              <span style={{fontSize:11,color:muted}}>{fmtD(wStart)} – {fmtD(wEnd)}</span>
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <button onClick={()=>setWeekOff(w=>w-1)} style={{
                background:"none",border:`1px solid ${border}`,borderRadius:8,
                padding:"6px 8px",color:muted,cursor:"pointer",display:"flex",alignItems:"center",
              }}><ChevronLeft size={14}/></button>
              <button onClick={()=>setWeekOff(0)} style={{
                background:weekOff===0?`${purp}18`:"none",
                border:`1px solid ${weekOff===0?`${purp}40`:border}`,
                borderRadius:8,padding:"6px 12px",
                color:weekOff===0?purp:muted,cursor:"pointer",
                fontSize:11,fontWeight:700,fontFamily:"inherit",
              }}>Hoje</button>
              <button onClick={()=>setWeekOff(w=>w+1)} style={{
                background:"none",border:`1px solid ${border}`,borderRadius:8,
                padding:"6px 8px",color:muted,cursor:"pointer",display:"flex",alignItems:"center",
              }}><ChevronRight size={14}/></button>
            </div>
          </div>

          {/* days grid */}
          <div style={{padding:"16px",display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
            {weekDays.map(day => {
              const dayStr  = toISO(day);
              const isToday = dayStr === todayStr;
              const isPast  = day < today;
              const dApts   = weekApts.filter(a => a.appointment_date.slice(0,10)===dayStr)
                .sort((a,b) => a.appointment_date.localeCompare(b.appointment_date));

              return (
                <div key={dayStr} style={{display:"flex",flexDirection:"column",gap:4,opacity:isPast?.5:1}}>
                  {/* day pill */}
                  <div style={{
                    display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 4px 6px",
                    borderRadius:12,marginBottom:2,
                    background: isToday ? `linear-gradient(135deg,${purp}30,${pink}20)` : "transparent",
                    border:`1px solid ${isToday?`${purp}50`:"transparent"}`,
                  }}>
                    <span style={{
                      fontSize:9,fontWeight:800,letterSpacing:"0.07em",textTransform:"uppercase",
                      color:isToday?purp:muted,
                    }}>{DAYS[day.getDay()]}</span>
                    <span style={{
                      fontSize:20,fontWeight:900,lineHeight:1.2,
                      color:isToday?purp:text,
                    }}>{day.getDate()}</span>
                    <div style={{
                      width:5,height:5,borderRadius:"50%",marginTop:3,
                      background:dApts.length>0?(isToday?purp:muted):"transparent",
                    }}/>
                  </div>

                  {/* blocks */}
                  <div style={{display:"flex",flexDirection:"column",gap:3,minHeight:90}}>
                    {dApts.slice(0,4).map(a => {
                      const sc = STATUS[a.status] ?? {color:muted};
                      return (
                        <div key={a.id} style={{
                          background:`${sc.color}12`,
                          borderLeft:`2px solid ${sc.color}`,
                          borderRadius:"0 5px 5px 0",
                          padding:"3px 5px",
                        }}>
                          <div style={{fontSize:9,fontWeight:800,color:text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{fmtT(a.appointment_date)}</div>
                          <div style={{fontSize:9,color:sc.color,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:600}}>{a.client_name}</div>
                        </div>
                      );
                    })}
                    {dApts.length > 4 && (
                      <div style={{fontSize:9,color:muted,textAlign:"center",fontWeight:700}}>+{dApts.length-4}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* legend */}
          {!loading && weekApts.length > 0 && (
            <div style={{
              padding:"12px 16px",borderTop:`1px solid ${border}`,
              display:"flex",gap:14,flexWrap:"wrap",alignItems:"center",
            }}>
              {(["confirmed","pending","completed","cancelled"] as const).map(s => {
                const cnt = weekApts.filter(a=>a.status===s).length;
                if (!cnt) return null;
                const sc = STATUS[s];
                return (
                  <div key={s} style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:sc.color}}/>
                    <span style={{fontSize:10,color:muted}}>{sc.label} </span>
                    <span style={{fontSize:10,fontWeight:800,color:sc.color}}>{cnt}</span>
                  </div>
                );
              })}
              <div style={{marginLeft:"auto",fontSize:11,color:muted}}>
                <b style={{color:text}}>{weekApts.length}</b> na semana
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── PENDENTES ───────────────────────────────────────────────────────── */}
      {!loading && pendingAll.length > 0 && (
        <div style={{
          background:card,border:`1px solid ${amb}20`,borderRadius:18,overflow:"hidden",
        }}>
          <div style={{
            padding:"16px 20px",borderBottom:`1px solid ${amb}15`,
            background:`linear-gradient(135deg,${amb}08,transparent)`,
            display:"flex",alignItems:"center",gap:12,
          }}>
            <div style={{width:8,height:8,borderRadius:"50%",background:amb,animation:"blink 1.4s infinite"}}/>
            <span style={{fontSize:14,fontWeight:800,color:text}}>Confirmações Pendentes</span>
            <div style={{
              fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20,
              background:`${amb}18`,color:amb,border:`1px solid ${amb}30`,
            }}>{pendingAll.length}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column"}}>
            {pendingAll.map((a,i) => {
              const d = new Date(a.appointment_date);
              return (
                <div key={a.id} style={{
                  display:"flex",alignItems:"center",gap:16,padding:"14px 20px",
                  borderBottom:i<pendingAll.length-1?`1px solid ${border}`:"none",
                  transition:"background .15s",
                }}
                  onMouseEnter={(e:any)=>e.currentTarget.style.background=card2}
                  onMouseLeave={(e:any)=>e.currentTarget.style.background="transparent"}
                >
                  <div style={{
                    minWidth:48,background:`${amb}12`,border:`1px solid ${amb}25`,
                    borderRadius:10,padding:"8px 4px",textAlign:"center",flexShrink:0,
                  }}>
                    <div style={{fontSize:15,fontWeight:900,color:amb,lineHeight:1}}>{d.getDate()}</div>
                    <div style={{fontSize:9,color:amb,fontWeight:700,textTransform:"uppercase"}}>{MONTHS[d.getMonth()]}</div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:text}}>{a.client_name}</div>
                    <div style={{fontSize:12,color:muted,marginTop:2}}>{a.service_name} · {fmtT(a.appointment_date)}</div>
                  </div>
                  <span style={{fontSize:15,fontWeight:900,color:grn,flexShrink:0}}>{fmt(a.price||0)}</span>
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    <button onClick={()=>setStatus(a.id,"confirmed")} style={{
                      background:`${grn}18`,border:`1px solid ${grn}35`,color:grn,
                      borderRadius:10,padding:"9px 18px",fontSize:12,cursor:"pointer",
                      fontWeight:800,fontFamily:"inherit",letterSpacing:"0.01em",
                    }}>✓ Confirmar</button>
                    <button onClick={()=>setStatus(a.id,"cancelled")} style={{
                      background:`${red}10`,border:`1px solid ${red}25`,color:red,
                      borderRadius:10,padding:"9px 14px",fontSize:12,cursor:"pointer",
                      fontWeight:800,fontFamily:"inherit",
                    }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0%,100%{opacity:.3} 50%{opacity:.7} }
        @keyframes blink   { 0%,100%{opacity:1}  50%{opacity:.2} }
        .md-main { box-sizing: border-box; }
        @media (max-width: 768px) {
          .md-main { margin-left: 0 !important; padding: 16px 16px 80px !important; }
        }
      `}</style>
    </div>
  );
}
