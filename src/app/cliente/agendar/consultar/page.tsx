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

function isHistoryAppointment(appointment: Appointment) {
  const finalStatus = ['completed', 'cancelled', 'canceled', 'no_show'].includes(appointment.status)
  return finalStatus || new Date(appointment.appointment_date).getTime() < Date.now()
}

function ConsultarAgendamentoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialId = useMemo(() => searchParams.get('appointmentId')?.trim() ?? '', [searchParams])
  const slug = searchParams.get('slug')?.trim() || ''

  const [phone, setPhone] = useState('')
  const [code, setCode] = useState(initialId)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [studio, setStudio] = useState<Studio | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)

  async function loadByPhone(nextPhone = phone) {
    if (!slug) {
      setError('Link inválido. Acesse a página de agendamento e clique em "Ver meus agendamentos".')
      return
    }
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
      setMessage(action === 'confirm' ? 'Presença confirmada com sucesso.' : 'Agendamento cancelado com sucesso.')
      if (action === 'cancel') setCancelTarget(null)
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
  const upcomingAppointments = appointments.filter((appointment) => !isHistoryAppointment(appointment))
  const historyAppointments = appointments.filter(isHistoryAppointment)
  const hasAppointments = appointments.length > 0

  return (
    <main className="client-page" style={{ '--client-brand': brand } as React.CSSProperties}>
      <style>{`
        .client-page {
          min-height: 100vh;
          background: linear-gradient(180deg, rgba(124,92,191,.10), #fff 260px);
          color: #1a1a1a;
          display: grid;
          place-items: center;
          padding: 20px;
        }
        .client-shell {
          width: 100%;
          max-width: 760px;
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 18px;
          box-shadow: 0 24px 70px rgba(20,20,20,0.10);
          padding: 24px;
          display: grid;
          gap: 18px;
        }
        .client-form, .client-code-form {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
        }
        .client-code-box {
          color: #777;
          font-size: 13px;
          border-radius: 14px;
          border: 1px solid rgba(0,0,0,0.08);
          background: rgba(0,0,0,0.018);
          padding: 12px 14px;
        }
        .client-code-box summary {
          cursor: pointer;
          font-weight: 800;
          color: #555;
        }
        .client-actions, .client-footer {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .client-appointment-section {
          display: grid;
          gap: 10px;
        }
        .client-section-title {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          margin-top: 2px;
        }
        .client-section-title h2 {
          margin: 0;
          font-size: 15px;
          letter-spacing: .02em;
        }
        .client-section-title span {
          color: #777;
          font-size: 12px;
          font-weight: 800;
        }
        .client-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 30;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(20, 16, 24, .42);
          backdrop-filter: blur(8px);
        }
        .client-modal {
          width: min(100%, 420px);
          border-radius: 18px;
          background: #fff;
          border: 1px solid rgba(0,0,0,.08);
          box-shadow: 0 24px 80px rgba(0,0,0,.22);
          padding: 22px;
          display: grid;
          gap: 14px;
        }
        @media (max-width: 520px) {
          .client-page { padding: 14px; place-items: start center; }
          .client-shell { padding: 20px; border-radius: 16px; gap: 16px; }
          .client-form, .client-code-form { grid-template-columns: 1fr; }
          .client-form button, .client-code-form button { width: 100%; }
          .client-actions, .client-footer { display: grid; grid-template-columns: 1fr; }
          .client-actions button, .client-footer a { width: 100%; justify-content: center; }
          .client-section-title { align-items: flex-start; flex-direction: column; gap: 4px; }
        }
      `}</style>

      <section className="client-shell">
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href={bookingLink} style={navButton()}>
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
            flexShrink: 0,
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
          className="client-form"
        >
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Ex: 66999990000"
            inputMode="tel"
            style={inputStyle(48)}
          />
          <button disabled={loading} style={primaryButton(brand, loading)}>
            {loading ? 'Buscando...' : 'Entrar'}
          </button>
        </form>
        <p style={{ margin: '-8px 0 0', color: '#777', fontSize: 12, lineHeight: 1.45 }}>
          Digite DDD + número, sem espaços, pontos ou parênteses. Exemplo: <strong style={{ color: '#444' }}>66999990000</strong>.
        </p>

        <details className="client-code-box">
          <summary>Tenho apenas o código do agendamento</summary>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void loadByCode(code)
            }}
            className="client-code-form"
            style={{ marginTop: 12 }}
          >
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Código completo"
              style={inputStyle(44)}
            />
            <button disabled={loading} style={secondaryButton()}>
              Consultar
            </button>
          </form>
          <p style={{ margin: '9px 0 0', lineHeight: 1.45 }}>
            Para alterar ou cancelar, informe também o mesmo WhatsApp usado no agendamento.
          </p>
        </details>

        {error && <Notice tone="danger">{error}</Notice>}
        {message && <Notice tone="success">{message}</Notice>}

        {hasAppointments && (
          <Notice tone="neutral">
            Encontramos {appointments.length} {appointments.length === 1 ? 'agendamento' : 'agendamentos'} para este acesso.
          </Notice>
        )}

        {upcomingAppointments.length > 0 && (
          <AppointmentSection title="Próximos agendamentos" count={upcomingAppointments.length}>
            {upcomingAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                studioName={studio?.name || 'Studio'}
                actionLoading={actionLoading}
                onConfirm={() => void updateAppointment(appointment.id, 'confirm')}
                onCancel={() => setCancelTarget(appointment)}
              />
            ))}
          </AppointmentSection>
        )}

        {historyAppointments.length > 0 && (
          <AppointmentSection title="Histórico" count={historyAppointments.length}>
            {historyAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                studioName={studio?.name || 'Studio'}
                actionLoading={actionLoading}
                onConfirm={() => void updateAppointment(appointment.id, 'confirm')}
                onCancel={() => setCancelTarget(appointment)}
              />
            ))}
          </AppointmentSection>
        )}

        <footer className="client-footer">
          <Link href={bookingLink} style={footerButton(brand, true)}>
            Novo agendamento
          </Link>
          {whatsappNumber && (
            <a
              href={`https://wa.me/55${whatsappNumber}?text=${encodeURIComponent('Olá! Quero falar sobre meu agendamento.')}`}
              target="_blank"
              rel="noreferrer"
              style={footerButton(brand, false)}
            >
              Falar no WhatsApp
            </a>
          )}
        </footer>
      </section>

      {cancelTarget && (
        <div className="client-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
          <div className="client-modal">
            <div>
              <p style={{ margin: 0, color: '#b91c1c', fontSize: 11, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>
                Cancelar horário
              </p>
              <h2 id="cancel-title" style={{ margin: '5px 0 0', fontSize: 22, lineHeight: 1.15 }}>
                Tem certeza que deseja cancelar?
              </h2>
            </div>
            <p style={{ margin: 0, color: '#666', fontSize: 14, lineHeight: 1.55 }}>
              {cancelTarget.service_name} em {formatDateTime(cancelTarget.appointment_date)} será removido da sua agenda.
            </p>
            <div className="client-actions">
              <button
                onClick={() => void updateAppointment(cancelTarget.id, 'cancel')}
                disabled={Boolean(actionLoading)}
                style={actionStyle('#dc2626', actionLoading === `${cancelTarget.id}:cancel`)}
              >
                <XCircle size={16} /> Sim, cancelar
              </button>
              <button
                onClick={() => setCancelTarget(null)}
                disabled={Boolean(actionLoading)}
                style={actionStyle('#555', false, true)}
              >
                Manter agendamento
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function AppointmentSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="client-appointment-section">
      <div className="client-section-title">
        <h2>{title}</h2>
        <span>{count} {count === 1 ? 'horário' : 'horários'}</span>
      </div>
      {children}
    </section>
  )
}

function AppointmentCard({
  appointment,
  studioName,
  actionLoading,
  onConfirm,
  onCancel,
}: {
  appointment: Appointment
  studioName: string
  actionLoading: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const changeable = canClientChange(appointment.status)

  return (
    <article style={{
      borderRadius: 16,
      padding: 18,
      border: '1px solid rgba(0,0,0,0.08)',
      background: '#fff',
      display: 'grid',
      gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, color: '#777', fontSize: 11, fontWeight: 900, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            {studioName}
          </p>
          <h3 style={{ margin: '5px 0 0', fontSize: 20 }}>{appointment.service_name}</h3>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <Info label="Data e horário" value={formatDateTime(appointment.appointment_date)} />
      <Info label="Cliente" value={appointment.client_name} />
      <Info label="Valor" value={formatCurrency(appointment.price)} />

      {changeable && (
        <div className="client-actions">
          <button
            onClick={onConfirm}
            disabled={Boolean(actionLoading)}
            style={actionStyle('#16a34a', actionLoading === `${appointment.id}:confirm`)}
          >
            <CheckCircle2 size={16} /> Confirmar presença
          </button>
          <button
            onClick={onCancel}
            disabled={Boolean(actionLoading)}
            style={actionStyle('#dc2626', actionLoading === `${appointment.id}:cancel`, true)}
          >
            <XCircle size={16} /> Cancelar
          </button>
        </div>
      )}
    </article>
  )
}

function Notice({ children, tone }: { children: React.ReactNode; tone: 'success' | 'danger' | 'neutral' }) {
  const color = tone === 'success' ? '#15803d' : tone === 'danger' ? '#b91c1c' : '#4b5563'
  const bg = tone === 'success' ? 'rgba(22,163,74,.09)' : tone === 'danger' ? 'rgba(220,38,38,.08)' : 'rgba(17,24,39,.045)'
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

function inputStyle(height: number): React.CSSProperties {
  return {
    height,
    borderRadius: 12,
    border: '1px solid rgba(0,0,0,0.12)',
    padding: '0 14px',
    fontSize: 14,
    outline: 'none',
    minWidth: 0,
  }
}

function navButton(): React.CSSProperties {
  return {
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
  }
}

function primaryButton(brand: string, loading: boolean): React.CSSProperties {
  return {
    height: 48,
    borderRadius: 12,
    border: 'none',
    background: brand,
    color: '#fff',
    padding: '0 16px',
    fontWeight: 850,
    cursor: loading ? 'wait' : 'pointer',
    opacity: loading ? 0.75 : 1,
  }
}

function secondaryButton(): React.CSSProperties {
  return {
    height: 44,
    borderRadius: 12,
    border: '1px solid rgba(0,0,0,0.12)',
    background: '#fff',
    padding: '0 14px',
    fontWeight: 800,
  }
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
    justifyContent: 'center',
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
