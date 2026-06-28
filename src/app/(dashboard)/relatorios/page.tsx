'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Appointment } from '@/types/database'

const C = {
  purple: '#a78bfa', pink: '#f472b6', green: '#34d399',
  amber: '#fbbf24', red: '#f87171', muted: '#8f89aa',
  card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)',
}
const money = (n: number) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`
const pct = (n: number, t: number) => t ? Math.round(n / t * 100) : 0

const PERIODS = [
  { key: 'week',       label: 'Semana'   },
  { key: 'month',      label: 'Mês'      },
  { key: 'last_month', label: 'Mês ant.' },
  { key: '3months',    label: '3 meses'  },
  { key: 'all',        label: 'Tudo'     },
] as const
type Period = typeof PERIODS[number]['key']

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Confirmado', color: C.green  },
  pending:   { label: 'Pendente',   color: C.amber  },
  completed: { label: 'Concluído',  color: C.purple },
  cancelled: { label: 'Cancelado',  color: C.red    },
}
const WEEK_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function SkeletonCard({ h = 80 }: { h?: number }) {
  return <div style={{ height: h, borderRadius: 14, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s ease infinite' }} />
}

function Kpi({ label, value, sub, color, loading }: { label: string; value: string; sub?: string; color: string; loading: boolean }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}88, transparent)` }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</span>
      {loading
        ? <div style={{ height: 28, width: 80, borderRadius: 6, background: 'rgba(255,255,255,0.07)', marginTop: 8, animation: 'pulse 1.5s ease infinite' }} />
        : <strong style={{ display: 'block', fontSize: 24, fontWeight: 800, color: '#f0f0ff', marginTop: 6, lineHeight: 1 }}>{value}</strong>}
      {sub && !loading && <span style={{ fontSize: 11, color: C.muted, marginTop: 4, display: 'block' }}>{sub}</span>}
    </div>
  )
}

function Bar({ value, max, color, label, tooltip }: { value: number; max: number; color: string; label: string; tooltip: string }) {
  const h = Math.max(4, Math.round((value / Math.max(max, 1)) * 80))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }} title={tooltip}>
      <div style={{ width: '100%', height: 80, display: 'flex', alignItems: 'flex-end' }}>
        <div style={{
          width: '100%', height: h, borderRadius: '5px 5px 2px 2px',
          background: value > 0 ? `linear-gradient(180deg, ${color}cc, ${color}66)` : 'rgba(255,255,255,0.04)',
          transition: 'height .4s cubic-bezier(.34,1.56,.64,1)',
          border: value > 0 ? `1px solid ${color}44` : 'none',
        }} />
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#e8e8f8' }}>{title}</span>
        {sub && <span style={{ fontSize: 11, color: C.muted }}>{sub}</span>}
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  )
}

