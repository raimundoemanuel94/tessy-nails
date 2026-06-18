'use client'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronLeft, ChevronRight, Clock, Copy, ExternalLink, Lock, Plus, Trash2, Unlock, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const C = {
  bg: '#080812', card: '#12111f', card2: '#1a1828', border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.12)', text: '#f4f4f5', muted: '#8f89aa',
  purple: '#7C5CBF', green: '#22c55e', red: '#ef4444', yellow: '#f59e0b',
}

const DAYS_KEYS  = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
const DAYS_FULL  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const DAYS_SHORT = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB']

type Interval = { open: string; close: string }
type DayConfig = { is_open: boolean; open: string; close: string; intervals?: Interval[] }
type WorkingHours = Record<string, DayConfig>

function ymd(d: Date) { return d.toISOString().slice(0, 10) }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }

// Gera lista de slots visíveis a partir da config
function intervalsOf(cfg: DayConfig): Interval[] {
  if (cfg.intervals && cfg.intervals.length > 0) return cfg.intervals
  return [{ open: cfg.open || '09:00', close: cfg.close || '18:00' }]
}

export default function DisponibilidadePage() {
  const [studioId, setStudioId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'ok'|'err'>('ok')
  const [weekOffset, setWeekOffset] = useState(0)
  const [workingHours, setWorkingHours] = useState<WorkingHours>({})
  const [blockedDates, setBlockedDates] = useState<string[]>([])

  // Modal state
  const [shareSlot, setShareSlot] = useState<{ date: string; time: string; link: string } | null>(null)
  const [studioSlug, setStudioSlug] = useState('tessy-nails')
  const [studioName, setStudioName] = useState('')
  const [studioAvatar, setStudioAvatar] = useState('')
  const [studioBrandColor, setStudioBrandColor] = useState('#7C5CBF')
  const [generatingBanner, setGeneratingBanner] = useState(false)
  const [shareTime, setShareTime] = useState('09:00')
  const [shareDate, setShareDate] = useState('')

  const [editDay, setEditDay] = useState<{
    date: string
    label: string
    intervals: Interval[]
    isWeekKey: boolean   // true = editando padrão da semana, false = override de data específica
    weekKey?: string
  } | null>(null)

  useEffect(() => {
    async function load() {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data: profile } = await sb.from('profiles').select('studio_id').eq('id', user.id).single()
      if (!profile?.studio_id) return
      setStudioId(profile.studio_id)
      // Load studio info for banner
      const { data: studio } = await sb.from('studios')
        .select('slug, name, avatar_url, brand_color')
        .eq('id', profile.studio_id).single()
      if (studio) {
        setStudioSlug(studio.slug || 'tessy-nails')
        setStudioName(studio.name || '')
        setStudioAvatar(studio.avatar_url || '')
        setStudioBrandColor(studio.brand_color || '#7C5CBF')
      }

      const { data: settings } = await sb.from('salon_settings')
        .select('working_hours, blocked_dates')
        .eq('studio_id', profile.studio_id)
        .single()
      if (settings) {
        setWorkingHours((settings.working_hours as WorkingHours) || {})
        setBlockedDates(settings.blocked_dates || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  function showToast(msg: string, type: 'ok'|'err' = 'ok') {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(''), 2500)
  }

  async function generateAndShareBanner(date: string, time: string, link: string) {
    setGeneratingBanner(true)
    const W = 1080, H = 1920
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!

    const brand = studioBrandColor || '#7C5CBF'
    const br = parseInt(brand.slice(1,3),16)
    const bg = parseInt(brand.slice(3,5),16)
    const bb = parseInt(brand.slice(5,7),16)

    const dateObj = new Date(date + 'T12:00')
    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' })
    const dateLabel = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })

    // Background
    const bgGrad = ctx.createLinearGradient(0,0,0,H)
    bgGrad.addColorStop(0,'#08060f'); bgGrad.addColorStop(0.5,'#110d1f'); bgGrad.addColorStop(1,'#0d0a1a')
    ctx.fillStyle = bgGrad; ctx.fillRect(0,0,W,H)

    // Glow
    const gc = ctx.createRadialGradient(W/2,H*0.3,0,W/2,H*0.3,800)
    gc.addColorStop(0,`rgba(${br},${bg},${bb},0.18)`); gc.addColorStop(1,'transparent')
    ctx.fillStyle = gc; ctx.fillRect(0,0,W,H)

    // Orbs
    ctx.save(); ctx.globalAlpha=0.08; ctx.fillStyle=brand
    ctx.beginPath(); ctx.arc(W+140,-140,500,0,Math.PI*2); ctx.fill()
    ctx.beginPath(); ctx.arc(-140,H+140,460,0,Math.PI*2); ctx.fill()
    ctx.restore()

    // Top/bottom bars
    const barG = ctx.createLinearGradient(0,0,W,0)
    barG.addColorStop(0,'transparent'); barG.addColorStop(0.25,brand); barG.addColorStop(0.75,brand); barG.addColorStop(1,'transparent')
    ctx.fillStyle = barG; ctx.fillRect(0,0,W,7); ctx.fillRect(0,H-7,W,7)

    // Avatar
    const aR = 145, aX = W/2, aY = 220
    const ag = ctx.createRadialGradient(aX,aY,0,aX,aY,aR+50)
    ag.addColorStop(0,`rgba(${br},${bg},${bb},0.3)`); ag.addColorStop(1,'transparent')
    ctx.fillStyle = ag; ctx.fillRect(aX-aR-50,aY-aR-50,(aR+50)*2,(aR+50)*2)
    ctx.beginPath(); ctx.arc(aX,aY,aR+5,0,Math.PI*2); ctx.strokeStyle=brand; ctx.lineWidth=4; ctx.stroke()

    if (studioAvatar) {
      try {
        const img = new Image(); img.crossOrigin='anonymous'
        await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=studioAvatar})
        ctx.save(); ctx.beginPath(); ctx.arc(aX,aY,aR,0,Math.PI*2); ctx.clip()
        const sc = Math.max((aR*2)/img.width,(aR*2)/img.height)
        const dw=img.width*sc, dh=img.height*sc
        ctx.drawImage(img,aX-dw/2,aY-dh/2-dh*0.05,dw,dh); ctx.restore()
      } catch {
        ctx.beginPath(); ctx.arc(aX,aY,aR,0,Math.PI*2); ctx.fillStyle=brand; ctx.fill()
      }
    } else {
      ctx.beginPath(); ctx.arc(aX,aY,aR,0,Math.PI*2); ctx.fillStyle=brand; ctx.fill()
    }

    let y = aY + aR + 50
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'

    // Nome
    ctx.fillStyle = '#fff'; ctx.font = '700 68px system-ui,sans-serif'
    ctx.fillText(studioName || 'Studio', W/2, y); y += 84

    // Badge "HORÁRIO DISPONÍVEL"
    const bW=680, bH=72, bX=W/2-bW/2
    ctx.fillStyle=`rgba(${br},${bg},${bb},0.18)`; ctx.strokeStyle=`rgba(${br},${bg},${bb},0.5)`; ctx.lineWidth=1.5
    ctx.beginPath(); ctx.roundRect(bX,y,bW,bH,36); ctx.fill(); ctx.stroke()
    ctx.fillStyle=brand; ctx.font='700 30px system-ui,sans-serif'; ctx.textBaseline='middle'
    ctx.fillText('💅  HORÁRIO DISPONÍVEL', W/2, y+bH/2); y += bH + 48

    // Separador
    const sepG = ctx.createLinearGradient(60,0,W-60,0)
    sepG.addColorStop(0,'transparent'); sepG.addColorStop(0.3,`rgba(${br},${bg},${bb},0.5)`); sepG.addColorStop(0.7,`rgba(${br},${bg},${bb},0.5)`); sepG.addColorStop(1,'transparent')
    ctx.fillStyle=sepG; ctx.fillRect(60,y,W-120,1.5); y += 60

    // Horário BIG
    ctx.fillStyle='#fff'; ctx.font='900 200px system-ui,sans-serif'; ctx.textBaseline='top'
    ctx.fillText(time, W/2, y); y += 220

    // Data
    ctx.fillStyle=brand; ctx.font='700 52px system-ui,sans-serif'
    const weekCap = weekday.charAt(0).toUpperCase() + weekday.slice(1)
    ctx.fillText(weekCap + ', ' + dateLabel, W/2, y); y += 80

    // Separador
    ctx.fillStyle=sepG; ctx.fillRect(60,y,W-120,1.5); y += 60

    // Urgência
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='400 38px system-ui,sans-serif'
    ctx.fillText('Vagas limitadas — agende agora! 🔥', W/2, y); y += 80

    // CTA botão
    ctx.fillStyle=brand
    ctx.beginPath(); ctx.roundRect(70,y,W-140,110,32); ctx.fill()
    const shine = ctx.createLinearGradient(70,y,70,y+110)
    shine.addColorStop(0,'rgba(255,255,255,0.18)'); shine.addColorStop(1,'rgba(255,255,255,0)')
    ctx.fillStyle=shine; ctx.beginPath(); ctx.roundRect(70,y,W-140,110,32); ctx.fill()
    ctx.fillStyle='#fff'; ctx.font='700 44px system-ui,sans-serif'; ctx.textBaseline='middle'
    ctx.fillText('Agendar agora  →', W/2, y+55); y += 130

    // URL
    ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.font='300 26px monospace'; ctx.textBaseline='middle'
    ctx.fillText(link, W/2, H-60)

    // Download
    canvas.toBlob(async (blob) => {
      if (!blob) { setGeneratingBanner(false); return }
      const file = new File([blob], 'horario-avulso.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], text: link }); setGeneratingBanner(false); return } catch {}
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href=url; a.download='horario-avulso.png'; a.click()
      URL.revokeObjectURL(url)
      setGeneratingBanner(false)
    }, 'image/png')
  }

  async function persist(updates: Record<string, unknown>) {
    setSaving(true)
    const sb = createClient()
    const { error } = await sb.from('salon_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('studio_id', studioId)
    setSaving(false)
    if (error) {
      showToast('Erro ao salvar.', 'err')
      const { data } = await sb.from('salon_settings').select('working_hours, blocked_dates').eq('studio_id', studioId).single()
      if (data) {
        setWorkingHours((data.working_hours as WorkingHours) || {})
        setBlockedDates(data.blocked_dates || [])
      }
      return false
    }
    showToast('Salvo!')
    return true
  }

  async function toggleWeekDay(key: string) {
    const cur = workingHours[key] || { is_open: false, open: '09:00', close: '18:00' }
    const next = { ...workingHours, [key]: { ...cur, is_open: !cur.is_open } }
    setWorkingHours(next)
    await persist({ working_hours: next })
  }

  async function toggleBlockDate(date: string) {
    const next = blockedDates.includes(date)
      ? blockedDates.filter(d => d !== date)
      : [...blockedDates, date]
    setBlockedDates(next)
    await persist({ blocked_dates: next })
  }

  function openEditDay(date: string, label: string, dayKey: string) {
    const dateOverride = workingHours[date]
    const weekConfig   = workingHours[dayKey] || { is_open: false, open: '09:00', close: '18:00' }
    const base         = dateOverride || weekConfig
    setEditDay({
      date,
      label,
      intervals: intervalsOf(base),
      isWeekKey: false,
      weekKey: dayKey,
    })
  }

  function openEditWeekDay(key: string, label: string) {
    const cfg = workingHours[key] || { is_open: true, open: '09:00', close: '18:00' }
    setEditDay({
      date: key,
      label,
      intervals: intervalsOf(cfg),
      isWeekKey: true,
    })
  }

  async function saveEditDay() {
    if (!editDay) return
    const intervals = editDay.intervals.filter(iv => iv.open && iv.close)
    if (intervals.length === 0) return

    // Simplified: use first interval as open/close for backwards compat + store all in intervals
    const first = intervals[0]
    const update: DayConfig = {
      is_open: true,
      open: first.open,
      close: intervals[intervals.length - 1].close,
      intervals,
    }
    const next = { ...workingHours, [editDay.date]: update }
    setWorkingHours(next)
    await persist({ working_hours: next })
    setEditDay(null)
  }

  // Calendar grid
  const today = new Date(); today.setHours(12, 0, 0, 0)
  const dow    = today.getDay() === 0 ? 7 : today.getDay()
  const monday = addDays(today, -(dow - 1) + weekOffset * 14)

  const days = []
  for (let i = 0; i < 14; i++) {
    const d = addDays(monday, i)
    if (d.getDay() === 0) continue
    const date = ymd(d)
    days.push({
      date, dayKey: DAYS_KEYS[d.getDay()],
      label: DAYS_SHORT[d.getDay()],
      fullLabel: `${DAYS_SHORT[d.getDay()]} ${d.getDate()}/${d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}`,
      dayNum: d.getDate(),
      month: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      isToday: date === ymd(today),
      isPast: d < today,
    })
  }

  const rangeLabel = `${days[0].dayNum} de ${days[0].month} — ${days[days.length-1].dayNum} de ${days[days.length-1].month}`

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', color: C.muted }}>Carregando...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>

      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100, background: toastType === 'err' ? C.red : C.green, color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          {toastType === 'err' ? '✕' : '✓'} {toast}
        </div>
      )}

      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: '0 0 6px', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>Controle</p>
          <h1 style={{ margin: 0, color: C.text, fontSize: 24, fontWeight: 900 }}>Disponibilidade</h1>
          <p style={{ color: C.muted, fontSize: 12, margin: '5px 0 0' }}>Defina os dias e horários disponíveis para agendamento.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {saving && <span style={{ color: C.muted, fontSize: 12 }}>Salvando...</span>}
          <button
            onClick={() => { setShareDate(ymd(today)); setShareSlot(null) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: `1px solid ${C.purple}40`, background: `${C.purple}15`, color: C.purple, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}
          >
            📤 Gerar link avulso
          </button>
        </div>
      </header>

      {/* ── Padrão semanal ── */}
      <section style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
        <p style={{ margin: '0 0 14px', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          Horários padrão por dia da semana
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
          {DAYS_KEYS.slice(1, 7).map((key, i) => {
            const cfg       = workingHours[key] || { is_open: false, open: '09:00', close: '18:00' }
            const ivs       = intervalsOf(cfg)
            const label     = DAYS_FULL[i + 1]
            return (
              <div key={key} style={{
                borderRadius: 14,
                border: `1.5px solid ${cfg.is_open ? C.purple : C.border}`,
                background: cfg.is_open ? `${C.purple}12` : C.card2,
                padding: '12px 10px',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {/* toggle on/off */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: cfg.is_open ? C.text : C.muted, fontSize: 12, fontWeight: 700 }}>{label.slice(0,3)}</span>
                  <button onClick={() => toggleWeekDay(key)} style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: cfg.is_open ? C.purple : 'rgba(255,255,255,0.06)',
                    border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center',
                  }}>
                    {cfg.is_open ? <Check size={13} color="#fff" /> : <X size={11} color={C.muted} />}
                  </button>
                </div>

                {/* intervals */}
                {cfg.is_open && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {ivs.map((iv, idx) => (
                      <span key={idx} style={{ color: C.purple, fontSize: 10, fontWeight: 600 }}>
                        {iv.open} – {iv.close}
                      </span>
                    ))}
                  </div>
                )}
                {!cfg.is_open && (
                  <span style={{ color: C.muted, fontSize: 10 }}>Fechado</span>
                )}

                {/* edit button */}
                <button onClick={() => openEditWeekDay(key, label)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '5px 0', borderRadius: 8,
                  border: `1px solid ${C.border}`, background: 'transparent',
                  cursor: 'pointer', color: C.muted, fontSize: 10, fontFamily: 'inherit',
                }}>
                  <Clock size={10} /> Horários
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Grade 2 semanas ── */}
      <section style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p style={{ margin: '0 0 4px', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>Próximas 2 semanas</p>
            <p style={{ margin: 0, color: C.muted, fontSize: 12 }}>{rangeLabel}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setWeekOffset(w => w - 1)} disabled={weekOffset <= 0}
              style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.border}`, background: C.card2, cursor: weekOffset <= 0 ? 'not-allowed' : 'pointer', display: 'grid', placeItems: 'center', opacity: weekOffset <= 0 ? 0.4 : 1 }}>
              <ChevronLeft size={16} color={C.muted} />
            </button>
            <button onClick={() => setWeekOffset(w => w + 1)}
              style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.border}`, background: C.card2, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <ChevronRight size={16} color={C.muted} />
            </button>
          </div>
        </div>

        {/* Legenda */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { color: C.purple, label: 'Override ativo' },
            { color: C.red, label: 'Bloqueado' },
            { color: 'rgba(255,255,255,0.06)', label: 'Padrão / Fechado' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
              <span style={{ color: C.muted, fontSize: 11 }}>{label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {days.map(day => {
            const dateOverride = workingHours[day.date]
            const weekConfig   = workingHours[day.dayKey] || { is_open: false, open: '09:00', close: '18:00' }
            const config       = dateOverride || weekConfig
            const isBlocked    = blockedDates.includes(day.date)
            const hasOverride  = !!dateOverride
            const isOpen       = (hasOverride ? dateOverride!.is_open : weekConfig.is_open) && !isBlocked
            const ivs          = intervalsOf(config)

            return (
              <div key={day.date} style={{
                borderRadius: 12,
                border: `1.5px solid ${isBlocked ? `${C.red}55` : hasOverride ? `${C.purple}70` : C.border}`,
                background: day.isToday ? `${C.purple}20` : isBlocked ? `${C.red}10` : hasOverride ? `${C.purple}12` : C.card2,
                padding: '10px 8px',
                display: 'flex', flexDirection: 'column', gap: 4,
                opacity: day.isPast ? 0.4 : 1,
                outline: day.isToday ? `2px solid ${C.purple}88` : 'none',
                outlineOffset: 2,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>{day.label}</span>
                  {day.isToday && <span style={{ background: C.purple, color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 999 }}>HOJE</span>}
                  {hasOverride && !day.isToday && <span style={{ color: C.yellow, fontSize: 9 }}>✦</span>}
                </div>

                <span style={{ color: isBlocked ? C.red : isOpen ? C.text : C.muted, fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{day.dayNum}</span>
                <span style={{ color: C.muted, fontSize: 10 }}>{day.month}</span>

                {/* Intervals */}
                {isOpen && ivs.map((iv, idx) => (
                  <span key={idx} style={{ color: C.purple, fontSize: 9, fontWeight: 700 }}>{iv.open}–{iv.close}</span>
                ))}
                {isBlocked && <span style={{ color: C.red, fontSize: 10, fontWeight: 700 }}>Bloqueado</span>}
                {!isOpen && !isBlocked && <span style={{ color: C.muted, fontSize: 10 }}>
                  {weekConfig.is_open ? 'Padrão' : 'Fechado'}
                </span>}

                {!day.isPast && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                    <button onClick={() => toggleBlockDate(day.date)} title={isBlocked ? 'Desbloquear' : 'Bloquear dia'}
                      style={{ flex: 1, height: 24, borderRadius: 7, border: `1px solid ${isBlocked ? C.red : C.border}`, background: isBlocked ? `${C.red}22` : 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                      {isBlocked ? <Unlock size={10} color={C.red} /> : <Lock size={10} color={C.muted} />}
                    </button>
                    <button onClick={() => openEditDay(day.date, day.fullLabel, day.dayKey)}
                      title="Definir horários específicos para este dia"
                      style={{ flex: 1, height: 24, borderRadius: 7, border: `1px solid ${hasOverride ? C.purple : C.border}`, background: hasOverride ? `${C.purple}18` : 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                      <Clock size={10} color={hasOverride ? C.purple : C.muted} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Modal link avulso ── */}
      {shareDate !== '' && shareSlot === null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', padding: 18 }}
          onClick={e => e.target === e.currentTarget && setShareDate('')}>
          <div style={{ width: '100%', maxWidth: 400, borderRadius: 20, background: C.card, border: `1px solid ${C.border2}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: C.text, fontSize: 16 }}>📤 Link de horário avulso</strong>
                <p style={{ margin: '3px 0 0', color: C.muted, fontSize: 11 }}>Gera um link com data e hora pré-definidos para compartilhar no Status</p>
              </div>
              <button onClick={() => setShareDate('')} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', color: C.muted, fontFamily: 'inherit', fontSize: 16 }}>×</button>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>Data</label>
                <input type="date" value={shareDate} min={ymd(today)}
                  onChange={e => setShareDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border2}`, background: C.card2, color: C.text, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>Horário disponível</label>
                <input type="time" value={shareTime}
                  onChange={e => setShareTime(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border2}`, background: C.card2, color: C.text, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' as const }} />
              </div>
            </div>

            {/* Preview do link */}
            {shareDate && shareTime && (() => {
              const origin = typeof window !== 'undefined' ? window.location.origin : 'https://tessy-nails.vercel.app'
              const link = `${origin}/agendar/tessy-nails?date=${shareDate}&time=${shareTime}`
              return (
                <div style={{ padding: '12px 14px', borderRadius: 12, background: `${C.purple}10`, border: `1px solid ${C.purple}25` }}>
                  <p style={{ margin: '0 0 6px', fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>Link gerado</p>
                  <p style={{ margin: '0 0 10px', fontSize: 11, color: C.text, wordBreak: 'break-all', lineHeight: 1.5 }}>{link}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { navigator.clipboard.writeText(link); showToast('Link copiado!') }}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderRadius: 9, border: `1px solid ${C.purple}40`, background: `${C.purple}18`, color: C.purple, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                      <Copy size={13} /> Copiar link
                    </button>
                    <button onClick={() => void generateAndShareBanner(shareDate, shareTime, link)}
                      disabled={generatingBanner}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderRadius: 9, border: 'none', background: C.purple, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', opacity: generatingBanner ? 0.7 : 1 }}>
                      {generatingBanner ? '⏳ Gerando...' : '📲 Gerar banner Story'}
                    </button>
                  </div>
                </div>
              )
            })()}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShareDate('')} style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de intervalos de horário ── */}
      {editDay && (
        <div onClick={e => e.target === e.currentTarget && setEditDay(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', padding: 18 }}>
          <div style={{ width: '100%', maxWidth: 420, borderRadius: 20, background: C.card, border: `1px solid ${C.border2}`, padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: C.text, fontSize: 16 }}>
                  {editDay.isWeekKey ? `Padrão — ${editDay.label}` : `Override — ${editDay.label}`}
                </strong>
                <p style={{ margin: '3px 0 0', color: C.muted, fontSize: 11 }}>
                  {editDay.isWeekKey
                    ? 'Horários padrão para todas as semanas'
                    : 'Sobrepõe o padrão apenas neste dia'}
                </p>
              </div>
              <button onClick={() => setEditDay(null)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', color: C.muted, fontFamily: 'inherit', fontSize: 16 }}>×</button>
            </div>

            {/* Intervals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  Intervalos de atendimento
                </span>
                <button
                  onClick={() => setEditDay(d => d ? { ...d, intervals: [...d.intervals, { open: '09:00', close: '12:00' }] } : d)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: `1px solid ${C.purple}40`, background: `${C.purple}12`, color: C.purple, cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                  <Plus size={11} /> Adicionar horário
                </button>
              </div>

              {editDay.intervals.map((iv, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                  <div>
                    <label style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 5 }}>
                      Início {editDay.intervals.length > 1 ? `#${idx + 1}` : ''}
                    </label>
                    <input type="time" value={iv.open}
                      onChange={e => setEditDay(d => {
                        if (!d) return d
                        const ivs = [...d.intervals]
                        ivs[idx] = { ...ivs[idx], open: e.target.value }
                        return { ...d, intervals: ivs }
                      })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border2}`, background: C.card2, color: C.text, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 5 }}>Fim</label>
                    <input type="time" value={iv.close}
                      onChange={e => setEditDay(d => {
                        if (!d) return d
                        const ivs = [...d.intervals]
                        ivs[idx] = { ...ivs[idx], close: e.target.value }
                        return { ...d, intervals: ivs }
                      })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border2}`, background: C.card2, color: C.text, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' as const }} />
                  </div>
                  {editDay.intervals.length > 1 && (
                    <button onClick={() => setEditDay(d => d ? { ...d, intervals: d.intervals.filter((_, i) => i !== idx) } : d)}
                      style={{ width: 36, height: 42, borderRadius: 10, border: `1px solid ${C.red}30`, background: `${C.red}10`, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                      <Trash2 size={13} color={C.red} />
                    </button>
                  )}
                </div>
              ))}

              {/* Preview */}
              {editDay.intervals.length > 0 && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: `${C.purple}10`, border: `1px solid ${C.purple}25` }}>
                  <p style={{ margin: '0 0 4px', fontSize: 10, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>Preview</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {editDay.intervals.map((iv, idx) => (
                      <span key={idx} style={{ fontSize: 13, fontWeight: 700, color: C.purple }}>
                        {iv.open} → {iv.close}
                        {idx < editDay.intervals.length - 1 && <span style={{ color: C.muted, marginLeft: 8 }}>·</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditDay(null)} style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                Cancelar
              </button>
              <button onClick={saveEditDay} disabled={saving}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: C.purple, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
