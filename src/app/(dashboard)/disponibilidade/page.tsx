'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Check, ChevronLeft, ChevronRight, Clock, Lock, Sparkles, Unlock } from 'lucide-react'
import { useEffect, useState } from 'react'

const C = {
  card: '#12111f',
  card2: '#1a1828',
  border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.12)',
  text: '#f4f4f5',
  muted: '#8f89aa',
  purple: '#7C5CBF',
  green: '#22c55e',
  red: '#ef4444',
  yellow: '#f59e0b',
}

type Hours = { is_open: boolean; open: string; close: string }
type DayCard = {
  date: string
  dayKey: string
  label: string
  dayNum: number
  month: string
  isToday: boolean
  isPast: boolean
}

const DAYS_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const DAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DAYS_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

function ymd(d: Date) {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export default function DisponibilidadePage() {
  const [studioId, setStudioId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'ok' | 'err'>('ok')
  const [weekOffset, setWeekOffset] = useState(0)
  const [workingHours, setWorkingHours] = useState<Record<string, Hours>>({})
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [editDay, setEditDay] = useState<{ date: string; label: string; open: string; close: string } | null>(null)

  useEffect(() => {
    async function load() {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await sb.from('profiles').select('studio_id').eq('id', user.id).single()
      if (!profile?.studio_id) { setLoading(false); return }

      setStudioId(profile.studio_id)
      const { data: settings } = await sb
        .from('salon_settings')
        .select('working_hours, blocked_dates')
        .eq('studio_id', profile.studio_id)
        .single()

      if (settings) {
        setWorkingHours((settings.working_hours as Record<string, Hours>) || {})
        setBlockedDates(settings.blocked_dates || [])
      }
      setLoading(false)
    }

    void load()
  }, [])

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 2500)
  }

  async function persist(updates: Record<string, unknown>) {
    setSaving(true)
    const sb = createClient()
    const { error } = await sb
      .from('salon_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('studio_id', studioId)
    setSaving(false)

    if (error) {
      showToast('Erro ao salvar. Tente novamente.', 'err')
      console.error('persist error:', error.message)
      const { data } = await sb.from('salon_settings').select('working_hours, blocked_dates').eq('studio_id', studioId).single()
      if (data) {
        setWorkingHours((data.working_hours as Record<string, Hours>) || {})
        setBlockedDates(data.blocked_dates || [])
      }
      return false
    }

    showToast('Salvo!')
    return true
  }

  async function toggleBlockDate(date: string) {
    const next = blockedDates.includes(date) ? blockedDates.filter(d => d !== date) : [...blockedDates, date]
    setBlockedDates(next)
    await persist({ blocked_dates: next })
  }

  async function saveEditDay(redirectToVitrine = false) {
    if (!editDay) return
    const cur = workingHours[editDay.date] || {}
    const next = { ...workingHours, [editDay.date]: { ...cur, is_open: true, open: editDay.open, close: editDay.close } }
    setWorkingHours(next)
    const ok = await persist({ working_hours: next })
    if (ok) {
      setEditDay(null)
      if (redirectToVitrine) window.location.href = '/vitrine'
    }
  }

  function openDayEditor(date: string, label: string, open = '09:00', close = '18:00') {
    setEditDay({ date, label, open, close })
  }

  const presets = [
    { label: 'Manhã', sub: '09:00-12:00', open: '09:00', close: '12:00' },
    { label: 'Tarde', sub: '13:00-18:00', open: '13:00', close: '18:00' },
    { label: 'Dia todo', sub: '09:00-18:00', open: '09:00', close: '18:00' },
    { label: 'Sábado', sub: '09:00-13:00', open: '09:00', close: '13:00' },
  ]

  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const dow = today.getDay() === 0 ? 7 : today.getDay()
  const monday = addDays(today, -(dow - 1) + weekOffset * 14)
  const days: DayCard[] = []

  for (let i = 0; i < 14; i++) {
    const d = addDays(monday, i)
    if (d.getDay() === 0) continue
    const date = ymd(d)
    days.push({
      date,
      dayKey: DAYS_KEYS[d.getDay()],
      label: DAYS_SHORT[d.getDay()],
      dayNum: d.getDate(),
      month: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      isToday: date === ymd(today),
      isPast: d < today,
    })
  }

  const rangeLabel = `${days[0].dayNum} de ${days[0].month} - ${days[days.length - 1].dayNum} de ${days[days.length - 1].month}`
  const releasedCount = days.filter(day => !!workingHours[day.date]?.is_open && !blockedDates.includes(day.date)).length
  const nextUnreleasedDay = days.find(day => !day.isPast && !workingHours[day.date]?.is_open && !blockedDates.includes(day.date))
  const nextBlockedDay = days.find(day => !day.isPast && blockedDates.includes(day.date))

  if (loading) {
    return <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', color: C.muted }}>Carregando...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100, background: toastType === 'err' ? C.red : C.green, color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          {toastType === 'err' ? 'Erro:' : 'OK:'} {toast}
        </div>
      )}

      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: '0 0 6px', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>Controle</p>
          <h1 style={{ margin: 0, color: C.text, fontSize: 24, fontWeight: 900 }}>Vagas</h1>
          <p style={{ color: C.muted, fontSize: 12, margin: '5px 0 0' }}>Libere somente os dias e horários que devem aparecer para as clientes.</p>
        </div>
        {saving && <span style={{ color: C.muted, fontSize: 12 }}>Salvando...</span>}
      </header>

      <section className="vagas-summary" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 16,
        alignItems: 'center',
        padding: 18,
        borderRadius: 18,
        background: `linear-gradient(135deg, ${C.purple}22, ${C.card})`,
        border: `1px solid ${C.purple}35`,
      }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: '0 0 6px', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Vagas da quinzena
          </p>
          <h2 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 900 }}>
            {releasedCount} {releasedCount === 1 ? 'dia liberado' : 'dias liberados'}
          </h2>
          <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 12, lineHeight: 1.45 }}>
            Dias não liberados não entram no agendamento público. Esse é o controle manual da semana.
          </p>
        </div>
        <div className="vagas-summary-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {nextUnreleasedDay && (
          <button
            onClick={() => openDayEditor(nextUnreleasedDay.date, `${nextUnreleasedDay.label} ${nextUnreleasedDay.dayNum}/${nextUnreleasedDay.month}`)}
            style={{
              minHeight: 42,
              padding: '0 16px',
              borderRadius: 12,
              border: 'none',
              background: C.purple,
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 850,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Liberar próximo dia
          </button>
        )}
        {nextBlockedDay && !nextUnreleasedDay && (
          <button
            onClick={() => toggleBlockDate(nextBlockedDay.date)}
            style={{
              minHeight: 42,
              padding: '0 16px',
              borderRadius: 12,
              border: `1px solid ${C.red}40`,
              background: `${C.red}16`,
              color: C.red,
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 850,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Desbloquear próximo
          </button>
        )}
        <Link
          href="/vitrine"
          style={{
            minHeight: 42,
            padding: '0 16px',
            borderRadius: 12,
            border: `1px solid ${C.green}35`,
            background: `${C.green}14`,
            color: C.green,
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 850,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
          }}
        >
          <Sparkles size={14} /> Vitrine
        </Link>
        </div>
      </section>

      <section className="vagas-grid-section" style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20 }}>
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

        <div className="vagas-legend" style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { color: C.purple, label: 'Liberado' },
            { color: C.red, label: 'Bloqueado' },
            { color: 'rgba(255,255,255,0.06)', label: 'Não liberado' },
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

        <div className="vagas-days-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {days.map(day => {
            const dateOverride = workingHours[day.date]
            const weekConfig = workingHours[day.dayKey] || { is_open: false, open: '09:00', close: '18:00' }
            const config = dateOverride || weekConfig
            const isBlocked = blockedDates.includes(day.date)
            const isReleased = !!dateOverride?.is_open
            const isOpen = isReleased && !isBlocked
            const hasOverride = !!dateOverride

            return (
              <div key={day.date} style={{
                borderRadius: 12,
                border: `1.5px solid ${isBlocked ? `${C.red}55` : isOpen ? `${C.purple}55` : C.border}`,
                background: day.isToday ? `${C.purple}20` : isBlocked ? `${C.red}10` : isOpen ? `${C.purple}10` : C.card2,
                padding: '12px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                opacity: day.isPast ? 0.4 : 1,
                outline: day.isToday ? `2px solid ${C.purple}88` : 'none',
                outlineOffset: 2,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>{day.label}</span>
                  {day.isToday && <span style={{ background: C.purple, color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 999 }}>HOJE</span>}
                  {hasOverride && !day.isToday && <span style={{ color: C.yellow, fontSize: 8, fontWeight: 700 }}>*</span>}
                </div>

                <span style={{ color: isBlocked ? C.red : isOpen ? C.text : C.muted, fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{day.dayNum}</span>
                <span style={{ color: C.muted, fontSize: 10 }}>{day.month}</span>

                {isOpen && <span style={{ color: C.purple, fontSize: 10, fontWeight: 700 }}>{config.open}-{config.close}</span>}
                {isBlocked && <span style={{ color: C.red, fontSize: 10, fontWeight: 700 }}>Bloqueado</span>}
                {!isOpen && !isBlocked && <span style={{ color: C.muted, fontSize: 10 }}>Não liberado</span>}

                {!day.isPast && (
                  <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                    {!isBlocked && (
                      <button
                        onClick={() => openDayEditor(day.date, `${day.label} ${day.dayNum}/${day.month}`, config.open || '09:00', config.close || '18:00')}
                        title="Liberar ou ajustar vagas deste dia"
                        style={{
                          minHeight: 32,
                          borderRadius: 9,
                          border: `1px solid ${isOpen ? `${C.purple}66` : C.purple}`,
                          background: isOpen ? `${C.purple}18` : C.purple,
                          color: isOpen ? C.purple : '#fff',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: 11,
                          fontWeight: 850,
                        }}
                      >
                        {isOpen ? 'Ajustar vagas' : 'Liberar vagas'}
                      </button>
                    )}
                    <button
                      onClick={() => toggleBlockDate(day.date)}
                      title={isBlocked ? 'Desbloquear' : 'Bloquear dia'}
                      style={{
                        minHeight: 28,
                        borderRadius: 8,
                        border: `1px solid ${isBlocked ? C.red : C.border}`,
                        background: isBlocked ? `${C.red}18` : 'transparent',
                        color: isBlocked ? C.red : C.muted,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 10,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                      }}
                    >
                      {isBlocked ? <Unlock size={11} /> : <Lock size={11} />}
                      {isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <details style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 18 }}>
        <summary style={{ cursor: 'pointer', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>
          Referência da semana
        </summary>
        <p style={{ margin: '12px 0 14px', color: C.muted, fontSize: 12, lineHeight: 1.45 }}>
          Estes horários são apenas base para preencher os dias. Para a cliente enxergar vaga no link, libere o dia na grade acima.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
          {DAYS_KEYS.slice(1, 7).map((key, i) => {
            const config = workingHours[key] || { is_open: false, open: '09:00', close: '18:00' }
            return (
              <div key={key} style={{
                padding: '14px 8px',
                borderRadius: 14,
                border: `1.5px solid ${config.is_open ? C.purple : C.border}`,
                background: config.is_open ? `${C.purple}18` : C.card2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: config.is_open ? C.purple : 'rgba(255,255,255,0.06)', display: 'grid', placeItems: 'center' }}>
                  {config.is_open ? <Check size={15} color="#fff" /> : <span style={{ color: C.muted, fontSize: 13, fontWeight: 900 }}>-</span>}
                </div>
                <span style={{ color: config.is_open ? C.text : C.muted, fontSize: 12, fontWeight: 700 }}>{DAYS_FULL[i + 1].slice(0, 3)}</span>
                {config.is_open && <span style={{ color: C.muted, fontSize: 10 }}>{config.open}-{config.close}</span>}
              </div>
            )
          })}
        </div>
        <p style={{ margin: '12px 0 0', color: C.muted, fontSize: 11 }}>
          Ajuste a referência em <strong style={{ color: C.text }}>Configurações - Horários</strong>.
        </p>
      </details>

      {editDay && (
        <div onClick={e => e.target === e.currentTarget && setEditDay(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', padding: 18 }}>
          <div style={{ width: '100%', maxWidth: 420, maxHeight: 'calc(100vh - 36px)', overflowY: 'auto', borderRadius: 20, background: C.card, border: `1px solid ${C.border2}`, padding: 22, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.45)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
              <div>
                <p style={{ margin: '0 0 6px', color: C.purple, fontSize: 10, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>Liberar vagas</p>
                <strong style={{ color: C.text, fontSize: 18 }}> {editDay.label}</strong>
                <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 12, lineHeight: 1.45 }}>
                  Escolha um período pronto. A cliente só verá horários dentro desse intervalo.
                </p>
              </div>
              <button onClick={() => setEditDay(null)} style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', cursor: 'pointer', color: C.muted, fontFamily: 'inherit', flexShrink: 0 }}>x</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {presets.map(item => {
                const active = editDay.open === item.open && editDay.close === item.close
                return (
                  <button
                    key={item.label}
                    onClick={() => setEditDay(current => current ? { ...current, open: item.open, close: item.close } : current)}
                    style={{
                      minHeight: 62,
                      borderRadius: 14,
                      border: `1px solid ${active ? C.purple : C.border2}`,
                      background: active ? `${C.purple}22` : C.card2,
                      color: active ? C.text : C.muted,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      padding: '10px 12px',
                    }}
                  >
                    <strong style={{ display: 'block', color: active ? C.text : C.muted, fontSize: 13 }}>{item.label}</strong>
                    <span style={{ display: 'block', marginTop: 4, color: active ? C.purple : C.muted, fontSize: 11, fontWeight: 800 }}>{item.sub}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ border: `1px solid ${C.border}`, background: C.card2, borderRadius: 14, padding: 14 }}>
              <p style={{ margin: '0 0 10px', color: C.muted, fontSize: 11, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>Personalizar</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {(['open', 'close'] as const).map((field, fi) => (
                <div key={field}>
                  <label style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>{fi === 0 ? 'Abre' : 'Fecha'}</label>
                  <input type="time" value={editDay[field]}
                    onChange={e => setEditDay(d => d ? { ...d, [field]: e.target.value } : d)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border2}`, background: C.card2, color: C.text, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            </div>

            <div style={{ border: `1px solid ${C.green}30`, background: `${C.green}10`, borderRadius: 14, padding: 12 }}>
              <strong style={{ display: 'block', color: C.green, fontSize: 12 }}>Vai aparecer no link público</strong>
              <span style={{ display: 'block', marginTop: 4, color: C.muted, fontSize: 12 }}>
                {editDay.open} até {editDay.close}. Dias bloqueados ou sem salvar não aparecem para a cliente.
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              <button onClick={() => void saveEditDay(false)} disabled={saving}
                style={{ minHeight: 46, borderRadius: 12, border: 'none', background: C.purple, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 850 }}>
                {saving ? 'Salvando...' : 'Salvar vagas'}
              </button>
              <button onClick={() => void saveEditDay(true)} disabled={saving}
                style={{ minHeight: 44, borderRadius: 12, border: `1px solid ${C.green}40`, background: `${C.green}14`, color: C.green, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 850 }}>
                Salvar e gerar vitrine
              </button>
              <button onClick={() => setEditDay(null)} style={{ minHeight: 40, borderRadius: 12, border: `1px solid ${C.border}`, background: 'transparent', color: C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 760px) {
          .vagas-summary {
            grid-template-columns: 1fr !important;
            padding: 16px !important;
          }
          .vagas-summary-actions {
            justify-content: stretch !important;
          }
          .vagas-summary-actions > * {
            flex: 1 1 100%;
            justify-content: center;
          }
          .vagas-grid-section {
            padding: 16px !important;
          }
          .vagas-grid-section > div:first-child {
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .vagas-legend {
            gap: 10px 12px !important;
            margin-bottom: 12px !important;
          }
          .vagas-days-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
        }
      `}</style>
    </div>
  )
}
