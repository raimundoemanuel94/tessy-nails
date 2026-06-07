'use client'
import {useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase/client'
import type {Studio,SalonSettings} from '@/types/database'
const C={bg:'#080812',card:'#10101f',card2:'#17172a',border:'#1c1c36',border2:'#26264a',purple:'#a78bfa',green:'#34d399',text:'#e8e8f8',muted:'#6b6b9a'}
function Field({label,value,onChange,type='text',placeholder}:{label:string,value:string|number,onChange:(v:string)=>void,type?:string,placeholder?:string}){return <div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:C.muted,fontFamily:'monospace'}}>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{background:C.bg,border:`1px solid ${C.border2}`,borderRadius:8,padding:'8px 12px',color:C.text,fontSize:13,fontFamily:'inherit',outline:'none'}}/></div>}
function Toggle({on,onClick}:{on:boolean,onClick:()=>void}){return <button onClick={onClick} style={{width:40,height:22,borderRadius:11,border:'none',cursor:'pointer',position:'relative',background:on?C.purple:C.border2,transition:'background 0.2s',flexShrink:0}}><div style={{position:'absolute',top:3,width:16,height:16,borderRadius:8,background:'#fff',transition:'left 0.2s',left:on?21:3}}/></button>}
const DIAS:[string,string][]=[['monday','Segunda'],['tuesday','Terça'],['wednesday','Quarta'],['thursday','Quinta'],['friday','Sexta'],['saturday','Sábado'],['sunday','Domingo']]
export default function ConfiguracoesPage(){
  const [studio,setStudio]=useState<Studio|null>(null)
  const [settings,setSettings]=useState<SalonSettings|null>(null)
  const [loading,setLoading]=useState(true)
  const [saved,setSaved]=useState(false)
  const [saving,setSaving]=useState(false)
  const [tab,setTab]=useState('studio')
  useEffect(()=>{
    const load=async()=>{
      const sb=createClient()
      const {data:{user}}=await sb.auth.getUser()
      if(!user)return
      const {data:p}=await sb.from('profiles').select('studio_id').eq('id',user.id).single()
      if(!p||!p.studio_id)return
      const [{data:s},{data:cfg}]=await Promise.all([sb.from('studios').select('*').eq('id',p.studio_id).single(),sb.from('salon_settings').select('*').eq('studio_id',p.studio_id).single()])
      setStudio(s);setSettings(cfg);setLoading(false)
    };load()
  },[])
  const saveAll=async()=>{
    if(!studio||!settings)return
    setSaving(true)
    const sb=createClient()
    await Promise.all([sb.from('studios').update({name:studio.name,phone:studio.phone,address:studio.address}).eq('id',studio.id),sb.from('salon_settings').update({slot_duration:settings.slot_duration,cancel_hours:settings.cancel_hours,auto_confirm:settings.auto_confirm,working_hours:settings.working_hours}).eq('studio_id',settings.studio_id)])
    setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2500)
  }
  const wh=(settings?.working_hours as any)||{}
  const setWh=(day:string,field:string,val:any)=>setSettings(s=>s?{...s,working_hours:{...wh,[day]:{...wh[day],[field]:val}}}:s)
  if(loading)return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',color:C.muted}}>Carregando...</div>
  const TABS=[{id:'studio',l:'📍 Studio'},{id:'horarios',l:'◷ Horários'},{id:'preferencias',l:'⚙ Preferências'}]
  return(
    <div style={{display:'flex',flexDirection:'column',gap:20,maxWidth:680}}>
      <div><h1 style={{fontSize:20,fontWeight:800,color:'#fff',margin:0}}>Configurações</h1><p style={{color:C.muted,fontSize:12,margin:'3px 0 0'}}>Personalize o seu studio</p></div>
      <div style={{display:'flex',gap:4,background:C.card2,borderRadius:10,padding:4}}>{TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'8px 10px',borderRadius:7,border:'none',cursor:'pointer',background:tab===t.id?C.card:'transparent',color:tab===t.id?C.text:C.muted,fontFamily:'inherit',fontSize:12,fontWeight:tab===t.id?600:400,transition:'all 0.15s'}}>{t.l}</button>)}</div>
      {tab==='studio'&&studio&&(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,display:'flex',flexDirection:'column',gap:14}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><Field label="Nome do studio" value={studio.name} onChange={v=>setStudio(s=>s?{...s,name:v}:s)}/><Field label="Telefone" value={studio.phone||''} onChange={v=>setStudio(s=>s?{...s,phone:v}:s)}/></div><Field label="Endereço" value={studio.address||''} onChange={v=>setStudio(s=>s?{...s,address:v}:s)}/><div style={{display:'flex',alignItems:'center',gap:8,background:C.card2,borderRadius:8,padding:'8px 12px'}}><span style={{width:7,height:7,borderRadius:'50%',background:C.green,display:'inline-block'}}/><span style={{fontSize:11,color:C.muted}}>{studio.slug}.nailit.app · Plano {studio.plan}</span></div></div>)}
      {tab==='horarios'&&settings&&(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,display:'flex',flexDirection:'column',gap:12}}>{DIAS.map(([k,l])=>{const h=wh[k]||{open:false,start:'09:00',end:'18:00'};return(<div key={k} style={{display:'flex',alignItems:'center',gap:12}}><Toggle on={!!h.open} onClick={()=>setWh(k,'open',!h.open)}/><span style={{fontSize:13,color:h.open?C.text:C.muted,minWidth:100,fontWeight:h.open?600:400}}>{l}</span>{h.open&&<><input type="time" value={h.start||'09:00'} onChange={e=>setWh(k,'start',e.target.value)} style={{background:C.bg,border:`1px solid ${C.border2}`,borderRadius:7,padding:'5px 9px',color:C.text,fontSize:12,fontFamily:'inherit'}}/><span style={{color:C.muted,fontSize:11}}>até</span><input type="time" value={h.end||'18:00'} onChange={e=>setWh(k,'end',e.target.value)} style={{background:C.bg,border:`1px solid ${C.border2}`,borderRadius:7,padding:'5px 9px',color:C.text,fontSize:12,fontFamily:'inherit'}}/></>}{!h.open&&<span style={{fontSize:11,color:'#2a2a46'}}>Fechado</span>}</div>)})}</div>)}
      {tab==='preferencias'&&settings&&(<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:20,display:'flex',flexDirection:'column',gap:14}}><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:C.muted,fontFamily:'monospace'}}>Duração do slot</label><select value={settings.slot_duration} onChange={e=>setSettings(s=>s?{...s,slot_duration:Number(e.target.value)}:s)} style={{background:C.bg,border:`1px solid ${C.border2}`,borderRadius:8,padding:'8px 12px',color:C.text,fontSize:13,fontFamily:'inherit',outline:'none'}}>{[15,30,45,60].map(v=><option key={v} value={v} style={{background:C.card2}}>{v} minutos</option>)}</select></div><div style={{display:'flex',flexDirection:'column',gap:4}}><label style={{fontSize:11,color:C.muted,fontFamily:'monospace'}}>Cancelamento mínimo</label><select value={settings.cancel_hours} onChange={e=>setSettings(s=>s?{...s,cancel_hours:Number(e.target.value)}:s)} style={{background:C.bg,border:`1px solid ${C.border2}`,borderRadius:8,padding:'8px 12px',color:C.text,fontSize:13,fontFamily:'inherit',outline:'none'}}>{[1,2,6,12,24,48].map(v=><option key={v} value={v} style={{background:C.card2}}>{v}h antes</option>)}</select></div></div><div style={{display:'flex',alignItems:'center',gap:14,padding:14,background:C.card2,borderRadius:10}}><Toggle on={!!settings.auto_confirm} onClick={()=>setSettings(s=>s?{...s,auto_confirm:!s.auto_confirm}:s)}/><div><div style={{fontSize:13,fontWeight:600,color:C.text}}>Confirmação automática</div><div style={{fontSize:11,color:C.muted}}>Agendamentos públicos confirmam automaticamente</div></div></div></div>)}
      <div style={{display:'flex',gap:8,alignItems:'center',justifyContent:'flex-end'}}>{saved&&<span style={{fontSize:12,color:C.green}}>✓ Salvo com sucesso!</span>}<button onClick={saveAll} disabled={saving} style={{background:C.purple,color:'#fff',border:'none',borderRadius:8,padding:'8px 18px',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',opacity:saving?0.6:1}}>{saving?'Salvando...':'Salvar configurações'}</button></div>
    </div>
  )
}
