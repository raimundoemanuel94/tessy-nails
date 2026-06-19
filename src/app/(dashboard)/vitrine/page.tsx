'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Copy, Download, Share2, Sparkles, Wand2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Appointment } from '@/types/database'

const C = {
  card: '#10101f',
  card2: '#17172a',
  border: '#1c1c36',
  border2: '#26264a',
  purple: '#a78bfa',
  pink: '#f472b6',
  green: '#34d399',
  text: '#e8e8f8',
  muted: '#7777a7',
}

type Slot = { time: string; occupied: boolean; selected: boolean }
type Template = 'dark' | 'rose'

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const dateLabel = (date: Date) => date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

export default function VitrinePage() {
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    return d
  })
  const [studioId, setStudioId] = useState('')
  const [studioName, setStudioName] = useState('Tessy Nails')
  const [studioSlug, setStudioSlug] = useState('')
  const [slotDuration, setSlotDuration] = useState(30)
  const [slots, setSlots] = useState<Slot[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [workingHours, setWorkingHours] = useState<Record<string, { is_open: boolean; open: string; close: string }>>({})
  const [template, setTemplate] = useState<Template>('dark')
  const [caption, setCaption] = useState('Reserve ja o seu horario')
  const [imageUrl, setImageUrl] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const loadBase = async () => {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await sb.from('profiles').select('studio_id').eq('id', user.id).single()
      if (!profile?.studio_id) { setLoading(false); return }
      setStudioId(profile.studio_id)

      const [{ data: studio }, { data: settings }] = await Promise.all([
        sb.from('studios').select('name, slug').eq('id', profile.studio_id).single(),
        sb.from('salon_settings').select('slot_duration, working_hours').eq('studio_id', profile.studio_id).single(),
      ])
      if (studio?.name) setStudioName(studio.name)
      if (studio?.slug) setStudioSlug(studio.slug)
      if (settings?.slot_duration) setSlotDuration(settings.slot_duration)
      if (settings?.working_hours) setWorkingHours(settings.working_hours as Record<string, { is_open: boolean; open: string; close: string }>)
      setLoading(false)
    }
    void loadBase()
  }, [])

  useEffect(() => {
    if (!studioId) return
    const loadDay = async () => {
      const sb = createClient()
      const start = `${ymd(date)}T00:00:00`
      const end = `${ymd(date)}T23:59:59`
      const { data } = await sb
        .from('appointments')
        .select('*')
        .eq('studio_id', studioId)
        .gte('appointment_date', start)
        .lte('appointment_date', end)
      const rows = data || []
      setAppointments(rows)

      const weekday = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][date.getDay()]
      const config = (workingHours as any)?.[ymd(date)] || workingHours?.[weekday] || { is_open: true, open: '09:00', close: '18:00' }
      const [oh, om] = (config.open || '09:00').split(':').map(Number)
      const [ch, cm] = (config.close || '18:00').split(':').map(Number)
      const openMin = oh * 60 + om
      const closeMin = ch * 60 + cm
      const busy = rows
        .filter(item => !['cancelled', 'no_show'].includes(item.status))
        .map(item => {
          const d = new Date(item.appointment_date)
          const startMin = d.getHours() * 60 + d.getMinutes()
          return { start: startMin, end: startMin + (item.duration_minutes || slotDuration) }
        })
      const generated: Slot[] = []
      for (let minute = openMin; minute + slotDuration <= closeMin; minute += slotDuration) {
        const time = `${pad(Math.floor(minute / 60))}:${pad(minute % 60)}`
        const occupied = busy.some(range => minute < range.end && minute + slotDuration > range.start)
        generated.push({ time, occupied, selected: !occupied })
      }
      setSlots(generated)
      setImageUrl('')
    }
    void loadDay()
  }, [date, studioId, slotDuration, workingHours])

  const selectedFree = useMemo(() => slots.filter(slot => slot.selected && !slot.occupied), [slots])
  const bookingUrl = studioSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/agendar/${studioSlug}` : ''

  const moveDate = (amount: number) => {
    const next = new Date(date)
    next.setDate(date.getDate() + amount)
    next.setHours(12, 0, 0, 0)
    setDate(next)
  }

  function toggleSlot(time: string) {
    setSlots(prev => prev.map(slot => slot.time === time && !slot.occupied ? { ...slot, selected: !slot.selected } : slot))
    setImageUrl('')
  }

  async function copyText() {
    const manha = selectedFree.filter(slot => Number(slot.time.slice(0, 2)) < 12).map(slot => slot.time).join(' - ')
    const tarde = selectedFree.filter(slot => Number(slot.time.slice(0, 2)) >= 12).map(slot => slot.time).join(' - ')
    const text = [
      `Horarios disponiveis - ${dateLabel(date)}`,
      manha ? `Manha: ${manha}` : '',
      tarde ? `Tarde: ${tarde}` : '',
      caption,
      bookingUrl,
    ].filter(Boolean).join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  async function generateImage() {
    if (!selectedFree.length) return
    setGenerating(true)
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1350
    const ctx = canvas.getContext('2d')
    if (!ctx) { setGenerating(false); return }

    if (template === 'rose') {
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height)
      bg.addColorStop(0, '#fff7fb')
      bg.addColorStop(1, '#fce7f3')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(244,114,182,0.22)'
      ctx.beginPath(); ctx.arc(930, 160, 280, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#3b2432'
    } else {
      const bg = ctx.createLinearGradient(0, 0, 0, canvas.height)
      bg.addColorStop(0, '#140f22')
      bg.addColorStop(1, '#08060f')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'rgba(167,139,250,0.18)'
      ctx.beginPath(); ctx.arc(920, 120, 320, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#ffffff'
    }

    const text = template === 'rose' ? '#3b2432' : '#ffffff'
    const muted = template === 'rose' ? '#9f607d' : 'rgba(255,255,255,0.52)'
    const accent = template === 'rose' ? '#db2777' : '#a78bfa'
    const pillBg = template === 'rose' ? '#ffffff' : 'rgba(255,255,255,0.08)'

    ctx.textAlign = 'left'
    ctx.fillStyle = muted
    ctx.font = '800 34px system-ui, sans-serif'
    ctx.fillText(dateLabel(date).toUpperCase(), 82, 130)
    ctx.fillStyle = text
    ctx.font = '900 86px system-ui, sans-serif'
    ctx.fillText('Horarios', 82, 235)
    ctx.fillText('disponiveis', 82, 325)
    ctx.fillStyle = accent
    ctx.font = '700 48px system-ui, sans-serif'
    ctx.fillText('unhas', 82, 390)

    const groups = [
      { label: 'MANHA', items: selectedFree.filter(slot => Number(slot.time.slice(0, 2)) < 12) },
      { label: 'TARDE', items: selectedFree.filter(slot => Number(slot.time.slice(0, 2)) >= 12) },
    ]
    let y = 505
    for (const group of groups) {
      if (!group.items.length) continue
      ctx.fillStyle = muted
      ctx.font = '900 28px system-ui, sans-serif'
      ctx.fillText(group.label, 82, y)
      y += 40
      let x = 82
      for (const slot of group.items) {
        const width = 162
        if (x + width > 1000) { x = 82; y += 78 }
        ctx.fillStyle = pillBg
        ctx.beginPath(); ctx.roundRect(x, y, width, 58, 29); ctx.fill()
        ctx.strokeStyle = `${accent}66`; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = accent
        ctx.font = '900 32px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(slot.time, x + width / 2, y + 39)
        ctx.textAlign = 'left'
        x += width + 18
      }
      y += 100
    }

    ctx.fillStyle = template === 'rose' ? '#fdf2f8' : 'rgba(255,255,255,0.06)'
    ctx.beginPath(); ctx.roundRect(82, 980, 916, 88, 26); ctx.fill()
    ctx.fillStyle = accent
    ctx.font = '900 34px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(caption || 'Reserve ja o seu horario', 540, 1035)

    ctx.fillStyle = text
    ctx.font = '900 38px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(studioName || 'Tessy Nails', 82, 1190)
    ctx.fillStyle = muted
    ctx.font = '500 25px system-ui, sans-serif'
    ctx.fillText('Atualizado agora', 82, 1230)
    ctx.textAlign = 'right'
    ctx.fillText(bookingUrl || '', 998, 1230)

    const url = canvas.toDataURL('image/png')
    setImageUrl(url)
    setGenerating(false)
  }

  async function shareImage() {
    if (!imageUrl) return
    const blob = await (await fetch(imageUrl)).blob()
    const file = new File([blob], 'tessy-nails-vitrine.png', { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: bookingUrl })
        return
      } catch {}
    }
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = 'tessy-nails-vitrine.png'
    a.click()
  }

  if (loading) return <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: C.muted }}>Carregando vitrine...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/agenda" style={iconButtonStyle()}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p style={{ margin: '0 0 5px', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>Vitrine</p>
            <h1 style={{ margin: 0, color: C.text, fontSize: 24, fontWeight: 900 }}>Vitrine do Dia</h1>
            <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 12 }}>Escolha horarios avulsos e gere o banner para status.</p>
          </div>
        </div>
        <Link href="/disponibilidade" style={{ ...buttonStyle(C.purple, false), textDecoration: 'none' }}>
          <CalendarDays size={14} /> Vagas
        </Link>
      </header>

      <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: 10 }}>
          <button onClick={() => moveDate(-1)} style={iconButtonStyle()}><ChevronLeft size={16} /></button>
          <div style={{ textAlign: 'center' }}>
            <strong style={{ display: 'block', color: C.text, fontSize: 16, textTransform: 'capitalize' }}>{dateLabel(date)}</strong>
            <span style={{ color: C.muted, fontSize: 12 }}>{selectedFree.length} selecionado(s) livres</span>
          </div>
          <button onClick={() => moveDate(1)} style={iconButtonStyle()}><ChevronRight size={16} /></button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <p style={{ margin: 0, color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>Horarios</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setSlots(prev => prev.map(slot => slot.occupied ? slot : { ...slot, selected: true }))} style={textButtonStyle()}>Todos</button>
            <button onClick={() => setSlots(prev => prev.map(slot => ({ ...slot, selected: false })))} style={textButtonStyle()}>Nenhum</button>
          </div>
        </div>

        <SlotGroup label="Manha" slots={slots.filter(slot => Number(slot.time.slice(0, 2)) < 12)} onToggle={toggleSlot} />
        <SlotGroup label="Tarde" slots={slots.filter(slot => Number(slot.time.slice(0, 2)) >= 12)} onToggle={toggleSlot} />
      </section>

      <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, display: 'grid', gap: 12 }}>
        <div>
          <p style={{ margin: '0 0 8px', color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>Mensagem</p>
          <input
            value={caption}
            onChange={event => setCaption(event.target.value)}
            style={{ width: '100%', height: 42, boxSizing: 'border-box', borderRadius: 11, border: `1px solid ${C.border2}`, background: C.card2, color: C.text, padding: '0 12px', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['dark', 'rose'] as Template[]).map(item => (
            <button key={item} onClick={() => setTemplate(item)} style={{
              ...buttonStyle(item === template ? C.purple : C.muted, item === template),
              minWidth: 92,
            }}>
              {item === 'dark' ? 'Escuro' : 'Rose'}
            </button>
          ))}
        </div>
      </section>

      <button onClick={generateImage} disabled={generating || selectedFree.length === 0} style={{
        minHeight: 52,
        borderRadius: 14,
        border: 'none',
        background: selectedFree.length ? `linear-gradient(135deg, ${C.purple}, ${C.pink})` : C.border2,
        color: '#fff',
        fontWeight: 900,
        fontSize: 14,
        fontFamily: 'inherit',
        cursor: selectedFree.length ? 'pointer' : 'not-allowed',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
      }}>
        <Wand2 size={17} /> {generating ? 'Gerando...' : 'Gerar Vitrine'}
      </button>

      {imageUrl && (
        <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, display: 'grid', gap: 12 }}>
          <img src={imageUrl} alt="Vitrine" style={{ width: '100%', borderRadius: 12, display: 'block' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={shareImage} style={buttonStyle(C.green, true)}><Share2 size={15} /> Compartilhar</button>
            <a href={imageUrl} download="tessy-nails-vitrine.png" style={{ ...buttonStyle(C.purple, false), textDecoration: 'none' }}><Download size={15} /> Baixar</a>
          </div>
          <button onClick={copyText} style={buttonStyle(C.muted, false)}><Copy size={15} /> {copied ? 'Copiado' : 'Copiar texto'}</button>
        </section>
      )}
    </div>
  )
}

function SlotGroup({ label, slots, onToggle }: { label: string; slots: Slot[]; onToggle: (time: string) => void }) {
  if (!slots.length) return null
  return (
    <div>
      <p style={{ margin: '0 0 8px', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {slots.map(slot => (
          <button key={slot.time} onClick={() => onToggle(slot.time)} disabled={slot.occupied} style={{
            minHeight: 38,
            padding: '0 14px',
            borderRadius: 11,
            border: `1px solid ${slot.selected && !slot.occupied ? C.purple : C.border2}`,
            background: slot.occupied ? 'transparent' : slot.selected ? `${C.purple}28` : C.card2,
            color: slot.occupied ? C.muted : slot.selected ? C.text : C.muted,
            opacity: slot.occupied ? 0.42 : 1,
            textDecoration: slot.occupied ? 'line-through' : 'none',
            cursor: slot.occupied ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontWeight: 850,
          }}>
            {slot.time}
          </button>
        ))}
      </div>
    </div>
  )
}

function iconButtonStyle() {
  return {
    width: 38,
    height: 38,
    borderRadius: 11,
    border: `1px solid ${C.border2}`,
    background: C.card,
    color: C.muted,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  }
}

function buttonStyle(color: string, filled: boolean) {
  return {
    minHeight: 40,
    borderRadius: 11,
    border: `1px solid ${color}55`,
    background: filled ? `${color}26` : 'transparent',
    color,
    padding: '0 13px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 850,
  }
}

function textButtonStyle() {
  return {
    border: 0,
    background: 'transparent',
    color: C.purple,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'uppercase' as const,
    letterSpacing: '.08em',
  }
}
