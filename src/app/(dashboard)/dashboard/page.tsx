// @ts-nocheck
"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  bg:      "#080812",
  card:    "#10101f",
  card2:   "#17172a",
  border:  "#1c1c36",
  border2: "#26264a",
  purple:  "#a78bfa",
  brand:   "#7c5cbf",
  pink:    "#f472b6",
  green:   "#34d399",
  amber:   "#fbbf24",
  red:     "#f87171",
  text:    "#e8e8f8",
  muted:   "#6b6b9a",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Appointment = {
  id: string;
  client_name: string;
  service_name: string;
  appointment_date: string;
  duration_minutes: number;
  price: number;
  status: string;
  notes?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Confirmado", color: C.green  },
  pending:   { label: "Pendente",   color: C.amber  },
  completed: { label: "Concluído",  color: C.purple },
  cancelled: { label: "Cancelado",  color: C.red    },
};

const DAY_NAMES   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MONTH_NAMES = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

const fmt   = (n: number) => `R$ ${n.toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
const fmtT  = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const fmtDt = (d: Date) => `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
const toISO = (d: Date) => d.toISOString().slice(0,10);
const addD  = (d: Date, n: number) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: C.muted };
  return (
    <span style={{
      padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:700,whiteSpace:"nowrap",
      background:s.color+"22",color:s.color,border:`1px solid ${s.color}33`,
    }}>{s.label}</span>
  );
}

// ─── KpiCard ──────────────────────────────────────────────────────────────────

