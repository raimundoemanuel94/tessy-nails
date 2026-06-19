'use client'

import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, Copy, ExternalLink, Search, Share2, XCircle } from 'lucide-react'
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
  confirmed: { label: 'confirmado', color: C.green },
  pending: { label: 'pendente', color: C.amber },
  completed: { label: 'concluido', color: C.purple },
  cancelled: { label: 'cancelado', color: C.red },
  no_show: { label: 'faltou', color: C.red },
}

const money = (n: number) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`
const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const time = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const longDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })

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
  const [studioName, setStudioName] = useState('')
  const [studioAvatar, setStudioAvatar] = useState('')
  const [studioBrandColor, setStudioBrandColor] = useState('#7C5CBF')
  const [copied, setCopied] = useState(false)
  const [bannerOpen, setBannerOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('todos')
  const [search, setSearch] = useState('')
  const [weekSelection, setWeekSelection] = useState<Record<string, string[]>>({})
  const [salonSettings, setSalonSettings] = useState<{ slot_duration: number; working_hours: Record<string, { is_open: boolean; open: string; close: string }> } | null>(null)

  useEffect(() => {
    const load = async () => {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await sb.from('profiles').select('studio_id').eq('id', user.id).single()
      if (!profile?.studio_id) { setLoading(false); return }
      const { data: studioData } = await sb.from('studios').select('slug, name, avatar_url, brand_color').eq('id', profile.studio_id).single()
      if (studioData?.slug) setStudioSlug(studioData.slug)
      if (studioData?.name) setStudioName(studioData.name)
      if (studioData?.avatar_url) setStudioAvatar(studioData.avatar_url)
      if (studioData?.brand_color) setStudioBrandColor(studioData.brand_color)
      const { data: settingsData } = await sb.from('salon_settings').select('slot_duration, working_hours').eq('studio_id', profile.studio_id).single()
      if (settingsData) setSalonSettings(settingsData)
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

  const selectedApts = apts
    .filter(item => item.appointment_date.slice(0, 10) === selectedDate)
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))

  const nextApt = apts
    .filter(item => item.appointment_date >= new Date().toISOString() && !['completed', 'cancelled', 'no_show'].includes(item.status))
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0]

  const selectedRevenue = selectedApts
    .filter(item => item.status !== 'cancelled')
    .reduce((sum, item) => sum + Number(item.price || 0), 0)
  const todayApts = apts.filter(item => item.appointment_date.slice(0, 10) === today)
  const activeTodayCount = todayApts.filter(item => !['completed', 'cancelled', 'no_show'].includes(item.status)).length
  const pendingCount = apts.filter(item => item.status === 'pending').length
  const selectedDateReleased = Boolean((salonSettings?.working_hours as any)?.[selectedDate]?.is_open)
  const trackedApts = useMemo(() => {
    const term = search.trim().toLowerCase()
    return apts
      .filter(item => statusFilter === 'todos' || item.status === statusFilter)
      .filter(item => !term || `${item.client_name} ${item.service_name} ${item.notes || ''}`.toLowerCase().includes(term))
  }, [apts, search, statusFilter])
  const trackedUpcoming = trackedApts.filter(item =>
    item.appointment_date >= new Date().toISOString() && !['completed', 'cancelled', 'no_show'].includes(item.status)
  )
  const trackedHistory = trackedApts
    .filter(item => !trackedUpcoming.some(next => next.id === item.id))
    .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
  const statusCount = (status: string) => status === 'todos' ? apts.length : apts.filter(item => item.status === status).length

  const changeStatus = async (id: string, status: string) => {
    const sb = createClient()
    const { error } = await sb.from('appointments').update({ status }).eq('id', id)
    if (!error) setApts(prev => prev.map(item => item.id === id ? { ...item, status } : item))
    else console.error('Erro ao atualizar status:', error.message)
  }

  const confirmWithWhatsapp = async (id: string) => {
    const apt = apts.find(item => item.id === id)
    if (!apt) return
    await changeStatus(id, 'confirmed')
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
    const msg = `Olá ${nome}! ✅ Seu agendamento de *${apt.service_name}* foi confirmado para *${quando} às ${hora}*. Te esperamos! 💅`
    const number = clientPhone.replace(/\D/g, '')
    window.open(`https://wa.me/55${number}?text=${encodeURIComponent(msg)}`, '_blank')
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
    const msg = 'Olá ' + nome + '! 😔 Infelizmente não consigo te atender ' + quando + ' às ' + hora + '. Por favor, entre em contato para remarcar. 💅'
    const number = clientPhone.replace(/\D/g, '')
    window.open('https://wa.me/55' + number + '?text=' + encodeURIComponent(msg), '_blank')
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
    <div className="agenda-page" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1180 }}>
      <header className="agenda-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: '0 0 6px', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>
            Atendimento
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>Agenda</h1>
          <p style={{ color: C.muted, fontSize: 12, margin: '5px 0 0' }}>
            {selectedApts.length} atendimento(s) no dia selecionado
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setOffset(value => value - 7)} style={navButtonStyle}>
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => { setOffset(0); setSelectedDate(today) }} style={{ ...navButtonStyle, padding: '0 13px' }}>
            Hoje
          </button>
          <button onClick={() => setOffset(value => value + 7)} style={navButtonStyle}>
            <ChevronRight size={15} />
          </button>
        </div>
      </header>

      <section className="agenda-kpis" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 10,
      }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
          <p style={{ margin: 0, color: C.muted, fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>Hoje</p>
          <strong style={{ display: 'block', marginTop: 5, color: C.text, fontSize: 22 }}>{activeTodayCount}</strong>
          <span style={{ color: C.muted, fontSize: 12 }}>{todayApts.length} no total</span>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14 }}>
          <p style={{ margin: 0, color: C.muted, fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>Pendentes</p>
          <strong style={{ display: 'block', marginTop: 5, color: pendingCount ? C.amber : C.text, fontSize: 22 }}>{pendingCount}</strong>
          <span style={{ color: C.muted, fontSize: 12 }}>{pendingCount ? 'precisam de resposta' : 'tudo em dia'}</span>
        </div>
        <div style={{ background: selectedDateReleased ? `${C.green}10` : `${C.purple}10`, border: `1px solid ${selectedDateReleased ? `${C.green}35` : `${C.purple}35`}`, borderRadius: 16, padding: 14, display: 'grid', gap: 8 }}>
          <div>
            <p style={{ margin: 0, color: selectedDateReleased ? C.green : C.purple, fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>Status de vagas</p>
            <strong style={{ display: 'block', marginTop: 5, color: C.text, fontSize: 14 }}>{selectedDateReleased ? 'Dia liberado' : 'Dia não liberado'}</strong>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href="/disponibilidade" style={{ ...navButtonStyle, minWidth: 'auto', height: 34, padding: '0 11px', color: C.purple, textDecoration: 'none' }}>
              Liberar vagas
            </a>
            <a href="/vitrine" style={{ ...navButtonStyle, minWidth: 'auto', height: 34, padding: '0 11px', color: C.green, textDecoration: 'none' }}>
              Postar status
            </a>
            <button onClick={() => setBannerOpen(true)} style={{ ...navButtonStyle, minWidth: 'auto', height: 34, padding: '0 11px', color: C.pink }}>
              Banner semanal
            </button>
          </div>
        </div>
      </section>

      <section className="agenda-tracking" style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 18px',
          borderBottom: `1px solid ${C.border}`,
          display: 'grid',
          gridTemplateColumns: 'minmax(210px, 1fr) auto',
          gap: 12,
          alignItems: 'center',
          background: `linear-gradient(135deg, ${C.green}10, transparent)`,
        }}>
          <div>
            <p style={{ margin: 0, color: C.green, fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>
              Acompanhamento
            </p>
            <h2 style={{ margin: '4px 0 0', color: C.text, fontSize: 15, fontWeight: 900 }}>
              Todos os agendamentos
            </h2>
            <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 12 }}>
              {trackedUpcoming.length} ativos - {trackedHistory.length} no historico
            </p>
          </div>
          <label style={{
            height: 38,
            width: 270,
            maxWidth: '100%',
            background: C.card2,
            border: `1px solid ${C.border2}`,
            borderRadius: 11,
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: C.muted,
          }}>
            <Search size={14} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar cliente ou servico"
              style={{
                width: '100%',
                background: 'transparent',
                border: 0,
                outline: 'none',
                color: C.text,
                fontSize: 12,
                fontFamily: 'inherit',
              }}
            />
          </label>
        </div>

        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '12px 18px',
          borderBottom: `1px solid ${C.border}`,
        }}>
          {['todos', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'].map(item => (
            <button key={item} onClick={() => setStatusFilter(item)} style={{
              height: 34,
              padding: '0 12px',
              borderRadius: 999,
              border: `1px solid ${statusFilter === item ? C.purple : C.border2}`,
              background: statusFilter === item ? `${C.purple}22` : 'transparent',
              color: statusFilter === item ? C.purple : C.muted,
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: 'inherit',
              fontWeight: statusFilter === item ? 850 : 700,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              minWidth: 'max-content',
            }}>
              {item === 'todos' ? 'Todos' : (ST[item]?.label || item)} ({statusCount(item)})
            </button>
          ))}
        </div>

        {trackedUpcoming.length === 0 && trackedHistory.length === 0 ? (
          <div style={{ minHeight: 170, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24, color: C.muted }}>
            <div>
              <Clock size={28} color={C.purple} style={{ margin: '0 auto 10px' }} />
              <strong style={{ color: C.text, fontSize: 14 }}>Nenhum agendamento encontrado</strong>
              <p style={{ margin: '6px 0 0', fontSize: 12 }}>Ajuste a busca ou o filtro para ver outros registros.</p>
            </div>
          </div>
        ) : (
          <>
            {trackedUpcoming.length > 0 && (
              <div>
                <div style={{ padding: '12px 18px 8px', color: C.green, fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>
                  Proximos
                </div>
                {trackedUpcoming.map((appointment, index) => {
                  const status = ST[appointment.status] || { label: appointment.status, color: C.muted }
                  return (
                    <div key={appointment.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '74px minmax(0, 1fr) auto',
                      gap: 14,
                      padding: '14px 18px',
                      borderTop: index === 0 ? 'none' : `1px solid ${C.border}`,
                      background: appointment.status === 'confirmed' ? `${C.green}07` : 'transparent',
                    }}>
                      <div style={{ textAlign: 'center', borderRadius: 14, background: `${status.color}12`, border: `1px solid ${status.color}30`, padding: '9px 6px' }}>
                        <strong style={{ color: status.color, fontSize: 17 }}>{time(appointment.appointment_date)}</strong>
                        <span style={{ display: 'block', color: C.muted, fontSize: 9, marginTop: 4 }}>{shortDate(appointment.appointment_date)}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 850 }}>{appointment.client_name || 'Cliente sem nome'}</h3>
                          <Badge status={appointment.status} />
                        </div>
                        <p style={{ margin: '5px 0 0', color: C.muted, fontSize: 12 }}>
                          {appointment.service_name} - {appointment.duration_minutes || 0}min - {money(appointment.price)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                        {appointment.status === 'pending' && (
                          <>
                            <button onClick={() => void confirmWithWhatsapp(appointment.id)} style={actionStyle(C.green)}>
                              <Check size={13} /> Confirmar + Zap
                            </button>
                            <button onClick={() => void recusarWithWhatsapp(appointment.id)} style={actionStyle(C.red)}>
                              <XCircle size={13} /> Recusar
                            </button>
                          </>
                        )}
                        {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                          <button onClick={() => changeStatus(appointment.id, 'completed')} style={actionStyle(C.purple)}>
                            <CheckCircle2 size={13} /> Concluir
                          </button>
                        )}
                        {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                          <button onClick={() => changeStatus(appointment.id, 'no_show')} style={actionStyle(C.red)}>
                            <XCircle size={13} /> Faltou
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {trackedHistory.length > 0 && (
              <div style={{ borderTop: trackedUpcoming.length ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ padding: '12px 18px 8px', color: C.muted, fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>
                  Historico recente
                </div>
                {trackedHistory.slice(0, 8).map((appointment, index) => {
                  const status = ST[appointment.status] || { label: appointment.status, color: C.muted }
                  return (
                    <div key={appointment.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '74px minmax(0, 1fr) auto',
                      gap: 14,
                      padding: '13px 18px',
                      borderTop: index === 0 ? 'none' : `1px solid ${C.border}`,
                      opacity: 0.92,
                    }}>
                      <div style={{ textAlign: 'center', borderRadius: 14, background: `${status.color}10`, border: `1px solid ${status.color}25`, padding: '9px 6px' }}>
                        <strong style={{ color: status.color, fontSize: 17 }}>{time(appointment.appointment_date)}</strong>
                        <span style={{ display: 'block', color: C.muted, fontSize: 9, marginTop: 4 }}>{shortDate(appointment.appointment_date)}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 850 }}>{appointment.client_name || 'Cliente sem nome'}</h3>
                          <Badge status={appointment.status} />
                        </div>
                        <p style={{ margin: '5px 0 0', color: C.muted, fontSize: 12 }}>
                          {appointment.service_name} - {appointment.duration_minutes || 0}min - {money(appointment.price)}
                        </p>
                      </div>
                      <strong style={{ color: C.green, fontSize: 13, alignSelf: 'center' }}>{money(appointment.price)}</strong>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </section>

      {studioSlug && (
        <section className="agenda-link" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          padding: '12px 16px',
          borderRadius: 14,
          background: `${C.purple}12`,
          border: `1px solid ${C.purple}28`,
        }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, color: C.purple, fontSize: 10, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>Seu link de agendamento</p>
            <p style={{ margin: '3px 0 0', color: C.muted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{bookingUrl}</p>
          </div>
          <button onClick={copyLink} title="Copiar link" style={{ ...navButtonStyle, gap: 5, padding: '0 12px', minWidth: 'auto', color: copied ? C.green : C.purple, border: `1px solid ${copied ? C.green : C.purple}44` }}>
            <Copy size={13} />
            <span style={{ fontSize: 11, fontWeight: 850 }}>{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>
          <a href={bookingUrl} target="_blank" rel="noreferrer" title="Abrir link" style={{ ...navButtonStyle, gap: 5, padding: '0 12px', minWidth: 'auto', color: C.muted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <ExternalLink size={13} />
            <span style={{ fontSize: 11, fontWeight: 850 }}>Abrir</span>
          </a>
        </section>
      )}

      {nextApt && (
        <section className="agenda-next" style={{
          display: 'grid',
          gridTemplateColumns: 'auto minmax(0, 1fr) auto',
          gap: 14,
          alignItems: 'center',
          padding: 16,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${C.green}14, ${C.purple}08)`,
          border: `1px solid ${C.green}30`,
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 15,
            display: 'grid',
            placeItems: 'center',
            background: `${C.green}16`,
            border: `1px solid ${C.green}35`,
            color: C.green,
          }}>
            <CalendarCheck size={21} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, color: C.green, fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>
              Próximo horário
            </p>
            <h2 style={{ margin: '4px 0 0', color: C.text, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nextApt.client_name || 'Cliente'} - {nextApt.service_name}
            </h2>
            <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 12 }}>
              {shortDate(nextApt.appointment_date)} as {time(nextApt.appointment_date)}
            </p>
          </div>
          <button onClick={() => setSelectedDate(nextApt.appointment_date.slice(0, 10))} style={{
            height: 38,
            padding: '0 13px',
            borderRadius: 11,
            border: `1px solid ${C.green}35`,
            background: `${C.green}14`,
            color: C.green,
            fontWeight: 850,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}>
            Abrir dia
          </button>
        </section>
      )}

      <section className="agenda-days" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
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
              <span style={{ color: isSelected ? C.purple : C.muted, fontSize: 10, fontWeight: 850, textTransform: 'uppercase' }}>
                {date.toLocaleDateString('pt-BR', { weekday: 'short' })}
              </span>
              <strong style={{ color: isSelected ? C.purple : C.text, fontSize: 19 }}>{date.getDate()}</strong>
              <span style={{
                minWidth: 18,
                height: 18,
                borderRadius: 999,
                display: 'grid',
                placeItems: 'center',
                background: activeCount ? `${C.green}18` : `${C.border2}88`,
                color: activeCount ? C.green : C.muted,
                fontSize: 10,
                fontWeight: 850,
              }}>
                {dayAppointments.length}
              </span>
            </button>
          )
        })}
      </section>

      <section className="agenda-selected" style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        <div style={{
          minHeight: 64,
          padding: '16px 18px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          background: `linear-gradient(135deg, ${C.purple}10, transparent)`,
        }}>
          <div>
            <h2 style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 900, textTransform: 'capitalize' }}>
              {longDate(selectedDate)}
            </h2>
            <p style={{ margin: '4px 0 0', color: C.muted, fontSize: 12 }}>
              {selectedApts.length} atendimento(s) - {money(selectedRevenue)}
            </p>
          </div>
          <span style={{
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 850,
            background: `${C.purple}20`,
            color: C.purple,
            border: `1px solid ${C.purple}35`,
            textTransform: 'uppercase',
            letterSpacing: '.05em',
          }}>
            Dia selecionado
          </span>
        </div>

        {selectedApts.length === 0 ? (
          <div style={{ minHeight: 220, display: 'grid', placeItems: 'center', textAlign: 'center', padding: 28, color: C.muted }}>
            <div>
              <Clock size={30} color={C.purple} style={{ margin: '0 auto 10px' }} />
              <strong style={{ color: C.text, fontSize: 14 }}>Nenhum agendamento neste dia</strong>
              <p style={{ margin: '6px 0 0', fontSize: 12 }}>Quando uma cliente marcar pelo link público, ela aparece aqui.</p>
            </div>
          </div>
        ) : (
          selectedApts.map((appointment, index) => {
            const status = ST[appointment.status] || { label: appointment.status, color: C.muted }
            return (
              <div key={appointment.id} style={{
                display: 'grid',
                gridTemplateColumns: '74px 4px minmax(0, 1fr) auto',
                gap: 14,
                padding: '16px 18px',
                borderBottom: index < selectedApts.length - 1 ? `1px solid ${C.border}` : 'none',
                background: appointment.status === 'confirmed' ? `${C.green}07` : 'transparent',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ color: status.color, fontSize: 18 }}>{time(appointment.appointment_date)}</strong>
                  <span style={{ display: 'block', color: C.muted, fontSize: 10, marginTop: 4 }}>{appointment.duration_minutes}min</span>
                </div>
                <div style={{ width: 4, borderRadius: 999, background: status.color, opacity: 0.7 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 850 }}>
                      {appointment.client_name || 'Cliente sem nome'}
                    </h3>
                    <Badge status={appointment.status} />
                  </div>
                  <p style={{ margin: '5px 0 0', color: C.muted, fontSize: 12 }}>
                    {appointment.service_name} - {money(appointment.price)}
                  </p>
                  {appointment.notes && (
                    <p style={{ margin: '8px 0 0', color: C.amber, fontSize: 11, lineHeight: 1.45 }}>
                      {appointment.notes}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
                  {appointment.status === 'pending' && (
                    <>
                      <button onClick={() => void confirmWithWhatsapp(appointment.id)} style={actionStyle(C.green)}>
                        <Check size={13} /> Confirmar + Zap
                      </button>
                      <button onClick={() => void recusarWithWhatsapp(appointment.id)} style={actionStyle(C.red)}>
                        <XCircle size={13} /> Recusar
                      </button>
                    </>
                  )}
                  {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                    <button onClick={() => changeStatus(appointment.id, 'completed')} style={actionStyle(C.purple)}>
                      <CheckCircle2 size={13} /> Concluir
                    </button>
                  )}
                  {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                    <button onClick={() => changeStatus(appointment.id, 'no_show')} style={actionStyle(C.red)}>
                      <XCircle size={13} /> Faltou
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </section>


      {/* ─── BANNER DE VAGAS ─── */}
      {studioSlug && (
        <section className="agenda-banner" style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setBannerOpen(v => !v)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Share2 size={16} color={C.pink} />
              <span style={{ color: C.text, fontSize: 14, fontWeight: 850 }}>Montar banner semanal</span>
            </div>
            <span style={{ color: C.muted, fontSize: 12 }}>{bannerOpen ? '▲ fechar' : '▼ abrir'}</span>
          </button>

          {bannerOpen && (() => {
            const slotDur = salonSettings?.slot_duration || 30
            const wh = salonSettings?.working_hours as any
            const weekdayKeys2 = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
            const weekdayShort = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB']

            // Build the 6 days (mon..sat) of the week containing selectedDate
            const base = new Date(selectedDate + 'T12:00')
            const dow = base.getDay() === 0 ? 7 : base.getDay() // mon=1..sun=7
            const monday = new Date(base); monday.setDate(base.getDate() - (dow - 1))

            const weekDays: { dateStr: string; label: string; dayNum: number; allSlots: string[]; freeSlots: string[] }[] = []
            for (let i = 0; i < 6; i++) { // mon..sat
              const d = new Date(monday); d.setDate(monday.getDate() + i)
              const dateStr = ymd(d)
              const dayKey = weekdayKeys2[d.getDay()]
              const dayConfig = wh?.[dayKey]

              let openH = 9, openM = 0, closeH = 18, closeM = 0
              let isOpen = true
              if (dayConfig) {
                isOpen = !!dayConfig.is_open
                if (dayConfig.open && dayConfig.close) {
                  const [oh, om] = dayConfig.open.split(':').map(Number)
                  const [ch, cm] = dayConfig.close.split(':').map(Number)
                  openH = oh; openM = om; closeH = ch; closeM = cm
                }
              }

              const all: string[] = []
              if (isOpen) {
                const openMin = openH*60+openM, closeMin = closeH*60+closeM
                for (let m = openMin; m + slotDur <= closeMin; m += slotDur) {
                  all.push(String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'))
                }
              }

              // busy ranges for this day
              const dayApts = apts.filter(a => a.appointment_date.slice(0,10) === dateStr && !['cancelled','no_show'].includes(a.status))
              const busy = dayApts.map(a => {
                const [hh,mm] = a.appointment_date.slice(11,16).split(':').map(Number)
                const s = hh*60+mm
                return { start: s, end: s + (a.duration_minutes || 30) }
              })
              const free = all.filter(slot => {
                const [sh,sm] = slot.split(':').map(Number)
                const ss = sh*60+sm, se = ss+slotDur
                return !busy.some(r => ss < r.end && se > r.start)
              })

              weekDays.push({ dateStr, label: weekdayShort[d.getDay()], dayNum: d.getDate(), allSlots: all, freeSlots: free })
            }

            const slugLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/agendar/${studioSlug}`

            const toggleSlot = (dateStr: string, slot: string) => {
              setWeekSelection(prev => {
                const cur = prev[dateStr] || []
                const next = cur.includes(slot) ? cur.filter(s => s !== slot) : [...cur, slot]
                return { ...prev, [dateStr]: next }
              })
            }

            const selectAllDay = (dateStr: string, free: string[]) => {
              setWeekSelection(prev => {
                const cur = prev[dateStr] || []
                const allSel = free.every(s => cur.includes(s))
                return { ...prev, [dateStr]: allSel ? [] : [...free] }
              })
            }

            const totalSelected = Object.values(weekSelection).reduce((sum, arr) => sum + arr.length, 0)

            const monthNameOuter = monday.toLocaleDateString('pt-BR', { month: 'long' })
            const rangeLabel = () => `${weekDays[0].dayNum} a ${weekDays[weekDays.length-1].dayNum} de ${monthNameOuter}`

            const handleShare = async () => {
              if (totalSelected === 0) return

              const W = 1080, H = 1920
              const canvas = document.createElement('canvas')
              canvas.width = W; canvas.height = H
              const ctx = canvas.getContext('2d')!

              const brand = studioBrandColor || '#7C5CBF'
              const br = parseInt(brand.slice(1,3),16)
              const bgc = parseInt(brand.slice(3,5),16)
              const bbc = parseInt(brand.slice(5,7),16)

              const rangeLabelStr = rangeLabel()

              const draw = async () => {
                // Fundo escuro
                const bg = ctx.createLinearGradient(0,0,0,H)
                bg.addColorStop(0,'#08060f'); bg.addColorStop(0.5,'#110d1f'); bg.addColorStop(1,'#0d0a1a')
                ctx.fillStyle = bg; ctx.fillRect(0,0,W,H)

                const gc = ctx.createRadialGradient(W/2,H*0.3,0,W/2,H*0.3,800)
                gc.addColorStop(0,`rgba(${br},${bgc},${bbc},0.18)`); gc.addColorStop(1,'transparent')
                ctx.fillStyle = gc; ctx.fillRect(0,0,W,H)

                ctx.save(); ctx.globalAlpha=0.08; ctx.fillStyle=brand
                ctx.beginPath(); ctx.arc(W+140,-140,500,0,Math.PI*2); ctx.fill()
                ctx.beginPath(); ctx.arc(-140,H+140,460,0,Math.PI*2); ctx.fill()
                ctx.restore()

                const barG = ctx.createLinearGradient(0,0,W,0)
                barG.addColorStop(0,'transparent'); barG.addColorStop(0.25,brand); barG.addColorStop(0.75,brand); barG.addColorStop(1,'transparent')
                ctx.fillStyle = barG; ctx.fillRect(0,0,W,7); ctx.fillRect(0,H-7,W,7)

                // Avatar
                const aR = 145, aX = W/2, aY = 215
                const ag = ctx.createRadialGradient(aX,aY,0,aX,aY,aR+50)
                ag.addColorStop(0,`rgba(${br},${bgc},${bbc},0.3)`); ag.addColorStop(1,'transparent')
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
                  } catch { ctx.beginPath(); ctx.arc(aX,aY,aR,0,Math.PI*2); ctx.fillStyle=brand; ctx.fill() }
                } else { ctx.beginPath(); ctx.arc(aX,aY,aR,0,Math.PI*2); ctx.fillStyle=brand; ctx.fill() }

                let y = aY + aR + 46

                // Nome
                ctx.fillStyle='#fff'; ctx.font='700 68px system-ui,sans-serif'
                ctx.textAlign='center'; ctx.textBaseline='top'
                ctx.fillText(studioName || 'Studio', W/2, y); y += 84

                // Badge
                const bW=580,bH=64,bX=W/2-bW/2
                ctx.fillStyle=`rgba(${br},${bgc},${bbc},0.18)`; ctx.strokeStyle=`rgba(${br},${bgc},${bbc},0.5)`; ctx.lineWidth=1.5
                ctx.beginPath(); ctx.roundRect(bX,y,bW,bH,32); ctx.fill(); ctx.stroke()
                ctx.fillStyle=brand; ctx.font='700 27px system-ui,sans-serif'; ctx.textBaseline='middle'
                ctx.fillText('💅  HORÁRIOS DA SEMANA', W/2, y+bH/2); y += bH + 20

                // Range
                ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='400 32px system-ui,sans-serif'; ctx.textBaseline='top'
                ctx.fillText(rangeLabelStr, W/2, y); y += 50

                // Legenda
                const legY = y + 8
                ctx.textAlign='left'
                ctx.fillStyle='#22c55e'; ctx.beginPath(); ctx.arc(W/2-150, legY+10, 9, 0, Math.PI*2); ctx.fill()
                ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.font='400 24px system-ui,sans-serif'; ctx.textBaseline='middle'
                ctx.fillText('Disponível', W/2-130, legY+10)
                ctx.fillStyle='#555'; ctx.beginPath(); ctx.arc(W/2+30, legY+10, 9, 0, Math.PI*2); ctx.fill()
                ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fillText('Ocupado', W/2+50, legY+10)
                ctx.textAlign='center'
                y += 60

                // Separador
                const sepG = ctx.createLinearGradient(60,0,W-60,0)
                sepG.addColorStop(0,'transparent'); sepG.addColorStop(0.3,`rgba(${br},${bgc},${bbc},0.5)`); sepG.addColorStop(0.7,`rgba(${br},${bgc},${bbc},0.5)`); sepG.addColorStop(1,'transparent')
                ctx.fillStyle=sepG; ctx.fillRect(60,y,W-120,1.5); y += 30

                // ── DIAS DA SEMANA — UMA LINHA POR DIA ──────────
                const daysToShow = weekDays.filter(d => (weekSelection[d.dateStr]?.length || 0) > 0)
                const rowH2 = 110
                const rowGap = 12

                daysToShow.forEach((day, idx) => {
                  const sel = weekSelection[day.dateStr] || []
                  const busySlots = day.allSlots.filter(s => !day.freeSlots.includes(s))
                  const toShow = [...sel, ...busySlots.filter(s => !sel.includes(s))].sort()

                  const rowY = y + idx * (rowH2 + rowGap)
                  const midY = rowY + rowH2/2

                  // Fundo da linha
                  ctx.save()
                  ctx.fillStyle = `rgba(${br},${bgc},${bbc},0.06)`
                  ctx.beginPath(); ctx.roundRect(60, rowY, W-120, rowH2, 20); ctx.fill()
                  ctx.restore()

                  // Label dia (SEG, TER...)
                  ctx.save()
                  ctx.fillStyle = brand
                  ctx.font = '800 52px Georgia, serif'
                  ctx.textAlign = 'left'
                  ctx.textBaseline = 'middle'
                  ctx.fillText(day.label, 88, midY)
                  ctx.restore()

                  // Linha vertical separando label dos horários
                  ctx.save()
                  ctx.fillStyle = `rgba(${br},${bgc},${bbc},0.35)`
                  ctx.fillRect(290, rowY + 20, 2, rowH2 - 40)
                  ctx.restore()

                  // Horários em linha separados por traço
                  ctx.save()
                  ctx.textAlign = 'left'
                  ctx.textBaseline = 'middle'
                  let tx = 318

                  toShow.forEach((slot, si) => {
                    const isFree = sel.includes(slot)
                    const h = parseInt(slot.slice(0,2))
                    const m = slot.slice(3,5)
                    const labelClean = h + (m === '00' ? 'h' : 'h' + m)

                    if (si > 0) {
                      // Traço separador
                      ctx.fillStyle = 'rgba(255,255,255,0.2)'
                      ctx.font = '300 36px system-ui, sans-serif'
                      ctx.fillText(' - ', tx, midY)
                      tx += ctx.measureText(' - ').width
                    }

                    if (isFree) {
                      ctx.fillStyle = '#86efac'
                      ctx.font = '800 44px system-ui, sans-serif'
                    } else {
                      ctx.save()
                      ctx.globalAlpha = 0.3
                      ctx.fillStyle = '#ffffff'
                      ctx.font = '400 44px system-ui, sans-serif'
                    }

                    const tw = ctx.measureText(labelClean).width
                    ctx.fillText(labelClean, tx, midY)

                    if (!isFree) {
                      ctx.restore()
                      // Risco
                      ctx.save()
                      ctx.globalAlpha = 0.6
                      ctx.strokeStyle = '#ff4444'
                      ctx.lineWidth = 3
                      ctx.beginPath()
                      ctx.moveTo(tx, midY + 2)
                      ctx.lineTo(tx + tw, midY + 2)
                      ctx.stroke()
                      ctx.restore()
                    }
                    tx += tw
                  })
                  ctx.restore()
                })

                y += daysToShow.length * (rowH2 + rowGap) + 24

                // Separador
                ctx.fillStyle=sepG; ctx.fillRect(60,y,W-120,1.5); y += 36

                // CTA
                ctx.fillStyle=brand
                ctx.beginPath(); ctx.roundRect(70,y,W-140,98,28); ctx.fill()
                const shine=ctx.createLinearGradient(70,y,70,y+98)
                shine.addColorStop(0,'rgba(255,255,255,0.18)'); shine.addColorStop(1,'rgba(255,255,255,0)')
                ctx.fillStyle=shine; ctx.beginPath(); ctx.roundRect(70,y,W-140,98,28); ctx.fill()
                ctx.fillStyle='#fff'; ctx.font='700 40px system-ui,sans-serif'; ctx.textBaseline='middle'
                ctx.fillText('Agende agora  →', W/2, y+49); y += 120

                // URL
                ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.font='300 26px monospace'; ctx.textBaseline='middle'
                ctx.fillText(slugLink, W/2, H-60)

                canvas.toBlob(async (blob) => {
                  if (!blob) return
                  const file = new File([blob],'horarios-semana.png',{type:'image/png'})
                  if (navigator.share && navigator.canShare?.({files:[file]})) {
                    try { await navigator.share({files:[file],text:slugLink}); return } catch {}
                  }
                  const url=URL.createObjectURL(blob); const a=document.createElement('a')
                  a.href=url; a.download='horarios-semana.png'; a.click(); URL.revokeObjectURL(url)
                },'image/png')
              }
              await draw()
            }

            return (
              <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ margin: '14px 0 0', color: C.muted, fontSize: 12 }}>
                  Semana de <strong style={{ color: C.text }}>{rangeLabel()}</strong> · Marque os horários livres de cada dia
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {weekDays.map(day => {
                    const sel = weekSelection[day.dateStr] || []
                    const allSelected = day.freeSlots.length > 0 && day.freeSlots.every(s => sel.includes(s))
                    return (
                      <div key={day.dateStr} style={{ background: C.card2, border: `1px solid ${C.border2}`, borderRadius: 12, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: day.freeSlots.length ? 10 : 0 }}>
                          <span style={{ color: C.text, fontSize: 14, fontWeight: 850 }}>
                            {day.label} <span style={{ color: C.muted, fontWeight: 400 }}>· dia {day.dayNum}</span>
                          </span>
                          {day.freeSlots.length > 0 && (
                            <button onClick={() => selectAllDay(day.dateStr, day.freeSlots)}
                              style={{ background: 'transparent', border: 'none', color: C.pink, fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                              {allSelected ? 'limpar' : 'todos'}
                            </button>
                          )}
                        </div>
                        {day.freeSlots.length === 0 ? (
                          <p style={{ margin: 0, color: C.muted, fontSize: 12, fontStyle: 'italic' }}>Sem horários livres</p>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {day.freeSlots.map(slot => {
                              const active = sel.includes(slot)
                              return (
                                <button key={slot} onClick={() => toggleSlot(day.dateStr, slot)}
                                  style={{
                                    height: 32, padding: '0 12px', borderRadius: 8,
                                    border: `1px solid ${active ? '#22c55e' : C.border2}`,
                                    background: active ? 'rgba(34,197,94,0.15)' : 'transparent',
                                    color: active ? '#22c55e' : C.muted,
                                    fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                                  }}>
                                  {slot}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {totalSelected > 0 && (
                  <button onClick={() => void handleShare()}
                    style={{ height: 48, borderRadius: 12, border: 'none', background: C.pink, color: '#fff', fontWeight: 850, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Share2 size={15} /> Compartilhar banner ({totalSelected} {totalSelected === 1 ? 'horário' : 'horários'})
                  </button>
                )}
              </div>
            )
          })()}
        </section>
      )}

      <style>{`
        @media (max-width: 760px) {
          .agenda-page {
            gap: 14px !important;
          }
          .agenda-header {
            order: 1;
          }
          .agenda-kpis {
            order: 2;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 10px !important;
          }
          .agenda-kpis > div {
            padding: 13px !important;
            border-radius: 14px !important;
          }
          .agenda-kpis > div:last-child {
            grid-column: 1 / -1;
          }
          .agenda-kpis > div:last-child > div:last-child {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .agenda-kpis > div:last-child a,
          .agenda-kpis > div:last-child button {
            width: 100%;
            min-height: 42px !important;
          }
          .agenda-days {
            order: 3;
            padding-bottom: 8px !important;
            margin: 0 -16px;
            padding-left: 16px;
            padding-right: 16px;
          }
          .agenda-selected {
            order: 4;
          }
          .agenda-tracking {
            order: 5;
          }
          .agenda-link {
            order: 6;
          }
          .agenda-next {
            order: 7;
          }
          .agenda-banner {
            order: 8;
          }
          .agenda-tracking > div:first-child {
            grid-template-columns: 1fr !important;
            padding: 15px !important;
          }
          .agenda-tracking label {
            width: 100% !important;
          }
          .agenda-tracking > div:nth-child(2) {
            padding: 10px 15px !important;
          }
          .agenda-selected > div:not(:first-child),
          .agenda-tracking div[style*="grid-template-columns: 74px"] {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .agenda-selected > div:not(:first-child) > div:last-child,
          .agenda-tracking div[style*="grid-template-columns: 74px"] > div:last-child {
            justify-content: stretch !important;
          }
          .agenda-selected > div:not(:first-child) button,
          .agenda-tracking div[style*="grid-template-columns: 74px"] button {
            min-height: 38px !important;
          }
          .agenda-link {
            align-items: stretch !important;
          }
          .agenda-link > div {
            width: 100%;
          }
          .agenda-link button,
          .agenda-link a {
            flex: 1 1 130px;
          }
        }
      `}</style>
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
    fontWeight: 850,
    fontFamily: 'inherit',
  }
}
