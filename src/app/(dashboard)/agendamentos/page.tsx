'use client'

import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, CheckCircle2, Clock, Search, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Appointment } from '@/types/database'

const C = {
  bg: '#080812',
  card: '#10101f',
  card2: '#17172a',
  border: '#1c1c36',
  border2: '#26264a',
  purple: '#a78bfa',
  pink: '#f472b6',
  green: '#34d399',
  amber: '#fbbf24',
  red: '#f87171',
  text: '#e8e8f8',
  muted: '#7777a7',
}

const ST: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'confirmado', color: C.green },
  pending: { label: 'pendente', color: C.amber },
  completed: { label: 'concluido', color: C.purple },
  cancelled: { label: 'cancelado', color: C.red },
}

const money = (n: number) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`
const dateKey = (iso: string) => iso.slice(0, 10)
const todayKey = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10)
}
const time = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const fullDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })

function Badge({ status }: { status: string }) {
  const item = ST[status] || { label: status, color: C.muted }
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 10,
      fontWeight: 800,
      background: `${item.color}20`,
      color: item.color,
      border: `1px solid ${item.color}35`,
      textTransform: 'uppercase',
      letterSpacing: '.05em',
    }}>
      {item.label}
    </span>
  )
}

function EmptyState({ title }: { title: string }) {
  return (
    <div style={{
      minHeight: 180,
      display: 'grid',
      placeItems: 'center',
      textAlign: 'center',
      color: C.muted,
      padding: 24,
    }}>
      <div>
        <Sparkles size={28} color={C.purple} style={{ margin: '0 auto 10px' }} />
        <div style={{ fontSize: 13, fontWeight: 800 }}>{title}</div>
      </div>
    </div>
  )
}

function AppointmentRow({
  appointment,
  compact,
  onStatus,
}: {
  appointment: Appointment
  compact?: boolean
  onStatus: (id: string, status: string) => void
}) {
  const status = ST[appointment.status] || { label: appointment.status, color: C.muted }
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: compact ? '1fr' : 'minmax(0, 1fr) auto',
      gap: compact ? 12 : 16,
      padding: compact ? '14px 16px' : '16px 18px',
      borderBottom: `1px solid ${C.border}`,
      background: appointment.status === 'confirmed' ? `${C.green}08` : 'transparent',
    }}>
      <div style={{ display: 'flex', gap: 14, minWidth: 0 }}>
        <div style={{
          width: 62,
          minWidth: 62,
          borderRadius: 14,
          background: `${status.color}14`,
          border: `1px solid ${status.color}30`,
          display: 'grid',
          placeItems: 'center',
          alignSelf: 'flex-start',
          padding: '10px 6px',
        }}>
          <strong style={{ color: status.color, fontSize: 16, lineHeight: 1 }}>{time(appointment.appointment_date)}</strong>
          <span style={{ color: C.muted, fontSize: 9, marginTop: 4 }}>{fullDate(appointment.appointment_date)}</span>
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 850, lineHeight: 1.25 }}>
              {appointment.client_name || 'Cliente sem nome'}
            </h3>
            <Badge status={appointment.status} />
          </div>
          <p style={{ margin: '5px 0 0', color: C.muted, fontSize: 12 }}>
            {appointment.service_name} • {appointment.duration_minutes || 0}min
          </p>
          {appointment.notes && (
            <p style={{
              margin: '8px 0 0',
              color: C.amber,
              fontSize: 11,
              lineHeight: 1.45,
              maxWidth: 680,
            }}>
              {appointment.notes}
            </p>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: compact ? 'flex-start' : 'center',
        justifyContent: compact ? 'space-between' : 'flex-end',
        gap: 10,
        flexWrap: 'wrap',
      }}>
        <strong style={{ color: C.green, fontSize: 15 }}>{money(appointment.price)}</strong>
        {appointment.status === 'pending' && (
          <button onClick={() => onStatus(appointment.id, 'confirmed')} style={actionStyle(C.green)}>
            <Check size={13} /> Confirmar
          </button>
        )}
        {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
          <button onClick={() => onStatus(appointment.id, 'completed')} style={actionStyle(C.purple)}>
            <CheckCircle2 size={13} /> Concluir
          </button>
        )}
      </div>
    </div>
  )
}

function actionStyle(color: string): CSSProperties {
  return {
    height: 34,
    padding: '0 12px',
    borderRadius: 10,
    border: `1px solid ${color}44`,
    background: `${color}18`,
    color,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 800,
    fontFamily: 'inherit',
  }
}

export default function AgendamentosPage() {
  const [apts, setApts] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('todos')
  const [q, setQ] = useState('')

  useEffect(() => {
    const load = async () => {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await sb.from('profiles').select('studio_id').eq('id', user.id).single()
      if (!profile?.studio_id) { setLoading(false); return }
      const { data } = await sb
        .from('appointments')
        .select('*')
        .eq('studio_id', profile.studio_id)
        .order('appointment_date', { ascending: true })
      setApts(data || [])
      setLoading(false)
    }
    void load()
  }, [])

  const changeStatus = async (id: string, status: string) => {
    const sb = createClient()
    await sb.from('appointments').update({ status }).eq('id', id)
    setApts(prev => prev.map(item => item.id === id ? { ...item, status } : item))
  }

  const searched = useMemo(() => {
    const term = q.trim().toLowerCase()
    return apts
      .filter(item => filter === 'todos' || item.status === filter)
      .filter(item => !term || `${item.client_name} ${item.service_name} ${item.notes || ''}`.toLowerCase().includes(term))
  }, [apts, filter, q])

  const today = todayKey()
  const upcoming = searched.filter(item => dateKey(item.appointment_date) >= today && !['completed', 'cancelled'].includes(item.status))
  const history = searched.filter(item => !upcoming.some(next => next.id === item.id)).sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
  const count = (status: string) => status === 'todos' ? apts.length : apts.filter(item => item.status === status).length

  if (loading) {
    return <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', color: C.muted }}>Carregando agendamentos...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1180 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: '0 0 6px', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>
            Agenda do studio
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Agendamentos</h1>
          <p style={{ color: C.muted, fontSize: 12, margin: '5px 0 0' }}>
            {upcoming.length} proximos • {apts.length} no total
          </p>
        </div>
      </header>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 1fr) repeat(5, auto)',
        gap: 8,
        alignItems: 'center',
      }}>
        <label style={{
          height: 42,
          minWidth: 220,
          background: C.card,
          border: `1px solid ${C.border2}`,
          borderRadius: 12,
          padding: '0 13px',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          color: C.muted,
        }}>
          <Search size={15} />
          <input
            value={q}
            onChange={event => setQ(event.target.value)}
            placeholder="Buscar cliente, servico ou observacao"
            style={{
              width: '100%',
              background: 'transparent',
              border: 0,
              outline: 'none',
              color: C.text,
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          />
        </label>
        {['todos', 'pending', 'confirmed', 'completed', 'cancelled'].map(item => (
          <button key={item} onClick={() => setFilter(item)} style={{
            height: 36,
            padding: '0 13px',
            borderRadius: 999,
            border: `1px solid ${filter === item ? C.purple : C.border}`,
            background: filter === item ? `${C.purple}22` : 'transparent',
            color: filter === item ? C.purple : C.muted,
            cursor: 'pointer',
            fontSize: 11,
            fontFamily: 'inherit',
            fontWeight: filter === item ? 800 : 650,
            whiteSpace: 'nowrap',
          }}>
            {item === 'todos' ? 'Todos' : (ST[item]?.label || item)} ({count(item)})
          </button>
        ))}
      </section>

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: 14,
      }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{
            minHeight: 58,
            padding: '16px 18px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: `linear-gradient(135deg, ${C.green}12, transparent)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CalendarDays size={17} color={C.green} />
              <strong style={{ color: C.text, fontSize: 14 }}>Proximos atendimentos</strong>
            </div>
            <span style={{ color: C.green, fontSize: 11, fontWeight: 900 }}>{upcoming.length} ativos</span>
          </div>
          {upcoming.length === 0
            ? <EmptyState title="Nenhum horario futuro nessa busca" />
            : upcoming.map(item => <AppointmentRow key={item.id} appointment={item} onStatus={changeStatus} />)}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
          <div style={{
            minHeight: 54,
            padding: '15px 18px',
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={16} color={C.muted} />
              <strong style={{ color: C.text, fontSize: 14 }}>Historico recente</strong>
            </div>
            <span style={{ color: C.muted, fontSize: 11, fontWeight: 800 }}>{history.length} registros</span>
          </div>
          {history.length === 0
            ? <EmptyState title="Sem historico para mostrar" />
            : history.map(item => <AppointmentRow key={item.id} appointment={item} compact onStatus={changeStatus} />)}
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          section[style*="repeat(5"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