function KpiCard({ emoji, label, value, sub, color, tag }: {
  emoji:string; label:string; value:string|number; sub?:string; color:string; tag?:string;
}) {
  return (
    <div style={{
      display:"flex",flexDirection:"column",background:C.card,
      border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",
      position:"relative",overflow:"hidden",gap:5,
    }}>
      <div style={{
        position:"absolute",top:14,right:16,width:38,height:38,borderRadius:"50%",
        background:color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,
      }}>{emoji}</div>
      <div style={{
        position:"absolute",bottom:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg,${color}90,transparent)`,
      }}/>
      <div style={{fontSize:9,color:C.muted,fontFamily:"monospace",letterSpacing:"0.1em",textTransform:"uppercase"}}>{label}</div>
      <div style={{fontSize:28,fontWeight:900,color:"#fff",lineHeight:1}}>{value}</div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {sub && <div style={{fontSize:10,color:C.muted}}>{sub}</div>}
        {tag && (
          <div style={{
            fontSize:9,fontWeight:800,padding:"1px 7px",borderRadius:20,
            background:color+"20",color,
          }}>{tag}</div>
        )}
      </div>
    </div>
  );
}

// ─── KpiSkeleton ─────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"18px 20px",display:"flex",flexDirection:"column",gap:10}}>
      {[55,120,75].map(w=>(
        <div key={w} style={{height:w===120?28:10,width:`${w}px`,borderRadius:6,background:C.card2,animation:"pulse 1.4s ease-in-out infinite"}}/>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [apts,    setApts]    = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOff, setWeekOff] = useState(0);

  // ── Static date refs (computed once) ──────────────────────────────────────
  const now      = new Date();
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStr = toISO(today);
  const mStart   = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
  const mEnd     = toISO(new Date(now.getFullYear(), now.getMonth()+1, 0));

  // ── Week range (reactive to weekOff) ──────────────────────────────────────
  const wStart = (() => {
    const d = new Date(today);
    const dow = d.getDay();
    d.setDate(d.getDate() + (dow===0 ? -6 : 1-dow) + weekOff*7);
    return d;
  })();
  const wEnd     = addD(wStart, 6);
  const weekDays = Array.from({length:7}, (_,i) => addD(wStart, i));

  // ── Load all appointments ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data:{ user } } = await sb.auth.getUser();
      if (!user) return;
      const { data:p } = await sb.from("profiles").select("studio_id").eq("id",user.id).single();
      if (!p?.studio_id) return;
      const { data } = await sb
        .from("appointments").select("*").eq("studio_id",p.studio_id)
        .order("appointment_date",{ascending:true});
      if (data) setApts(data);
      setLoading(false);
    })();
  }, []);

  // ── Derived views ─────────────────────────────────────────────────────────
  const todayApts  = apts.filter(a => a.appointment_date.slice(0,10) === todayStr);
  const weekApts   = apts.filter(a => {
    const d = a.appointment_date.slice(0,10);
    return d >= toISO(wStart) && d <= toISO(wEnd);
  });
  const monthApts  = apts.filter(a => {
    const d = a.appointment_date.slice(0,10);
    return d >= mStart && d <= mEnd;
  });
  const pendingAll = apts.filter(a => a.status === "pending");
  const mRevenue   = monthApts.filter(a => a.status==="completed").reduce((s,a)=>s+(a.price||0),0);
  const uniqueM    = new Set(monthApts.map(a=>a.client_name)).size;

  // ── Actions ───────────────────────────────────────────────────────────────
  const setStatus = async (id: string, status: string) => {
    const sb = createClient();
    await sb.from("appointments").update({status}).eq("id",id);
    setApts(prev => prev.map(a => a.id===id ? {...a,status} : a));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>

      {/* HEADER */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:900,color:"#fff",margin:0}}>Dashboard</h1>
          <p style={{color:C.muted,margin:"4px 0 0",fontSize:12}}>
            {now.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
          </p>
        </div>
        {!loading && pendingAll.length > 0 && (
          <div style={{
            display:"flex",alignItems:"center",gap:8,
            background:C.amber+"15",border:`1px solid ${C.amber}33`,
            borderRadius:10,padding:"8px 14px",
          }}>
            <div style={{width:7,height:7,borderRadius:"50%",background:C.amber,animation:"blink 1.5s ease-in-out infinite"}}/>
            <span style={{fontSize:12,color:C.amber,fontWeight:700}}>
              {pendingAll.length} pendente{pendingAll.length!==1?"s":""} aguardando
            </span>
          </div>
        )}
      </div>

      {/* KPI CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        {loading
          ? [0,1,2,3].map(i=><KpiSkeleton key={i}/>)
          : <>
              <KpiCard emoji="📅" color={C.purple} label="Agendamentos hoje" value={todayApts.length}
                sub={`${pendingAll.length} pendente${pendingAll.length!==1?"s":""}`}/>
              <KpiCard emoji="💰" color={C.green}  label="Faturamento mês"  value={fmt(mRevenue)}
                sub="agendamentos concluídos"/>
              <KpiCard emoji="👥" color={C.pink}   label="Clientes este mês" value={uniqueM}
                sub={`${monthApts.length} atendimento${monthApts.length!==1?"s":""}`}/>
              <KpiCard emoji="📋" color={C.amber}  label="Total geral"      value={apts.length}
                sub={`${monthApts.length} este mês`}
                tag={pendingAll.length>0 ? `${pendingAll.length} ⏳` : undefined}/>
            </>
        }
      </div>

      {/* MAIN GRID: agenda + calendário */}
      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1.6fr)",gap:16,alignItems:"start"}}>

        {/* ── AGENDA DO DIA ──────────────────────────────────────────────── */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <span style={{fontSize:14,fontWeight:800,color:C.text}}>Agenda de Hoje</span>
            <span style={{
              fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:20,
              background:C.purple+"20",color:C.purple,border:`1px solid ${C.purple}33`,
            }}>
              {loading ? "..." : `${todayApts.length} atendimento${todayApts.length!==1?"s":""}`}
            </span>
          </div>

          {loading ? (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[1,2,3].map(i=>(
                <div key={i} style={{display:"flex",gap:10,padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{width:46,height:40,borderRadius:8,background:C.card2,animation:"pulse 1.4s ease-in-out infinite"}}/>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                    <div style={{height:12,width:"60%",borderRadius:4,background:C.card2,animation:"pulse 1.4s ease-in-out infinite"}}/>
                    <div style={{height:10,width:"40%",borderRadius:4,background:C.card2,animation:"pulse 1.4s ease-in-out infinite"}}/>
                  </div>
                </div>
              ))}
            </div>
          ) : todayApts.length === 0 ? (
            <div style={{textAlign:"center",padding:"36px 0"}}>
              <div style={{fontSize:36,marginBottom:10}}>🌸</div>
              <div style={{fontSize:13,fontWeight:700,color:C.muted}}>Nenhum agendamento hoje</div>
              <div style={{fontSize:11,color:C.muted,marginTop:4,opacity:.7}}>Dia livre!</div>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column"}}>
              {todayApts.map((a,i) => {
                const sc = STATUS_MAP[a.status] ?? {color:C.muted};
                return (
                  <div key={a.id} style={{
                    display:"flex",alignItems:"center",gap:12,padding:"12px 0",
                    borderBottom:i<todayApts.length-1?`1px solid ${C.border}`:"none",
                  }}>
                    <div style={{minWidth:46,textAlign:"center"}}>
                      <div style={{fontSize:15,fontWeight:900,color:C.purple,lineHeight:1}}>{fmtT(a.appointment_date)}</div>
                      <div style={{fontSize:9,color:C.muted,marginTop:2}}>{a.duration_minutes}min</div>
                    </div>
                    <div style={{width:3,alignSelf:"stretch",borderRadius:2,background:sc.color,opacity:.8}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.client_name}</div>
                      <div style={{fontSize:11,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.service_name}</div>
                      {a.notes && <div style={{fontSize:10,color:C.amber,marginTop:2}}>⚠ {a.notes}</div>}
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                      <StatusBadge status={a.status}/>
                      <span style={{fontSize:12,fontWeight:800,color:C.green}}>{fmt(a.price||0)}</span>
                      {a.status==="pending" && (
                        <button onClick={()=>setStatus(a.id,"confirmed")} style={{
                          background:C.green+"20",border:`1px solid ${C.green}44`,color:C.green,
                          borderRadius:7,padding:"3px 9px",fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:"inherit",
                        }}>✓ Confirmar</button>
                      )}
                      {a.status==="confirmed" && (
                        <button onClick={()=>setStatus(a.id,"completed")} style={{
                          background:C.purple+"20",border:`1px solid ${C.purple}44`,color:C.purple,
                          borderRadius:7,padding:"3px 9px",fontSize:10,cursor:"pointer",fontWeight:700,fontFamily:"inherit",
                        }}>✦ Concluir</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CALENDÁRIO SEMANAL ─────────────────────────────────────────── */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:20}}>

          {/* nav */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <span style={{fontSize:14,fontWeight:800,color:C.text}}>Semana</span>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:11,color:C.muted,marginRight:4}}>
                {fmtDt(wStart)} – {fmtDt(wEnd)}
              </span>
              <button onClick={()=>setWeekOff(w=>w-1)} style={{
                display:"flex",alignItems:"center",background:"none",
                border:`1px solid ${C.border2}`,borderRadius:7,
                padding:"5px 8px",color:C.muted,cursor:"pointer",
              }}><ChevronLeft size={13}/></button>
              <button onClick={()=>setWeekOff(0)} style={{
                background:weekOff===0?C.purple+"20":"none",
                border:`1px solid ${weekOff===0?C.purple+"44":C.border2}`,
                borderRadius:7,padding:"5px 10px",
                color:weekOff===0?C.purple:C.muted,
                cursor:"pointer",fontSize:10,fontWeight:700,fontFamily:"inherit",
              }}>Hoje</button>
              <button onClick={()=>setWeekOff(w=>w+1)} style={{
                display:"flex",alignItems:"center",background:"none",
                border:`1px solid ${C.border2}`,borderRadius:7,
                padding:"5px 8px",color:C.muted,cursor:"pointer",
              }}><ChevronRight size={13}/></button>
            </div>
          </div>

          {/* day columns */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
            {weekDays.map(day => {
              const dayStr  = toISO(day);
              const isToday = dayStr === todayStr;
              const isPast  = day < today;
              const dApts   = weekApts
                .filter(a => a.appointment_date.slice(0,10) === dayStr)
                .sort((a,b) => a.appointment_date.localeCompare(b.appointment_date));

              return (
                <div key={dayStr} style={{display:"flex",flexDirection:"column",gap:4,opacity:isPast?.55:1}}>
                  {/* header pill */}
                  <div style={{
                    display:"flex",flexDirection:"column",alignItems:"center",
                    padding:"8px 4px 6px",borderRadius:10,marginBottom:2,
                    background:isToday?C.purple+"22":"transparent",
                    border:`1px solid ${isToday?C.purple+"55":"transparent"}`,
                  }}>
                    <span style={{fontSize:9,fontWeight:800,letterSpacing:"0.07em",textTransform:"uppercase",color:isToday?C.purple:C.muted}}>
                      {DAY_NAMES[day.getDay()]}
                    </span>
                    <span style={{fontSize:20,fontWeight:900,lineHeight:1.2,color:isToday?C.purple:C.text}}>
                      {day.getDate()}
                    </span>
                    <div style={{
                      width:5,height:5,borderRadius:"50%",marginTop:3,
                      background:dApts.length>0?(isToday?C.purple:C.muted):C.card,
                      border:`1px solid ${dApts.length>0?(isToday?C.purple:C.border2):C.border}`,
                    }}/>
                  </div>

                  {/* blocks */}
                  <div style={{display:"flex",flexDirection:"column",gap:3,minHeight:100}}>
                    {loading && isToday
                      ? [1,2].map(i=>(
                          <div key={i} style={{height:36,borderRadius:6,background:C.card2,animation:"pulse 1.4s ease-in-out infinite"}}/>
                        ))
                      : <>
                          {dApts.slice(0,4).map(a => {
                            const sc = STATUS_MAP[a.status] ?? {color:C.muted};
                            return (
                              <div key={a.id} style={{
                                background:sc.color+"16",border:`1px solid ${sc.color}30`,
                                borderLeft:`2.5px solid ${sc.color}`,
                                borderRadius:6,padding:"4px 6px",
                              }}>
                                <div style={{fontSize:9,fontWeight:800,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{fmtT(a.appointment_date)}</div>
                                <div style={{fontSize:9,color:sc.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:600}}>{a.client_name}</div>
                              </div>
                            );
                          })}
                          {dApts.length > 4 && (
                            <div style={{fontSize:9,color:C.muted,textAlign:"center",fontWeight:700,paddingTop:2}}>+{dApts.length-4} mais</div>
                          )}
                          {dApts.length === 0 && !isPast && (
                            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",opacity:.25}}>
                              <div style={{width:18,height:1,background:C.muted}}/>
                            </div>
                          )}
                        </>
                    }
                  </div>
                </div>
              );
            })}
          </div>

          {/* week legend */}
          {!loading && weekApts.length > 0 && (
            <div style={{marginTop:16,paddingTop:14,borderTop:`1px solid ${C.border}`,display:"flex",gap:16,flexWrap:"wrap"}}>
              {(["confirmed","pending","completed","cancelled"] as const).map(s => {
                const cnt = weekApts.filter(a=>a.status===s).length;
                if (!cnt) return null;
                const sc = STATUS_MAP[s];
                return (
                  <div key={s} style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:sc.color}}/>
                    <span style={{fontSize:10,color:C.muted}}>{sc.label}</span>
                    <span style={{fontSize:10,fontWeight:800,color:sc.color}}>{cnt}</span>
                  </div>
                );
              })}
              <div style={{marginLeft:"auto",fontSize:10,color:C.muted}}>
                <span style={{fontWeight:800,color:C.text}}>{weekApts.length}</span> na semana
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PENDENTES */}
      {!loading && pendingAll.length > 0 && (
        <div style={{background:C.card,border:`1px solid ${C.amber}22`,borderRadius:14,padding:20}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <span style={{
              fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:20,
              background:C.amber+"20",color:C.amber,border:`1px solid ${C.amber}33`,
            }}>⏳ PENDENTES</span>
            <span style={{fontSize:14,fontWeight:800,color:C.text}}>
              {pendingAll.length} aguardando confirmação
            </span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {pendingAll.map(a => {
              const d = new Date(a.appointment_date);
              return (
                <div key={a.id} style={{
                  display:"flex",alignItems:"center",gap:14,
                  background:C.card2,border:`1px solid ${C.border}`,
                  borderRadius:10,padding:"11px 16px",
                }}>
                  <div style={{
                    minWidth:46,background:C.amber+"15",border:`1px solid ${C.amber}33`,
                    borderRadius:8,padding:"6px 4px",textAlign:"center",flexShrink:0,
                  }}>
                    <div style={{fontSize:13,fontWeight:900,color:C.amber,lineHeight:1}}>{d.getDate()}</div>
                    <div style={{fontSize:8,color:C.amber,fontWeight:700,textTransform:"uppercase"}}>{MONTH_NAMES[d.getMonth()]}</div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.text}}>{a.client_name}</div>
                    <div style={{fontSize:11,color:C.muted}}>{a.service_name} · {fmtT(a.appointment_date)}</div>
                  </div>
                  <div style={{fontSize:13,fontWeight:800,color:C.green,flexShrink:0}}>{fmt(a.price||0)}</div>
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    <button onClick={()=>setStatus(a.id,"confirmed")} style={{
                      background:C.green+"20",border:`1px solid ${C.green}44`,color:C.green,
                      borderRadius:8,padding:"7px 16px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit",
                    }}>✓ Confirmar</button>
                    <button onClick={()=>setStatus(a.id,"cancelled")} style={{
                      background:C.red+"10",border:`1px solid ${C.red}33`,color:C.red,
                      borderRadius:8,padding:"7px 12px",fontSize:11,cursor:"pointer",fontWeight:700,fontFamily:"inherit",
                    }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:.35} 50%{opacity:.75} }
        @keyframes blink { 0%,100%{opacity:1}   50%{opacity:.3}  }
      `}</style>
    </div>
  );
}
