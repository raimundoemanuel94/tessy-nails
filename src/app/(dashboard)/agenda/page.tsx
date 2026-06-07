'use client'
import {useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import type {Appointment} from '@/types/database'
const C={bg:'#080812',card:'#10101f',card2:'#17172a',border:'#1c1c36',purple:'#a78bfa',pink:'#f472b6',green:'#34d399',amber:'#fbbf24',red:'#f87171',text:'#e8e8f8',muted:'#6b6b9a'}
const fR=(n:number)=>`R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const ST:Record<string,{l:string,c:string}>={confirmed:{l:'confirmado',c:C.green},pending:{l:'pendente',c:C.amber},completed:{l:'concluído',c:C.purple},cancelled:{l:'cancelado',c:C.red}}
function Badge({s}:{s:string}){const c=ST[s]||{l:s,c:C.muted};return <span style={{padding:'2px 9px',borderRadius:20,fontSize:10,fontWeight:700,background:c.c+'22',color:c.c,border:`1px solid ${c.c}33`}}>{c.l}</span>}
export default function AgendaPage(){
  const [apts,setApts]=useState<Appointment[]>([])
  const [loading,setLoading]=useState(true)
  const [selDate,setSelDate]=useState(new Date().toISOString().slice(0,10))
  useEffect(()=>{
    const load=async()=>{
      const sb=createClient()
      const {data:{user}}=await sb.auth.getUser()
      if(!user)return
      const {data:p}=await sb.from('profiles').select('studio_id').eq('id',user.id).single()
      if(!p?.studio_id)return
      const {data}=await sb.from('appointments').select('*').eq('studio_id',p.studio_id).order('appointment_date')
      setApts(data||[]);setLoading(false)
    };load()
  },[])
  const chg=async(id:string,status:string)=>{const sb=createClient();await sb.from('appointments').update({status}).eq('id',id);setApts(p=>p.map(a=>a.id===id?{...a,status}:a))}
  const days=Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()+(i-3));return d.toISOString().slice(0,10)})
  const dayApts=apts.filter(a=>a.appointment_date.startsWith(selDate)).sort((a,b)=>a.appointment_date.localeCompare(b.appointment_date))
  const fmt=(d:string)=>{const dt=new Date(d+'T00:00');return{w:['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][dt.getDay()],n:dt.getDate()}}
  if(loading)return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',color:C.muted}}>Carregando...</div>
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div><h1 style={{fontSize:20,fontWeight:800,color:'#fff',margin:0}}>Agenda</h1><p style={{color:C.muted,fontSize:12,margin:'3px 0 0'}}>Seus horários</p></div>
      <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4}}>
        {days.map(d=>{const {w,n}=fmt(d);const isSel=d===selDate;const isToday=d===new Date().toISOString().slice(0,10);const has=apts.some(a=>a.appointment_date.startsWith(d));return(
          <button key={d} onClick={()=>setSelDate(d)} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'9px 13px',borderRadius:11,border:`1px solid ${isSel?C.purple:C.border}`,background:isSel?C.purple+'22':C.card,cursor:'pointer',minWidth:52,fontFamily:'inherit',flexShrink:0,position:'relative'}}>
            {isToday&&<div style={{position:'absolute',top:4,right:4,width:5,height:5,borderRadius:'50%',background:C.amber}}/>}
            <span style={{fontSize:9,color:isSel?C.purple:C.muted,textTransform:'uppercase',letterSpacing:'0.1em'}}>{w}</span>
            <span style={{fontSize:17,fontWeight:800,color:isSel?C.purple:C.text}}>{n}</span>
            <div style={{width:5,height:5,borderRadius:'50%',background:has?(isSel?C.purple:C.border):C.card}}/>
          </button>
        )})}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
        <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:14}}>{new Date(selDate+'T00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})} — {dayApts.length} atendimento(s)</div>
        {dayApts.length===0?<div style={{textAlign:'center',padding:32,color:C.muted}}><div style={{fontSize:28,marginBottom:8}}>📅</div><div>Nenhum agendamento neste dia</div></div>:dayApts.map((a,i)=>(
          <div key={a.id} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'14px 0',borderBottom:i<dayApts.length-1?`1px solid ${C.border}`:'none'}}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',minWidth:50}}><span style={{fontSize:15,fontWeight:800,color:C.purple}}>{new Date(a.appointment_date).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span><span style={{fontSize:9,color:C.muted}}>{a.duration_minutes}min</span></div>
            <div style={{width:3,borderRadius:2,alignSelf:'stretch',background:(ST[a.status]||{c:C.muted}).c,opacity:0.5}}/>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.text}}>{a.client_name}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{a.service_name}</div>{a.notes&&<div style={{fontSize:11,color:C.amber,marginTop:3}}>⚠ {a.notes}</div>}</div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:7}}>
              <Badge s={a.status}/><span style={{fontSize:13,fontWeight:700,color:C.green}}>{fR(a.price)}</span>
              {a.status==='pending'&&<button onClick={()=>chg(a.id,'confirmed')} style={{background:C.green+'22',border:`1px solid ${C.green}44`,color:C.green,borderRadius:7,padding:'3px 9px',fontSize:10,cursor:'pointer',fontWeight:600,fontFamily:'inherit'}}>Confirmar</button>}
              {a.status==='confirmed'&&<button onClick={()=>chg(a.id,'completed')} style={{background:C.purple+'22',border:`1px solid ${C.purple}44`,color:C.purple,borderRadius:7,padding:'3px 9px',fontSize:10,cursor:'pointer',fontWeight:600,fontFamily:'inherit'}}>Concluir</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
