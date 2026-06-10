// @ts-nocheck
'use client'
// @ts-nocheck
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const C = { bg:'#080612',card:'#10101f',card2:'#17172a',border:'#1c1c36',border2:'#26264a',purple:'#7C5CBF',green:'#22d47b',red:'#f55a5a',gold:'#f0b64a',text:'#F4F2FB',muted:'#736C8E' }
const PLANS = ['free','starter','pro','studio']
const fR = (n: number) => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`

function Field({ label, value, onChange, type='text', placeholder }: any) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:13 }}>
      <label style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' }}>{label}</label>
      <input type={type} value={value||''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ height:44, padding:'0 13px', background:C.bg, border:`1px solid ${C.border2}`, borderRadius:11, color:C.text, fontSize:13, fontFamily:'inherit', outline:'none' }}/>
    </div>
  )
}

export default function AdminClient({ studios: initialStudios }: { studios: any[] }) {
  const [studios, setStudios]   = useState(initialStudios)
  const [view, setView]         = useState<'list'|'edit'|'new'>('list')
  const [sel, setSel]           = useState<any>(null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [newForm, setNewForm]   = useState({ name:'', slug:'', plan:'pro', brand_color:'#7C5CBF', whatsapp:'', instagram:'', address:'' })

  const total = {
    studios: studios.length,
    active:  studios.filter(s => s.is_active).length,
    appts:   studios.reduce((a,s) => a + s.appt_count, 0),
    clients: studios.reduce((a,s) => a + s.client_count, 0),
  }

  const saveStudio = async () => {
    if (!sel) return
    setSaving(true)
    const sb = createClient()
    const { data } = await sb.from('studios').update({
      name: sel.name, plan: sel.plan, brand_color: sel.brand_color,
      whatsapp: sel.whatsapp, instagram: sel.instagram, address: sel.address,
      is_active: sel.is_active,
    }).eq('id', sel.id).select().single()
    if (data) setStudios(p => p.map(s => s.id === sel.id ? { ...sel, ...data } : s))
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const toggleActive = async (studio: any) => {
    const sb = createClient()
    await sb.from('studios').update({ is_active: !studio.is_active }).eq('id', studio.id)
    setStudios(p => p.map(s => s.id === studio.id ? { ...s, is_active: !s.is_active } : s))
    if (sel?.id === studio.id) setSel((s: any) => ({ ...s, is_active: !s.is_active }))
  }

  const createStudio = async () => {
    if (!newForm.name || !newForm.slug) return
    setSaving(true)
    const sb = createClient()
    const { data } = await sb.from('studios').insert({
      name: newForm.name, slug: newForm.slug.toLowerCase().replace(/\s+/g,'-'),
      plan: newForm.plan, brand_color: newForm.brand_color,
      whatsapp: newForm.whatsapp || null, instagram: newForm.instagram || null,
      address: newForm.address || null,
    }).select().single()
    if (data) {
      // create default salon_settings
      await sb.from('salon_settings').insert({ studio_id: data.id })
      setStudios(p => [{ ...data, appt_count:0, client_count:0, svc_count:0, profiles:null }, ...p])
      setView('list')
    }
    setSaving(false)
  }

  const planColor: Record<string,string> = { free:'#736C8E', starter:'#5a9ef5', pro:C.purple, studio:C.gold }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'"Plus Jakarta Sans",-apple-system,sans-serif', color:C.text,
      backgroundImage:'radial-gradient(600px circle at 50% -80px, rgba(124,92,191,.15), transparent 70%)' }}>

      {/* Top bar */}
      <header style={{ padding:'16px 24px', borderBottom:`1px solid ${C.border}`, background:'rgba(8,6,18,.8)',
        backdropFilter:'blur(16px)', position:'sticky', top:0, zIndex:20, display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:36, height:36, borderRadius:11, background:`linear-gradient(140deg,#9D7FD4,${C.purple})`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, boxShadow:'0 4px 16px rgba(124,92,191,.4)' }}>💅</div>
        <div>
          <div style={{ fontFamily:'Georgia,serif', fontSize:16, fontWeight:600 }}>Nailit</div>
          <div style={{ fontSize:9, color:C.purple, fontWeight:700, letterSpacing:'.2em' }}>SUPERADMIN</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          {view !== 'list' && (
            <button onClick={() => { setView('list'); setSel(null); setSaved(false) }}
              style={{ background:'none', border:`1px solid ${C.border2}`, borderRadius:9, padding:'7px 14px', color:C.muted, cursor:'pointer', fontFamily:'inherit', fontSize:12 }}>
              ← Studios
            </button>
          )}
          {view === 'list' && (
            <button onClick={() => setView('new')}
              style={{ height:36, padding:'0 16px', borderRadius:11, background:`linear-gradient(135deg,#9D7FD4,${C.purple})`, color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:13, fontFamily:'inherit', boxShadow:'0 4px 14px rgba(124,92,191,.4)' }}>
              + Novo studio
            </button>
          )}
        </div>
      </header>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 20px' }}>

        {/* List view */}
        {view === 'list' && (
          <>
            {/* KPIs */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
              {[
                ['Studios',total.studios,C.purple,'⊞'],
                ['Ativos',total.active,C.green,'●'],
                ['Agendamentos',total.appts,'#5a9ef5','☰'],
                ['Clientes',total.clients,C.gold,'◎'],
              ].map(([l,v,c,i]) => (
                <div key={l as string} style={{ position:'relative', overflow:'hidden', background:`linear-gradient(180deg,${C.card2},${C.card})`,
                  border:`1px solid ${C.border}`, borderRadius:16, padding:'14px 16px' }}>
                  <div style={{ position:'absolute', top:0, left:12, right:12, height:2, background:`linear-gradient(90deg,transparent,${c as string},transparent)` }}/>
                  <div style={{ position:'absolute', top:10, right:12, fontSize:16, color:c as string, opacity:.4 }}>{i as string}</div>
                  <div style={{ fontSize:9, color:C.muted, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>{l as string}</div>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:26, fontWeight:600, marginTop:5, color:'#fff' }}>{v as number}</div>
                </div>
              ))}
            </div>

            {/* Studios list */}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {studios.map(s => (
                <div key={s.id} style={{ background:`linear-gradient(180deg,${C.card2},${C.card})`, border:`1px solid ${C.border}`,
                  borderRadius:16, padding:'14px 18px', display:'flex', alignItems:'center', gap:14 }}>
                  {/* Logo */}
                  <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(140deg,${s.brand_color||C.purple},rgba(0,0,0,.4))`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#fff', fontSize:15,
                    fontFamily:'Georgia,serif', flexShrink:0, boxShadow:`0 4px 14px ${s.brand_color||C.purple}44` }}>
                    {s.avatar_url ? <img src={s.avatar_url} style={{ width:'100%', height:'100%', borderRadius:12, objectFit:'cover' }} alt="" /> : s.name.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:14, fontWeight:700 }}>{s.name}</span>
                      <span style={{ fontSize:9, padding:'2px 8px', borderRadius:6, fontWeight:700, textTransform:'uppercase',
                        background:`${planColor[s.plan]||C.muted}22`, color:planColor[s.plan]||C.muted,
                        border:`1px solid ${planColor[s.plan]||C.muted}33` }}>{s.plan}</span>
                      {!s.is_active && <span style={{ fontSize:9, padding:'2px 8px', borderRadius:6, fontWeight:700, background:`${C.red}18`, color:C.red, border:`1px solid ${C.red}30` }}>BLOQUEADO</span>}
                    </div>
                    <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.slug}.nailit.app</div>
                    <div style={{ display:'flex', gap:14, marginTop:6 }}>
                      {[['☰',s.appt_count,'agend.'],['◎',s.client_count,'clientes'],['✦',s.svc_count,'serviços']].map(([ic,n,l]) => (
                        <span key={l as string} style={{ fontSize:10, color:C.muted }}><span style={{ color:'#fff', fontWeight:600 }}>{n as number}</span> {l as string}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    <button onClick={() => toggleActive(s)}
                      style={{ padding:'6px 12px', borderRadius:9, border:`1px solid ${s.is_active?C.green:C.red}44`,
                        background:s.is_active?`${C.green}18`:`${C.red}18`, color:s.is_active?C.green:C.red,
                        cursor:'pointer', fontSize:11, fontWeight:600, fontFamily:'inherit' }}>
                      {s.is_active ? '● Ativo' : '○ Bloqueado'}
                    </button>
                    <button onClick={() => { setSel({ ...s }); setView('edit') }}
                      style={{ padding:'6px 14px', borderRadius:9, border:`1px solid ${C.border2}`, background:'none',
                        color:C.muted, cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Edit view */}
        {view === 'edit' && sel && (
          <div style={{ maxWidth:560 }}>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:22, fontWeight:600, margin:'0 0 20px' }}>Editar studio</h2>
            {/* Brand preview */}
            <div style={{ position:'relative', overflow:'hidden', borderRadius:18, padding:18, marginBottom:20,
              background:`linear-gradient(135deg,rgba(${sel.brand_color||'124,92,191'},.25),${C.card})`,
              border:`1px solid rgba(124,92,191,.3)` }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                <div style={{ width:52, height:52, borderRadius:16, background:`linear-gradient(140deg,${sel.brand_color||C.purple},rgba(0,0,0,.4))`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#fff', fontSize:20, fontFamily:'Georgia,serif' }}>
                  {sel.name.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:17, fontWeight:600 }}>{sel.name}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{sel.slug}.nailit.app</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <input type="color" value={sel.brand_color||'#7C5CBF'} onChange={e => setSel((s: any) => ({ ...s, brand_color: e.target.value }))}
                  style={{ width:42, height:42, border:'none', background:'none', cursor:'pointer', borderRadius:10, padding:0 }}/>
                <div><div style={{ fontSize:13, fontWeight:700, fontFamily:'monospace', color:'#fff' }}>{(sel.brand_color||'#7C5CBF').toUpperCase()}</div><div style={{ fontSize:10, color:C.muted }}>Cor da marca</div></div>
                <div style={{ marginLeft:'auto', display:'flex', flexDirection:'column', gap:4 }}>
                  <label style={{ fontSize:9, color:C.muted, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' }}>Plano</label>
                  <select value={sel.plan} onChange={e => setSel((s: any) => ({ ...s, plan: e.target.value }))}
                    style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:8, padding:'6px 10px', color:C.text, fontSize:12, fontFamily:'inherit', outline:'none' }}>
                    {PLANS.map(p => <option key={p} value={p} style={{ background:C.card2 }}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:20 }}>
              <Field label="Nome" value={sel.name} onChange={(v: string) => setSel((s: any) => ({ ...s, name:v }))}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Field label="WhatsApp" value={sel.whatsapp} onChange={(v: string) => setSel((s: any) => ({ ...s, whatsapp:v }))} placeholder="(66) 99999-0000"/>
                <Field label="Instagram" value={sel.instagram} onChange={(v: string) => setSel((s: any) => ({ ...s, instagram:v }))} placeholder="@studio"/>
              </div>
              <Field label="Endereço" value={sel.address} onChange={(v: string) => setSel((s: any) => ({ ...s, address:v }))}/>
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:12, background:C.card2, borderRadius:11, marginTop:4 }}>
                <span style={{ fontSize:12, color:C.muted, flex:1 }}>Status do studio</span>
                <button onClick={() => setSel((s: any) => ({ ...s, is_active: !s.is_active }))}
                  style={{ padding:'6px 14px', borderRadius:9, border:`1px solid ${sel.is_active?C.green:C.red}44`,
                    background:sel.is_active?`${C.green}18`:`${C.red}18`, color:sel.is_active?C.green:C.red,
                    cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
                  {sel.is_active ? '● Ativo' : '○ Bloqueado'}
                </button>
              </div>
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, marginTop:18 }}>
              {saved && <span style={{ fontSize:12, color:C.green }}>✓ Salvo!</span>}
              <button onClick={() => { setView('list'); setSel(null) }}
                style={{ background:'none', border:`1px solid ${C.border2}`, borderRadius:10, padding:'9px 18px', color:C.muted, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
                Cancelar
              </button>
              <button onClick={saveStudio} disabled={saving}
                style={{ background:`linear-gradient(135deg,#9D7FD4,${C.purple})`, color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(124,92,191,.4)', opacity:saving?0.6:1 }}>
                {saving ? 'Salvando...' : 'Salvar studio'}
              </button>
            </div>
          </div>
        )}

        {/* New studio */}
        {view === 'new' && (
          <div style={{ maxWidth:560 }}>
            <h2 style={{ fontFamily:'Georgia,serif', fontSize:22, fontWeight:600, margin:'0 0 20px' }}>Novo studio</h2>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:20 }}>
              <Field label="Nome do studio *" value={newForm.name} onChange={(v: string) => { setNewForm(f => ({ ...f, name:v, slug:v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'') })) }} placeholder="Ex: Bella Studio"/>
              <Field label="Slug (URL) *" value={newForm.slug} onChange={(v: string) => setNewForm(f => ({ ...f, slug:v.toLowerCase().replace(/[^a-z0-9-]/g,'') }))} placeholder="bella-studio"/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Field label="WhatsApp" value={newForm.whatsapp} onChange={(v: string) => setNewForm(f => ({ ...f, whatsapp:v }))} placeholder="(66) 99999-0000"/>
                <Field label="Instagram" value={newForm.instagram} onChange={(v: string) => setNewForm(f => ({ ...f, instagram:v }))} placeholder="@studio"/>
              </div>
              <Field label="Endereço" value={newForm.address} onChange={(v: string) => setNewForm(f => ({ ...f, address:v }))}/>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <label style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' }}>Plano</label>
                  <select value={newForm.plan} onChange={e => setNewForm(f => ({ ...f, plan:e.target.value }))}
                    style={{ height:44, padding:'0 13px', background:C.bg, border:`1px solid ${C.border2}`, borderRadius:11, color:C.text, fontSize:13, fontFamily:'inherit', outline:'none' }}>
                    {PLANS.map(p => <option key={p} value={p} style={{ background:C.card2 }}>{p}</option>)}
                  </select>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  <label style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' }}>Cor da marca</label>
                  <div style={{ display:'flex', alignItems:'center', gap:10, height:44, padding:'0 13px', background:C.bg, border:`1px solid ${C.border2}`, borderRadius:11 }}>
                    <input type="color" value={newForm.brand_color} onChange={e => setNewForm(f => ({ ...f, brand_color:e.target.value }))}
                      style={{ width:32, height:32, border:'none', background:'none', cursor:'pointer', padding:0, borderRadius:8 }}/>
                    <span style={{ fontSize:12, fontFamily:'monospace', color:C.muted }}>{newForm.brand_color.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div style={{ padding:10, background:C.card2, borderRadius:10, fontSize:11, color:C.muted, marginBottom:16 }}>
                URL pública: <b style={{ color:C.text }}>{newForm.slug||'slug'}.nailit.app</b>
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button onClick={() => setView('list')}
                  style={{ background:'none', border:`1px solid ${C.border2}`, borderRadius:10, padding:'9px 18px', color:C.muted, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
                  Cancelar
                </button>
                <button onClick={createStudio} disabled={saving || !newForm.name || !newForm.slug}
                  style={{ background:`linear-gradient(135deg,#9D7FD4,${C.purple})`, color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 16px rgba(124,92,191,.4)', opacity:(saving||!newForm.name||!newForm.slug)?0.5:1 }}>
                  {saving ? 'Criando...' : 'Criar studio'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
