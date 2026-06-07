'use client'
import {useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import type {Client} from '@/types/database'
const C={bg:'#080812',card:'#10101f',card2:'#17172a',border:'#1c1c36',border2:'#26264a',purple:'#a78bfa',pink:'#f472b6',green:'#34d399',amber:'#fbbf24',red:'#f87171',text:'#e8e8f8',muted:'#6b6b9a'}
const GR=['#a78bfa','#f472b6','#818cf8','#c084fc','#fbbf24','#34d399']
function Field({label,value,onChange,type='text',placeholder}:{label:string,value:string,onChange:(v:string)=>void,type?:string,placeholder?:string}){
  return <div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:C.muted,fontFamily:'monospace'}}>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{background:C.bg,border:`1px solid ${C.border2}`,borderRadius:8,padding:'8px 12px',color:C.text,fontSize:13,fontFamily:'inherit',outline:'none'}}/></div>
}
export default function ClientesPage(){
  const [clts,setClts]=useState<Client[]>([])
  const [studioId,setStudioId]=useState<string|null>(null)
  const [loading,setLoading]=useState(true)
  const [q,setQ]=useState('')
  const [sel,setSel]=useState<Client|null>(null)
  const [modal,setModal]=useState(false)
  const [form,setForm]=useState({name:'',phone:'',email:'',birth_date:'',notes:''})
  const [saving,setSaving]=useState(false)
  useEffect(()=>{
    const load=async()=>{
      const sb=createClient()
      const {data:{user}}=await sb.auth.getUser()
      if(!user)return
      const {data:p}=await sb.from('profiles').select('studio_id').eq('id',user.id).single()
      if(!p||!p.studio_id)return
      setStudioId(p.studio_id)
      const {data}=await sb.from('clients').select('*').eq('studio_id',p.studio_id).eq('is_active',true).order('name')
      setClts(data||[]);setLoading(false)
    };load()
  },[])
  const save=async()=>{
    if(!form.name.trim()||!studioId)return
    setSaving(true)
    const sb=createClient()
    const {data}=await sb.from('clients').insert({studio_id:studioId,name:form.name,phone:form.phone||null,email:form.email||null,birth_date:form.birth_date||null,notes:form.notes||null}).select().single()
    if(data)setClts(p=>[...p,data].sort((a,b)=>a.name.localeCompare(b.name)))
    setSaving(false);setModal(false);setForm({name:'',phone:'',email:'',birth_date:'',notes:''})
  }
  const list=clts.filter(c=>!q||c.name.toLowerCase().includes(q.toLowerCase())||c.phone?.includes(q)||c.email?.toLowerCase().includes(q.toLowerCase()))
  if(loading)return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',color:C.muted}}>Carregando...</div>
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><div><h1 style={{fontSize:20,fontWeight:800,color:'#fff',margin:0}}>Clientes</h1><p style={{color:C.muted,fontSize:12,margin:'3px 0 0'}}>{clts.length} cadastradas</p></div><button onClick={()=>setModal(true)} style={{background:C.purple,color:'#fff',border:'none',borderRadius:9,padding:'9px 18px',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>+ Nova cliente</button></div>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Buscar por nome, telefone ou email..." style={{background:C.card,border:`1px solid ${C.border2}`,borderRadius:8,padding:'9px 14px',color:C.text,fontSize:13,fontFamily:'inherit',outline:'none'}}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:12}}>
        {list.map((c,i)=>(
          <div key={c.id} onClick={()=>setSel(sel?.id===c.id?null:c)} style={{display:'flex',flexDirection:'column',gap:11,background:C.card,border:`1px solid ${sel?.id===c.id?C.purple:C.border}`,borderRadius:12,padding:16,cursor:'pointer',transition:'border 0.15s'}}>
            <div style={{display:'flex',alignItems:'center',gap:11}}><div style={{width:42,height:42,borderRadius:'50%',background:`linear-gradient(135deg,${GR[i%GR.length]},${GR[(i+1)%GR.length]})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff',flexShrink:0}}>{c.name[0]}</div><div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:C.text}}>{c.name}</div><div style={{fontSize:11,color:C.muted}}>{c.phone||'—'}</div></div></div>
            <div style={{display:'flex',justifyContent:'space-between',paddingTop:9,borderTop:`1px solid ${C.border}`}}><span style={{fontSize:10,color:C.muted}}>{c.email||'—'}</span>{c.birth_date&&<span style={{fontSize:10,color:C.pink}}>🎂 {new Date(c.birth_date+'T00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</span>}</div>
          </div>
        ))}
        {list.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:C.muted}}><div style={{fontSize:36,marginBottom:10}}>◎</div><div>Nenhuma cliente encontrada</div></div>}
      </div>
      {sel&&(
        <div style={{background:C.card,border:`1px solid ${C.purple}44`,borderRadius:12,padding:18}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><span style={{fontSize:15,fontWeight:700,color:C.text}}>{sel.name}</span><button onClick={()=>setSel(null)} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:18}}>×</button></div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:sel.notes?12:0}}>
            {[['Telefone',sel.phone||'—'],['Email',sel.email||'—'],['Aniversário',sel.birth_date?new Date(sel.birth_date+'T00:00').toLocaleDateString('pt-BR'):'—']].map(([l,v])=>(
              <div key={l} style={{background:C.card2,borderRadius:8,padding:'10px 12px'}}><div style={{fontSize:9,color:C.muted,fontFamily:'monospace',textTransform:'uppercase',marginBottom:3}}>{l}</div><div style={{fontSize:12,color:C.text,fontWeight:600}}>{v}</div></div>
            ))}
          </div>
          {sel.notes&&<div style={{background:C.card2,borderRadius:8,padding:'10px 12px'}}><div style={{fontSize:9,color:C.muted,fontFamily:'monospace',textTransform:'uppercase',marginBottom:3}}>Observações</div><div style={{fontSize:12,color:C.text}}>{sel.notes}</div></div>}
        </div>
      )}
      {modal&&(
        <div onClick={e=>e.target===e.currentTarget&&setModal(false)} style={{position:'fixed',inset:0,zIndex:1000,background:'#00000088',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:16,padding:24,width:'100%',maxWidth:420,display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><span style={{fontSize:15,fontWeight:700,color:C.text}}>Nova Cliente</span><button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:C.muted,fontSize:20,cursor:'pointer'}}>×</button></div>
            <Field label="Nome completo" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="Ex: Maria Silva"/>
            <Field label="Telefone / WhatsApp" value={form.phone} onChange={v=>setForm(f=>({...f,phone:v}))} placeholder="(66) 99999-0000"/>
            <Field label="Email (opcional)" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} type="email"/>
            <Field label="Data de aniversário" value={form.birth_date} onChange={v=>setForm(f=>({...f,birth_date:v}))} type="date"/>
            <Field label="Observações" value={form.notes} onChange={v=>setForm(f=>({...f,notes:v}))} placeholder="Alergias, preferências..."/>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:4}}><button onClick={()=>setModal(false)} style={{background:'transparent',border:`1px solid ${C.border2}`,borderRadius:8,padding:'7px 16px',color:C.muted,cursor:'pointer',fontFamily:'inherit',fontSize:13}}>Cancelar</button><button onClick={save} disabled={saving} style={{background:C.purple,color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:saving?0.6:1}}>{saving?'Salvando...':'Cadastrar'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
