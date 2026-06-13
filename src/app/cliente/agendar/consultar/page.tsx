'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
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
    pending: 'Pendente',
    completed: 'Concluido',
    cancelled: 'Cancelado',
  }

  return map[status] || status
}

function onlyAppointmentId(value: string) {
  return value.trim().replace(/^#/, '')
}

function ConsultarAgendamentoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialId = useMemo(() => onlyAppointmentId(searchParams.get('appointmentId') ?? ''), [searchParams])

  const [code, setCode] = useState(initialId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [studio, setStudio] = useState<Studio | null>(null)

  async function load(id: string) {
    const appointmentId = onlyAppointmentId(id)
    if (!appointmentId) {
      setError('Informe o codigo completo do agendamento.')
      setAppointment(null)
      setStudio(null)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/public/appointments/${encodeURIComponent(appointmentId)}`, {
        cache: 'no-store',
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) throw new Error(data?.error || 'Nao encontramos esse agendamento.')

      setAppointment(data?.appointment ?? null)
      setStudio(data?.studio ?? null)
      router.replace(`/cliente/agendar/consultar?appointmentId=${encodeURIComponent(appointmentId)}`, { scroll: false })
    } catch (err) {
      setAppointment(null)
      setStudio(null)
      setError(err instanceof Error ? err.message : 'Nao foi possivel consultar o agendamento.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialId) void load(initialId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId])

  const brand = studio?.brand_color || '#7C5CBF'
  const bookingLink = studio?.slug ? `/agendar/${studio.slug}` : '/'
  const whatsappNumber = (studio?.whatsapp || studio?.phone || '').replace(/\D/g, '')
  const whatsappLink = whatsappNumber && appointment
    ? `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(`Ola! Quero falar sobre meu agendamento ${appointment.id.slice(0, 8).toUpperCase()}.`)}`
    : ''

  return (
    <main style={{
      minHeight: '100vh',
      background: '#F7F3EF',
      color: '#2B1E1A',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      backgroundImage: 'radial-gradient(850px circle at 50% -180px, rgba(124,92,191,0.15), transparent 65%)',
    }}>
      <section style={{
        width: '100%',
        maxWidth: 760,
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid rgba(120,90,80,0.12)',
        borderRadius: 28,
        boxShadow: '0 24px 80px rgba(92,58,46,0.14)',
        padding: 28,
        display: 'grid',
        gap: 20,
      }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            background: brand,
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 900,
          }}>
            <Search size={22} />
          </div>
          <div>
            <p style={{ margin: 0, color: '#8A7469', fontSize: 11, fontWeight: 900, letterSpacing: '.2em', textTransform: 'uppercase' }}>
              Area da cliente
            </p>
            <h1 style={{ margin: '4px 0 0', fontFamily: 'Georgia, serif', fontSize: 34, lineHeight: 1.05 }}>
              Consultar agendamento
            </h1>
          </div>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            void load(code)
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 10,
          }}
        >
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Cole o codigo completo do agendamento"
            style={{
              height: 48,
              borderRadius: 14,
              border: '1px solid rgba(120,90,80,0.18)',
              background: '#fff',
              padding: '0 14px',
              color: '#2B1E1A',
              fontSize: 14,
              outline: 'none',
              minWidth: 0,
            }}
          />
          <button
            disabled={loading}
            style={{
              height: 48,
              borderRadius: 14,
              border: 'none',
              background: brand,
              color: '#fff',
              padding: '0 18px',
              fontWeight: 850,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? 'Buscando...' : 'Consultar'}
          </button>
        </form>

        {error && (
          <div style={{
            borderRadius: 16,
            padding: 14,
            background: 'rgba(160,110,92,0.10)',
            border: '1px solid rgba(160,110,92,0.18)',
            color: '#8D5B4A',
            fontSize: 13,
            fontWeight: 700,
          }}>
            {error}
          </div>
        )}

        {appointment && (
          <div style={{
            borderRadius: 24,
            padding: 22,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,245,242,0.98))',
            border: '1px solid rgba(120,90,80,0.12)',
            display: 'grid',
            gap: 13,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, color: '#8A7469', fontSize: 11, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>
                  {studio?.name || 'Studio'}
                </p>
                <h2 style={{ margin: '5px 0 0', color: '#2B1E1A', fontSize: 22 }}>
                  {appointment.service_name}
                </h2>
              </div>
              <span style={{
                borderRadius: 999,
                padding: '7px 11px',
                background: 'rgba(52,211,153,0.13)',
                border: '1px solid rgba(52,211,153,0.22)',
                color: '#16794F',
                fontSize: 11,
                fontWeight: 900,
                textTransform: 'uppercase',
              }}>
                {formatStatus(appointment.status)}
              </span>
            </div>

            {[
              ['Cliente', appointment.client_name],
              ['Data e horario', formatDateTime(appointment.appointment_date)],
              ['Duracao', `${appointment.duration_minutes} minutos`],
              ['Valor', formatCurrency(appointment.price)],
              ['Codigo', appointment.id],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 14 }}>
                <span style={{ color: '#8A7469' }}>{label}</span>
                <strong style={{ color: '#2B1E1A', textAlign: 'right', overflowWrap: 'anywhere' }}>{value}</strong>
              </div>
            ))}
          </div>
        )}

        <footer style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href={bookingLink} style={{
            height: 46,
            padding: '0 18px',
            borderRadius: 14,
            background: appointment ? brand : 'transparent',
            border: appointment ? 'none' : '1px solid rgba(120,90,80,0.18)',
            color: appointment ? '#fff' : '#5B4740',
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            fontWeight: 850,
          }}>
            Novo agendamento
          </Link>
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noreferrer" style={{
              height: 46,
              padding: '0 18px',
              borderRadius: 14,
              border: '1px solid rgba(120,90,80,0.18)',
              color: '#5B4740',
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
              fontWeight: 850,
            }}>
              Falar no WhatsApp
            </a>
          )}
        </footer>
      </section>
    </main>
  )
}

function LoadingShell() {
  return (
    <main style={{ minHeight: '100vh', background: '#F7F3EF', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 760, minHeight: 420, borderRadius: 28, background: 'rgba(255,255,255,0.82)' }} />
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
