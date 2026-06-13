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

export default function AgendarClient({ studio, services, settings }: { studio: Studio; services: Service[]; settings: Settings }) {
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
      color: #f7f4ff;
      background:
        radial-gradient(720px circle at 50% -140px, rgba(var(--booking-rgb), .28), transparent 68%),
        linear-gradient(180deg, rgba(var(--booking-rgb), .06), transparent 360px),
        #080812;
      font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding-bottom: 34px;
    }
    .booking-header {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 13px;
      min-height: 76px;
      padding: 14px 18px;
      background: rgba(8, 8, 18, .86);
      border-bottom: 1px solid rgba(255,255,255,.08);
      backdrop-filter: blur(18px);
    }
    .booking-logo {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      overflow: hidden;
      color: #fff;
      font-weight: 860;
      background: linear-gradient(145deg, var(--booking-brand), rgba(0,0,0,.38));
      box-shadow: 0 10px 26px rgba(var(--booking-rgb), .32);
      border: 1px solid rgba(255,255,255,.14);
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
    .booking-brand-copy strong { font-size: 15px; font-weight: 820; }
    .booking-brand-copy span { color: #958eaa; font-size: 12px; margin-top: 3px; }
    .booking-instagram {
      color: #e9ddff;
      text-decoration: none;
      border: 1px solid rgba(var(--booking-rgb), .34);
      background: rgba(var(--booking-rgb), .12);
      border-radius: 10px;
      padding: 7px 10px;
      font-size: 11px;
      font-weight: 780;
    }
    .booking-header-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .booking-header-action {
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      padding: 0 12px;
      color: #e9ddff;
      text-decoration: none;
      border: 1px solid rgba(255,255,255,.11);
      background: rgba(255,255,255,.04);
      font-size: 11px;
      font-weight: 800;
      white-space: nowrap;
    }
    .booking-header-action.is-brand {
      border-color: rgba(var(--booking-rgb), .34);
      background: rgba(var(--booking-rgb), .13);
    }
    .booking-main {
      width: min(100% - 28px, 1080px);
      margin: 0 auto;
      padding-top: 28px;
      display: grid;
      grid-template-columns: minmax(300px, 390px) minmax(420px, 1fr);
      align-items: start;
      gap: 28px;
    }
    .booking-side {
      position: sticky;
      top: 100px;
      min-height: 560px;
      border-radius: 18px;
      padding: 24px;
      overflow: hidden;
      background:
        linear-gradient(180deg, rgba(var(--booking-rgb), .18), rgba(255,255,255,.035)),
        rgba(255,255,255,.035);
      border: 1px solid rgba(255,255,255,.09);
      box-shadow: 0 24px 70px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.04);
    }
    .booking-side:before {
      content: "";
      position: absolute;
      inset: auto -80px -90px auto;
      width: 220px;
      height: 220px;
      border-radius: 50%;
      background: rgba(var(--booking-rgb), .18);
      filter: blur(8px);
    }
    .booking-side-content {
      position: relative;
      z-index: 1;
      min-height: 512px;
      display: flex;
      flex-direction: column;
    }
    .booking-side-badge {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 18px;
      font-weight: 880;
      background: linear-gradient(145deg, var(--booking-brand), rgba(0,0,0,.34));
      border: 1px solid rgba(255,255,255,.16);
      box-shadow: 0 16px 36px rgba(var(--booking-rgb), .28);
      overflow: hidden;
    }
    .booking-side-badge img { width: 100%; height: 100%; object-fit: cover; }
    .booking-side h1 {
      margin: 28px 0 0;
      max-width: 9ch;
      color: #fff;
      font-size: 42px;
      line-height: .96;
      font-weight: 900;
      letter-spacing: 0;
    }
    .booking-side p {
      margin: 15px 0 0;
      color: #b9b1cc;
      font-size: 14px;
      line-height: 1.6;
    }
    .booking-side-meta {
      margin-top: auto;
      display: grid;
      gap: 9px;
    }
    .booking-client-card {
      margin-top: 18px;
      border-radius: 14px;
      padding: 14px;
      background: rgba(8,8,18,.38);
      border: 1px solid rgba(255,255,255,.09);
    }
    .booking-client-card span {
      display: block;
      color: color-mix(in srgb, var(--booking-brand), white 34%);
      font-size: 10px;
      font-weight: 840;
      letter-spacing: .1em;
      text-transform: uppercase;
    }
    .booking-client-card strong {
      display: block;
      margin-top: 7px;
      color: #fff;
      font-size: 15px;
    }
    .booking-client-card p {
      margin: 6px 0 12px;
      color: #a9a1bc;
      font-size: 12px;
      line-height: 1.5;
    }
    .booking-client-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .booking-client-actions a {
      min-height: 34px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      padding: 0 12px;
      color: #f7f4ff;
      text-decoration: none;
      font-size: 11px;
      font-weight: 800;
      border: 1px solid rgba(255,255,255,.11);
      background: rgba(255,255,255,.045);
    }
    .booking-client-actions a:first-child {
      border-color: rgba(var(--booking-rgb), .34);
      background: rgba(var(--booking-rgb), .13);
    }
    .booking-side-meta div {
      min-height: 42px;
      border-radius: 12px;
      padding: 10px 12px;
      background: rgba(255,255,255,.055);
      border: 1px solid rgba(255,255,255,.08);
    }
    .booking-side-meta span {
      display: block;
      color: #8f88a4;
      font-size: 10px;
      font-weight: 820;
      text-transform: uppercase;
      letter-spacing: .1em;
    }
    .booking-side-meta strong {
      display: block;
      margin-top: 4px;
      color: #f7f4ff;
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .booking-flow {
      display: grid;
      gap: 18px;
    }
    .booking-progress { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
    .booking-progress span {
      height: 4px;
      border-radius: 999px;
      background: rgba(255,255,255,.09);
    }
    .booking-progress span.is-active {
      background: linear-gradient(90deg, var(--booking-brand), color-mix(in srgb, var(--booking-brand), white 34%));
      box-shadow: 0 0 18px rgba(var(--booking-rgb), .28);
    }
    .booking-title span {
      display: block;
      color: color-mix(in srgb, var(--booking-brand), white 36%);
      font-size: 11px;
      font-weight: 840;
      letter-spacing: .13em;
      text-transform: uppercase;
      margin-bottom: 7px;
    }
    .booking-title h1,
    .booking-title h2 {
      margin: 0;
      color: #fff;
      font-size: 28px;
      line-height: 1.06;
      font-weight: 880;
      letter-spacing: 0;
    }
    .booking-title p { margin: 7px 0 0; color: #958eaa; font-size: 13px; line-height: 1.5; }
    .booking-list { display: grid; gap: 11px; }
    .booking-service {
      display: flex;
      align-items: center;
      gap: 13px;
      width: 100%;
      padding: 15px;
      border: 1px solid rgba(255,255,255,.09);
      border-radius: 14px;
      background: linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.026));
      box-shadow: 0 18px 42px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.04);
      cursor: pointer;
      text-align: left;
    }
    .booking-service:hover { border-color: rgba(var(--booking-rgb), .4); }
    .booking-service-icon {
      width: 44px;
      height: 44px;
      flex: 0 0 auto;
      border-radius: 13px;
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 15px;
      font-weight: 860;
      background: rgba(var(--booking-rgb), .15);
      border: 1px solid rgba(var(--booking-rgb), .24);
    }
    .booking-service-copy { flex: 1; min-width: 0; }
    .booking-service-copy strong,
    .booking-service-copy span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .booking-service-copy strong { color: #f7f4ff; font-size: 14px; font-weight: 820; }
    .booking-service-copy span { color: #958eaa; font-size: 11.5px; margin-top: 4px; }
    .booking-price { color: #45dda1; font-size: 18px; font-weight: 880; white-space: nowrap; }
    .booking-back {
      min-height: 36px;
      padding: 0 12px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.035);
      color: #b9b1cc;
      cursor: pointer;
      font-weight: 720;
    }
    .booking-step-head { display: flex; gap: 11px; align-items: flex-start; }
    .booking-date-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; }
    .booking-date,
    .booking-time {
      min-height: 74px;
      border-radius: 13px;
      border: 1px solid rgba(255,255,255,.09);
      background: rgba(255,255,255,.035);
      color: #f7f4ff;
      cursor: pointer;
      display: grid;
      place-items: center;
      gap: 2px;
      padding: 8px 6px;
    }
    .booking-date.is-active,
    .booking-time.is-active {
      border-color: rgba(var(--booking-rgb), .5);
      background: rgba(var(--booking-rgb), .15);
      color: color-mix(in srgb, var(--booking-brand), white 34%);
    }
    .booking-date small { color: #958eaa; font-size: 9px; font-weight: 820; text-transform: uppercase; }
    .booking-date strong { font-size: 20px; line-height: 1; }
    .booking-date em { color: #958eaa; font-size: 10px; font-style: normal; }
    .booking-time-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
    .booking-time { min-height: 48px; font-size: 15px; font-weight: 820; }
    .booking-state {
      min-height: 180px;
      display: grid;
      place-items: center;
      text-align: center;
      color: #958eaa;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(255,255,255,.025);
      padding: 24px;
    }
    .booking-summary,
    .booking-confirm-card {
      border-radius: 14px;
      padding: 16px;
      background: rgba(var(--booking-rgb), .11);
      border: 1px solid rgba(var(--booking-rgb), .25);
      display: flex;
      gap: 13px;
    }
    .booking-summary-mark {
      width: 42px;
      height: 42px;
      border-radius: 13px;
      display: grid;
      place-items: center;
      background: rgba(var(--booking-rgb), .2);
      color: #fff;
      font-weight: 860;
      flex: 0 0 auto;
    }
    .booking-summary strong { color: #f7f4ff; font-size: 14px; }
    .booking-summary p { margin: 5px 0 0; color: #b5aec8; font-size: 12px; line-height: 1.45; }
    .booking-field { display: grid; gap: 6px; }
    .booking-field label {
      color: #958eaa;
      font-size: 10px;
      font-weight: 840;
      letter-spacing: .11em;
      text-transform: uppercase;
    }
    .booking-field input,
    .booking-field textarea {
      width: 100%;
      box-sizing: border-box;
      border-radius: 13px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.055);
      color: #f7f4ff;
      outline: none;
      font: inherit;
    }
    .booking-field input { height: 46px; padding: 0 14px; }
    .booking-field textarea { min-height: 88px; resize: none; padding: 12px 14px; }
    .booking-field input:focus,
    .booking-field textarea:focus { border-color: rgba(var(--booking-rgb), .55); box-shadow: 0 0 0 3px rgba(var(--booking-rgb), .14); }
    .booking-primary {
      min-height: 50px;
      border: 0;
      border-radius: 14px;
      color: #fff;
      background: linear-gradient(135deg, color-mix(in srgb, var(--booking-brand), white 32%), var(--booking-brand));
      box-shadow: 0 12px 30px rgba(var(--booking-rgb), .34);
      cursor: pointer;
      font-weight: 840;
    }
    .booking-primary:disabled { cursor: default; opacity: .58; }
    .booking-error {
      border-radius: 12px;
      border: 1px solid rgba(248,113,113,.28);
      background: rgba(248,113,113,.1);
      color: #fca5a5;
      padding: 11px 12px;
      font-size: 12px;
    }
    .booking-done { text-align: center; display: grid; gap: 18px; }
    .booking-check {
      width: 72px;
      height: 72px;
      margin: 0 auto;
      border-radius: 50%;
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 32px;
      background: rgba(var(--booking-rgb), .16);
      border: 1px solid rgba(var(--booking-rgb), .34);
    }
    .booking-confirm-card { display: grid; gap: 10px; text-align: left; }
    .booking-confirm-card div { display: flex; justify-content: space-between; gap: 14px; font-size: 13px; }
    .booking-confirm-card span { color: #a9a1bc; }
    .booking-confirm-card strong { color: #f7f4ff; text-align: right; }
    .booking-whatsapp {
      min-height: 50px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: #fff;
      background: linear-gradient(135deg, #25d366, #128c7e);
      font-weight: 840;
    }
    @media (max-width: 860px) {
      .booking-main {
        width: min(100% - 22px, 520px);
        grid-template-columns: 1fr;
        padding-top: 18px;
      }
      .booking-side {
        position: relative;
        top: auto;
        min-height: 0;
        padding: 18px;
      }
      .booking-side-content { min-height: 0; }
      .booking-side h1 {
        max-width: none;
        font-size: 28px;
        margin-top: 14px;
      }
      .booking-side p { font-size: 13px; }
      .booking-side-meta {
        margin-top: 16px;
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 420px) {
      .booking-header { padding-inline: 14px; }
      .booking-instagram { display: none; }
      .booking-header-actions { gap: 6px; }
      .booking-header-action { padding: 0 9px; }
      .booking-header-action.is-whatsapp { display: none; }
      .booking-date-grid { grid-template-columns: repeat(3, 1fr); }
      .booking-time-grid { grid-template-columns: repeat(2, 1fr); }
      .booking-title h1, .booking-title h2 { font-size: 24px; }
      .booking-service { align-items: flex-start; }
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
            <p>Escolha o serviço, encontre um horário disponível e confirme seu agendamento online.</p>
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
