'use client'
import {useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import type {Appointment} from '@/types/database'
const C={bg:'#080812',card:'#10101f',card2:'#17172a',border:'#1c1c36',purple:'#a78bfa',pink:'#f472b6',green:'#34d399',amber:'#fbbf24',red:'#f87171',text:'#e8e8f8',muted:'#6b6b9a'}
const fR=(n:number)=>`R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const ST:Record<string,{l:string,c:string}>={confirmed:{l:'confirmado',c:C.green},pending:{l:'pendente',c:C.amber},completed:{l:'concluído',c:C.purple},cancelled:{l:'cancelado',c:C.red}}
function Kpi({icon,label,value,sub,color}:{icon:string,label:string,value:string|number,sub?:string,color:string}){return(
  <div style={{display:'flex',flexDirection:'column',background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'16px 18px',position:'relative',overflow:'hidden',gap:4}}>
    <div style={{position:'absolute',top:12,right:14,fontSize:22,color,opacity:0.15}}>{icon}</div>
    <div style={{fontSize:9,color:C.muted,fontFamily:'monospace',letterSpacing:'0.1em',textTransform:'uppercase'}}>{label}</div>
    <div style={{fontSize:24,fontWeight:800,color:'#fff',lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:C.muted}}>{sub}</div>}
    <div style={{position:'absolute',bottom:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${color}60,transparent)`}}/>
  </div>
)}
export default function RelatoriosPage(){
  const [apts,setApts]=useState<Appointment[]>([])
  const [loading,setLoading]=useState(true)
  useEffect(()=>{
    const load=async()=>{
      const sb=createClient()
      const {data:{user}}=await sb.auth.getUser()
      if(!user)return
      const {data:p}=await sb.from('profiles').select('studio_id').eq('id',user.id).single()
      if(!p||!p.studio_id)return
      const {data}=await sb.from('appointments').select('*').eq('studio_id',p.studio_id)
      setApts(data||[]);setLoading(false)
    };load()
  },[])
  const conc=apts.filter(a=>a.status==='completed')
  const rec=conc.reduce((s,a)=>s+a.price,0)
  const tkt=conc.length?rec/conc.length:0
  const svcCnt:{[k:string]:number}={}
  conc.forEach(a=>{svcCnt[a.service_name]=(svcCnt[a.service_name]||0)+1})
  const top=Object.entries(svcCnt).sort((a,b)=>b[1]-a[1]).slice(0,5)
  if(loading)return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',color:C.muted}}>Carregando...</div>
  return(
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      <div><h1 style={{fontSize:20,fontWeight:800,color:'#fff',margin:0}}>Relatórios</h1><p style={{color:C.muted,fontSize:12,margin:'3px 0 0'}}>Métricas do seu studio</p></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}><Kpi icon="$" label="Receita total" value={fR(rec)} color={C.green}/><Kpi icon="☰" label="Concluídos" value={conc.length} color={C.purple}/><Kpi icon="↑" label="Ticket médio" value={fR(tkt)} color={C.pink}/><Kpi icon="%" label="Taxa conclusão" value={apts.length?Math.round(conc.length/apts.length*100)+'%':'—'} color={C.amber}/></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}><div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:14}}>Serviços mais realizados</div>{top.length===0?<p style={{color:C.muted,fontSize:13}}>Nenhum dado ainda</p>:top.map(([n,v],i)=>(
          <div key={n} style={{display:'flex',flexDirection:'column',gap:4,marginBottom:10}}><div style={{display:'flex',justifyContent:'space-between'}}><div style={{display:'flex',alignItems:'center',gap:7}}><span style={{fontSize:10,color:C.muted,fontFamily:'monospace',minWidth:16}}>#{i+1}</span><span style={{fontSize:12,color:C.text}}>{n}</span></div><span style={{fontSize:12,fontWeight:700,color:C.purple}}>{v}x</span></div><div style={{height:5,background:C.border,borderRadius:3}}><div style={{height:'100%',borderRadius:3,background:`linear-gradient(90deg,${C.purple},${C.pink})`,width:`${(v/top[0][1])*100}%`,transition:'width 0.5s'}}/></div></div>
        ))}</div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}><div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:14}}>Por status</div>{Object.entries(ST).map(([k,v])=>{const n=apts.filter(a=>a.status===k).length;const pct=apts.length?Math.round(n/apts.length*100):0;return(
          <div key={k} style={{display:'flex',flexDirection:'column',gap:4,padding:'12px',background:C.card2,borderRadius:9,border:`1px solid ${v.c}33`,marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:12,color:v.c,fontWeight:600}}>{v.l}</span><span style={{fontSize:12,fontWeight:700,color:C.text}}>{n} <span style={{color:v.c,fontSize:10}}>({pct}%)</span></span></div><div style={{height:3,background:C.border,borderRadius:2}}><div style={{height:'100%',borderRadius:2,background:v.c,width:`${pct}%`}}/></div></div>
        )})}
        </div>
      </div>
    </div>
  )
}
