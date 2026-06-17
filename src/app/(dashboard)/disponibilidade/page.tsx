'use client'
import { createClient } from '@/lib/supabase/client'
import { Check, ChevronLeft, ChevronRight, Clock, Lock, Unlock, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const C = {
  bg: '#080812', card: '#12111f', card2: '#1a1828', border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.12)', text: '#f4f4f5', muted: '#8f89aa',
  purple: '#7C5CBF', green: '#22c55e', red: '#ef4444', yellow: '#f59e0b',
}

const DAYS_KEYS = ['sun','mon','tue','wed','thu','fri','sat']
const DAYS_FULL = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const DAYS_SHORT = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB']

function ymd(d: Date) { return d.toISOString().slice(0, 10) }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r }

export default function DisponibilidadePage() {
  const [studioId, setStudioId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [workingHours, setWorkingHours] = useState<Record<string, { is_open: boolean; open: string; close: string }>>({})
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [editDay, setEditDay] = useState<{ date: string; label: string; open: string; close: string } | null>(null)

  useEffect(() => {
    async function load() {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data: profile } = await sb.from('profiles').select('studio_id').eq('id', user.id).single()
      if (!profile?.studio_id) return
      setStudioId(profile.studio_id)
      const { data: settings } = await sb.from('salon_settings')
        .select('working_hours, blocked_dates')
        .eq('studio_id', profile.studio_id)
        .single()
      if (settings) {
        setWorkingHours((settings.working_hours as Record<string, { is_open: boolean; open: string; close: string }>) || {})
        setBlockedDates(settings.blocked_dates || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  async function persist(updates: Record<string, any>) {
    setSaving(true)
    const sb = createClient()
    await sb.from('salon_settings').update({ ...updates, updated_at: new Date().toISOString() }).eq('studio_id', studioId)
    setSaving(false)
    showToast('Salvo!')
  }

  async function toggleWeekDay(key: string) {
    const cur = workingHours[key] || { is_open: false, open: '09:00', close: '18:00' }
    const next = { ...workingHours, [key]: { ...cur, is_open: !cur.is_open } }
    setWorkingHours(next)
    await persist({ working_hours: next })
  }

  async function toggleBlockDate(date: string) {
    const next = blockedDates.includes(date) ? blockedDates.filter(d => d !== date) : [...blockedDates, date]
    setBlockedDates(next)
    await persist({ blocked_dates: next })
  }

  async function saveEditDay() {
    if (!editDay) return
    const cur = workingHours[editDay.date] || {}
    const next = { ...workingHours, [editDay.date]: { ...cur, is_open: true, open: editDay.open, close: editDay.close } }
    setWorkingHours(next)
    await persist({ working_hours: next })
    setEditDay(null)
  }

  const today = new Date(); today.setHours(12, 0, 0, 0)
  const dow = today.getDay() === 0 ? 7 : today.getDay()
  const monday = addDays(today, -(dow - 1) + weekOffset * 14)

  const days = []
  for (let i = 0; i < 14; i++) {
    const d = addDays(monday, i)
    if (d.getDay() === 0) continue
    const date = ymd(d)
    days.push({
      date, dayKey: DAYS_KEYS[d.getDay()],
      label: DAYS_SHORT[d.getDay()],
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
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100, background: C.green, color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          ✓ {toast}
        </div>
      )}

      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: '0 0 6px', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>Controle</p>
          <h1 style={{ margin: 0, color: C.text, fontSize: 24, fontWeight: 900 }}>Disponibilidade</h1>
          <p style={{ color: C.muted, fontSize: 12, margin: '5px 0 0' }}>Controle quais dias e horários aparecem para as clientes agendarem.</p>
        </div>
        {saving && <span style={{ color: C.muted, fontSize: 12 }}>Salvando...</span>}
      </header>

      {/* Dias padrão da semana */}
      <section style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
        <p style={{ margin: '0 0 14px', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>Dias de atendimento padrão</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
          {DAYS_KEYS.slice(1, 7).map((key, i) => {
            const config = workingHours[key] || { is_open: false, open: '09:00', close: '18:00' }
            return (
              <button key={key} onClick={() => toggleWeekDay(key)} style={{
                padding: '14px 8px', borderRadius: 14,
                border: `1.5px solid ${config.is_open ? C.purple : C.border}`,
                background: config.is_open ? `${C.purple}18` : C.card2,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                transition: 'all .15s',
              }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: config.is_open ? C.purple : 'rgba(255,255,255,0.06)', display: 'grid', placeItems: 'center' }}>
                  {config.is_open ? <Check size={15} color="#fff" /> : <X size={13} color={C.muted} />}
                </div>
                <span style={{ color: config.is_open ? C.text : C.muted, fontSize: 12, fontWeight: 700 }}>{DAYS_FULL[i + 1].slice(0,3)}</span>
                {config.is_open && (
                  <span style={{ color: C.muted, fontSize: 10 }}>{config.open}–{config.close}</span>
                )}
              </button>
            )
          })}
        </div>
        <p style={{ margin: '12px 0 0', color: C.muted, fontSize: 11 }}>
          * Horários de abertura/fechamento em <strong style={{ color: C.text }}>Configurações → Horários</strong>
        </p>
      </section>

      {/* Grade 2 semanas */}
      <section style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
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
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { color: C.purple, label: 'Aberto' },
            { color: C.red, label: 'Bloqueado' },
            { color: 'rgba(255,255,255,0.06)', label: 'Fechado' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: color, border: `1px solid ${color}` }} />
              <span style={{ color: C.muted, fontSize: 11 }}>{label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={10} color={C.muted} />
            <span style={{ color: C.muted, fontSize: 11 }}>= bloquear dia</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={10} color={C.muted} />
            <span style={{ color: C.muted, fontSize: 11 }}>= ajustar horário</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {days.map(day => {
            // Prioridade: override de data específica > configuração da semana
            const dateOverride = workingHours[day.date]
            const weekConfig = workingHours[day.dayKey] || { is_open: false, open: '09:00', close: '18:00' }
            const config = dateOverride || weekConfig
            const isBlocked = blockedDates.includes(day.date)
            const isOpen = config.is_open && !isBlocked
            const hasOverride = !!dateOverride

            return (
              <div key={day.date} style={{
                borderRadius: 12,
                border: `1.5px solid ${isBlocked ? `${C.red}55` : isOpen ? `${C.purple}55` : C.border}`,
                background: day.isToday ? `${C.purple}20` : isBlocked ? `${C.red}10` : isOpen ? `${C.purple}10` : C.card2,
                padding: '12px 10px',
                display: 'flex', flexDirection: 'column', gap: 5,
                opacity: day.isPast ? 0.4 : 1,
                outline: day.isToday ? `2px solid ${C.purple}88` : 'none',
                outlineOffset: 2,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>{day.label}</span>
                  {day.isToday && <span style={{ background: C.purple, color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 999 }}>HOJE</span>}
                  {hasOverride && !day.isToday && <span style={{ color: C.yellow, fontSize: 8, fontWeight: 700 }}>✦</span>}
                </div>

                <span style={{ color: isBlocked ? C.red : isOpen ? C.text : C.muted, fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{day.dayNum}</span>
                <span style={{ color: C.muted, fontSize: 10 }}>{day.month}</span>

                {isOpen && <span style={{ color: C.purple, fontSize: 10, fontWeight: 700 }}>{config.open}–{config.close}</span>}
                {isBlocked && <span style={{ color: C.red, fontSize: 10, fontWeight: 700 }}>Bloqueado</span>}
                {!isOpen && !isBlocked && <span style={{ color: C.muted, fontSize: 10 }}>Fechado</span>}

                {!day.isPast && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    <button onClick={() => toggleBlockDate(day.date)} title={isBlocked ? 'Desbloquear' : 'Bloquear dia'}
                      style={{ flex: 1, height: 26, borderRadius: 7, border: `1px solid ${isBlocked ? C.red : C.border}`, background: isBlocked ? `${C.red}22` : 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                      {isBlocked ? <Unlock size={11} color={C.red} /> : <Lock size={11} color={C.muted} />}
                    </button>
                    <button onClick={() => setEditDay({ date: day.date, label: `${day.label} ${day.dayNum}/${day.month}`, open: config.open || '09:00', close: config.close || '18:00' })}
                      title="Ajustar horário deste dia"
                      style={{ flex: 1, height: 26, borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                      <Clock size={11} color={C.muted} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Modal horário específico */}
      {editDay && (
        <div onClick={e => e.target === e.currentTarget && setEditDay(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', padding: 18 }}>
          <div style={{ width: '100%', maxWidth: 380, borderRadius: 18, background: C.card, border: `1px solid ${C.border2}`, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: C.text, fontSize: 15 }}>Horário — {editDay.label}</strong>
              <button onClick={() => setEditDay(null)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', color: C.muted, fontFamily: 'inherit' }}>×</button>
            </div>
            <p style={{ margin: 0, color: C.muted, fontSize: 12 }}>Define um horário específico pra esse dia, sobrepõe o padrão da semana.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {(['open','close'] as const).map((field, fi) => (
                <div key={field}>
                  <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>{fi === 0 ? 'Abre' : 'Fecha'}</label>
                  <input type="time" value={editDay[field]}
                    onChange={e => setEditDay(d => d ? { ...d, [field]: e.target.value } : d)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border2}`, background: C.card2, color: C.text, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditDay(null)} style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Cancelar</button>
              <button onClick={saveEditDay} disabled={saving}
                style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: C.purple, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
