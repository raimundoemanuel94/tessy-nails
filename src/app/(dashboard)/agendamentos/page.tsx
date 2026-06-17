'use client'

import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, CheckCircle2, Clock, Search, Sparkles, XCircle } from 'lucide-react'
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
  no_show: { label: 'faltou', color: C.red },
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
  onConfirmWithWhatsapp,
  onRecusar,
}: {
  appointment: Appointment
  compact?: boolean
  onStatus: (id: string, status: string) => void
  onConfirmWithWhatsapp: (id: string) => Promise<void>
  onRecusar: (id: string) => Promise<void>
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
              maxWidth: '100%',
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
          <>
            <button onClick={() => void onConfirmWithWhatsapp(appointment.id)} style={actionStyle(C.green)}>
              <Check size={13} /> Confirmar + Zap
            </button>
            <button onClick={() => void onRecusar(appointment.id)} style={actionStyle(C.red)}>
              <XCircle size={13} /> Recusar
            </button>
          </>
        )}
        {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
          <button onClick={() => onStatus(appointment.id, 'completed')} style={actionStyle(C.purple)}>
            <CheckCircle2 size={13} /> Concluir
          </button>
        )}
        {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
          <button onClick={() => onStatus(appointment.id, 'no_show')} style={actionStyle(C.red)}>
            <XCircle size={13} /> Faltou
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
  const [studioId, setStudioId] = useState('')
  const [services, setServices] = useState<{ id: string; name: string; price: number; duration_minutes: number }[]>([])
  const [clients, setClients] = useState<{ id: string; name: string; phone: string | null }[]>([])
  const [newModal, setNewModal] = useState(false)
  const [newForm, setNewForm] = useState({ clientName: '', clientId: '', serviceId: '', date: '', time: '', price: '', notes: '', isPackage: false })
  const [savingNew, setSavingNew] = useState(false)

  useEffect(() => {
    const load = async () => {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await sb.from('profiles').select('studio_id').eq('id', user.id).single()
      if (!profile?.studio_id) { setLoading(false); return }
      const { data: studioData } = await sb.from('studios').select('whatsapp, phone').eq('id', profile.studio_id).single()
      setStudioId(profile.studio_id)
      const [{ data }, { data: svcData }, { data: cliData }] = await Promise.all([
        sb.from('appointments').select('*').eq('studio_id', profile.studio_id).order('appointment_date', { ascending: true }),
        sb.from('services').select('id, name, price, duration_minutes').eq('studio_id', profile.studio_id).eq('is_active', true).order('name'),
        sb.from('clients').select('id, name, phone').eq('studio_id', profile.studio_id).eq('is_active', true).order('name'),
      ])
      setApts(data || [])
      setServices(svcData || [])
      setClients(cliData || [])
      setLoading(false)
    }
    void load()
  }, [])

  const changeStatus = async (id: string, status: string) => {
    const sb = createClient()
    const { error } = await sb.from('appointments').update({ status }).eq('id', id)
    if (!error) setApts(prev => prev.map(item => item.id === id ? { ...item, status } : item))
    else console.error('Erro ao atualizar status:', error.message)
  }

  const confirmWithWhatsapp = async (id: string) => {
    const apt = apts.find(item => item.id === id)
    if (!apt) return

    // Confirma no banco
    await changeStatus(id, 'confirmed')

    // Busca telefone da cliente
    const sb = createClient()
    let clientPhone = ''
    if (apt.client_id) {
      const { data: client } = await sb.from('clients').select('phone').eq('id', apt.client_id).single()
      clientPhone = client?.phone || ''
    }

    if (!clientPhone) return // sem telefone, só confirma no banco

    // Monta mensagem
    const aptDate = new Date(apt.appointment_date)
    const hoje = new Date()
    hoje.setHours(0,0,0,0)
    const amanha = new Date(hoje); amanha.setDate(hoje.getDate() + 1)
    const aptDay = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate())
    const diffDays = Math.round((aptDay.getTime() - hoje.getTime()) / 86400000)
    const quando = diffDays === 0 ? 'hoje' : diffDays === 1 ? 'amanhã' : aptDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    const hora = aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const nome = apt.client_name?.split(' ')[0] || 'cliente'

    const msg = `Olá ${nome}! ✅ Seu agendamento de *${apt.service_name}* foi confirmado para *${quando} às ${hora}*. Te esperamos! 💅`

    const number = clientPhone.replace(/\D/g, '')
    const url = `https://wa.me/55${number}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const recusarWithWhatsapp = async (id: string) => {
    const apt = apts.find(item => item.id === id)
    if (!apt) return

    await changeStatus(id, 'cancelled')

    const sb = createClient()
    let clientPhone = ''
    if (apt.client_id) {
      const { data: client } = await sb.from('clients').select('phone').eq('id', apt.client_id).single()
      clientPhone = client?.phone || ''
    }
    if (!clientPhone) return

    const aptDate = new Date(apt.appointment_date)
    const hoje = new Date(); hoje.setHours(0,0,0,0)
    const diffDays = Math.round((new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate()).getTime() - hoje.getTime()) / 86400000)
    const quando = diffDays === 0 ? 'hoje' : diffDays === 1 ? 'amanhã' : aptDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    const hora = aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const nome = apt.client_name?.split(' ')[0] || 'cliente'

    const msg = `Olá ${nome}! 😔 Infelizmente não consigo te atender ${quando} às ${hora}. Por favor, entre em contato para remarcar. 💅`
    const number = clientPhone.replace(/\D/g, '')
    window.open('https://wa.me/55' + number + '?text=' + encodeURIComponent(msg), '_blank')
  }

    const createAppointment = async () => {
    if (!newForm.clientName.trim() || !newForm.serviceId || !newForm.date || !newForm.time) return
    setSavingNew(true)
    const sb = createClient()
    const service = services.find(s => s.id === newForm.serviceId)
    const client = clients.find(c => c.id === newForm.clientId)
    const appointmentDate = `${newForm.date}T${newForm.time}:00`
    const price = newForm.isPackage ? 0 : (parseFloat(newForm.price) || service?.price || 0)

    // Check conflict
    const { data: conflicts } = await sb
      .from('appointments')
      .select('id, appointment_date, duration_minutes')
      .eq('studio_id', studioId)
      .eq('appointment_date::date', newForm.date)
      .not('status', 'in', '("cancelled","no_show")')

    const newStart = new Date(appointmentDate).getTime()
    const newEnd = newStart + (service?.duration_minutes || 60) * 60000
    const hasConflict = (conflicts || []).some(apt => {
      const start = new Date(apt.appointment_date).getTime()
      const end = start + apt.duration_minutes * 60000
      return newStart < end && newEnd > start
    })

    if (hasConflict) {
      alert('Conflito de horário! Já existe um agendamento nesse horário.')
      setSavingNew(false)
      return
    }

    let clientId = newForm.clientId
    if (!clientId && newForm.clientName.trim()) {
      const { data: newClient } = await sb.from('clients').insert({
        studio_id: studioId, name: newForm.clientName.trim(), source: 'manual'
      }).select('id').single()
      if (newClient) { clientId = newClient.id; setClients(prev => [...prev, { id: newClient.id, name: newForm.clientName.trim(), phone: null }]) }
    }

    const { data: apt } = await sb.from('appointments').insert({
      studio_id: studioId,
      client_id: clientId || null,
      client_name: client?.name || newForm.clientName.trim(),
      service_id: newForm.serviceId,
      service_name: service?.name || '',
      appointment_date: appointmentDate,
      duration_minutes: service?.duration_minutes || 60,
      price,
      status: 'confirmed',
      source: 'manual',
      notes: newForm.notes || null,
    }).select('*').single()

    if (apt) {
      setApts(prev => [...prev, apt as Appointment].sort((a, b) => a.appointment_date.localeCompare(b.appointment_date)))
      setNewModal(false)
      setNewForm({ clientName: '', clientId: '', serviceId: '', date: '', time: '', price: '', notes: '', isPackage: false })
    }
    setSavingNew(false)
  }

    const searched = useMemo(() => {
    const term = q.trim().toLowerCase()
    return apts
      .filter(item => filter === 'todos' || item.status === filter)
      .filter(item => !term || `${item.client_name} ${item.service_name} ${item.notes || ''}`.toLowerCase().includes(term))
  }, [apts, filter, q])

  const today = todayKey()
  const upcoming = searched.filter(item => dateKey(item.appointment_date) >= today && !['completed', 'cancelled', 'no_show'].includes(item.status))
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
          minWidth: 0,
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
        {['todos', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'].map(item => (
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

      {/* Modal novo agendamento */}
      {newModal && (
        <div onClick={e => e.target === e.currentTarget && setNewModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, borderRadius: 20, background: C.card, border: `1px solid ${C.border2}`, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: C.text, fontSize: 16 }}>Novo agendamento</strong>
              <button onClick={() => setNewModal(false)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${C.border2}`, background: 'transparent', color: C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }}>×</button>
            </div>

            {/* Cliente */}
            <div>
              <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Cliente</label>
              <input
                list="clients-list"
                value={newForm.clientName}
                onChange={e => {
                  const name = e.target.value
                  const found = clients.find(c => c.name === name)
                  setNewForm(f => ({ ...f, clientName: name, clientId: found?.id || '' }))
                }}
                placeholder="Nome da cliente..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border2}`, background: C.card2, color: C.text, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' as const }}
              />
              <datalist id="clients-list">
                {clients.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>

            {/* Serviço */}
            <div>
              <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Serviço</label>
              <select
                value={newForm.serviceId}
                onChange={e => {
                  const svc = services.find(s => s.id === e.target.value)
                  setNewForm(f => ({ ...f, serviceId: e.target.value, price: svc?.price?.toString() || '' }))
                }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border2}`, background: C.card2, color: C.text, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' as const }}
              >
                <option value="">Escolher serviço...</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} — R$ {s.price.toFixed(2).replace('.', ',')}</option>)}
              </select>
            </div>

            {/* Data e Hora */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Data</label>
                <input type="date" value={newForm.date} onChange={e => setNewForm(f => ({ ...f, date: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border2}`, background: C.card2, color: C.text, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Horário</label>
                <input type="time" value={newForm.time} onChange={e => setNewForm(f => ({ ...f, time: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border2}`, background: C.card2, color: C.text, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' as const }} />
              </div>
            </div>

            {/* Pacote mensal toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: C.card2, border: `1px solid ${C.border}` }}>
              <input type="checkbox" id="isPackage" checked={newForm.isPackage} onChange={e => setNewForm(f => ({ ...f, isPackage: e.target.checked }))}
                style={{ width: 16, height: 16, cursor: 'pointer', accentColor: C.purple }} />
              <label htmlFor="isPackage" style={{ color: C.text, fontSize: 13, cursor: 'pointer' }}>
                Cliente de pacote mensal <span style={{ color: C.muted, fontSize: 11 }}>(não cobra por sessão)</span>
              </label>
            </div>

            {/* Preço — só mostra se não for pacote */}
            {!newForm.isPackage && (
              <div>
                <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Valor (R$)</label>
                <input type="number" value={newForm.price} onChange={e => setNewForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0,00" min="0" step="0.01"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border2}`, background: C.card2, color: C.text, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' as const }} />
              </div>
            )}

            {/* Observações */}
            <div>
              <label style={{ display: 'block', color: C.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Observações</label>
              <input value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Alergias, preferências..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${C.border2}`, background: C.card2, color: C.text, fontFamily: 'inherit', fontSize: 14, boxSizing: 'border-box' as const }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setNewModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${C.border2}`, background: 'transparent', color: C.muted, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Cancelar</button>
              <button onClick={() => void createAppointment()} disabled={savingNew || !newForm.clientName || !newForm.serviceId || !newForm.date || !newForm.time}
                style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: C.purple, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, opacity: savingNew ? 0.7 : 1 }}>
                {savingNew ? 'Salvando...' : 'Criar agendamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
