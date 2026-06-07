'use client'
import {useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import type {Appointment} from '@/types/database'
const C={bg:'#080812',card:'#10101f',card2:'#17172a',border:'#1c1c36',border2:'#26264a',purple:'#a78bfa',pink:'#f472b6',green:'#34d399',amber:'#fbbf24',red:'#f87171',text:'#e8e8f8',muted:'#6b6b9a'}
const fR=(n:number)=>`R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const ST:Record<string,{l:string,c:string}>={confirmed:{l:'confirmado',c:C.green},pending:{l:'pendente',c:C.amber},completed:{l:'concluído',c:C.purple},cancelled:{l:'cancelado',c:C.red}}
function Badge({s}:{s:string}){const c=ST[s]||{l:s,c:C.muted};return <span style={{padding:'2px 9px',borderRadius:20,fontSize:10,fontWeight:700,background:c.c+'22',color:c.c,border:`1px solid ${c.c}33`}}>{c.l}</span>}
export default function AgendamentosPage(){
  const [apts,setApts]=useState<Appointment[]>([])
  const [loading,setLoading]=useState(true)
  const [flt,setFlt]=useState('todos')
  const [q,setQ]=useState('')
  useEffect(()=>{
    const load=async()=>{
      const sb=createClient()
      const {data:{user}}=await sb.auth.getUser()
      if(!user)return
      const {data:p}=await sb.from('profiles').select('studio_id').eq('id',user.id).single()
      if(!p?.studio_id)return
      const {data}=await sb.from('appointments').select('*').eq('studio_id',p.studio_id).order('appointment_date',{ascending:false})
      setApts(data||[]);setLoading(false)
    };load()
  },[])
  const chg=async(id:string,status:string)=>{const sb=createClient();await sb.from('appointments').update({status}).eq('id',id);setApts(p=>p.map(a=>a.id===id?{...a,status}:a))}
  const list=apts.filter(a=>flt==='todos'||a.status===flt).filter(a=>!q||a.client_name.toLowerCase().includes(q.toLowerCase())||a.service_name.toLowerCase().includes(q.toLowerCase()))
  const cnt=(k:string)=>k==='todos'?apts.length:apts.filter(a=>a.status===k).length
  if(loading)return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',color:C.muted}}>Carregando...</div>
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div><h1 style={{fontSize:20,fontWeight:800,color:'#fff',margin:0}}>Agendamentos</h1><p style={{color:C.muted,fontSize:12,margin:'3px 0 0'}}>{apts.length} no total</p></div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Buscar cliente ou serviço..." style={{flex:1,minWidth:180,background:C.card,border:`1px solid ${C.border2}`,borderRadius:8,padding:'8px 13px',color:C.text,fontSize:13,fontFamily:'inherit',outline:'none'}}/>
        {['todos','pending','confirmed','completed','cancelled'].map(f=>(
          <button key={f} onClick={()=>setFlt(f)} style={{padding:'6px 13px',borderRadius:20,border:`1px solid ${flt===f?C.purple:C.border}`,background:flt===f?C.purple+'22':'transparent',color:flt===f?C.purple:C.muted,cursor:'pointer',fontSize:11,fontFamily:'inherit',fontWeight:flt===f?700:400}}>
            {f==='todos'?'Todos':(ST[f]?.l||f)} ({cnt(f)})
          </button>
        ))}
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden'}}>
        {list.length===0?<p style={{color:C.muted,fontSize:13,textAlign:'center',padding:24}}>Nenhum resultado</p>:list.map((a,i)=>{
          const dt=new Date(a.appointment_date)
          return(
            <div key={a.id} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderBottom:i<list.length-1?`1px solid ${C.border}`:'none',flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:120}}><div style={{fontSize:13,fontWeight:600,color:C.text}}>{a.client_name}</div><div style={{fontSize:11,color:C.muted}}>{a.service_name}</div>{a.notes&&<div style={{fontSize:10,color:C.amber}}>⚠ {a.notes}</div>}</div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <span style={{fontSize:11,color:C.purple,fontFamily:'monospace',fontWeight:700}}>{dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
                <span style={{fontSize:10,color:C.muted}}>{dt.toLocaleDateString('pt-BR')}</span>
                <Badge s={a.status}/>
                <span style={{fontSize:13,fontWeight:700,color:C.green}}>{fR(a.price)}</span>
                {a.status==='pending'&&<button onClick={()=>chg(a.id,'confirmed')} style={{background:C.green+'22',border:`1px solid ${C.green}44`,color:C.green,borderRadius:6,padding:'3px 8px',fontSize:10,cursor:'pointer',fontWeight:600}}>✓</button>}
                {(a.status==='confirmed'||a.status==='pending')&&<button onClick={()=>chg(a.id,'completed')} style={{background:C.purple+'22',border:`1px solid ${C.purple}44`,color:C.purple,borderRadius:6,padding:'3px 8px',fontSize:10,cursor:'pointer',fontWeight:600}}>✦</button>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
