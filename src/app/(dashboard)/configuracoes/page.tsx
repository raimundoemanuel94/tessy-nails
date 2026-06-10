// @ts-nocheck
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Studio, SalonSettings } from '@/types/database'

const C = { bg:'#080612',card:'#10101f',card2:'#17172a',border:'#1c1c36',border2:'#26264a',purple:'#7C5CBF',green:'#22d47b',text:'#F4F2FB',muted:'#736C8E' }

function Field({ label, value, onChange, type='text', placeholder }: { label:string; value:string|number; onChange:(v:string)=>void; type?:string; placeholder?:string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:14 }}>
      <label style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' }}>{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:8, padding:'9px 13px', color:C.text, fontSize:13, fontFamily:'inherit', outline:'none' }}/>
    </div>
  )
}

function Toggle({ on, onClick }: { on:boolean; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ width:42, height:24, borderRadius:12, border:'none', cursor:'pointer', position:'relative', background:on?C.purple:C.border2, transition:'background 0.2s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:3, width:18, height:18, borderRadius:9, background:'#fff', transition:'left 0.2s', left:on?21:3, boxShadow:'0 2px 6px rgba(0,0,0,.3)' }}/>
    </button>
  )
}

const DAYS: [string, string][] = [
  ['monday','Segunda'],['tuesday','Terça'],['wednesday','Quarta'],
  ['thursday','Quinta'],['friday','Sexta'],['saturday','Sábado'],['sunday','Domingo']
]

