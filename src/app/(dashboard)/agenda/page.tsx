'use client'

import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, Copy, ExternalLink, Share2, XCircle } from 'lucide-react'
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
  const [bannerSlots, setBannerSlots] = useState<string[]>([])
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
      if (settingsData) setSalonSettings(settingsData as any)
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

  const changeStatus = async (id: string, status: string) => {
    const sb = createClient()
    await sb.from('appointments').update({ status }).eq('id', id)
    setApts(prev => prev.map(item => item.id === id ? { ...item, status } : item))
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1180 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
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

      {studioSlug && (
        <section style={{
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
          <a href={bookingUrl} target="_blank" rel="noreferrer" title="Abrir link" style={{ ...navButtonStyle, gap: 5, padding: '0 12px', minWidth: 'auto', color: C.muted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <ExternalLink size={13} />
            <span style={{ fontSize: 11, fontWeight: 850 }}>Abrir</span>
          </a>
        </section>
      )}

      {nextApt && (
        <section style={{
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
              Proximo horario
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

      <section style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
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

      <section style={{
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
              <p style={{ margin: '6px 0 0', fontSize: 12 }}>Quando uma cliente marcar pelo link publico, ela aparece aqui.</p>
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
        <section style={{
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
              <span style={{ color: C.text, fontSize: 14, fontWeight: 850 }}>Montar banner de vagas</span>
            </div>
            <span style={{ color: C.muted, fontSize: 12 }}>{bannerOpen ? '▲ fechar' : '▼ abrir'}</span>
          </button>

          {bannerOpen && (() => {
            const freeSlots = (() => {
              // Build busy ranges considering full duration of each appointment
              const busyRanges = selectedApts
                .filter(a => !['cancelled', 'no_show'].includes(a.status))
                .map(a => {
                  const [hh, mm] = a.appointment_date.slice(11, 16).split(':').map(Number)
                  const startMin = hh * 60 + mm
                  const dur = a.duration_minutes || 30
                  return { start: startMin, end: startMin + dur }
                })

              // Use salon_settings working_hours if available, else default
              const weekdays = ['sun','mon','tue','wed','thu','fri','sat']
              const dayKey = weekdays[new Date(selectedDate + 'T12:00').getDay()]
              const wh = salonSettings?.working_hours as any
              const dayConfig = wh?.[dayKey]
              const slotDur = salonSettings?.slot_duration || 30

              let openH = 9, openM = 0, closeH = 18, closeM = 0
              if (dayConfig?.is_open && dayConfig.open && dayConfig.close) {
                const [oh, om] = dayConfig.open.split(':').map(Number)
                const [ch, cm] = dayConfig.close.split(':').map(Number)
                openH = oh; openM = om; closeH = ch; closeM = cm
              }

              const openMin = openH * 60 + openM
              const closeMin = closeH * 60 + closeM
              const all: string[] = []
              for (let m = openMin; m + slotDur <= closeMin; m += slotDur) {
                const hh = String(Math.floor(m / 60)).padStart(2, '0')
                const mm = String(m % 60).padStart(2, '0')
                all.push(`${hh}:${mm}`)
              }

              // Filter: a slot is free only if it doesn't overlap any busy range
              return all.filter(slot => {
                const [sh, sm] = slot.split(':').map(Number)
                const slotStart = sh * 60 + sm
                const slotEnd = slotStart + slotDur
                return !busyRanges.some(r => slotStart < r.end && slotEnd > r.start)
              })
            })()

            const slugLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/agendar/${studioSlug}`

            const toggle = (slot: string) =>
              setBannerSlots(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot])

            const shareText = bannerSlots.length === 0 ? '' :
              `💅 Vagas disponíveis — ${new Date(selectedDate + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n` +
              bannerSlots.map(s => `🕐 ${s}`).join('\n') +
              `\n\n👉 Agende pelo link:\n${slugLink}`

            const handleShare = async () => {
              if (!bannerSlots.length) return

              // Generate visual banner on canvas
              const W = 1080, H = 1080
              const canvas = document.createElement('canvas')
              canvas.width = W; canvas.height = H
              const ctx = canvas.getContext('2d')!

              const brand = studioBrandColor || '#7C5CBF'
              const brandR = parseInt(brand.slice(1,3),16)
              const brandG = parseInt(brand.slice(3,5),16)
              const brandB = parseInt(brand.slice(5,7),16)

              // Background gradient
              const bg = ctx.createLinearGradient(0, 0, 0, H)
              bg.addColorStop(0, '#0d0d1a')
              bg.addColorStop(1, '#1a1028')
              ctx.fillStyle = bg
              ctx.fillRect(0, 0, W, H)

              // Subtle brand glow top-right
              const glow = ctx.createRadialGradient(W, 0, 0, W, 0, 600)
              glow.addColorStop(0, `rgba(${brandR},${brandG},${brandB},0.18)`)
              glow.addColorStop(1, 'transparent')
              ctx.fillStyle = glow
              ctx.fillRect(0, 0, W, H)

              // Top bar brand line
              ctx.fillStyle = brand
              ctx.fillRect(0, 0, W, 6)

              // Draw avatar circle (async - load image if available)
              const drawContent = async () => {
                const avatarSize = 120
                const avatarX = W/2
                const avatarY = 200

                if (studioAvatar) {
                  try {
                    const img = new Image()
                    img.crossOrigin = 'anonymous'
                    await new Promise((res, rej) => {
                      img.onload = res; img.onerror = rej
                      img.src = studioAvatar
                    })
                    // Circle clip for avatar
                    ctx.save()
                    ctx.beginPath()
                    ctx.arc(avatarX, avatarY, avatarSize/2, 0, Math.PI*2)
                    ctx.clip()
                    ctx.drawImage(img, avatarX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize)
                    ctx.restore()
                    // Avatar ring
                    ctx.beginPath()
                    ctx.arc(avatarX, avatarY, avatarSize/2 + 4, 0, Math.PI*2)
                    ctx.strokeStyle = brand
                    ctx.lineWidth = 3
                    ctx.stroke()
                  } catch {
                    // fallback circle
                    ctx.beginPath()
                    ctx.arc(avatarX, avatarY, avatarSize/2, 0, Math.PI*2)
                    ctx.fillStyle = brand
                    ctx.fill()
                    ctx.fillStyle = '#fff'
                    ctx.font = 'bold 48px sans-serif'
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillText('💅', avatarX, avatarY)
                  }
                } else {
                  ctx.beginPath()
                  ctx.arc(avatarX, avatarY, avatarSize/2, 0, Math.PI*2)
                  ctx.fillStyle = brand
                  ctx.fill()
                }

                // Studio name
                ctx.fillStyle = '#ffffff'
                ctx.font = 'bold 54px -apple-system, sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'top'
                ctx.fillText(studioName || 'Studio', W/2, avatarY + avatarSize/2 + 24)

                // "Vagas disponíveis" label
                ctx.fillStyle = brand
                ctx.font = 'bold 28px sans-serif'
                ctx.fillText('💅 VAGAS DISPONÍVEIS', W/2, avatarY + avatarSize/2 + 96)

                // Date
                const dateStr = new Date(selectedDate + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
                ctx.fillStyle = 'rgba(255,255,255,0.7)'
                ctx.font = '32px sans-serif'
                ctx.fillText(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), W/2, avatarY + avatarSize/2 + 142)

                // Divider
                ctx.fillStyle = `rgba(${brandR},${brandG},${brandB},0.3)`
                ctx.fillRect(120, avatarY + avatarSize/2 + 190, W - 240, 1)

                // Time slots
                const slotsPerRow = 3
                const slotW = 240, slotH = 72
                const totalRows = Math.ceil(bannerSlots.length / slotsPerRow)
                const startY = avatarY + avatarSize/2 + 220
                const totalGridH = totalRows * (slotH + 16)
                const gridOffsetY = startY

                bannerSlots.forEach((slot, i) => {
                  const row = Math.floor(i / slotsPerRow)
                  const col = i % slotsPerRow
                  const totalInRow = Math.min(slotsPerRow, bannerSlots.length - row * slotsPerRow)
                  const rowOffsetX = (W - totalInRow * slotW - (totalInRow-1) * 16) / 2
                  const x = rowOffsetX + col * (slotW + 16)
                  const y = gridOffsetY + row * (slotH + 16)

                  // Slot pill background
                  ctx.fillStyle = `rgba(${brandR},${brandG},${brandB},0.15)`
                  ctx.strokeStyle = `rgba(${brandR},${brandG},${brandB},0.5)`
                  ctx.lineWidth = 1.5
                  const r = 16
                  ctx.beginPath()
                  ctx.roundRect(x, y, slotW, slotH, r)
                  ctx.fill()
                  ctx.stroke()

                  // Time text
                  ctx.fillStyle = '#ffffff'
                  ctx.font = 'bold 36px sans-serif'
                  ctx.textAlign = 'center'
                  ctx.textBaseline = 'middle'
                  ctx.fillText(`🕐 ${slot}`, x + slotW/2, y + slotH/2)
                })

                // CTA at bottom
                const ctaY = gridOffsetY + totalGridH + 60
                ctx.fillStyle = brand
                const ctaR = 20
                ctx.beginPath()
                ctx.roundRect(120, ctaY, W - 240, 80, ctaR)
                ctx.fill()

                ctx.fillStyle = '#ffffff'
                ctx.font = 'bold 32px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText('👉 Agende pelo link na bio', W/2, ctaY + 40)

                // Bottom URL
                ctx.fillStyle = 'rgba(255,255,255,0.4)'
                ctx.font = '22px monospace'
                ctx.fillText(slugLink, W/2, H - 50)

                // Share the canvas
                canvas.toBlob(async (blob) => {
                  if (!blob) return
                  const file = new File([blob], 'vagas-banner.png', { type: 'image/png' })
                  if (navigator.share && navigator.canShare?.({ files: [file] })) {
                    try {
                      await navigator.share({ files: [file], text: shareText })
                      return
                    } catch {}
                  }
                  // Fallback: download
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url; a.download = 'vagas-banner.png'; a.click()
                  URL.revokeObjectURL(url)
                }, 'image/png')
              }

              await drawContent()
            }

            return (
              <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ margin: '14px 0 4px', color: C.muted, fontSize: 12 }}>
                  Dia: <strong style={{ color: C.text }}>{longDate(selectedDate)}</strong> · Selecione os horários livres para incluir no banner
                </p>

                {freeSlots.length === 0 ? (
                  <p style={{ color: C.muted, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Nenhum horário livre neste dia.</p>
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
                    <div style={{
                      background: C.card2,
                      border: `1px solid ${C.border2}`,
                      borderRadius: 12,
                      padding: '14px 16px',
                    }}>
                      <p style={{ margin: '0 0 8px', color: C.pink, fontSize: 11, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                        Prévia do banner
                      </p>
                      <p style={{ margin: '0 0 6px', color: C.text, fontSize: 13, fontWeight: 850 }}>
                        💅 Vagas disponíveis — {new Date(selectedDate + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                      {bannerSlots.map(s => (
                        <p key={s} style={{ margin: '2px 0', color: C.muted, fontSize: 13 }}>🕐 {s}</p>
                      ))}
                      <p style={{ margin: '8px 0 0', color: C.purple, fontSize: 12 }}>
                        👉 {slugLink}
                      </p>
                    </div>

                    <button
                      onClick={() => void handleShare()}
                      style={{
                        height: 44,
                        borderRadius: 12,
                        border: 'none',
                        background: C.pink,
                        color: '#fff',
                        fontWeight: 850,
                        fontSize: 14,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <Share2 size={15} /> Compartilhar banner
                    </button>
                  </>
                )}
              </div>
            )
          })()}
        </section>
      )}

      <style>{`
        @media (max-width: 760px) {
          section[style*="grid-template-columns: auto minmax"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 74px"] {
            grid-template-columns: 1fr !important;
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
