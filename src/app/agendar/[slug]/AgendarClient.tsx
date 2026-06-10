// @ts-nocheck
'use client'
import { useState } from 'react'
import { toast } from 'sonner'

type Studio   = { id:string; name:string; slug:string; avatar_url:string|null; brand_color:string; whatsapp:string|null; instagram:string|null; address:string|null; phone:string|null }
type Service  = { id:string; name:string; description:string|null; price:number; duration_minutes:number; category:string|null }
type Settings = { slot_duration:number; advance_days:number; cancel_hours:number; auto_confirm:boolean; working_hours:any } | null
type CreatedAppointment = {
  id: string
  status: string
  appointment_date: string
  client_name: string
  service_name: string
  price: number
  duration_minutes: number
  client_id?: string | null
  service_id?: string | null
  studio_id?: string
}

const fmtR = (n: number) => `R$ ${Number(n||0).toFixed(2).replace('.',',')}`
const WD = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const WDFULL = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
const pad2 = (value: number) => String(value).padStart(2, '0')
const formatLocalYmd = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
const formatPtBrDate = (value: string) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const formatPtBrDateTime = (value: string) =>
  new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const statusLabel: Record<string, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendente de confirmação',
  cancelled: 'Cancelado',
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}

export default function AgendarClient({ studio, services, settings }: { studio:Studio; services:Service[]; settings:Settings }) {
  const brand = studio.brand_color || '#7C5CBF'
  const rgb   = hexToRgb(brand)

  const [step, setStep]           = useState<'service'|'date'|'time'|'info'|'done'>('service')
  const [selSvc, setSelSvc]       = useState<Service | null>(null)
  const [selDate, setSelDate]     = useState('')
  const [selTime, setSelTime]     = useState('')
  const [name, setName]           = useState('')
  const [phone, setPhone]         = useState('')
  const [notes, setNotes]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [slots, setSlots]         = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotState, setSlotState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [slotError, setSlotError]  = useState('')
  const [bookingError, setBookingError] = useState('')
  const [createdAppointment, setCreatedAppointment] = useState<CreatedAppointment | null>(null)

  // CSS vars injected inline — brand color is fully dynamic
  const style: any = {
    '--brand': brand, '--brand-rgb': rgb,
    '--brand-light': `color-mix(in srgb, ${brand} 66%, white)`,
    '--brand-glow': `rgba(${rgb},.35)`,
    '--brand-soft': `rgba(${rgb},.14)`,
    '--bg':'#080612', '--surface':'#120F22', '--surface2':'#1A1530',
    '--border':'rgba(255,255,255,.07)', '--border2':'rgba(255,255,255,.12)',
    '--text':'#F4F2FB', '--muted':'#736C8E', '--green':'#22d47b',
  }

  // Available dates based on working_hours
  const wh = settings?.working_hours || {}
  const advanceDays = settings?.advance_days || 30
  const availableDates: string[] = []
  for (let i = 0; i < advanceDays; i++) {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() + i)
    const dayKey = WDFULL[d.getDay()]
    const h = wh[dayKey]
    if (h?.is_open) availableDates.push(formatLocalYmd(d))
  }

  const fetchSlots = async (date: string, svc: Service) => {
    setLoadingSlots(true)
    setSlots([])
    setSlotError('')
    setSlotState('loading')
    try {
      const params = new URLSearchParams({
        studioId: studio.id,
        serviceId: svc.id,
        date,
      })
      const res = await fetch(`/api/public/slots?${params.toString()}`)
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Erro ao carregar horários, tente novamente')
      }
      setSlots(Array.isArray(data?.slots) ? data.slots : [])
      setSlotState('ready')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar horários, tente novamente'
      setSlotError(message)
      setSlotState('error')
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const submit = async () => {
    if (!selSvc || !selDate || !selTime || !name || !phone) return
    setLoading(true)
    setBookingError('')

    try {
      const res = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: studio.slug,
          serviceId: selSvc.id,
          appointmentDate: `${selDate}T${selTime}:00`,
          clientName: name.trim(),
          clientPhone: phone.trim(),
          notes: notes.trim() || undefined,
        })
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Não foi possível confirmar o agendamento.')
      }

      const appointment = data?.appointment as CreatedAppointment | undefined
      if (!appointment?.id) {
        throw new Error('A confirmação não retornou os dados do agendamento.')
      }

      setCreatedAppointment(appointment)
      setStep('done')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível confirmar o agendamento.'
      setBookingError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const waLink = () => {
    const num = (studio.whatsapp || studio.phone || '').replace(/\D/g,'')
    const msg = encodeURIComponent(`Olá! Agendei um(a) ${selSvc?.name} para ${selDate?.split('-').reverse().join('/')} às ${selTime}. Meu nome é ${name}.`)
    return `https://wa.me/55${num}?text=${msg}`
  }

  const C = { brand, bg:'#080612', surface:'#120F22', surface2:'#1A1530', border:'rgba(255,255,255,.07)', border2:'rgba(255,255,255,.12)', text:'#F4F2FB', muted:'#736C8E', green:'#22d47b' }

  return (
    <div style={{ ...style, minHeight:'100vh', background:C.bg, fontFamily:'"Plus Jakarta Sans",-apple-system,sans-serif', paddingBottom:32,
      backgroundImage:`radial-gradient(600px circle at 50% -100px, rgba(${rgb},.2), transparent 70%)` }}>

      {/* Header */}
      <header style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:14, borderBottom:`1px solid ${C.border}`,
        background:'rgba(8,6,18,.8)', backdropFilter:'blur(16px)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ width:46, height:46, borderRadius:15, background:`linear-gradient(140deg,${brand},rgba(0,0,0,.4))`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, color:'#fff',
          boxShadow:`0 6px 20px rgba(${rgb},.4)`, flexShrink:0 }}>
          {studio.avatar_url
            ? <img src={studio.avatar_url} style={{ width:'100%', height:'100%', borderRadius:13, objectFit:'cover' }} alt="logo"/>
            : studio.name.slice(0,2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily:'Georgia,serif', fontSize:17, fontWeight:600, color:C.text }}>{studio.name}</div>
          <div style={{ fontSize:11, color:C.muted }}>Agendar horário</div>
        </div>
        {studio.instagram && (
          <a href={`https://instagram.com/${studio.instagram.replace('@','')}`} target="_blank" rel="noreferrer"
            style={{ marginLeft:'auto', fontSize:10, color:brand, border:`1px solid rgba(${rgb},.3)`, borderRadius:8, padding:'5px 10px', textDecoration:'none', fontWeight:600 }}>
            {studio.instagram}
          </a>
        )}
      </header>

      <div style={{ maxWidth:480, margin:'0 auto', padding:'20px 16px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Progress */}
        {step !== 'done' && (
          <div style={{ display:'flex', gap:6 }}>
            {(['service','date','time','info'] as const).map((s,i) => (
              <div key={s} style={{ flex:1, height:3, borderRadius:3, background: ['service','date','time','info'].indexOf(step) >= i ? brand : C.border, transition:'.3s' }}/>
            ))}
          </div>
        )}

        {/* STEP 1: Serviço */}
        {step === 'service' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <h1 style={{ fontFamily:'Georgia,serif', fontSize:22, fontWeight:600, color:C.text, margin:0 }}>Escolha o serviço</h1>
              <p style={{ fontSize:12, color:C.muted, margin:'4px 0 0' }}>{services.length} serviços disponíveis</p>
            </div>
            {services.map(svc => (
              <button key={svc.id} onClick={() => {
                setSelSvc(svc)
                setSelDate('')
                setSelTime('')
                setSlots([])
                setSlotError('')
                setSlotState('idle')
                setBookingError('')
                setCreatedAppointment(null)
                setStep('date')
              }}
                style={{ display:'flex', alignItems:'center', gap:14, background:`linear-gradient(180deg,${C.surface2},${C.surface})`,
                  border:`1px solid ${C.border}`, borderRadius:16, padding:16, cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'.15s' }}
                onMouseEnter={e => (e.currentTarget as any).style.borderColor = brand}
                onMouseLeave={e => (e.currentTarget as any).style.borderColor = C.border}>
                <div style={{ width:46, height:46, borderRadius:14, background:`rgba(${rgb},.15)`, border:`1px solid rgba(${rgb},.25)`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>💅</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{svc.name}</div>
                  {svc.description && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{svc.description}</div>}
                  <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{svc.duration_minutes} min</div>
                </div>
                <div style={{ fontFamily:'Georgia,serif', fontSize:18, fontWeight:600, color:C.green }}>{fmtR(svc.price)}</div>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2: Data */}
        {step === 'date' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button onClick={() => setStep('service')} style={{ background:'none', border:`1px solid ${C.border2}`, borderRadius:9, padding:'6px 12px', color:C.muted, cursor:'pointer', fontSize:13 }}>← Voltar</button>
              <div>
                <h2 style={{ fontFamily:'Georgia,serif', fontSize:20, fontWeight:600, color:C.text, margin:0 }}>Escolha a data</h2>
                <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{selSvc?.name}</p>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:9 }}>
              {availableDates.slice(0,28).map(d => {
                const dt = new Date(d+'T00:00'), on = d === selDate
                return (
                  <button key={d} onClick={() => {
                    setSelDate(d)
                    setSelTime('')
                    setSlots([])
                    setSlotError('')
                    setSlotState('loading')
                    setStep('time')
                    void fetchSlots(d, selSvc!)
                  }}
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'10px 6px',
                      borderRadius:13, border:`1px solid ${on?brand:C.border}`, background:on?`rgba(${rgb},.15)`:C.surface,
                      cursor:'pointer', fontFamily:'inherit', transition:'.15s' }}>
                    <span style={{ fontSize:9, color:on?brand:C.muted, textTransform:'uppercase', fontWeight:700 }}>{WD[dt.getDay()]}</span>
                    <span style={{ fontFamily:'Georgia,serif', fontSize:16, fontWeight:600, color:on?brand:C.text }}>{dt.getDate()}</span>
                    <span style={{ fontSize:9, color:C.muted }}>{dt.toLocaleDateString('pt-BR',{ month:'short' })}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Horário */}
        {step === 'time' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button onClick={() => setStep('date')} style={{ background:'none', border:`1px solid ${C.border2}`, borderRadius:9, padding:'6px 12px', color:C.muted, cursor:'pointer', fontSize:13 }}>← Voltar</button>
              <div>
                <h2 style={{ fontFamily:'Georgia,serif', fontSize:20, fontWeight:600, color:C.text, margin:0 }}>Escolha o horário</h2>
                <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{new Date(selDate+'T00:00').toLocaleDateString('pt-BR',{ weekday:'long', day:'numeric', month:'long' })}</p>
              </div>
            </div>
            {loadingSlots || slotState === 'loading' ? (
              <div style={{ textAlign:'center', padding:32, color:C.muted }}>
                <div style={{ width:28, height:28, borderRadius:'50%', border:`3px solid ${brand}`, borderTopColor:'transparent', animation:'spin .8s linear infinite', margin:'0 auto' }}/>
                <div style={{ marginTop:12 }}>Carregando horários...</div>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            ) : slotState === 'error' ? (
              <div style={{ textAlign:'center', padding:32, color:C.muted }}>
                <div style={{ fontSize:28, marginBottom:8 }}>⚠</div>
                <div>{slotError || 'Erro ao carregar horários, tente novamente'}</div>
                <button onClick={() => { if (selSvc && selDate) void fetchSlots(selDate, selSvc) }}
                  style={{ marginTop:12, background:'none', border:`1px solid ${C.border2}`, borderRadius:9, padding:'8px 16px', color:C.muted, cursor:'pointer', fontFamily:'inherit' }}>
                  Tentar novamente
                </button>
              </div>
            ) : slots.length === 0 ? (
              <div style={{ textAlign:'center', padding:32, color:C.muted }}>
                <div style={{ fontSize:28, marginBottom:8 }}>😔</div>
                <div>Sem horários disponíveis</div>
                <button onClick={() => setStep('date')} style={{ marginTop:12, background:'none', border:`1px solid ${C.border2}`, borderRadius:9, padding:'8px 16px', color:C.muted, cursor:'pointer', fontFamily:'inherit' }}>Escolher outro dia</button>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9 }}>
                {slots.map((t: string) => {
                  const on = t === selTime
                  return (
                    <button key={t} onClick={() => { setSelTime(t); setStep('info') }}
                      style={{ padding:'12px 8px', borderRadius:13, border:`1px solid ${on?brand:C.border}`,
                        background:on?`rgba(${rgb},.16)`:C.surface, cursor:'pointer', fontFamily:'inherit',
                        fontFamily:'Georgia,serif', fontSize:15, fontWeight:600, color:on?brand:C.text, transition:'.15s' }}>
                      {t}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Dados */}
        {step === 'info' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <button onClick={() => setStep('time')} style={{ background:'none', border:`1px solid ${C.border2}`, borderRadius:9, padding:'6px 12px', color:C.muted, cursor:'pointer', fontSize:13 }}>← Voltar</button>
              <div>
                <h2 style={{ fontFamily:'Georgia,serif', fontSize:20, fontWeight:600, color:C.text, margin:0 }}>Seus dados</h2>
                <p style={{ fontSize:11, color:C.muted, margin:'2px 0 0' }}>{selSvc?.name} · {selDate?.split('-').reverse().join('/')} às {selTime}</p>
              </div>
            </div>
            {/* Resumo */}
            <div style={{ background:`rgba(${rgb},.1)`, border:`1px solid rgba(${rgb},.25)`, borderRadius:14, padding:16, display:'flex', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:13, background:`rgba(${rgb},.2)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>💅</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{selSvc?.name}</div>
                <div style={{ fontSize:12, color:C.muted }}>{new Date(selDate+'T00:00').toLocaleDateString('pt-BR',{ weekday:'long', day:'numeric', month:'long' })} · {selTime}</div>
                <div style={{ fontSize:14, fontWeight:700, color:C.green, marginTop:4 }}>{fmtR(selSvc?.price||0)}</div>
              </div>
            </div>
            {[['Nome completo','text',name,setName,'Ex: Ana Silva'],['WhatsApp','tel',phone,setPhone,'(66) 99999-0000']].map(([l,t,v,set,ph]) => (
              <div key={l as string} style={{ display:'flex', flexDirection:'column', gap:5 }}>
                <label style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' }}>{l as string}</label>
                <input type={t as string} value={v as string} onChange={e => (set as any)(e.target.value)} placeholder={ph as string}
                  style={{ height:46, padding:'0 15px', background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:13, color:C.text, fontSize:14, fontFamily:'inherit', outline:'none' }}
                  onFocus={e => e.target.style.borderColor=brand} onBlur={e => e.target.style.borderColor=C.border2}/>
              </div>
            ))}
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:10, color:C.muted, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' }}>Observações (opcional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Alergias, preferências de esmalte..." rows={3}
                style={{ padding:'12px 15px', background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:13, color:C.text, fontSize:13, fontFamily:'inherit', outline:'none', resize:'none' }}/>
            </div>
            <button onClick={submit} disabled={loading || !name || !phone}
              style={{ height:50, borderRadius:14, background:`linear-gradient(135deg,color-mix(in srgb,${brand},white 34%),${brand})`, color:'#fff',
                fontSize:14, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'inherit',
                boxShadow:`0 6px 22px rgba(${rgb},.45)`, opacity:(loading||!name||!phone)?0.6:1 }}>
              {loading ? 'Confirmando...' : 'Confirmar agendamento'}
            </button>
            {bookingError && (
              <div style={{ background:'rgba(248,113,113,.1)', border:'1px solid rgba(248,113,113,.25)', borderRadius:12, padding:'10px 12px', color:'#fca5a5', fontSize:12 }}>
                {bookingError}
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Confirmado */}
        {step === 'done' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:22, padding:'20px 0', textAlign:'center' }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:`rgba(${rgb},.15)`, border:`2px solid rgba(${rgb},.4)`,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:36,
              boxShadow:`0 0 30px rgba(${rgb},.3), 0 0 60px rgba(${rgb},.15)` }}>
              ✓
            </div>
            <div>
              <h1 style={{ fontFamily:'Georgia,serif', fontSize:24, fontWeight:600, color:C.text, margin:0 }}>Agendamento confirmado!</h1>
              <p style={{ fontSize:13, color:C.muted, margin:'8px 0 0', lineHeight:1.5 }}>
                Seu <b style={{ color:C.text }}>{createdAppointment?.service_name || selSvc?.name}</b> foi registrado com sucesso.<br/>
                <b style={{ color:C.text }}>
                  {createdAppointment ? formatPtBrDateTime(createdAppointment.appointment_date) : `${selDate?.split('-').reverse().join('/')} às ${selTime}`}
                </b>
              </p>
            </div>
            <div style={{ background:`linear-gradient(180deg,${C.surface2},${C.surface})`, border:`1px solid ${C.border}`, borderRadius:18, padding:18, width:'100%', display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span style={{ color:C.muted }}>Cliente</span><span style={{ color:C.text, fontWeight:600 }}>{createdAppointment?.client_name || name}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span style={{ color:C.muted }}>Serviço</span><span style={{ color:C.text, fontWeight:600 }}>{createdAppointment?.service_name || selSvc?.name}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span style={{ color:C.muted }}>Data</span><span style={{ color:C.text, fontWeight:600 }}>{createdAppointment ? formatPtBrDate(createdAppointment.appointment_date) : selDate?.split('-').reverse().join('/')}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span style={{ color:C.muted }}>Horário</span><span style={{ color:C.text, fontWeight:600 }}>{createdAppointment ? new Date(createdAppointment.appointment_date).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) : selTime}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span style={{ color:C.muted }}>Valor</span><span style={{ color:C.green, fontWeight:700 }}>{fmtR((createdAppointment?.price ?? selSvc?.price) || 0)}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span style={{ color:C.muted }}>Status</span><span style={{ color:C.text, fontWeight:600 }}>{statusLabel[createdAppointment?.status || 'confirmed'] || createdAppointment?.status || 'Confirmado'}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span style={{ color:C.muted }}>Código</span><span style={{ color:C.text, fontWeight:600 }}>{createdAppointment?.id?.slice(0, 8).toUpperCase() || '—'}</span></div>
            </div>
            {studio.whatsapp && (
              <a href={waLink()} target="_blank" rel="noreferrer"
                style={{ display:'flex', alignItems:'center', gap:10, height:50, padding:'0 24px', borderRadius:14, width:'100%', justifyContent:'center',
                  background:'linear-gradient(135deg,#25d366,#128c7e)', color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none',
                  boxShadow:'0 6px 22px rgba(37,211,102,.3)' }}>
                📱 Falar no WhatsApp
              </a>
            )}
            <button onClick={() => {
              setStep('service')
              setSelSvc(null)
              setSelDate('')
              setSelTime('')
              setName('')
              setPhone('')
              setNotes('')
              setSlots([])
              setSlotError('')
              setSlotState('idle')
              setBookingError('')
              setCreatedAppointment(null)
            }}
              style={{ background:'none', border:`1px solid ${C.border2}`, borderRadius:12, padding:'10px 20px', color:C.muted, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}>
              Fazer outro agendamento
            </button>
            {studio.address && <p style={{ fontSize:11, color:C.muted }}>📍 {studio.address}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
