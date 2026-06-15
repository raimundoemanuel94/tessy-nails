'use client'

import Link from 'next/link'
import type React from 'react'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Search, XCircle } from 'lucide-react'
import { BOOKING_TIME_ZONE } from '@/lib/time'

type Appointment = {
  id: string
  status: string
  appointment_date: string
  client_name: string
  service_name: string
  price: number
  duration_minutes: number
  studio_id?: string
}

type Studio = {
  id: string
  name: string
  slug: string
  brand_color: string | null
  avatar_url: string | null
  whatsapp: string | null
  phone: string | null
}

function formatCurrency(value: number) {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BOOKING_TIME_ZONE,
  }).format(new Date(value))
}

function formatStatus(status: string) {
  const map: Record<string, string> = {
    confirmed: 'Confirmado',
    pending: 'Aguardando confirmação',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    canceled: 'Cancelado',
    no_show: 'Falta registrada',
  }
  return map[status] || status
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits
}

function canClientChange(status: string) {
  return !['completed', 'cancelled', 'canceled', 'no_show'].includes(status)
}

function ConsultarAgendamentoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialId = useMemo(() => searchParams.get('appointmentId')?.trim() ?? '', [searchParams])
  const slug = searchParams.get('slug')?.trim() || 'tessy-nails'

  const [phone, setPhone] = useState('')
  const [code, setCode] = useState(initialId)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [studio, setStudio] = useState<Studio | null>(null)

  async function loadByPhone(nextPhone = phone) {
    const cleanPhone = normalizePhone(nextPhone)
    if (cleanPhone.length < 10) {
      setError('Informe o WhatsApp usado no agendamento.')
      setAppointments([])
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`/api/public/client-appointments?slug=${encodeURIComponent(slug)}&phone=${encodeURIComponent(cleanPhone)}`, {
        cache: 'no-store',
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Não foi possível consultar seus agendamentos.')

      setStudio(data?.studio ?? null)
      setAppointments(Array.isArray(data?.appointments) ? data.appointments : [])
      router.replace(`/cliente/agendar/consultar?slug=${encodeURIComponent(slug)}&phone=${encodeURIComponent(cleanPhone)}`, { scroll: false })
      if (!data?.appointments?.length) setMessage('Nenhum agendamento encontrado para este WhatsApp.')
    } catch (err) {
      setAppointments([])
      setError(err instanceof Error ? err.message : 'Não foi possível consultar seus agendamentos.')
    } finally {
      setLoading(false)
    }
  }

  async function loadByCode(id: string) {
    const appointmentId = id.trim().replace(/^#/, '')
    if (!appointmentId) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`/api/public/appointments/${encodeURIComponent(appointmentId)}`, { cache: 'no-store' })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Não encontramos esse agendamento.')

      setStudio(data?.studio ?? null)
      setAppointments(data?.appointment ? [data.appointment] : [])
    } catch (err) {
      setAppointments([])
      setError(err instanceof Error ? err.message : 'Não foi possível consultar o agendamento.')
    } finally {
      setLoading(false)
    }
  }

  async function updateAppointment(appointmentId: string, action: 'confirm' | 'cancel') {
    const cleanPhone = normalizePhone(phone)
    if (cleanPhone.length < 10) {
      setError('Informe o WhatsApp para confirmar sua identidade.')
      return
    }

    setActionLoading(`${appointmentId}:${action}`)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`/api/public/appointments/${encodeURIComponent(appointmentId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, phone: cleanPhone }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || 'Não foi possível atualizar o agendamento.')

      setAppointments((current) => current.map((item) => item.id === appointmentId ? { ...item, status: data.appointment.status } : item))
      setMessage(action === 'confirm' ? 'Presenca confirmada com sucesso.' : 'Agendamento cancelado com sucesso.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar o agendamento.')
    } finally {
      setActionLoading('')
    }
  }

  useEffect(() => {
    const phoneParam = searchParams.get('phone') ?? ''
    if (phoneParam) {
      setPhone(phoneParam)
      void loadByPhone(phoneParam)
    } else if (initialId) {
      void loadByCode(initialId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId])

  const brand = studio?.brand_color || '#7C5CBF'
  const bookingLink = studio?.slug ? `/agendar/${studio.slug}` : `/agendar/${slug}`
  const whatsappNumber = (studio?.whatsapp || studio?.phone || '').replace(/\D/g, '')

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, rgba(124,92,191,.10), #fff 260px)',
      color: '#1a1a1a',
      display: 'grid',
      placeItems: 'center',
      padding: 20,
    }}>
      <section style={{
        width: '100%',
        maxWidth: 760,
        background: 'rgba(255,255,255,0.96)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 18,
        boxShadow: '0 24px 70px rgba(20,20,20,0.10)',
        padding: 24,
        display: 'grid',
        gap: 18,
      }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href={bookingLink} style={{
            minHeight: 38,
            padding: '0 13px',
            borderRadius: 999,
            border: '1px solid rgba(0,0,0,0.10)',
            color: '#555',
            background: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 800,
          }}>
            ← Voltar para agenda
          </Link>
          <span style={{
            minHeight: 34,
            padding: '0 11px',
            borderRadius: 999,
            background: `${brand}14`,
            color: brand,
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: 12,
            fontWeight: 900,
          }}>
            Consulta por WhatsApp
          </span>
        </nav>

        <header style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 50,
            height: 50,
            borderRadius: 14,
            background: brand,
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
          }}>
            <Search size={22} />
          </div>
          <div>
            <p style={{ margin: 0, color: brand, fontSize: 11, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>
              Área da cliente
            </p>
            <h1 style={{ margin: '4px 0 0', fontSize: 28, lineHeight: 1.1 }}>
              Meus agendamentos
            </h1>
            <p style={{ margin: '7px 0 0', color: '#777', fontSize: 13, lineHeight: 1.45 }}>
              Entre com o WhatsApp usado no agendamento para confirmar, cancelar ou consultar seus horários.
            </p>
          </div>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void loadByPhone()
          }}
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10 }}
        >
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Ex: 66999990000"
            inputMode="tel"
            style={{
              height: 48,
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.12)',
              padding: '0 14px',
              fontSize: 14,
              outline: 'none',
              minWidth: 0,
            }}
          />
          <button disabled={loading} style={{
            height: 48,
            borderRadius: 12,
            border: 'none',
            background: brand,
            color: '#fff',
            padding: '0 16px',
            fontWeight: 850,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.75 : 1,
          }}>
            {loading ? 'Buscando...' : 'Entrar'}
          </button>
        </form>
        <p style={{ margin: '-8px 0 0', color: '#777', fontSize: 12, lineHeight: 1.45 }}>
          Digite DDD + número, sem espaços, pontos ou parênteses. Exemplo: <strong style={{ color: '#444' }}>66999990000</strong>.
        </p>

        <details style={{ color: '#777', fontSize: 13 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Tenho apenas o código do agendamento</summary>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void loadByCode(code)
            }}
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10, marginTop: 10 }}
          >
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Codigo completo"
              style={{ height: 44, borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', padding: '0 14px', minWidth: 0 }}
            />
            <button disabled={loading} style={{ height: 44, borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', padding: '0 14px', fontWeight: 800 }}>
              Consultar
            </button>
          </form>
        </details>

        {error && <Notice tone="danger">{error}</Notice>}
        {message && <Notice tone="success">{message}</Notice>}

        {appointments.length > 0 && (
          <div style={{ display: 'grid', gap: 12 }}>
            {appointments.map((appointment) => {
              const changeable = canClientChange(appointment.status)
              return (
                <article key={appointment.id} style={{
                  borderRadius: 16,
                  padding: 18,
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: '#fff',
                  display: 'grid',
                  gap: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: 0, color: '#777', fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>
                        {studio?.name || 'Studio'}
                      </p>
                      <h2 style={{ margin: '5px 0 0', fontSize: 20 }}>{appointment.service_name}</h2>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>

                  <Info label="Data e horário" value={formatDateTime(appointment.appointment_date)} />
                  <Info label="Cliente" value={appointment.client_name} />
                  <Info label="Valor" value={formatCurrency(appointment.price)} />

                  {changeable && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => void updateAppointment(appointment.id, 'confirm')}
                        disabled={Boolean(actionLoading)}
                        style={actionStyle('#16a34a', actionLoading === `${appointment.id}:confirm`)}
                      >
                        <CheckCircle2 size={16} /> Confirmar presença
                      </button>
                      <button
                        onClick={() => void updateAppointment(appointment.id, 'cancel')}
                        disabled={Boolean(actionLoading)}
                        style={actionStyle('#dc2626', actionLoading === `${appointment.id}:cancel`, true)}
                      >
                        <XCircle size={16} /> Cancelar
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}

        <footer style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href={bookingLink} style={footerButton(brand, true)}>
            Novo agendamento
          </Link>
          {whatsappNumber && (
            <a
              href={`https://wa.me/55${whatsappNumber}?text=${encodeURIComponent('Ola! Quero falar sobre meu agendamento.')}`}
              target="_blank"
              rel="noreferrer"
              style={footerButton(brand, false)}
            >
              Falar no WhatsApp
            </a>
          )}
        </footer>
      </section>
    </main>
  )
}