export default function RelatoriosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('month')

  useEffect(() => {
    void (async () => {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await sb.from('profiles').select('studio_id').eq('id', user.id).single()
      if (!profile?.studio_id) { setLoading(false); return }
      const { data } = await sb.from('appointments').select('*').eq('studio_id', profile.studio_id)
      setAppointments(data || [])
      setLoading(false)
    })()
  }, [])

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      const d = new Date(a.appointment_date), now = new Date()
      if (period === 'all') return true
      if (period === 'week') { const s = new Date(now); s.setDate(now.getDate() - now.getDay()); s.setHours(0,0,0,0); return d >= s }
      if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      if (period === 'last_month') { const s = new Date(now.getFullYear(), now.getMonth()-1, 1), e = new Date(now.getFullYear(), now.getMonth(), 0, 23,59,59); return d >= s && d <= e }
      if (period === '3months') { const s = new Date(now); s.setMonth(now.getMonth()-3); s.setHours(0,0,0,0); return d >= s }
      return true
    })
  }, [appointments, period])

  const completed  = useMemo(() => filtered.filter(a => a.status === 'completed'), [filtered])
  const revenue    = useMemo(() => completed.reduce((s, a) => s + a.price, 0), [completed])
  const ticket     = completed.length ? revenue / completed.length : 0
  const completion = pct(completed.length, filtered.length)

  const topServices = useMemo(() => {
    const m: Record<string, number> = {}
    completed.forEach(a => { m[a.service_name] = (m[a.service_name] || 0) + 1 })
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [completed])
  const maxTop = topServices[0]?.[1] || 1

  const byDay = useMemo(() =>
    WEEK_LABELS.map((label, i) => ({
      label,
      value: completed.filter(a => new Date(a.appointment_date).getDay() === i).reduce((s, a) => s + a.price, 0),
    }))
  , [completed])
  const maxDay = Math.max(...byDay.map(d => d.value), 1)

  const byWeek = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => {
      const end = new Date(); end.setDate(end.getDate() - i * 7); end.setHours(23,59,59,999)
      const start = new Date(end); start.setDate(start.getDate() - 6); start.setHours(0,0,0,0)
      return { label: `S${8-i}`, value: completed.filter(a => { const d = new Date(a.appointment_date); return d >= start && d <= end }).reduce((s, a) => s + a.price, 0) }
    }).reverse()
  , [completed])
  const maxWeek = Math.max(...byWeek.map(w => w.value), 1)

  return (
    <div className="studio-page">
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        .period-btn { transition: all .15s ease; }
        .period-btn:hover { background: rgba(255,255,255,0.07) !important; }
      `}</style>

      <header className="studio-page-header" style={{ marginBottom: 20 }}>
        <div>
          <span className="studio-eyebrow">Performance</span>
          <h1>Relatórios</h1>
          <p>{loading ? 'Carregando dados…' : `${filtered.length} agendamentos no período`}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PERIODS.map(p => (
            <button key={p.key} className="period-btn" onClick={() => setPeriod(p.key)} style={{
              padding: '7px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              border: period === p.key ? 'none' : '1px solid rgba(255,255,255,0.1)',
              background: period === p.key ? '#7c3aed' : 'rgba(255,255,255,0.04)',
              color: period === p.key ? '#fff' : C.muted,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{p.label}</button>
          ))}
        </div>
      </header>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: 16 }}>
        <Kpi label="Receita" value={money(revenue)} sub={`${completed.length} concluídos`} color={C.green} loading={loading} />
        <Kpi label="Ticket médio" value={money(ticket)} sub="por atendimento" color={C.pink} loading={loading} />
        <Kpi label="Conclusão" value={`${completion}%`} sub={`${filtered.length} totais`} color={C.purple} loading={loading} />
        <Kpi label="Agendamentos" value={String(filtered.length)} sub={`${completed.length} concluídos`} color={C.amber} loading={loading} />
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Panel title="Receita por dia" sub="concluídos">
          {loading
            ? <SkeletonCard h={100} />
            : <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                {byDay.map(d => <div key={d.label} style={{flex:1}}><Bar value={Number(d.value)} max={maxDay} color={C.purple} label={String(d.label)} tooltip={`${d.label}: ${money(d.value)}`} /></div>)}
              </div>}
        </Panel>
        <Panel title="Evolução semanal" sub="últimas 8 semanas">
          {loading
            ? <SkeletonCard h={100} />
            : <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                {byWeek.map(w => <div key={w.label} style={{flex:1}}><Bar value={Number(w.value)} max={maxWeek} color={C.green} label={String(w.label)} tooltip={`${w.label}: ${money(w.value)}`} /></div>)}
              </div>}
        </Panel>
      </div>

      {/* Serviços + Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Panel title="Top serviços" sub="por volume">
          {loading ? <SkeletonCard /> : topServices.length === 0
            ? <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Nenhum serviço concluído ainda</p>
            : topServices.map(([name, count], i) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topServices.length-1 ? `1px solid ${C.border}` : 'none' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: C.muted, width: 20, textAlign: 'center' }}>#{i+1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', marginTop: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct(count, maxTop)}%`, background: `linear-gradient(90deg, ${C.purple}, ${C.pink})`, borderRadius: 999, transition: 'width .5s ease' }} />
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.purple, flexShrink: 0 }}>{count}×</span>
              </div>
            ))}
        </Panel>

        <Panel title="Por status" sub={`${filtered.length} no período`}>
          {loading ? <SkeletonCard /> : Object.entries(STATUS_MAP).map(([key, { label, color }]) => {
            const count = filtered.filter(a => a.status === key).length
            const p = pct(count, filtered.length)
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
                  <span style={{ fontSize: 12, color: C.muted }}>{count} <span style={{ fontSize: 10 }}>({p}%)</span></span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 999, transition: 'width .5s ease' }} />
                </div>
              </div>
            )
          })}
        </Panel>
      </div>
    </div>
  )
}
