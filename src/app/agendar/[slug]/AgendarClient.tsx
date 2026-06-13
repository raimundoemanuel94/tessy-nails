// @ts-nocheck
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

type Studio = {
  id: string
  name: string
  slug: string
  avatar_url: string | null
  brand_color: string
  whatsapp: string | null
  instagram: string | null
  address: string | null
  phone: string | null
}

type Service = {
  id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number
  category: string | null
}

type Settings = {
  slot_duration: number
  advance_days: number
  cancel_hours: number
  auto_confirm: boolean
  working_hours: any
} | null

type Professional = {
  id: string
  name: string
  avatar_url: string | null
  role: string
} | null

type CreatedAppointment = {
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
}

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

const money = (value: number) => `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
const pad2 = (value: number) => String(value).padStart(2, '0')
const localYmd = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`

function safeRgb(hex?: string | null) {
  const value = hex && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#7C5CBF'
  const r = parseInt(value.slice(1, 3), 16)
  const g = parseInt(value.slice(3, 5), 16)
  const b = parseInt(value.slice(5, 7), 16)
  return `${r},${g},${b}`
}

function formatDate(value: string) {
  return new Date(value + 'T00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StepBar({ step }: { step: string }) {
  const steps = ['service', 'date', 'time', 'info']
  const current = Math.max(0, steps.indexOf(step))

  return (
    <div className="booking-progress" aria-label="Progresso do agendamento">
      {steps.map((item, index) => (
        <span key={item} className={index <= current ? 'is-active' : ''} />
      ))}
    </div>
  )
}

export default function AgendarClient({ studio, services, settings, professional }: { studio: Studio; services: Service[]; settings: Settings; professional?: Professional }) {
  const brand = /^#[0-9A-Fa-f]{6}$/.test(studio.brand_color || '') ? studio.brand_color : '#7C5CBF'
  const rgb = safeRgb(brand)
  const router = useRouter()

  const [step, setStep] = useState<'service' | 'date' | 'time' | 'info' | 'done'>('service')
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotError, setSlotError] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [createdAppointment, setCreatedAppointment] = useState<CreatedAppointment | null>(null)

  const workingHours = settings?.working_hours || {}
  const advanceDays = settings?.advance_days || 30
  const availableDates: string[] = []

  for (let i = 0; i < advanceDays; i++) {
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() + i)
    const config = workingHours[weekdayKeys[date.getDay()]]
    if (config?.is_open) availableDates.push(localYmd(date))
  }

  async function fetchSlots(date: string, service: Service) {
    setLoadingSlots(true)
    setSlots([])
    setSlotError('')

    try {
      const params = new URLSearchParams({
        studioId: studio.id,
        serviceId: service.id,
        date,
      })
      if (professional?.id) params.set('professionalId', professional.id)
      const response = await fetch(`/api/public/slots?${params.toString()}`)
      const data = await response.json().catch(() => null)

      if (!response.ok) throw new Error(data?.error || 'Erro ao carregar horários.')
      setSlots(Array.isArray(data?.slots) ? data.slots : [])
    } catch (error) {
      setSlotError(error instanceof Error ? error.message : 'Erro ao carregar horários.')
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  async function submit() {
    if (!selectedService || !selectedDate || !selectedTime || !name.trim() || !phone.trim()) return

    setLoading(true)
    setBookingError('')

    try {
      const response = await fetch('/api/public/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studioId: studio.id,
          slug: studio.slug,
          serviceId: selectedService.id,
          appointmentDate: `${selectedDate}T${selectedTime}:00`,
          clientName: name.trim(),
          clientPhone: phone.trim(),
          notes: notes.trim() || undefined,
          professionalId: professional?.id ?? undefined,
        }),
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) throw new Error(data?.error || 'Não foi possível confirmar o agendamento.')

      const appointment = data?.appointment as CreatedAppointment | undefined
      if (!appointment?.id) throw new Error('A confirmação não retornou os dados do agendamento.')

      setCreatedAppointment(appointment)
      setStep('done')
      router.replace(`/cliente/agendar/sucesso?appointmentId=${encodeURIComponent(appointment.id)}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível confirmar o agendamento.'
      setBookingError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  function whatsappLink() {
    const number = (studio.whatsapp || studio.phone || '').replace(/\D/g, '')
    const message = encodeURIComponent(
      `Olá! Agendei ${selectedService?.name} para ${selectedDate.split('-').reverse().join('/')} às ${selectedTime}. Meu nome é ${name}.`,
    )
    return `https://wa.me/55${number}?text=${message}`
  }

  function reset() {
    setStep('service')
    setSelectedService(null)
    setSelectedDate('')
    setSelectedTime('')
    setName('')
    setPhone('')
    setNotes('')
    setSlots([])
    setSlotError('')
    setBookingError('')
    setCreatedAppointment(null)
  }

  const css = `
    .booking-shell {
      --booking-brand: ${brand};
      --booking-rgb: ${rgb};
      min-height: 100vh;
      color: #1a1a1a;
      background: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
      padding-bottom: 40px;
    }
    .booking-header {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 68px;
      padding: 12px 20px;
      background: rgba(255,255,255,.85);
      border-bottom: 1px solid #eeeeee;
      backdrop-filter: saturate(180%) blur(14px);
    }
    .booking-logo {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      overflow: hidden;
      color: #fff;
      font-weight: 700;
      font-size: 13px;
      background: var(--booking-brand);
      flex: 0 0 auto;
    }
    .booking-logo img { width: 100%; height: 100%; object-fit: cover; }
    .booking-brand-copy { min-width: 0; flex: 1; }
    .booking-brand-copy strong,
    .booking-brand-copy span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .booking-brand-copy strong { font-size: 15px; font-weight: 600; color: #1a1a1a; letter-spacing: -.01em; }
    .booking-brand-copy span { color: #777; font-size: 12px; margin-top: 2px; font-weight: 400; }
    .booking-instagram {
      color: #555;
      text-decoration: none;
      border: 1px solid #e5e5e5;
      background: #fafafa;
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 500;
    }
    .booking-header-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .booking-header-action {
      min-height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      padding: 0 12px;
      color: #555;
      text-decoration: none;
      border: 1px solid #e5e5e5;
      background: #ffffff;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      transition: background .15s;
    }
    .booking-header-action:hover { background: #fafafa; }
    .booking-header-action.is-brand {
      border-color: var(--booking-brand);
      color: var(--booking-brand);
      background: #ffffff;
    }
    .booking-main {
      width: min(100% - 32px, 1080px);
      margin: 0 auto;
      padding-top: 32px;
      display: grid;
      grid-template-columns: minmax(280px, 360px) minmax(420px, 1fr);
      align-items: start;
      gap: 36px;
    }
    .booking-side {
      position: sticky;
      top: 88px;
      border-radius: 14px;
      padding: 24px;
      background: #fafafa;
      border: 1px solid #eeeeee;
    }
    .booking-side-content {
      display: flex;
      flex-direction: column;
    }
    .booking-side-badge {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 17px;
      font-weight: 700;
      background: var(--booking-brand);
      overflow: hidden;
    }
    .booking-side-badge img { width: 100%; height: 100%; object-fit: cover; }
    .booking-side h1 {
      margin: 18px 0 0;
      color: #111;
      font-size: 26px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: -.025em;
    }
    .booking-side p {
      margin: 8px 0 0;
      color: #777;
      font-size: 13.5px;
      line-height: 1.55;
    }
    .booking-side-meta {
      margin-top: 22px;
      display: grid;
      gap: 1px;
      background: #eeeeee;
      border-radius: 10px;
      overflow: hidden;
    }
    .booking-side-meta div {
      padding: 12px 14px;
      background: #ffffff;
    }
    .booking-side-meta span {
      display: block;
      color: #999;
      font-size: 11px;
      font-weight: 500;
    }
    .booking-side-meta strong {
      display: block;
      margin-top: 3px;
      color: #1a1a1a;
      font-size: 13px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .booking-professional {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid #eeeeee;
      margin-top: 18px;
    }
    .booking-professional-avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      flex: 0 0 auto;
      overflow: hidden;
      display: grid;
      place-items: center;
      font-size: 15px;
      font-weight: 700;
      color: #fff;
      background: var(--booking-brand);
    }
    .booking-professional-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .booking-professional-info { min-width: 0; flex: 1; }
    .booking-professional-info span {
      display: block;
      font-size: 11px;
      font-weight: 500;
      color: #999;
    }
    .booking-professional-info strong {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
      margin-top: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .booking-professional-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #22c55e;
      flex: 0 0 auto;
    }
    .booking-client-card { display: none; }
    .booking-flow {
      display: grid;
      gap: 22px;
    }
    .booking-progress {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 6px;
    }
    .booking-progress span {
      height: 3px;
      border-radius: 999px;
      background: #eeeeee;
    }
    .booking-progress span.is-active {
      background: var(--booking-brand);
    }
    .booking-title span {
      display: block;
      color: #999;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 6px;
    }
    .booking-title h1,
    .booking-title h2 {
      margin: 0;
      color: #111;
      font-size: 24px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: -.025em;
    }
    .booking-title p { margin: 6px 0 0; color: #777; font-size: 13.5px; line-height: 1.5; }
    .booking-list { display: grid; gap: 10px; }
    .booking-service {
      display: flex;
      align-items: center;
      gap: 14px;
      width: 100%;
      padding: 16px;
      border: 1px solid #eeeeee;
      border-radius: 12px;
      background: #ffffff;
      cursor: pointer;
      text-align: left;
      transition: border-color .15s, background .15s;
    }
    .booking-service:hover { border-color: #cccccc; background: #fafafa; }
    .booking-service-icon {
      width: 42px;
      height: 42px;
      flex: 0 0 auto;
      border-radius: 11px;
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      background: var(--booking-brand);
    }
    .booking-service-copy { flex: 1; min-width: 0; }
    .booking-service-copy strong,
    .booking-service-copy span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .booking-service-copy strong { color: #1a1a1a; font-size: 14.5px; font-weight: 600; }
    .booking-service-copy span { color: #888; font-size: 12.5px; margin-top: 3px; font-weight: 400; }
    .booking-price { color: #1a1a1a; font-size: 16px; font-weight: 700; white-space: nowrap; }
    .booking-back {
      min-height: 34px;
      padding: 0 14px;
      border-radius: 8px;
      border: 1px solid #e5e5e5;
      background: #ffffff;
      color: #555;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: background .15s;
    }
    .booking-back:hover { background: #fafafa; }
    .booking-step-head { display: flex; gap: 14px; align-items: flex-start; }
    .booking-date-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; }
    .booking-date,
    .booking-time {
      min-height: 70px;
      border-radius: 11px;
      border: 1px solid #eeeeee;
      background: #ffffff;
      color: #1a1a1a;
      cursor: pointer;
      display: grid;
      place-items: center;
      gap: 2px;
      padding: 8px 6px;
      transition: border-color .15s, background .15s;
    }
    .booking-date:hover,
    .booking-time:hover { border-color: #cccccc; background: #fafafa; }
    .booking-date.is-active,
    .booking-time.is-active {
      border-color: var(--booking-brand);
      background: var(--booking-brand);
      color: #ffffff;
    }
    .booking-date.is-active small,
    .booking-date.is-active em {
      color: rgba(255,255,255,.85);
    }
    .booking-date small { color: #999; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
    .booking-date strong { font-size: 20px; line-height: 1; font-weight: 700; }
    .booking-date em { color: #999; font-size: 11px; font-style: normal; font-weight: 500; }
    .booking-time-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
    .booking-time { min-height: 46px; font-size: 14.5px; font-weight: 600; }
    .booking-state {
      min-height: 160px;
      display: grid;
      place-items: center;
      text-align: center;
      color: #888;
      border-radius: 12px;
      border: 1px dashed #dddddd;
      background: #fafafa;
      padding: 24px;
      font-size: 13.5px;
    }
    .booking-summary,
    .booking-confirm-card {
      border-radius: 12px;
      padding: 16px;
      background: #fafafa;
      border: 1px solid #eeeeee;
      display: flex;
      gap: 14px;
    }
    .booking-summary-mark {
      width: 42px;
      height: 42px;
      border-radius: 11px;
      display: grid;
      place-items: center;
      background: var(--booking-brand);
      color: #fff;
      font-weight: 700;
      flex: 0 0 auto;
    }
    .booking-summary strong { color: #1a1a1a; font-size: 14.5px; font-weight: 600; }
    .booking-summary p { margin: 4px 0 0; color: #777; font-size: 12.5px; line-height: 1.5; }
    .booking-field { display: grid; gap: 6px; }
    .booking-field label {
      color: #555;
      font-size: 12.5px;
      font-weight: 500;
    }
    .booking-field input,
    .booking-field textarea {
      width: 100%;
      box-sizing: border-box;
      border-radius: 10px;
      border: 1px solid #e5e5e5;
      background: #ffffff;
      color: #1a1a1a;
      outline: none;
      font: inherit;
      transition: border-color .15s, box-shadow .15s;
    }
    .booking-field input { height: 44px; padding: 0 14px; font-size: 14.5px; }
    .booking-field textarea { min-height: 80px; resize: none; padding: 11px 14px; font-size: 14px; }
    .booking-field input:focus,
    .booking-field textarea:focus {
      border-color: var(--booking-brand);
      box-shadow: 0 0 0 3px rgba(var(--booking-rgb), .12);
    }
    .booking-primary {
      min-height: 50px;
      border: 0;
      border-radius: 12px;
      color: #fff;
      background: var(--booking-brand);
      cursor: pointer;
      font-size: 14.5px;
      font-weight: 600;
      transition: opacity .15s;
    }
    .booking-primary:hover { opacity: .92; }
    .booking-primary:disabled { cursor: default; opacity: .45; }
    .booking-error {
      border-radius: 10px;
      border: 1px solid #fecaca;
      background: #fef2f2;
      color: #b91c1c;
      padding: 11px 13px;
      font-size: 12.5px;
    }
    .booking-done { text-align: center; display: grid; gap: 18px; }
    .booking-check {
      width: 64px;
      height: 64px;
      margin: 0 auto;
      border-radius: 50%;
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 30px;
      font-weight: 700;
      background: #22c55e;
    }
    .booking-confirm-card { display: grid; gap: 10px; text-align: left; }
    .booking-confirm-card div { display: flex; justify-content: space-between; gap: 14px; font-size: 13.5px; }
    .booking-confirm-card span { color: #888; font-weight: 500; }
    .booking-confirm-card strong { color: #1a1a1a; text-align: right; font-weight: 600; }
    .booking-whatsapp {
      min-height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: #fff;
      background: #22c55e;
      font-size: 14px;
      font-weight: 600;
      transition: opacity .15s;
    }
    .booking-whatsapp:hover { opacity: .92; }
    @media (max-width: 860px) {
      .booking-main {
        width: min(100% - 28px, 540px);
        grid-template-columns: 1fr;
        padding-top: 20px;
        gap: 22px;
      }
      .booking-side {
        position: relative;
        top: auto;
        padding: 18px;
      }
      .booking-side h1 {
        font-size: 22px;
      }
      .booking-side-meta {
        margin-top: 16px;
      }
    }
    @media (max-width: 420px) {
      .booking-header { padding-inline: 14px; }
      .booking-instagram { display: none; }
      .booking-header-actions { gap: 5px; }
      .booking-header-action { padding: 0 10px; }
      .booking-header-action.is-whatsapp { display: none; }
      .booking-date-grid { grid-template-columns: repeat(3, 1fr); }
      .booking-time-grid { grid-template-columns: repeat(2, 1fr); }
      .booking-title h1, .booking-title h2 { font-size: 22px; }
      .booking-service { gap: 11px; padding: 14px; }
      .booking-price { font-size: 15px; }
    }
  `

  return (
    <main className="booking-shell">
      <style>{css}</style>
      <header className="booking-header">
        <div className="booking-logo">
          {studio.avatar_url ? <img src={studio.avatar_url} alt={studio.name} /> : studio.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="booking-brand-copy">
          <strong>{studio.name}</strong>
          <span>{studio.address || 'Agendamento online'}</span>
        </div>
        <div className="booking-header-actions">
          <a className="booking-header-action" href="/cliente/agendar/consultar">Consultar</a>
          {studio.whatsapp || studio.phone ? (
            <a className="booking-header-action is-whatsapp" href={`https://wa.me/55${(studio.whatsapp || studio.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          ) : null}
          <a className="booking-header-action is-brand" href="/login">Entrar</a>
          {studio.instagram && (
            <a className="booking-instagram" href={`https://instagram.com/${studio.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
              {studio.instagram}
            </a>
          )}
        </div>
      </header>

      <section className="booking-main">
        <aside className="booking-side">
          <div className="booking-side-content">
            <div className="booking-side-badge">
              {studio.avatar_url ? <img src={studio.avatar_url} alt={studio.name} /> : studio.name.slice(0, 2).toUpperCase()}
            </div>
            <h1>{studio.name}</h1>
            <p>{professional ? `Agendamento com ${professional.name}.` : 'Escolha o serviço, encontre um horário disponível e confirme seu agendamento online.'}</p>

            {professional && (
              <div className="booking-professional">
                <div className="booking-professional-avatar">
                  {professional.avatar_url
                    ? <img src={professional.avatar_url} alt={professional.name} />
                    : professional.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="booking-professional-info">
                  <span>Sua manicure</span>
                  <strong>{professional.name}</strong>
                </div>
                <div className="booking-professional-dot" />
              </div>
            )}
            <div className="booking-client-card">
              <span>Cliente</span>
              <strong>Agende sem criar conta</strong>
              <p>Informe seu nome e WhatsApp no último passo. Depois do envio, você recebe uma confirmação com os dados do horário.</p>
              <div className="booking-client-actions">
                <a href="/login">Entrar</a>
                {(studio.whatsapp || studio.phone) && (
                  <a href={`https://wa.me/55${(studio.whatsapp || studio.phone || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                    Falar no WhatsApp
                  </a>
                )}
              </div>
            </div>
            <div className="booking-side-meta">
              <div>
                <span>Serviços</span>
                <strong>{services.length} disponíveis</strong>
              </div>
              <div>
                <span>Endereço</span>
                <strong>{studio.address || 'Consulte o studio'}</strong>
              </div>
              <div>
                <span>Contato</span>
                <strong>{studio.phone || studio.whatsapp || 'WhatsApp do studio'}</strong>
              </div>
            </div>
          </div>
        </aside>

        <div className="booking-flow">
        {step !== 'done' && <StepBar step={step} />}

        {step === 'service' && (
          <>
            <div className="booking-title">
              <span>Agendar horário</span>
              <h1>Escolha o serviço</h1>
              <p>{services.length} serviços disponíveis para este studio.</p>
            </div>
            <div className="booking-list">
              {services.length === 0 ? (
                <div className="booking-state">Nenhum serviço disponível no momento.</div>
              ) : services.map((service) => (
                <button
                  key={service.id}
                  className="booking-service"
                  onClick={() => {
                    setSelectedService(service)
                    setSelectedDate('')
                    setSelectedTime('')
                    setSlots([])
                    setSlotError('')
                    setBookingError('')
                    setCreatedAppointment(null)
                    setStep('date')
                  }}
                >
                  <span className="booking-service-icon">{service.name.slice(0, 1).toUpperCase()}</span>
                  <span className="booking-service-copy">
                    <strong>{service.name}</strong>
                    <span>{service.description || `${service.duration_minutes} min${service.category ? ` · ${service.category}` : ''}`}</span>
                  </span>
                  <span className="booking-price">{money(service.price)}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'date' && selectedService && (
          <>
            <div className="booking-step-head">
              <button className="booking-back" onClick={() => setStep('service')}>Voltar</button>
              <div className="booking-title">
                <span>{selectedService.name}</span>
                <h2>Escolha a data</h2>
                <p>Mostramos apenas dias abertos para agendamento.</p>
              </div>
            </div>
            <div className="booking-date-grid">
              {availableDates.slice(0, 28).map((date) => {
                const parsed = new Date(date + 'T00:00')
                const active = date === selectedDate
                return (
                  <button
                    key={date}
                    className={`booking-date ${active ? 'is-active' : ''}`}
                    onClick={() => {
                      setSelectedDate(date)
                      setSelectedTime('')
                      setSlots([])
                      setStep('time')
                      void fetchSlots(date, selectedService)
                    }}
                  >
                    <small>{weekdays[parsed.getDay()]}</small>
                    <strong>{parsed.getDate()}</strong>
                    <em>{parsed.toLocaleDateString('pt-BR', { month: 'short' })}</em>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 'time' && selectedService && (
          <>
            <div className="booking-step-head">
              <button className="booking-back" onClick={() => setStep('date')}>Voltar</button>
              <div className="booking-title">
                <span>{formatDate(selectedDate)}</span>
                <h2>Escolha o horário</h2>
                <p>{selectedService.name}</p>
              </div>
            </div>
            {loadingSlots ? (
              <div className="booking-state">Carregando horários...</div>
            ) : slotError ? (
              <div className="booking-state">
                <div>
                  <p>{slotError}</p>
                  <button className="booking-back" onClick={() => void fetchSlots(selectedDate, selectedService)}>Tentar novamente</button>
                </div>
              </div>
            ) : slots.length === 0 ? (
              <div className="booking-state">
                <div>
                  <p>Sem horários disponíveis neste dia.</p>
                  <button className="booking-back" onClick={() => setStep('date')}>Escolher outro dia</button>
                </div>
              </div>
            ) : (
              <div className="booking-time-grid">
                {slots.map((time) => (
                  <button
                    key={time}
                    className={`booking-time ${time === selectedTime ? 'is-active' : ''}`}
                    onClick={() => {
                      setSelectedTime(time)
                      setStep('info')
                    }}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 'info' && selectedService && (
          <>
            <div className="booking-step-head">
              <button className="booking-back" onClick={() => setStep('time')}>Voltar</button>
              <div className="booking-title">
                <span>Último passo</span>
                <h2>Seus dados</h2>
                <p>Confirme suas informações para reservar o horário.</p>
              </div>
            </div>
            <div className="booking-summary">
              <span className="booking-summary-mark">{selectedService.name.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{selectedService.name}</strong>
                <p>{formatDate(selectedDate)} às {selectedTime} · {money(selectedService.price)}</p>
              </div>
            </div>
            <div className="booking-field">
              <label>Nome completo</label>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Ana Silva" />
            </div>
            <div className="booking-field">
              <label>WhatsApp</label>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(66) 99999-0000" inputMode="tel" />
            </div>
            <div className="booking-field">
              <label>Observações (opcional)</label>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Alergias, preferências de esmalte..." />
            </div>
            <button className="booking-primary" onClick={submit} disabled={loading || !name.trim() || !phone.trim()}>
              {loading ? 'Confirmando...' : 'Confirmar agendamento'}
            </button>
            {bookingError && <div className="booking-error">{bookingError}</div>}
          </>
        )}

        {step === 'done' && (
          <div className="booking-done">
            <div className="booking-check">✓</div>
            <div className="booking-title">
              <span>Agendamento confirmado</span>
              <h1>Tudo certo</h1>
              <p>Seu horário foi registrado no sistema do studio.</p>
            </div>
            <div className="booking-confirm-card">
              <div><span>Cliente</span><strong>{createdAppointment?.client_name || name}</strong></div>
              <div><span>Serviço</span><strong>{createdAppointment?.service_name || selectedService?.name}</strong></div>
              {professional && <div><span>Manicure</span><strong>{professional.name}</strong></div>}
              <div><span>Data</span><strong>{createdAppointment ? formatDateTime(createdAppointment.appointment_date) : `${selectedDate} ${selectedTime}`}</strong></div>
              <div><span>Valor</span><strong>{money((createdAppointment?.price ?? selectedService?.price) || 0)}</strong></div>
            </div>
            {studio.whatsapp && <a className="booking-whatsapp" href={whatsappLink()} target="_blank" rel="noreferrer">Falar no WhatsApp</a>}
            <button className="booking-back" onClick={reset}>Fazer outro agendamento</button>
          </div>
        )}
        </div>
      </section>
    </main>
  )
}
