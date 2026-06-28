'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Appointment } from '@/types/database'

const C = {
  purple: '#a78bfa',
  pink: '#f472b6',
  green: '#34d399',
  amber: '#fbbf24',
  red: '#f87171',
  muted: '#8f89aa',
}

const statusMap: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'confirmado', color: C.green },
  pending: { label: 'pendente', color: C.amber },
  completed: { label: 'concluido', color: C.purple },
  cancelled: { label: 'cancelado', color: C.red },
}

const money = (n: number) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`

function Kpi({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <article className="studio-report-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub && <small>{sub}</small>}
      <i style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
    </article>
  )
}

export default function RelatoriosPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'last_month' | '3months' | 'all'>('month')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase.from('profiles').select('studio_id').eq('id', user.id).single()
      if (!profile?.studio_id) { setLoading(false); return }

      const { data } = await supabase.from('appointments').select('*').eq('studio_id', profile.studio_id)
      setAppointments(data || [])
      setLoading(false)
    }

    void load()
  }, [])

  const filteredByPeriod = appointments.filter((apt) => {
    if (period === 'all') return true
    const d = new Date(apt.appointment_date)
    const now = new Date()
    if (period === 'week') {
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      start.setHours(0, 0, 0, 0)
      return d >= start
    }
    if (period === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }
    if (period === 'last_month') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return d >= lm && d <= lmEnd
    }
    if (period === '3months') {
      const start = new Date(now)
      start.setMonth(now.getMonth() - 3)
      start.setHours(0, 0, 0, 0)
      return d >= start
    }
    return true
  })

  const completed = filteredByPeriod.filter((appointment) => appointment.status === 'completed')
  const revenue = completed.reduce((sum, appointment) => sum + appointment.price, 0)
  const ticket = completed.length ? revenue / completed.length : 0
  const completionRate = filteredByPeriod.length ? Math.round((completed.length / filteredByPeriod.length) * 100) : 0
  const serviceCount: Record<string, number> = {}
  completed.forEach((appointment) => {
    serviceCount[appointment.service_name] = (serviceCount[appointment.service_name] || 0) + 1
  })
  const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxTop = topServices[0]?.[1] || 1

  // Receita por dia da semana (concluídos)
  const WEEK_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const revenueByDay = WEEK_LABELS.map((label, idx) => ({
    label,
    value: completed.filter(a => new Date(a.appointment_date).getDay() === idx).reduce((s, a) => s + a.price, 0),
  }))
  const maxDay = Math.max(...revenueByDay.map(d => d.value), 1)

  // Receita últimas 8 semanas
  const weeklyRevenue = Array.from({ length: 8 }, (_, i) => {
    const end = new Date(); end.setDate(end.getDate() - i * 7); end.setHours(23,59,59,999)
    const start = new Date(end); start.setDate(start.getDate() - 6); start.setHours(0,0,0,0)
    const rev = completed.filter(a => { const d = new Date(a.appointment_date); return d >= start && d <= end }).reduce((s, a) => s + a.price, 0)
    return { label: `S${8 - i}`, value: rev }
  }).reverse()
  const maxWeek = Math.max(...weeklyRevenue.map(w => w.value), 1)

  if (loading) return <div className="studio-loading"><div /></div>

  return (
    <div className="studio-page">
      <header className="studio-page-header">
        <div>
          <span className="studio-eyebrow">Performance</span>
          <h1>Relatorios</h1>
          <p>Metricas do seu studio com base nos agendamentos registrados.</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['week', 'month', 'last_month', '3months', 'all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              border: period === p ? 'none' : '1px solid rgba(255,255,255,0.1)',
              background: period === p ? '#7c3aed' : 'rgba(255,255,255,0.04)',
              color: period === p ? '#fff' : '#8f89aa',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .15s',
            }}>
              {({ week: 'Semana', month: 'Mes', last_month: 'Mes ant.', '3months': '3 meses', all: 'Tudo' } as Record<typeof p, string>)[p]}
            </button>
          ))}
        </div>
      </header>

      <section className="studio-report-grid">
        <Kpi label="Receita total" value={money(revenue)} sub={`${completed.length} concluidos`} color={C.green} />
        <Kpi label="Concluidos" value={completed.length} sub={`${filteredByPeriod.length} agendamentos`} color={C.purple} />
        <Kpi label="Ticket medio" value={money(ticket)} sub="por atendimento" color={C.pink} />
        <Kpi label="Taxa conclusao" value={`${completionRate}%`} sub="conversao geral" color={C.amber} />
      </section>

      <section className="studio-report-panels">
        <article className="studio-report-panel">
          <header>
            <strong>Servicos mais realizados</strong>
            <span>Top 5</span>
          </header>
          {topServices.length === 0 ? (
            <p>Nenhum dado ainda</p>
          ) : topServices.map(([name, count], index) => (
            <div className="studio-progress-row" key={name}>
              <div>
                <span>#{index + 1}</span>
                <strong>{name}</strong>
                <em>{count}x</em>
              </div>
              <div><i style={{ width: `${(count / maxTop) * 100}%` }} /></div>
            </div>
          ))}
        </article>

        <article className="studio-report-panel">
          <header>
            <strong>Por status</strong>
            <span>{filteredByPeriod.length} no periodo</span>
          </header>
          {Object.entries(statusMap).map(([key, status]) => {
            const count = filteredByPeriod.filter((appointment) => appointment.status === key).length
            const percent = filteredByPeriod.length ? Math.round((count / filteredByPeriod.length) * 100) : 0

            return (
              <div className="studio-status-row" key={key} style={{ borderColor: `${status.color}33` }}>
                <div>
                  <span style={{ color: status.color }}>{status.label}</span>
                  <strong>{count} <small>({percent}%)</small></strong>
                </div>
                <div><i style={{ width: `${percent}%`, background: status.color }} /></div>
              </div>
            )
          })}
        </article>
      </section>

      <section className="studio-report-panels">
        <article className="studio-report-panel">
          <header>
            <strong>Receita por dia da semana</strong>
            <span>concluídos</span>
          </header>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100, padding: '16px 16px 0' }}>
            {revenueByDay.map(({ label, value }) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div
                  title={`R$ ${value.toFixed(2)}`}
                  style={{
                    width: '100%',
                    height: Math.max(4, Math.round((value / maxDay) * 72)),
                    borderRadius: '6px 6px 2px 2px',
                    background: value > 0 ? `linear-gradient(180deg, ${C.purple}, #7c3aed)` : 'rgba(255,255,255,0.06)',
                    transition: 'height .3s ease',
                  }}
                />
                <span style={{ color: C.muted, fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="studio-report-panel">
          <header>
            <strong>Evolução semanal</strong>
            <span>últimas 8 semanas</span>
          </header>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100, padding: '16px 16px 0' }}>
            {weeklyRevenue.map(({ label, value }) => (
              <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div
                  title={`R$ ${value.toFixed(2)}`}
                  style={{
                    width: '100%',
                    height: Math.max(4, Math.round((value / maxWeek) * 72)),
                    borderRadius: '6px 6px 2px 2px',
                    background: value > 0 ? `linear-gradient(180deg, ${C.green}, #16a34a)` : 'rgba(255,255,255,0.06)',
                    transition: 'height .3s ease',
                  }}
                />
                <span style={{ color: C.muted, fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>{label}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