function Notice({ children, tone }: { children: React.ReactNode; tone: 'success' | 'danger' }) {
  const color = tone === 'success' ? '#15803d' : '#b91c1c'
  const bg = tone === 'success' ? 'rgba(22,163,74,.09)' : 'rgba(220,38,38,.08)'
  return <div style={{ borderRadius: 12, padding: 13, background: bg, color, fontSize: 13, fontWeight: 750 }}>{children}</div>
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'confirmed' ? '#15803d' : status === 'pending' ? '#b45309' : ['cancelled', 'canceled', 'no_show'].includes(status) ? '#b91c1c' : '#555'
  return (
    <span style={{ borderRadius: 999, padding: '7px 10px', background: `${color}14`, color, fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>
      {formatStatus(status)}
    </span>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, fontSize: 14 }}>
      <span style={{ color: '#777' }}>{label}</span>
      <strong style={{ textAlign: 'right' }}>{value}</strong>
    </div>
  )
}

function actionStyle(color: string, loading: boolean, outline = false): React.CSSProperties {
  return {
    minHeight: 42,
    borderRadius: 999,
    border: `1px solid ${color}`,
    background: outline ? '#fff' : color,
    color: outline ? color : '#fff',
    padding: '0 14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    fontWeight: 850,
    cursor: loading ? 'wait' : 'pointer',
    opacity: loading ? 0.7 : 1,
  }
}

function footerButton(brand: string, primary: boolean): React.CSSProperties {
  return {
    height: 44,
    padding: '0 16px',
    borderRadius: 12,
    background: primary ? brand : '#fff',
    border: primary ? 'none' : '1px solid rgba(0,0,0,0.12)',
    color: primary ? '#fff' : '#444',
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
    fontWeight: 850,
  }
}

function LoadingShell() {
  return (
    <main style={{ minHeight: '100vh', background: '#fff', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 760, minHeight: 420, borderRadius: 18, background: 'rgba(0,0,0,0.04)' }} />
    </main>
  )
}

export default function ConsultarAgendamentoPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <ConsultarAgendamentoContent />
    </Suspense>
  )
}
