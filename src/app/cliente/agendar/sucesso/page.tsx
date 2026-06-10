'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BOOKING_TIME_ZONE } from '@/lib/time'

type Appointment = {
  id: string
  status: string
  appointment_date: string
  client_name: string
  service_name: string
  price: number
  duration_minutes: number
  client_id?: string | null
  service_id?: string | null
  studio_id?: string
  appointmentId?: string
  appointmentDate?: string
  clientName?: string
  serviceName?: string
  durationMinutes?: number
  studioId?: string
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: BOOKING_TIME_ZONE,
  }).format(new Date(value))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BOOKING_TIME_ZONE,
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
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
    cancelled: 'Cancelado',
  }

  return map[status] || status
}

function BookingSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const appointmentId = useMemo(() => searchParams.get('appointmentId')?.trim() ?? '', [searchParams])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [studio, setStudio] = useState<Studio | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      if (!appointmentId) {
        if (!active) return
        setError('O identificador do agendamento não foi informado.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const res = await fetch(`/api/public/appointments/${encodeURIComponent(appointmentId)}`, {
          cache: 'no-store',
        })
        const data = await res.json().catch(() => null)

        if (!res.ok) {
          throw new Error(data?.error || 'Não foi possível carregar os dados do agendamento.')
        }

        if (!active) return
        setAppointment(data?.appointment ?? null)
        setStudio(data?.studio ?? null)
      } catch (err) {
        if (!active) return
        const message = err instanceof Error ? err.message : 'Não foi possível carregar os dados do agendamento.'
        setError(message)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [appointmentId])

  const brand = studio?.brand_color || '#7C5CBF'
  const rgb = brand.startsWith('#') && brand.length === 7
    ? `${parseInt(brand.slice(1, 3), 16)},${parseInt(brand.slice(3, 5), 16)},${parseInt(brand.slice(5, 7), 16)}`
    : '124,92,191'

  const shortCode = appointment?.id ? appointment.id.slice(0, 8).toUpperCase() : '—'
  const bookingLink = studio?.slug ? `/agendar/${studio.slug}` : '/'
  const whatsappNumber = (studio?.whatsapp || studio?.phone || '').replace(/\D/g, '')
  const whatsappMessage = appointment
    ? encodeURIComponent(
        `Olá! Queria falar sobre o agendamento de ${appointment.service_name} em ${formatDateTime(appointment.appointment_date)}.`,
      )
    : ''
  const whatsappLink = whatsappNumber ? `https://wa.me/55${whatsappNumber}?text=${whatsappMessage}` : ''

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F7F3EF',
        color: '#2B1E1A',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        backgroundImage: `radial-gradient(800px circle at 50% -180px, rgba(${rgb}, 0.16), transparent 65%)`,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(120, 90, 80, 0.12)',
          borderRadius: 28,
          boxShadow: '0 24px 80px rgba(92, 58, 46, 0.14)',
          padding: 28,
        }}
      >
        {loading ? (
          <div style={{ minHeight: 360, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: `3px solid rgba(${rgb}, 0.25)`,
                  borderTopColor: brand,
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto',
                }}
              />
              <p style={{ marginTop: 14, color: '#7A665E', fontSize: 14 }}>Carregando confirmação...</p>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : error ? (
          <div style={{ minHeight: 360, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <div style={{ maxWidth: 420 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                  background: 'rgba(160, 110, 92, 0.12)',
                  border: '1px solid rgba(160, 110, 92, 0.2)',
                  color: '#8D5B4A',
                  fontSize: 28,
                }}
              >
                !
              </div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 30, margin: 0 }}>Não conseguimos abrir a confirmação</h1>
              <p style={{ color: '#7A665E', fontSize: 14, lineHeight: 1.6, marginTop: 10 }}>{error}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                <button
                  onClick={() => router.refresh()}
                  style={{
                    height: 46,
                    padding: '0 18px',
                    borderRadius: 14,
                    border: 'none',
                    background: `linear-gradient(135deg, ${brand}, color-mix(in srgb, ${brand}, white 24%))`,
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Tentar novamente
                </button>
                <Link
                  href={bookingLink}
                  style={{
                    height: 46,
                    padding: '0 18px',
                    borderRadius: 14,
                    border: '1px solid rgba(120, 90, 80, 0.18)',
                    color: '#5B4740',
                    display: 'inline-flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  Voltar ao agendamento
                </Link>
              </div>
            </div>
          </div>
        ) : appointment ? (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  background: `linear-gradient(145deg, ${brand}, color-mix(in srgb, ${brand}, black 18%))`,
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  boxShadow: `0 10px 28px rgba(${rgb}, 0.28)`,
                  flexShrink: 0,
                }}
              >
                ✓
              </div>
              <div>
                <p style={{ margin: 0, color: '#8A7469', fontSize: 11, fontWeight: 800, letterSpacing: '.22em', textTransform: 'uppercase' }}>
                  Agendamento confirmado
                </p>
                <h1 style={{ margin: '4px 0 0', fontFamily: 'Georgia, serif', fontSize: 34, lineHeight: 1.05 }}>
                  {studio?.name || 'Seu studio'}
                </h1>
              </div>
            </div>

            <p style={{ margin: 0, color: '#7A665E', lineHeight: 1.6, fontSize: 14 }}>
              Seu agendamento foi registrado com sucesso. Confira abaixo os dados reais retornados pelo sistema.
            </p>

            <div
              style={{
                borderRadius: 24,
                padding: 22,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(250,245,242,0.96))',
                border: '1px solid rgba(120, 90, 80, 0.12)',
                display: 'grid',
                gap: 12,
              }}
            >
              {[
                ['Cliente', appointment.client_name],
                ['Serviço', appointment.service_name],
                ['Data', formatDate(appointment.appointment_date)],
                ['Horário', formatTime(appointment.appointment_date)],
                ['Valor', formatCurrency(appointment.price)],
                ['Status', formatStatus(appointment.status)],
                ['Código', shortCode],
              ].map(([label, value]) => (
                <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 14 }}>
                  <span style={{ color: '#8A7469' }}>{label}</span>
                  <span style={{ color: '#2B1E1A', fontWeight: 700, textAlign: 'right' }}>{String(value)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href={bookingLink}
                style={{
                  height: 48,
                  padding: '0 20px',
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${brand}, color-mix(in srgb, ${brand}, white 26%))`,
                  color: '#fff',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                }}
              >
                Novo agendamento
              </Link>

              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    height: 48,
                    padding: '0 20px',
                    borderRadius: 14,
                    border: '1px solid rgba(120, 90, 80, 0.18)',
                    color: '#5B4740',
                    display: 'inline-flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    fontWeight: 800,
                  }}
                >
                  Falar no WhatsApp
                </a>
              )}
            </div>

            <p style={{ margin: 0, color: '#9A877D', fontSize: 12 }}>
              {studio?.slug ? `Acesse novamente: /agendar/${studio.slug}` : 'A confirmação ficou salva no sistema.'}
            </p>
          </div>
        ) : null}
      </div>
    </main>
  )
}

function LoadingShell() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#F7F3EF',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          minHeight: 420,
          borderRadius: 28,
          background: 'rgba(255,255,255,0.82)',
          border: '1px solid rgba(120, 90, 80, 0.12)',
          boxShadow: '0 24px 80px rgba(92, 58, 46, 0.14)',
        }}
      />
    </main>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <BookingSuccessContent />
    </Suspense>
  )
}
