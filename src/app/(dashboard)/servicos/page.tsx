'use client'
import {useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import type {Service} from '@/types/database'
const C={bg:'#080812',card:'#10101f',card2:'#17172a',border:'#1c1c36',border2:'#26264a',purple:'#a78bfa',pink:'#f472b6',green:'#34d399',amber:'#fbbf24',red:'#f87171',text:'#e8e8f8',muted:'#6b6b9a'}
const fR=(n:number)=>`R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const CORES=['#a78bfa','#f472b6','#818cf8','#c084fc','#a5b4fc','#f9a8d4','#fbbf24','#34d399']
const corByName=(name:string)=>CORES[name.charCodeAt(0)%CORES.length]
function Field({label,value,onChange,type='text',placeholder}:{label:string,value:string|number,onChange:(v:string)=>void,type?:string,placeholder?:string}){
  return(<div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:C.muted,fontFamily:'monospace'}}>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{background:C.bg,border:`1px solid ${C.border2}`,borderRadius:8,padding:'8px 12px',color:C.text,fontSize:13,fontFamily:'inherit',outline:'none'}}/></div>)
}
export default function ServicosPage(){
  const [svcs,setSvcs]=useState<Service[]>([])
  const [studioId,setStudioId]=useState<string|null>(null)
  const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState(false)
  const [edit,setEdit]=useState<Service|null>(null)
  const [form,setForm]=useState({name:'',price:'',duration_minutes:'60',category:'',description:''})
  const [saving,setSaving]=useState(false)
  useEffect(()=>{
    const load=async()=>{
      const sb=createClient()
      const {data:{user}}=await sb.auth.getUser()
      if(!user)return
      const {data:p}=await sb.from('profiles').select('studio_id').eq('id',user.id).single()
      if(!p?.studio_id)return
      setStudioId(p.studio_id)
      const {data}=await sb.from('services').select('*').eq('studio_id',p.studio_id).order('name')
      setSvcs(data||[]);setLoading(false)
    };load()
  },[])
  const openNew=()=>{setEdit(null);setForm({name:'',price:'',duration_minutes:'60',category:'',description:''});setModal(true)}
  const openEdit=(s:Service)=>{setEdit(s);setForm({name:s.name,price:String(s.price),duration_minutes:String(s.duration_minutes),category:s.category||'',description:s.description||''});setModal(true)}
  const save=async()=>{
    if(!form.name.trim()||!studioId)return
    setSaving(true)
    const sb=createClient()
    const payload={name:form.name,price:Number(form.price)||0,duration_minutes:Number(form.duration_minutes)||60,category:form.category||null,description:form.description||null,studio_id:studioId}
    if(edit){const {data}=await sb.from('services').update(payload).eq('id',edit.id).select().single();if(data)setSvcs(p=>p.map(s=>s.id===edit.id?data:s))}
    else{const {data}=await sb.from('services').insert(payload).select().single();if(data)setSvcs(p=>[...p,data])}
    setSaving(false);setModal(false)
  }
  const toggle=async(s:Service)=>{const sb=createClient();await sb.from('services').update({is_active:!s.is_active}).eq('id',s.id);setSvcs(p=>p.map(x=>x.id===s.id?{...x,is_active:!x.is_active}:x))}
  const del=async(id:string)=>{if(!confirm('Excluir este serviço?'))return;const sb=createClient();await sb.from('services').delete().eq('id',id);setSvcs(p=>p.filter(s=>s.id!==id))}
  if(loading)return(<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:12}}><div style={{width:36,height:36,borderRadius:'50%',border:`3px solid ${C.purple}`,borderTopColor:'transparent',animation:'spin 0.8s linear infinite'}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>)
  const ativos=svcs.filter(s=>s.is_active).length
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><div><h1 style={{fontSize:20,fontWeight:800,color:'#fff',margin:0}}>Serviços</h1><p style={{color:C.muted,fontSize:12,margin:'3px 0 0'}}>{ativos} ativos · {svcs.length-ativos} inativos</p></div><button onClick={openNew} style={{background:C.purple,color:'#fff',border:'none',borderRadius:9,padding:'9px 18px',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>+ Novo serviço</button></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:12}}>
        {svcs.map(s=>(
          <div key={s.id} style={{display:'flex',flexDirection:'column',background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:'hidden',opacity:s.is_active?1:0.55,transition:'opacity 0.2s'}}>
            <div style={{height:4,background:corByName(s.name)}}/>
            <div style={{display:'flex',flexDirection:'column',gap:12,padding:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div><div style={{fontSize:14,fontWeight:700,color:C.text}}>{s.name}</div><div style={{display:'flex',alignItems:'center',gap:6,marginTop:3}}><div style={{width:7,height:7,borderRadius:'50%',background:corByName(s.name)}}/><span style={{fontSize:10,color:C.muted}}>{s.category||'Geral'}</span></div></div>
                <div style={{display:'flex',gap:5}}><button onClick={()=>openEdit(s)} style={{background:'none',border:`1px solid ${C.border2}`,borderRadius:6,padding:'4px 9px',color:C.muted,cursor:'pointer',fontSize:11}}>✎</button><button onClick={()=>del(s.id)} style={{background:C.red+'18',border:`1px solid ${C.red}33`,borderRadius:6,padding:'4px 9px',color:C.red,cursor:'pointer',fontSize:11}}>✕</button></div>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div><div style={{fontSize:21,fontWeight:800,color:C.green}}>{fR(s.price)}</div><div style={{fontSize:11,color:C.muted}}>{s.duration_minutes} min</div></div>
                <button onClick={()=>toggle(s)} style={{padding:'5px 13px',borderRadius:20,border:`1px solid ${s.is_active?C.green:C.border2}`,background:s.is_active?C.green+'20':'transparent',color:s.is_active?C.green:C.muted,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'inherit',transition:'all 0.2s'}}>{s.is_active?'● Ativo':'○ Inativo'}</button>
              </div>
            </div>
          </div>
        ))}
        {svcs.length===0&&<div style={{gridColumn:'1/-1',textAlign:'center',padding:40,color:C.muted}}><div style={{fontSize:36,marginBottom:10}}>✦</div><div>Nenhum serviço cadastrado</div></div>}
      </div>
      {modal&&(
        <div onClick={e=>e.target===e.currentTarget&&setModal(false)} style={{position:'fixed',inset:0,zIndex:1000,background:'#00000088',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:C.card2,border:`1px solid ${C.border2}`,borderRadius:16,padding:24,width:'100%',maxWidth:440,display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><span style={{fontSize:15,fontWeight:700,color:C.text}}>{edit?'Editar Serviço':'Novo Serviço'}</span><button onClick={()=>setModal(false)} style={{background:'none',border:'none',color:C.muted,fontSize:20,cursor:'pointer'}}>×</button></div>
            <Field label="Nome do serviço" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} placeholder="Ex: Manicure em gel"/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><Field label="Preço (R$)" value={form.price} onChange={v=>setForm(f=>({...f,price:v}))} type="number"/><Field label="Duração (min)" value={form.duration_minutes} onChange={v=>setForm(f=>({...f,duration_minutes:v}))} type="number"/></div>
            <Field label="Categoria" value={form.category} onChange={v=>setForm(f=>({...f,category:v}))} placeholder="Manicure, Pedicure, Gel..."/>
            <Field label="Descrição (opcional)" value={form.description} onChange={v=>setForm(f=>({...f,description:v}))}/>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:4}}>
              <button onClick={()=>setModal(false)} style={{background:'transparent',border:`1px solid ${C.border2}`,borderRadius:8,padding:'7px 16px',color:C.muted,cursor:'pointer',fontFamily:'inherit',fontSize:13}}>Cancelar</button>
              <button onClick={save} disabled={saving} style={{background:C.purple,color:'#fff',border:'none',borderRadius:8,padding:'7px 16px',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:saving?0.6:1}}>{saving?'Salvando...':edit?'Salvar':'Criar serviço'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
