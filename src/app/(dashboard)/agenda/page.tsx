'use client'

import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import {
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Search,
  Share2,
  Sparkles,
  XCircle,
} from 'lucide-react'
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
  amber: '#fbbf24',
  red: '#f87171',
  text: '#e8e8f8',
  muted: '#7777a7',
}

const ST: Record<string, { label: string; color: string }> = {
  confirmed: { label: 'Confirmado', color: C.green },
  pending: { label: 'Pendente', color: C.amber },
  completed: { label: 'Concluido', color: C.purple },
  cancelled: { label: 'Cancelado', color: C.red },
  no_show: { label: 'Faltou', color: C.red },
}

type ViewMode = 'today' | 'week' | 'history'

const money = (n: number) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`
const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const time = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const longDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
const activeStatus = ['pending', 'confirmed']

function Badge({ status }: { status: string }) {
  const item = ST[status] || { label: status, color: C.muted }
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: 999,
      fontSize: 10,
      fontWeight: 850,
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

function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div style={{ minHeight: 190, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 28, color: C.muted }}>
      <div>
        <Sparkles size={28} color={C.purple} style={{ margin: '0 auto 10px' }} />
        <strong style={{ color: C.text, fontSize: 14 }}>{title}</strong>
        {text && <p style={{ margin: '6px 0 0', fontSize: 12, lineHeight: 1.45 }}>{text}</p>}
      </div>
    </div>
  )
}

function AppointmentCard({
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
  const canAct = activeStatus.includes(appointment.status)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: compact ? '1fr' : '74px 4px minmax(0, 1fr)',
      gap: compact ? 12 : 14,
      padding: compact ? '14px 16px' : '16px 18px',
      borderBottom: `1px solid ${C.border}`,
      background: appointment.status === 'confirmed' ? `${C.green}07` : 'transparent',
    }}>
      {!compact && (
        <>
          <div style={{ textAlign: 'center' }}>
            <strong style={{ color: status.color, fontSize: 18 }}>{time(appointment.appointment_date)}</strong>
            <span style={{ display: 'block', color: C.muted, fontSize: 10, marginTop: 4 }}>{appointment.duration_minutes || 0}min</span>
          </div>
          <div style={{ width: 4, borderRadius: 999, background: status.color, opacity: 0.7 }} />
        </>
      )}

      <div style={{ minWidth: 0 }}>
        {compact && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 9 }}>
            <strong style={{ color: status.color, fontSize: 15 }}>{time(appointment.appointment_date)}</strong>
            <span style={{ color: C.muted, fontSize: 11 }}>{shortDate(appointment.appointment_date)}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 850, lineHeight: 1.25 }}>
            {appointment.client_name || 'Cliente sem nome'}
          </h3>
          <Badge status={appointment.status} />
        </div>

        <div style={{ margin: '7px 0 0', color: C.muted, fontSize: 12, display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{appointment.service_name}</span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.border2, flex: '0 0 auto' }} />
          <span style={{ whiteSpace: 'nowrap', flex: '0 0 auto' }}>{appointment.duration_minutes || 0}min</span>
          <span style={{ color: C.green, fontWeight: 850, whiteSpace: 'nowrap' }}>{money(appointment.price)}</span>
        </div>

        {appointment.notes && (
          <p style={{ margin: '8px 0 0', color: C.amber, fontSize: 11, lineHeight: 1.45 }}>
            {appointment.notes}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
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
          {canAct && (
            <>
              <button onClick={() => onStatus(appointment.id, 'completed')} style={actionStyle(C.purple)}>
                <CheckCircle2 size={13} /> Concluir
              </button>
              <button onClick={() => onStatus(appointment.id, 'no_show')} style={actionStyle(C.red)}>
                <XCircle size={13} /> Faltou
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const navButtonStyle: CSSProperties = {
  height: 36,
  minWidth: 36,
  borderRadius: 10,
  border: `1px solid ${C.border2}`,
  background: C.card,
  color: C.muted,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 850,
}

export default function AgendaPage() {
  const [apts, setApts] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(ymd(new Date()))
  const [studioSlug, setStudioSlug] = useState('')
  const [copied, setCopied] = useState(false)
  const [bannerOpen, setBannerOpen] = useState(false)
  const [bannerSlots, setBannerSlots] = useState<string[]>([])
  const [view, setView] = useState<ViewMode>('today')
  const [filter, setFilter] = useState('todos')
  const [q, setQ] = useState('')

  useEffect(() => {
    const load = async () => {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await sb.from('profiles').select('studio_id').eq('id', user.id).single()
      if (!profile?.studio_id) { setLoading(false); return }
      const { data: studioData } = await sb.from('studios').select('slug').eq('id', profile.studio_id).single()
      if (studioData?.slug) setStudioSlug(studioData.slug)
      const { data } = await sb
        .from('appointments')
        .select('*')
        .eq('studio_id', profile.studio_id)
        .order('appointment_date', { ascending: true })
      const rows = data || []
      setApts(rows)
      const next = rows
        .filter(item => item.appointment_date >= new Date().toISOString() && !['completed', 'cancelled', 'no_show'].includes(item.status))
        .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0]
      if (next) setSelectedDate(next.appointment_date.slice(0, 10))
      setLoading(false)
    }
    void load()
  }, [])

  const today = ymd(new Date())
  const days = useMemo(() => {
    const start = new Date()
    start.setHours(12, 0, 0, 0)
    start.setDate(start.getDate() + offset)
    return Array.from({ length: 14 }, (_, index) => {
      const d = new Date(start)
      d.setDate(start.getDate() + index)
      return d
    })
  }, [offset])

  const todayApts = apts
    .filter(item => item.appointment_date.slice(0, 10) === today)
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))

  const selectedApts = apts
    .filter(item => item.appointment_date.slice(0, 10) === selectedDate)
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))

  const nextApt = apts
    .filter(item => item.appointment_date >= new Date().toISOString() && !['completed', 'cancelled', 'no_show'].includes(item.status))
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0]

  const searched = useMemo(() => {
    const term = q.trim().toLowerCase()
    return apts
      .filter(item => filter === 'todos' || item.status === filter)
      .filter(item => !term || `${item.client_name} ${item.service_name} ${item.notes || ''}`.toLowerCase().includes(term))
  }, [apts, filter, q])

  const upcoming = searched.filter(item => item.appointment_date.slice(0, 10) >= today && !['completed', 'cancelled', 'no_show'].includes(item.status))
  const history = searched.filter(item => !upcoming.some(next => next.id === item.id)).sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
  const selectedRevenue = selectedApts.filter(item => item.status !== 'cancelled').reduce((sum, item) => sum + Number(item.price || 0), 0)
  const todayRevenue = todayApts.filter(item => item.status !== 'cancelled').reduce((sum, item) => sum + Number(item.price || 0), 0)
  const count = (status: string) => status === 'todos' ? apts.length : apts.filter(item => item.status === status).length

  const changeStatus = async (id: string, status: string) => {
    const sb = createClient()
    await sb.from('appointments').update({ status }).eq('id', id)
    setApts(prev => prev.map(item => item.id === id ? { ...item, status } : item))
  }

  const getClientPhone = async (apt: Appointment) => {
    if (!apt.client_id) return ''
    const sb = createClient()
    const { data: client } = await sb.from('clients').select('phone').eq('id', apt.client_id).single()
    return client?.phone || ''
  }

  const appointmentWhenText = (iso: string) => {
    const aptDate = new Date(iso)
    const startToday = new Date()
    startToday.setHours(0, 0, 0, 0)
    const aptDay = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate())
    const diffDays = Math.round((aptDay.getTime() - startToday.getTime()) / 86400000)
    const quando = diffDays === 0 ? 'hoje' : diffDays === 1 ? 'amanha' : aptDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    const hora = aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return { quando, hora }
  }

  const confirmWithWhatsapp = async (id: string) => {
    const apt = apts.find(item => item.id === id)
    if (!apt) return
    await changeStatus(id, 'confirmed')
    const clientPhone = await getClientPhone(apt)
    if (!clientPhone) return
    const { quando, hora } = appointmentWhenText(apt.appointment_date)
    const nome = apt.client_name?.split(' ')[0] || 'cliente'
    const msg = `Ola ${nome}! Seu agendamento de *${apt.service_name}* foi confirmado para *${quando} as ${hora}*. Te esperamos!`
    window.open(`https://wa.me/55${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const recusarWithWhatsapp = async (id: string) => {
    const apt = apts.find(item => item.id === id)
    if (!apt) return
    await changeStatus(id, 'cancelled')
    const clientPhone = await getClientPhone(apt)
    if (!clientPhone) return
    const { quando, hora } = appointmentWhenText(apt.appointment_date)
    const nome = apt.client_name?.split(' ')[0] || 'cliente'
    const msg = `Ola ${nome}! Infelizmente nao consigo te atender ${quando} as ${hora}. Por favor, entre em contato para remarcar.`
    window.open(`https://wa.me/55${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const bookingUrl = studioSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/agendar/${studioSlug}` : ''
  const copyLink = () => {
    if (!bookingUrl) return
    navigator.clipboard.writeText(bookingUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  if (loading) {
    return <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', color: C.muted }}>Carregando agenda...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1180 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: '0 0 6px', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>
            Central de atendimento
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Agenda</h1>
          <p style={{ color: C.muted, fontSize: 12, margin: '5px 0 0' }}>
            Hoje, semana e historico no mesmo lugar
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'today', label: 'Hoje' },
            { id: 'week', label: 'Semana' },
            { id: 'history', label: 'Historico' },
          ].map(item => {
            const active = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewMode)}
                style={{
                  height: 38,
                  padding: '0 14px',
                  borderRadius: 999,
                  border: `1px solid ${active ? C.purple : C.border2}`,
                  background: active ? `${C.purple}22` : C.card,
                  color: active ? C.purple : C.muted,
                  fontWeight: 850,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </header>

      {view === 'today' && (
        <>
          {nextApt && (
            <section className="agenda-next-card" style={{
              display: 'grid',
              gridTemplateColumns: 'auto minmax(0, 1fr) auto',
              gap: 14,
              alignItems: 'center',
              padding: 16,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${C.green}14, ${C.purple}08)`,
              border: `1px solid ${C.green}30`,
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 15, display: 'grid', placeItems: 'center', background: `${C.green}16`, border: `1px solid ${C.green}35`, color: C.green }}>
                <CalendarCheck size={21} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, color: C.green, fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>Proximo horario</p>
                <h2 style={{ margin: '4px 0 0', color: C.text, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {nextApt.client_name || 'Cliente'} - {nextApt.service_name}
                </h2>
                <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 12 }}>{shortDate(nextApt.appointment_date)} as {time(nextApt.appointment_date)}</p>
              </div>
              <button onClick={() => { setSelectedDate(nextApt.appointment_date.slice(0, 10)); setView('week') }} style={{ ...navButtonStyle, padding: '0 13px', minWidth: 'auto', color: C.green, border: `1px solid ${C.green}35`, background: `${C.green}14` }}>
                Abrir dia
              </button>
            </section>
          )}

          <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ minHeight: 64, padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: `linear-gradient(135deg, ${C.purple}10, transparent)` }}>
              <div>
                <h2 style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 900 }}>Hoje</h2>
                <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 12 }}>{todayApts.length} atendimento(s) - {money(todayRevenue)}</p>
              </div>
              <span style={{ color: C.green, fontSize: 11, fontWeight: 900 }}>{todayApts.filter(item => activeStatus.includes(item.status)).length} ativos</span>
            </div>
            {todayApts.length === 0
              ? <EmptyState title="Nenhum atendimento hoje" text="Quando uma cliente marcar pelo link publico, ela aparece aqui." />
              : todayApts.map(item => <AppointmentCard key={item.id} appointment={item} onStatus={changeStatus} onConfirmWithWhatsapp={confirmWithWhatsapp} onRecusar={recusarWithWhatsapp} />)}
          </section>
        </>
      )}

      {view === 'week' && (
        <>
          {studioSlug && (
            <section className="agenda-link-card" style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto auto',
              gap: 8,
              alignItems: 'center',
              padding: '12px 16px',
              borderRadius: 14,
              background: `${C.purple}12`,
              border: `1px solid ${C.purple}28`,
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, color: C.purple, fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>Seu link de agendamento</p>
                <p style={{ margin: '3px 0 0', color: C.muted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bookingUrl}</p>
              </div>
              <button onClick={copyLink} title="Copiar link" style={{ ...navButtonStyle, gap: 5, padding: '0 12px', minWidth: 'auto', color: copied ? C.green : C.purple, border: `1px solid ${copied ? C.green : C.purple}44` }}>
                <Copy size={13} />
                <span style={{ fontSize: 11, fontWeight: 850 }}>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
              <a href={bookingUrl} target="_blank" rel="noreferrer" title="Abrir link" style={{ ...navButtonStyle, gap: 5, padding: '0 12px', minWidth: 'auto', color: C.muted, textDecoration: 'none' }}>
                <ExternalLink size={13} />
                <span style={{ fontSize: 11, fontWeight: 850 }}>Abrir</span>
              </a>
            </section>
          )}

          <section style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            <button onClick={() => setOffset(value => value - 7)} style={{ ...navButtonStyle, flex: '0 0 42px' }}><ChevronLeft size={15} /></button>
            {days.map(date => {
              const key = ymd(date)
              const isSelected = key === selectedDate
              const isToday = key === today
              const dayAppointments = apts.filter(item => item.appointment_date.slice(0, 10) === key)
              const activeCount = dayAppointments.filter(item => !['completed', 'cancelled', 'no_show'].includes(item.status)).length

              return (
                <button key={key} onClick={() => setSelectedDate(key)} style={{
                  minWidth: 68,
                  borderRadius: 14,
                  border: `1px solid ${isSelected ? C.purple : C.border}`,
                  background: isSelected ? `${C.purple}22` : C.card,
                  padding: '10px 8px',
                  display: 'grid',
                  gap: 4,
                  justifyItems: 'center',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  position: 'relative',
                  flexShrink: 0,
                }}>
                  {isToday && <span style={{ position: 'absolute', top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: C.amber }} />}
                  <span style={{ color: isSelected ? C.purple : C.muted, fontSize: 10, fontWeight: 850, textTransform: 'uppercase' }}>{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                  <strong style={{ color: isSelected ? C.purple : C.text, fontSize: 19 }}>{date.getDate()}</strong>
                  <span style={{ minWidth: 18, height: 18, borderRadius: 999, display: 'grid', placeItems: 'center', background: activeCount ? `${C.green}18` : `${C.border2}88`, color: activeCount ? C.green : C.muted, fontSize: 10, fontWeight: 850 }}>
                    {dayAppointments.length}
                  </span>
                </button>
              )
            })}
            <button onClick={() => setOffset(value => value + 7)} style={{ ...navButtonStyle, flex: '0 0 42px' }}><ChevronRight size={15} /></button>
          </section>

          <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ minHeight: 64, padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: `linear-gradient(135deg, ${C.purple}10, transparent)` }}>
              <div>
                <h2 style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 900, textTransform: 'capitalize' }}>{longDate(selectedDate)}</h2>
                <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 12 }}>{selectedApts.length} atendimento(s) - {money(selectedRevenue)}</p>
              </div>
              <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 850, background: `${C.purple}20`, color: C.purple, border: `1px solid ${C.purple}35`, textTransform: 'uppercase', letterSpacing: '.05em' }}>Dia selecionado</span>
            </div>
            {selectedApts.length === 0
              ? <EmptyState title="Nenhum agendamento neste dia" text="Escolha os horarios livres e compartilhe as vagas no WhatsApp ou Instagram." />
              : selectedApts.map(item => <AppointmentCard key={item.id} appointment={item} onStatus={changeStatus} onConfirmWithWhatsapp={confirmWithWhatsapp} onRecusar={recusarWithWhatsapp} />)}
          </section>

          {studioSlug && (
            <BannerSection
              selectedDate={selectedDate}
              selectedApts={selectedApts}
              studioSlug={studioSlug}
              bannerOpen={bannerOpen}
              bannerSlots={bannerSlots}
              setBannerOpen={setBannerOpen}
              setBannerSlots={setBannerSlots}
            />
          )}
        </>
      )}

      {view === 'history' && (
        <>
          <section className="agenda-filter-card" style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) repeat(5, auto)', gap: 8, alignItems: 'center' }}>
            <label style={{ height: 42, minWidth: 220, background: C.card, border: `1px solid ${C.border2}`, borderRadius: 12, padding: '0 13px', display: 'flex', alignItems: 'center', gap: 9, color: C.muted }}>
              <Search size={15} />
              <input
                value={q}
                onChange={event => setQ(event.target.value)}
                placeholder="Buscar cliente, servico ou observacao"
                style={{ width: '100%', background: 'transparent', border: 0, outline: 'none', color: C.text, fontSize: 13, fontFamily: 'inherit' }}
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

          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 14 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ minHeight: 58, padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: `linear-gradient(135deg, ${C.green}12, transparent)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CalendarCheck size={17} color={C.green} />
                  <strong style={{ color: C.text, fontSize: 14 }}>Proximos atendimentos</strong>
                </div>
                <span style={{ color: C.green, fontSize: 11, fontWeight: 900 }}>{upcoming.length} ativos</span>
              </div>
              {upcoming.length === 0
                ? <EmptyState title="Nenhum horario futuro nessa busca" />
                : upcoming.map(item => <AppointmentCard key={item.id} appointment={item} compact onStatus={changeStatus} onConfirmWithWhatsapp={confirmWithWhatsapp} onRecusar={recusarWithWhatsapp} />)}
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ minHeight: 54, padding: '15px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock size={16} color={C.muted} />
                  <strong style={{ color: C.text, fontSize: 14 }}>Historico recente</strong>
                </div>
                <span style={{ color: C.muted, fontSize: 11, fontWeight: 800 }}>{history.length} registros</span>
              </div>
              {history.length === 0
                ? <EmptyState title="Sem historico para mostrar" />
                : history.map(item => <AppointmentCard key={item.id} appointment={item} compact onStatus={changeStatus} onConfirmWithWhatsapp={confirmWithWhatsapp} onRecusar={recusarWithWhatsapp} />)}
            </div>
          </section>
        </>
      )}

      <style>{`
        @media (max-width: 760px) {
          .agenda-next-card,
          .agenda-link-card,
          .agenda-filter-card {
            grid-template-columns: 1fr !important;
          }
          .agenda-filter-card label {
            min-width: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

function BannerSection({
  selectedDate,
  selectedApts,
  studioSlug,
  bannerOpen,
  bannerSlots,
  setBannerOpen,
  setBannerSlots,
}: {
  selectedDate: string
  selectedApts: Appointment[]
  studioSlug: string
  bannerOpen: boolean
  bannerSlots: string[]
  setBannerOpen: (value: boolean | ((previous: boolean) => boolean)) => void
  setBannerSlots: (value: string[] | ((previous: string[]) => string[])) => void
}) {
  const booked = selectedApts
    .filter(a => !['cancelled', 'no_show'].includes(a.status))
    .map(a => a.appointment_date.slice(11, 16))
  const all = ['09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30']
  const freeSlots = all.filter(slot => !booked.includes(slot))
  const slugLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/agendar/${studioSlug}`
  const titleDate = new Date(`${selectedDate}T12:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const toggle = (slot: string) => {
    setBannerSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot])
  }

  const shareText = bannerSlots.length === 0 ? '' :
    `Vagas disponiveis - ${titleDate}\n\n` +
    bannerSlots.map(s => `Horario: ${s}`).join('\n') +
    `\n\nAgende pelo link:\n${slugLink}`

  const handleShare = async () => {
    if (!shareText) return
    if (navigator.share) {
      try { await navigator.share({ text: shareText }) } catch {}
    } else {
      await navigator.clipboard.writeText(shareText)
      alert('Texto copiado!')
    }
  }

  return (
    <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
      <button
        onClick={() => setBannerOpen(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Share2 size={16} color={C.pink} />
          <span style={{ color: C.text, fontSize: 14, fontWeight: 850 }}>Montar banner de vagas</span>
        </div>
        <span style={{ color: C.muted, fontSize: 12 }}>{bannerOpen ? 'Fechar' : 'Abrir'}</span>
      </button>

      {bannerOpen && (
        <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: '14px 0 4px', color: C.muted, fontSize: 12 }}>
            Dia: <strong style={{ color: C.text }}>{longDate(selectedDate)}</strong>. Selecione os horarios livres para incluir no banner.
          </p>

          {freeSlots.length === 0 ? (
            <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Nenhum horario livre neste dia.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {freeSlots.map(slot => {
                const active = bannerSlots.includes(slot)
                return (
                  <button
                    key={slot}
                    onClick={() => toggle(slot)}
                    style={{
                      height: 36,
                      padding: '0 14px',
                      borderRadius: 10,
                      border: `1px solid ${active ? C.pink : C.border2}`,
                      background: active ? `${C.pink}22` : C.card2,
                      color: active ? C.pink : C.muted,
                      fontWeight: 850,
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
          )}

          {bannerSlots.length > 0 && (
            <>
              <div style={{ background: C.card2, border: `1px solid ${C.border2}`, borderRadius: 12, padding: '14px 16px' }}>
                <p style={{ margin: '0 0 8px', color: C.pink, fontSize: 11, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>Previa do banner</p>
                <p style={{ margin: '0 0 6px', color: C.text, fontSize: 13, fontWeight: 850 }}>Vagas disponiveis - {titleDate}</p>
                {bannerSlots.map(s => <p key={s} style={{ margin: '2px 0', color: C.muted, fontSize: 13 }}>Horario: {s}</p>)}
                <p style={{ margin: '8px 0 0', color: C.purple, fontSize: 12 }}>{slugLink}</p>
              </div>

              <button
                onClick={() => void handleShare()}
                style={{ height: 44, borderRadius: 12, border: 'none', background: C.pink, color: '#fff', fontWeight: 850, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Share2 size={15} /> Compartilhar banner
              </button>
            </>
          )}
        </div>
      )}
    </section>
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
    fontWeight: 850,
    fontFamily: 'inherit',
  }
}
