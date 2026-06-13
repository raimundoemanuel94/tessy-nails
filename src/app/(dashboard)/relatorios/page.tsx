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
  completed: { label: 'concluído', color: C.purple },
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

    load()
  }, [])

  const completed = appointments.filter((appointment) => appointment.status === 'completed')
  const revenue = completed.reduce((sum, appointment) => sum + appointment.price, 0)
  const ticket = completed.length ? revenue / completed.length : 0
  const completionRate = appointments.length ? Math.round((completed.length / appointments.length) * 100) : 0
  const serviceCount: Record<string, number> = {}
  completed.forEach((appointment) => {
    serviceCount[appointment.service_name] = (serviceCount[appointment.service_name] || 0) + 1
  })
  const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxTop = topServices[0]?.[1] || 1

  if (loading) return <div className="studio-loading"><div /></div>

  return (
    <div className="studio-page">
      <header className="studio-page-header">
        <div>
          <span className="studio-eyebrow">Performance</span>
          <h1>Relatórios</h1>
          <p>Métricas do seu studio com base nos agendamentos registrados.</p>
        </div>
      </header>

      <section className="studio-report-grid">
        <Kpi label="Receita total" value={money(revenue)} sub={`${completed.length} concluídos`} color={C.green} />
        <Kpi label="Concluídos" value={completed.length} sub={`${appointments.length} agendamentos`} color={C.purple} />
        <Kpi label="Ticket médio" value={money(ticket)} sub="por atendimento" color={C.pink} />
        <Kpi label="Taxa conclusão" value={`${completionRate}%`} sub="conversão geral" color={C.amber} />
      </section>

      <section className="studio-report-panels">
        <article className="studio-report-panel">
          <header>
            <strong>Serviços mais realizados</strong>
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
            <span>{appointments.length} total</span>
          </header>
          {Object.entries(statusMap).map(([key, status]) => {
            const count = appointments.filter((appointment) => appointment.status === key).length
            const percent = appointments.length ? Math.round((count / appointments.length) * 100) : 0

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
    </div>
  )
}
