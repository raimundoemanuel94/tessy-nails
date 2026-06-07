'use client'
import {useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import type {Appointment} from '@/types/database'
const C={bg:'#080812',card:'#10101f',card2:'#17172a',border:'#1c1c36',border2:'#26264a',purple:'#a78bfa',pink:'#f472b6',green:'#34d399',amber:'#fbbf24',red:'#f87171',text:'#e8e8f8',muted:'#6b6b9a'}
const fR=(n:number)=>`R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const ST:Record<string,{l:string,c:string}>={confirmed:{l:'confirmado',c:C.green},pending:{l:'pendente',c:C.amber},completed:{l:'concluído',c:C.purple},cancelled:{l:'cancelado',c:C.red}}
function Badge({s}:{s:string}){const c=ST[s]||{l:s,c:C.muted};return <span style={{padding:'2px 9px',borderRadius:20,fontSize:10,fontWeight:700,background:c.c+'22',color:c.c,border:`1px solid ${c.c}33`}}>{c.l}</span>}
function Kpi({icon,label,value,sub,color}:{icon:string,label:string,value:string|number,sub?:string,color:string}){return(
  <div style={{display:'flex',flexDirection:'column',background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'16px 18px',position:'relative',overflow:'hidden',gap:4}}>
    <div style={{position:'absolute',top:12,right:14,fontSize:22,color,opacity:0.15}}>{icon}</div>
    <div style={{fontSize:9,color:C.muted,fontFamily:'monospace',letterSpacing:'0.1em',textTransform:'uppercase'}}>{label}</div>
    <div style={{fontSize:24,fontWeight:800,color:'#fff',lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:C.muted}}>{sub}</div>}
    <div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color}60,transparent)`}}/>
  </div>
)}
export default function DashboardPage(){
  const [apts,setApts]=useState<Appointment[]>([])
  const [loading,setLoading]=useState(true)
  const today=new Date().toISOString().slice(0,10)
  useEffect(()=>{
    const load=async()=>{
      const sb=createClient()
      const {data:{user}}=await sb.auth.getUser()
      if(!user)return
      const {data:p}=await sb.from('profiles').select('studio_id').eq('id',user.id).single()
      if(!p||!p.studio_id)return
      const {data}=await sb.from('appointments').select('*').eq('studio_id',p.studio_id).order('appointment_date',{ascending:false}).limit(100)
      setApts(data||[]);setLoading(false)
    };load()
  },[])
  const todayApts=apts.filter(a=>a.appointment_date.startsWith(today)).sort((a,b)=>a.appointment_date.localeCompare(b.appointment_date))
  const receita=apts.filter(a=>a.status==='completed').reduce((s,a)=>s+a.price,0)
  const pend=apts.filter(a=>a.status==='pending').length
  const confirm=async(id:string)=>{const sb=createClient();await sb.from('appointments').update({status:'confirmed'}).eq('id',id);setApts(p=>p.map(a=>a.id===id?{...a,status:'confirmed'}:a))}
  if(loading)return(<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:12}}><div style={{width:36,height:36,borderRadius:'50%',border:`3px solid ${C.purple}`,borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/><div style={{color:C.muted,fontSize:13}}>Carregando...</div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>)
  return(
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div><h1 style={{fontSize:22,fontWeight:800,color:'#fff',margin:0}}>Dashboard ✨</h1><p style={{color:C.muted,margin:'4px 0 0',fontSize:12}}>{new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</p></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        <Kpi icon="☰" label="Hoje" value={todayApts.length} sub={`${pend} pendente${pend!==1?'s':''}`} color={C.purple}/>
        <Kpi icon="$" label="Receita total" value={fR(receita)} sub="concluídos" color={C.green}/>
        <Kpi icon="◎" label="Total agend." value={apts.length} color={C.pink}/>
        <Kpi icon="⏳" label="Pendentes" value={pend} sub="aguardando" color={C.amber}/>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:16}}>Agenda de hoje — {todayApts.length} atendimento(s)</div>
        {todayApts.length===0?<p style={{color:C.muted,fontSize:13,textAlign:'center',padding:20}}>Nenhum agendamento hoje 🌸</p>:todayApts.map((a,i)=>(
          <div key={a.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:i<todayApts.length-1?`1px solid ${C.border}`:'none'}}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',minWidth:50}}><span style={{fontSize:14,fontWeight:700,color:C.purple}}>{new Date(a.appointment_date).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span><span style={{fontSize:9,color:C.muted}}>{a.duration_minutes}min</span></div>
            <div style={{width:3,alignSelf:'stretch',borderRadius:2,background:(ST[a.status]||{c:C.muted}).c,opacity:0.6}}/>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{a.client_name}</div><div style={{fontSize:11,color:C.muted}}>{a.service_name}</div>{a.notes&&<div style={{fontSize:10,color:C.amber}}>⚠ {a.notes}</div>}</div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}><Badge s={a.status}/><span style={{fontSize:13,fontWeight:700,color:C.green}}>{fR(a.price)}</span>{a.status==='pending'&&<button onClick={()=>confirm(a.id)} style={{background:C.green+'22',border:`1px solid ${C.green}44`,color:C.green,borderRadius:7,padding:'3px 10px',fontSize:11,cursor:'pointer',fontWeight:600,fontFamily:'inherit'}}>✓ Confirmar</button>}</div>
          </div>
        ))}
      </div>
      {pend>0&&(
        <div style={{background:C.card,border:`1px solid ${C.amber}33`,borderRadius:12,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:12}}>⏳ Confirmações pendentes</div>
          {apts.filter(a=>a.status==='pending').slice(0,5).map(a=>(
            <div key={a.id} style={{display:'flex',alignItems:'center',gap:10,background:C.card2,border:`1px solid ${C.amber}22`,borderRadius:9,padding:'10px 14px',marginBottom:8}}>
              <div style={{flex:1}}><span style={{fontSize:13,fontWeight:600,color:C.text}}>{a.client_name}</span><span style={{fontSize:11,color:C.muted}}> · {a.service_name} · {new Date(a.appointment_date).toLocaleDateString('pt-BR')}</span></div>
              <button onClick={()=>confirm(a.id)} style={{background:C.green+'22',border:`1px solid ${C.green}44`,color:C.green,borderRadius:7,padding:'5px 12px',fontSize:12,cursor:'pointer',fontWeight:600,fontFamily:'inherit'}}>✓ Confirmar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