export default function ConfiguracoesPage() {
  const [studio, setStudio]     = useState<Studio | null>(null)
  const [settings, setSettings] = useState<SalonSettings | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [tab, setTab]           = useState('studio')

  useEffect(() => {
    const load = async () => {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data: p } = await sb.from('profiles').select('studio_id').eq('id', user.id).single()
      if (!p || !p.studio_id) return
      const [{ data: s }, { data: cfg }] = await Promise.all([
        sb.from('studios').select('*').eq('id', p.studio_id).single(),
        sb.from('salon_settings').select('*').eq('studio_id', p.studio_id).single()
      ])
      setStudio(s); setSettings(cfg); setLoading(false)
    }
    load()
  }, [])

  const saveAll = async () => {
    if (!studio || !settings) return
    setSaving(true)
    const sb = createClient()
    await Promise.all([
      sb.from('studios').update({
        name: studio.name, phone: studio.phone, address: studio.address,
        whatsapp: studio.whatsapp, instagram: studio.instagram, brand_color: studio.brand_color
      }).eq('id', studio.id),
      sb.from('salon_settings').update({
        slot_duration: settings.slot_duration, cancel_hours: settings.cancel_hours,
        auto_confirm: settings.auto_confirm, working_hours: settings.working_hours
      }).eq('studio_id', settings.studio_id)
    ])
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  // working_hours usa formato correto: { monday: { is_open, open, close } }
  const wh = (settings?.working_hours as any) || {}
  const setWh = (day: string, field: string, val: any) =>
    setSettings(s => s ? { ...s, working_hours: { ...wh, [day]: { ...wh[day], [field]: val } } } : s)

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:12 }}>
      <div style={{ width:34, height:34, borderRadius:'50%', border:`3px solid ${C.purple}`, borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const TABS = [{ id:'studio', l:'📍 Studio' }, { id:'horarios', l:'◷ Horários' }, { id:'pref', l:'⚙ Pref.' }]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:700 }}>
      <div>
        <h1 style={{ fontSize:20, fontWeight:800, color:'#fff', margin:0 }}>Configurações</h1>
        <p style={{ color:C.muted, fontSize:12, margin:'3px 0 0' }}>Personalize o seu studio</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:C.card2, borderRadius:12, padding:5, border:`1px solid ${C.border}` }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex:1, padding:'9px', borderRadius:9, border:'none', cursor:'pointer',
              background:tab===t.id?`linear-gradient(135deg,#9D7FD4,${C.purple})`:'transparent',
              color:tab===t.id?'#fff':C.muted, fontFamily:'inherit', fontSize:12, fontWeight:600,
              boxShadow:tab===t.id?'0 4px 14px rgba(124,92,191,.4)':'none', transition:'all .15s' }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Tab: Studio */}
      {tab === 'studio' && studio && (
        <>
          {/* Identidade da marca */}
          <div style={{ position:'relative', overflow:'hidden', borderRadius:18, padding:18,
            background:`linear-gradient(135deg,rgba(124,92,191,.25),${C.card})`,
            border:`1px solid rgba(124,92,191,.35)` }}>
            <div style={{ position:'absolute', top:-40, right:-30, width:130, height:130, borderRadius:'50%', background:studio.brand_color||C.purple, opacity:.18, filter:'blur(30px)' }}/>
            <div style={{ position:'relative', display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
              <div style={{ width:52, height:52, borderRadius:16, background:`linear-gradient(140deg,${studio.brand_color||C.purple},rgba(0,0,0,.4))`,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff',
                boxShadow:`0 6px 20px ${studio.brand_color||C.purple}55` }}>
                {studio.avatar_url
                  ? <img src={studio.avatar_url} style={{ width:'100%', height:'100%', borderRadius:14, objectFit:'cover' }} alt="logo"/>
                  : (studio.name||'?').slice(0,2).toUpperCase()
                }
              </div>
              <div>
                <div style={{ fontFamily:'Georgia,serif', fontSize:18, fontWeight:600, color:'#fff' }}>{studio.name}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.5)' }}>Identidade da marca</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' }}>Cor principal</label>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <input type="color" value={studio.brand_color||'#7C5CBF'}
                    onChange={e => setStudio(s => s ? { ...s, brand_color: e.target.value } : s)}
                    style={{ width:42, height:42, border:'none', background:'none', cursor:'pointer', borderRadius:10, padding:0 }}/>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, fontFamily:'monospace', color:'#fff' }}>{(studio.brand_color||'#7C5CBF').toUpperCase()}</div>
                    <div style={{ fontSize:10, color:C.muted }}>toca pra mudar</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:20 }}>
            <Field label="Nome do studio" value={studio.name} onChange={v => setStudio(s => s ? { ...s, name:v } : s)}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Telefone" value={studio.phone||''} onChange={v => setStudio(s => s ? { ...s, phone:v } : s)} placeholder="(66) 99999-0000"/>
              <Field label="WhatsApp" value={studio.whatsapp||''} onChange={v => setStudio(s => s ? { ...s, whatsapp:v } : s)} placeholder="(66) 99999-0000"/>
            </div>
            <Field label="Endereço" value={studio.address||''} onChange={v => setStudio(s => s ? { ...s, address:v } : s)} placeholder="Rua, número, cidade"/>
            <Field label="Instagram" value={studio.instagram||''} onChange={v => setStudio(s => s ? { ...s, instagram:v } : s)} placeholder="@seustudio"/>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:C.card2, borderRadius:10, padding:'10px 13px' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:C.green, boxShadow:`0 0 8px ${C.green}` }}/>
              <span style={{ fontSize:11, color:C.muted }}>{studio.slug}.nailit.app · <b style={{ color:'#f0b64a' }}>Plano {studio.plan}</b></span>
            </div>
          </div>
        </>
      )}

      {/* Tab: Horários */}
      {tab === 'horarios' && settings && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:20, display:'flex', flexDirection:'column', gap:14 }}>
          {DAYS.map(([key, label]) => {
            const h = wh[key] || { is_open: false, open: '09:00', close: '18:00' }
            return (
              <div key={key} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <Toggle on={!!h.is_open} onClick={() => setWh(key, 'is_open', !h.is_open)}/>
                <span style={{ fontSize:13, color:h.is_open?C.text:C.muted, minWidth:84, fontWeight:h.is_open?600:400 }}>{label}</span>
                {h.is_open ? (
                  <>
                    <input type="time" value={h.open||'09:00'} onChange={e => setWh(key, 'open', e.target.value)}
                      style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:8, padding:'6px 10px', color:C.text, fontSize:12, fontFamily:'inherit' }}/>
                    <span style={{ color:C.muted, fontSize:11 }}>até</span>
                    <input type="time" value={h.close||'18:00'} onChange={e => setWh(key, 'close', e.target.value)}
                      style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:8, padding:'6px 10px', color:C.text, fontSize:12, fontFamily:'inherit' }}/>
                  </>
                ) : (
                  <span style={{ fontSize:11, color:'#2a2a46' }}>Fechado</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Tab: Preferências */}
      {tab === 'pref' && settings && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:20, display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' }}>Slot de agendamento</label>
              <select value={settings.slot_duration} onChange={e => setSettings(s => s ? { ...s, slot_duration: Number(e.target.value) } : s)}
                style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:8, padding:'9px 13px', color:C.text, fontSize:13, fontFamily:'inherit', outline:'none' }}>
                {[15,30,45,60].map(v => <option key={v} value={v} style={{ background:C.card2 }}>{v} minutos</option>)}
              </select>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' }}>Cancelamento mín.</label>
              <select value={settings.cancel_hours} onChange={e => setSettings(s => s ? { ...s, cancel_hours: Number(e.target.value) } : s)}
                style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:8, padding:'9px 13px', color:C.text, fontSize:13, fontFamily:'inherit', outline:'none' }}>
                {[1,2,6,12,24,48].map(v => <option key={v} value={v} style={{ background:C.card2 }}>{v}h antes</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:14, padding:14, background:C.card2, borderRadius:12, border:`1px solid ${C.border}` }}>
            <Toggle on={!!settings.auto_confirm} onClick={() => setSettings(s => s ? { ...s, auto_confirm: !s.auto_confirm } : s)}/>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:C.text }}>Confirmação automática</div>
              <div style={{ fontSize:11, color:C.muted }}>Agendamentos públicos confirmam sozinhos</div>
            </div>
          </div>
        </div>
      )}

      {/* Salvar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10 }}>
        {saved && <span style={{ fontSize:12, color:C.green }}>✓ Salvo com sucesso!</span>}
        <button onClick={saveAll} disabled={saving}
          style={{ background:`linear-gradient(135deg,#9D7FD4,${C.purple})`, color:'#fff', border:'none', borderRadius:12, padding:'10px 24px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', opacity:saving?0.6:1, boxShadow:'0 4px 16px rgba(124,92,191,.4)' }}>
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  )
}
