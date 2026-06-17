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

function getMapsUrl(studio: Studio) {
  if (studio.slug === 'tessy-nails') return 'https://maps.app.goo.gl/kg9QsK72y4eAaNPL8'
  if (!studio.address) return ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(studio.address)}`
}

function dateLabel(value: string) {
  const date = new Date(value + 'T00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000)
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Amanhã'
  return weekdays[date.getDay()]
}

function groupSlotsByPeriod(values: string[]) {
  return [
    { label: 'Manhã', slots: values.filter((time) => Number(time.slice(0, 2)) < 12) },
    { label: 'Tarde', slots: values.filter((time) => Number(time.slice(0, 2)) >= 12 && Number(time.slice(0, 2)) < 18) },
    { label: 'Noite', slots: values.filter((time) => Number(time.slice(0, 2)) >= 18) },
  ].filter((group) => group.slots.length > 0)
}

function isFeaturedService(service: Service, index: number) {
  const name = service.name.toLowerCase()
  return name.includes('manicure em gel') || (index === 0 && name.includes('manicure'))
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
  const [phoneMasked, setPhoneMasked] = useState('')

  function applyPhoneMask(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    let masked = digits
    if (digits.length > 2)  masked = '(' + digits.slice(0,2) + ') ' + digits.slice(2)
    if (digits.length > 7)  masked = '(' + digits.slice(0,2) + ') ' + digits.slice(2,7) + '-' + digits.slice(7)
    return { masked, raw: digits }
  }

  function handlePhoneChange(value: string) {
    const { masked, raw } = applyPhoneMask(value)
    setPhoneMasked(masked)
    setPhone(raw)
  }
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slotError, setSlotError] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [createdAppointment, setCreatedAppointment] = useState<CreatedAppointment | null>(null)

  const workingHours = settings?.working_hours || {}
  const advanceDays = settings?.advance_days || 30
  const mapsUrl = getMapsUrl(studio)
  const slotGroups = groupSlotsByPeriod(slots)
  const availableDates: string[] = []
  const todayYmd = localYmd(new Date())

  for (let i = 0; i < advanceDays; i++) {
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() + i)
    const ymd = localYmd(date)
    const config = workingHours[weekdayKeys[date.getDay()]]
    if (config?.is_open) availableDates.push(ymd)
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
    if (!selectedService || !selectedDate || !selectedTime || !name.trim() || phone.length < 10) return

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
      router.replace(`/cliente/agendar/sucesso?appointmentId=${encodeURIComponent(appointment.id)}&slug=${encodeURIComponent(studio.slug)}`)

      // Abre WhatsApp da Tessy com resumo do agendamento
      const tessyPhone = data?.studioPhone as string | undefined
      if (tessyPhone) {
        const aptDate = new Date(`${selectedDate}T${selectedTime}:00`)
        const hoje = new Date(); hoje.setHours(0,0,0,0)
        const diffDays = Math.round((new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate()).getTime() - hoje.getTime()) / 86400000)
        const quando = diffDays === 0 ? 'hoje' : diffDays === 1 ? 'amanhã' : aptDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
        const hora = aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        const clienteNome = name.trim().split(' ')[0]
        const msg = `💅 *Nova reserva!*\n\n👤 *${name.trim()}*\n✂️ ${selectedService?.name}\n📅 ${quando} às ${hora}\n📱 ${phone.trim()}\n\nResponda *CONFIRMAR* ou *RECUSAR*`
        const number = tessyPhone.replace(/\D/g, '')
        window.open('https://wa.me/55' + number + '?text=' + encodeURIComponent(msg), '_blank')
      }
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
      background: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
      padding-bottom: 60px;
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
      background: rgba(255,255,255,.9);
      border-bottom: 1px solid #eeeeee;
      backdrop-filter: saturate(180%) blur(14px);
    }
    .booking-logo {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      overflow: hidden;
      color: #fff;
      font-weight: 700;
      font-size: 15px;
      background: var(--booking-brand);
      flex: 0 0 auto;
      border: 2px solid rgba(0,0,0,0.06);
      box-shadow: 0 2px 8px rgba(0,0,0,0.10);
    }
    .booking-logo img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
    .booking-brand-copy { min-width: 0; flex: 1; }
    .booking-brand-copy strong {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 15px;
      font-weight: 700;
      color: #1a1a1a;
      letter-spacing: -.01em;
    }
    .booking-brand-copy span {
      display: block;
      color: #22c55e;
      font-size: 11px;
      margin-top: 1px;
      font-weight: 500;
    }
    .booking-brand-address { display: none; }
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
      color: var(--booking-brand);
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: .08em;
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
      border-radius: 10px;
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
    .booking-time-groups {
      display: grid;
      gap: 18px;
    }
    .booking-time-group {
      display: grid;
      gap: 9px;
    }
    .booking-time-label {
      color: #555;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
    }
    .booking-state {
      min-height: 160px;
      display: grid;
      place-items: center;
      text-align: center;
      color: #888;
      border-radius: 10px;
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
    .booking-field-help {
      color: #888;
      font-size: 12px;
      line-height: 1.45;
      margin: -1px 0 0;
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
    .booking-done-avatar {
      width: 78px;
      height: 78px;
      margin: 0 auto -4px;
      border-radius: 50%;
      overflow: hidden;
      display: grid;
      place-items: center;
      color: #fff;
      font-weight: 700;
      background: var(--booking-brand);
      border: 4px solid #ffffff;
      box-shadow: 0 14px 34px rgba(20,20,20,.12);
    }
    .booking-done-avatar img { width: 100%; height: 100%; object-fit: cover; }
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
    .booking-map-link {
      min-height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: var(--booking-brand);
      background: rgba(var(--booking-rgb), .08);
      border: 1px solid rgba(var(--booking-rgb), .16);
      font-size: 14px;
      font-weight: 600;
    }
    /* ─── HERO ROSÉ PREMIUM ─── */
    .booking-hero {
      text-align: center;
      padding: 0 0 24px;
      background: transparent;
    }
    .booking-hero-cover { display: none; }
    .booking-hero-cover-overlay { display: none; }
    .booking-hero-cover-text { display: none; }
    .booking-hero-badge-pill { display: none; }
    .booking-hero-badge-dot { display: none; }
    .booking-hero-badge-text { display: none; }
    .booking-hero-badge { display: none; }

    /* Fundo gradiente rosé atrás do avatar */
    .booking-hero-bg {
      background: linear-gradient(180deg, #fdf0f4 0%, #fefbfc 100%);
      padding: 36px 24px 48px;
      position: relative;
      overflow: hidden;
    }
    .booking-hero-bg::before {
      content: '';
      position: absolute;
      top: -30px; right: -40px;
      width: 180px; height: 180px;
      border-radius: 50%;
      background: rgba(255,255,255,.25);
    }
    .booking-hero-bg::after {
      content: '';
      position: absolute;
      bottom: 10px; left: -50px;
      width: 160px; height: 160px;
      border-radius: 50%;
      background: rgba(255,255,255,.18);
    }

    /* Avatar */
    .booking-hero-avatar-wrap {
      display: block;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }
    .booking-hero-avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      margin: 0 auto;
      overflow: hidden;
      border: 4px solid #fff !important;
      box-shadow: 0 8px 32px rgba(220,80,120,.20);
      background: #e8a0b8;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 36px;
      font-weight: 700;
    }
    .booking-hero-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 10%;
    }
    .booking-hero-avatar-online {
      position: absolute;
      bottom: 6px;
      right: calc(50% - 60px + 8px);
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #22c55e;
      border: 2.5px solid #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,.15);
      z-index: 2;
    }

    .booking-hero-name {
      font-size: clamp(26px, 6vw, 34px);
      font-weight: 800;
      color: #1a0a12;
      letter-spacing: -.04em;
      margin: 0 0 4px;
      line-height: 1.05;
      position: relative;
      z-index: 1;
    }
    .booking-hero-name em {
      font-style: italic;
      font-weight: 400;
      font-family: Georgia, 'Times New Roman', serif;
      color: var(--booking-brand);
    }
    .booking-hero-role {
      font-size: 13px;
      color: #8b5a6e;
      margin: 0;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }
    .booking-hero-rating {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 12px;
      padding: 5px 12px;
      background: #fef9c3;
      border-radius: 999px;
      font-size: 12.5px;
      font-weight: 500;
      color: #854d0e;
    }
    /* Online pill + info pills */
    .booking-hero-pills {
      display: flex;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
      padding: 0 16px;
      margin: 14px 0 0;
    }
    .booking-hero-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 28px;
      padding: 0 11px;
      border-radius: 999px;
      background: #fff;
      border: 1px solid #eedce4;
      color: #8b5a6e;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
    }
    .booking-hero-pill-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #22c55e;
      flex-shrink: 0;
    }
    .booking-hero-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: #fff;
      border-top: 0.5px solid #f5e6eb;
      cursor: pointer;
      text-decoration: none;
      color: #555;
      font-size: 12px;
    }
    .booking-hero-info span,
    .booking-hero-info a {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: #fff;
      border-top: 0.5px solid #f5e6eb;
      text-decoration: none;
      color: #555;
      font-size: 12px;
      width: 100%;
    }
    .booking-hero-info-addr {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: #fff;
      border-top: 0.5px solid #f5e6eb;
      border-bottom: 0.5px solid #f5e6eb;
      text-decoration: none;
      color: #444;
      font-size: 12px;
      font-weight: 500;
      transition: background .15s;
    }
    .booking-hero-info-addr:hover { background: #fff9fb; }
    .booking-hero-info-addr::after {
      content: '›';
      margin-left: auto;
      font-size: 16px;
      color: #ccc;
    }
    .booking-hero-info a {
      color: #666;
      text-decoration: none;
    }
    .booking-hero-info a:hover { color: var(--booking-brand); }
    .booking-hero-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 20px 0;
    }
    .booking-hero-cta {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 50px;
      border-radius: 14px;
      background: var(--booking-brand) !important;
      color: #fff !important;
      text-decoration: none;
      font-size: 15px;
      font-weight: 700;
      white-space: nowrap;
      transition: opacity .15s, transform .1s;
      box-shadow: 0 4px 16px rgba(var(--booking-rgb), .25);
    }
    .booking-hero-cta:hover { opacity: .92; }
    .booking-hero-cta:active { transform: scale(.98); }
    .booking-hero-whatsapp {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 50px;
      padding: 0 16px;
      border-radius: 14px;
      background: #fff;
      border: 1.5px solid #25D366;
      color: #25D366;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      white-space: nowrap;
      transition: background .15s, transform .1s;
    }
    .booking-hero-whatsapp:hover { background: #f0fff4; }
    .booking-hero-whatsapp:active { transform: scale(0.98); }
    .booking-hero-icon-btn {
      width: 50px; height: 50px;
      border-radius: 14px;
      background: #fff;
      border: 1px solid #eedce4;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      text-decoration: none;
      transition: background .15s;
    }
    .booking-hero-icon-btn:hover { background: #fff5f8; }
    .booking-client-access {
      margin: 14px 20px 0;
      border: 1px solid #f0d8e2;
      background: #fff;
      border-radius: 14px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #1a0a12;
      transition: background .15s, transform .12s;
    }
    .booking-client-access:hover { background: #fff5f8; transform: translateY(-1px); }
    .booking-client-access:active { transform: scale(.99); }
    .booking-client-access-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      background: #fce4ef;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }
    .booking-client-access-body { flex: 1; min-width: 0; }
    .booking-client-access span {
      display: block;
      color: var(--booking-brand);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .1em;
      margin-bottom: 2px;
    }
    .booking-client-access strong {
      display: block;
      font-size: 14px;
      font-weight: 700;
      color: #1a0a12;
    }
    .booking-client-access-arrow {
      flex: 0 0 auto;
      width: 30px; height: 30px;
      border-radius: 50%;
      background: var(--booking-brand);
      color: #fff !important;
      display: grid;
      place-items: center;
      font-size: 14px;
      font-weight: 700;
    }

    /* ─── SEÇÃO GENÉRICA ─── */
    .booking-section {
      padding: 24px 20px;
      border-top: 1px solid #f5edf0;
      background: #ffffff;
    }
    .booking-section-title {
      font-size: 11px;
      font-weight: 800;
      color: var(--booking-brand);
      margin: 0 0 16px;
      text-transform: uppercase;
      letter-spacing: .14em;
      display: flex;
      align-items: center;
      gap: 7px;
    }

    /* ─── GALERIA ─── */
    .booking-gallery {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .booking-gallery-item {
      aspect-ratio: 1;
      border-radius: 10px;
      background: #f4f4f5;
      overflow: hidden;
    }
    .booking-gallery-item img { width: 100%; height: 100%; object-fit: cover; }
    .booking-gallery-empty {
      grid-column: 1 / -1;
      padding: 24px;
      text-align: center;
      color: #999;
      font-size: 13px;
      border: 1px dashed #e5e5e5;
      border-radius: 10px;
    }

    /* ─── SERVIÇO CARD PREMIUM ─── */
    .booking-svc-card {
      border: 1px solid #f0e8ed;
      border-radius: 16px;
      padding: 0;
      background: #ffffff;
      cursor: pointer;
      text-align: left;
      transition: border-color .2s, transform .15s, box-shadow .2s;
      width: 100%;
      display: block;
      margin-bottom: 10px;
      box-shadow: 0 2px 12px rgba(194,24,91,.04);
      overflow: hidden;
    }
    .booking-svc-card:hover {
      border-color: rgba(var(--booking-rgb), .4);
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(194,24,91,.10);
    }
    .booking-svc-card:active { transform: scale(.99); }
    .booking-svc-card.is-featured {
      border-width: 1.5px;
      border-color: var(--booking-brand);
      box-shadow: 0 6px 24px rgba(var(--booking-rgb), .12);
    }
    .booking-svc-card-inner {
      padding: 16px 18px;
    }
    .booking-svc-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      background: rgba(var(--booking-rgb), .10);
      color: var(--booking-brand);
      border-radius: 999px;
      font-size: 10.5px;
      font-weight: 700;
      margin-bottom: 10px;
      letter-spacing: .02em;
    }
    .booking-svc-name {
      font-size: 15px;
      font-weight: 700;
      color: #1a0a12;
      margin: 0;
      letter-spacing: -.01em;
      line-height: 1.3;
    }
    .booking-svc-meta {
      font-size: 12px;
      color: #b08a9a;
      margin: 3px 0 0;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .booking-svc-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid #faf0f4;
    }
    .booking-svc-price {
      font-size: 20px;
      font-weight: 800;
      color: var(--booking-brand);
      letter-spacing: -.02em;
    }
    .booking-svc-price-label {
      font-size: 11px;
      color: #c0a0b0;
      font-weight: 500;
      display: block;
      margin-bottom: 1px;
    }
    .booking-svc-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 22px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      background: var(--booking-brand) !important;
      color: #ffffff !important;
      transition: opacity .15s, transform .1s;
      flex-shrink: 0;
      letter-spacing: .01em;
    }
    .booking-svc-btn:hover { opacity: .9; }
    .booking-svc-btn:active { transform: scale(.97); }

    /* ─── HORÁRIO ─── */
    .booking-hours {
      font-size: 13px;
      color: #666;
      display: grid;
      gap: 2px;
    }
    .booking-hours-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 14px;
      border-radius: 10px;
      background: #fafafa;
      border: 0.5px solid #f0e8ed;
    }
    .booking-hours-row span { font-weight: 500; color: #888; font-size: 12.5px; }
    .booking-hours-row strong {
      color: #1a0a12;
      font-weight: 700;
      font-size: 12.5px;
    }
    .booking-hours-row.closed { opacity: .5; }
    .booking-hours-row.closed strong { color: #999; font-weight: 500; }

    /* ─── COMO FUNCIONA ─── */
    .booking-howto {
      background: #fff9fb;
    }
    .booking-howto-step {
      display: flex;
      gap: 14px;
      align-items: center;
      padding: 12px 14px;
      border-radius: 12px;
      background: #fff;
      border: 0.5px solid #f0e8ed;
      margin-bottom: 8px;
    }
    .booking-howto-step:last-child { margin-bottom: 0; }
    .booking-howto-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--booking-brand);
      color: #fff;
      display: grid;
      place-items: center;
      font-size: 12px;
      font-weight: 800;
      flex-shrink: 0;
    }
    .booking-howto-text {
      font-size: 13.5px;
      font-weight: 600;
      color: #2d0a1a;
    }

    /* ─── RESUMO STICKY DURANTE FLUXO ─── */
    .booking-summary-sticky {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: end;
      gap: 12px;
      padding: 15px 16px;
      background: #ffffff;
      border: 1px solid rgba(var(--booking-rgb), .14);
      border-radius: 10px;
      margin-bottom: 18px;
      box-shadow: 0 14px 34px rgba(20,20,20,.06);
    }
    .booking-summary-label {
      grid-column: 1 / -1;
      color: var(--booking-brand);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .1em;
      text-transform: uppercase;
    }
    .booking-summary-sticky-info {
      flex: 1;
      min-width: 0;
    }
    .booking-summary-sticky-name {
      font-size: 13.5px;
      font-weight: 700;
      color: #1a1a1a;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .booking-summary-sticky-meta {
      font-size: 11.5px;
      color: #888;
      margin-top: 2px;
    }
    .booking-summary-sticky-when {
      text-align: right;
      flex-shrink: 0;
    }
    .booking-summary-sticky-when strong {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--booking-brand);
      text-transform: capitalize;
    }
    .booking-summary-sticky-when span {
      display: block;
      font-size: 11.5px;
      color: #888;
      margin-top: 1px;
    }
    .booking-trust-note {
      color: #888;
      font-size: 12px;
      line-height: 1.45;
      margin-top: -4px;
    }

    /* ─── INDICADOR DE PASSO ─── */
    .booking-step-indicator {
      margin-bottom: 18px;
    }
    .booking-step-indicator span {
      display: block;
      font-size: 11.5px;
      font-weight: 500;
      color: #999;
      margin-bottom: 6px;
      letter-spacing: .03em;
    }

    /* ─── TELA DE CONFIRMAÇÃO ─── */
    .booking-done-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 4px;
    }
    .booking-calendar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 48px;
      border-radius: 12px;
      text-decoration: none;
      color: #1a1a1a;
      background: #ffffff;
      border: 1px solid #e5e5e5;
      font-size: 14px;
      font-weight: 600;
      transition: background .15s;
    }
    .booking-calendar:hover { background: #fafafa; }
    .booking-policy {
      font-size: 12px;
      color: #999;
      text-align: center;
      margin: 16px 0 0;
      line-height: 1.5;
    }

    /* ─── RODAPÉ ─── */
    .booking-footer {
      border-top: 1px solid #f0e8ed;
      background: #fdf5f8;
      padding: 28px 20px 40px;
      margin-top: 4px;
    }
    .booking-footer-content {
      max-width: 720px;
      margin: 0 auto;
      text-align: center;
    }
    .booking-footer-brand {
      font-size: 18px;
      font-weight: 800;
      color: var(--booking-brand);
      margin-bottom: 12px;
      letter-spacing: -.02em;
      font-family: Georgia, serif;
      font-style: italic;
    }
    .booking-footer-line {
      font-size: 12.5px;
      color: #8b6070;
      margin: 6px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .booking-footer-line a {
      color: var(--booking-brand);
      text-decoration: none;
      font-weight: 500;
    }
    .booking-footer-policy {
      font-size: 11px;
      color: #c0a0b0;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #f0e0e8;
    }

    /* ─── BOTÃO FLUTUANTE WHATSAPP ─── */
    .booking-fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #22c55e;
      color: #fff;
      display: grid;
      place-items: center;
      text-decoration: none;
      box-shadow: 0 6px 18px rgba(34,197,94,.32);
      z-index: 20;
      font-size: 24px;
    }

    /* ─── LAYOUT: hero ocupa largura, conteúdo abaixo centralizado ─── */
    .booking-main-hero {
      width: 100%;
      max-width: 720px;
      margin: 0 auto;
      background: #ffffff;
      overflow: hidden;
    }
    .booking-main-hero .booking-hero-cover {
      margin-left: calc(-50vw + 50%);
      margin-right: calc(-50vw + 50%);
      width: 100vw;
      max-width: 720px;
      margin-left: 0;
      margin-right: 0;
    }

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
        <div className="booking-logo" style={{ borderRadius: '50%', overflow: 'hidden', width: 40, height: 40, flexShrink: 0, border: '2px solid var(--booking-brand)', background: '#fce4ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--booking-brand)' }}>
          {studio.avatar_url
            ? <img src={studio.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} alt="" />
            : studio.name.slice(0, 2).toUpperCase()
          }
        </div>
        <div className="booking-brand-copy">
          <strong>{professional ? professional.name : studio.name}</strong>
          <span style={{ color: '#22c55e', fontWeight: 600 }}>● Online agora</span>
        </div>
        <div className="booking-header-actions">
          {step !== 'service' && step !== 'done' && (
            <button
              className="booking-header-action"
              onClick={() => {
                if (step === 'date') setStep('service')
                else if (step === 'time') setStep('date')
                else if (step === 'info') setStep('time')
              }}
            >
              ← Voltar
            </button>
          )}
          {studio.instagram && (
            <a className="booking-instagram" href={`https://instagram.com/${studio.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
              {studio.instagram}
            </a>
          )}
          <a className="booking-header-action" href={`/cliente/agendar/consultar?slug=${encodeURIComponent(studio.slug)}`} title="Meus agendamentos" style={{ borderRadius: 20, paddingLeft: 14, paddingRight: 14, fontWeight: 600, fontSize: 12, border: '1px solid var(--booking-brand)', color: 'var(--booking-brand)', background: '#fff' }}>
            📅 Meus agendamentos
          </a>
        </div>
      </header>

      <section className="booking-main-hero">
        {step === 'service' && (
          <>
            {/* HERO — rosé premium */}
            <div className="booking-hero">
              {/* Fundo gradiente rosé com avatar */}
              <div className="booking-hero-bg">
                <div className="booking-hero-avatar-wrap">
                  <div className="booking-hero-avatar">
                    {(professional?.avatar_url || studio.avatar_url)
                      ? <img src={professional?.avatar_url || studio.avatar_url || ''} alt={professional ? professional.name : studio.name} />
                      : <span>{(professional ? professional.name : studio.name).slice(0, 2).toUpperCase()}</span>
                    }
                  </div>
                  <div className="booking-hero-avatar-online" />
                </div>

                {/* Nome com tipografia mista */}
                <h1 className="booking-hero-name">
                  {(() => {
                    const name = professional ? professional.name : studio.name
                    const parts = name.trim().split(' ')
                    if (parts.length === 1) return name
                    const first = parts[0]
                    const rest = parts.slice(1).join(' ')
                    return <>{first}<em> {rest}</em></>
                  })()}
                </h1>
                <p className="booking-hero-role">Manicure e pedicure</p>

                {/* Pills de status */}
                <div className="booking-hero-pills">
                  <span className="booking-hero-pill">
                    <span className="booking-hero-pill-dot" />
                    Online agora
                  </span>
                  <span className="booking-hero-pill">📅 Seg – Sáb</span>
                  <span className="booking-hero-pill">📍 Sorriso – MT</span>
                </div>
              </div>

              {/* Endereço clicável */}
              {studio.address && (
                <a className="booking-hero-info-addr" href={mapsUrl || '#'} target={mapsUrl ? '_blank' : undefined} rel="noreferrer">
                  <span>📍</span>
                  <span style={{ flex: 1 }}>{studio.address}</span>
                </a>
              )}

              {/* Botões */}
              <div className="booking-hero-actions">
                {/* Botão Agendar — principal */}
                <a className="booking-hero-cta" href="#servicos">
                  📅 Agendar agora
                </a>

                {/* Instagram — ícone */}
                {studio.instagram && (
                  <a
                    className="booking-hero-icon-btn"
                    href={`https://instagram.com/${(studio.instagram || '').replace('@','')}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    title="Instagram"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{color:'#E1306C'}}>
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                  </a>
                )}

                {/* WhatsApp — ícone */}
                {(studio.whatsapp || studio.phone) && (
                  <a
                    className="booking-hero-icon-btn"
                    href={`https://wa.me/55${(studio.whatsapp || studio.phone || '').replace(/\D/g, '').replace(/^55/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    title="WhatsApp"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>

            <a className="booking-client-access" href={`/cliente/agendar/consultar?slug=${encodeURIComponent(studio.slug)}`}>
              <div className="booking-client-access-icon">💅</div>
              <div className="booking-client-access-body">
                <span>Já tem agendamento?</span>
                <strong>Ver meus agendamentos</strong>
              </div>
              <div className="booking-client-access-arrow" style={{ background: 'var(--booking-brand)', color: '#fff' }}>→</div>
            </a>

            {/* SERVIÇOS */}
            <div className="booking-section" id="servicos">
              <div className="booking-section-title">💅 Escolha seu atendimento</div>
              {services.length === 0 ? (
                <div className="booking-state">Nenhum serviço disponível no momento.</div>
              ) : (
                services.map((service, idx) => {
                  const featured = isFeaturedService(service, idx)
                  return (
                    <div
                      key={service.id}
                      className={`booking-svc-card ${featured ? 'is-featured' : ''}`}
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
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && (() => {
                        setSelectedService(service)
                        setSelectedDate('')
                        setSelectedTime('')
                        setSlots([])
                        setStep('date')
                      })()}
                    >
                      <div className="booking-svc-card-inner">
                        {featured && <div className="booking-svc-badge">⭐ Mais escolhido</div>}
                        {!featured && service.name.toLowerCase().includes('pacote') && (
                          <div className="booking-svc-badge">💅 Pacote mensal</div>
                        )}
                        <div className="booking-svc-name">{service.name}</div>

                        <div className="booking-svc-footer">
                          <div>
                            <span className="booking-svc-price-label">a partir de</span>
                            <div className="booking-svc-price">{money(service.price)}</div>
                          </div>
                          <div className="booking-svc-btn">Escolher</div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* HORÁRIO DE FUNCIONAMENTO */}
            {settings?.working_hours && (
              <div className="booking-section">
                <div className="booking-section-title">Horário de funcionamento</div>
                <div className="booking-hours">
                  {weekdayKeys.map((key, i) => {
                    const cfg = settings.working_hours[key]
                    const open = cfg?.is_open
                    return (
                      <div key={key} className={`booking-hours-row${!open ? ' closed' : ''}`}>
                        <span>{['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'][i]}</span>
                        <strong>
                          {open ? `${cfg.open || '09:00'} – ${cfg.close || '18:00'}` : 'Fechado'}
                        </strong>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* COMO FUNCIONA */}
            <div className="booking-section booking-howto">
              <div className="booking-section-title">Como funciona</div>
              <div className="booking-howto-step">
                <div className="booking-howto-num">1</div>
                <div className="booking-howto-text">Escolha o serviço</div>
              </div>
              <div className="booking-howto-step">
                <div className="booking-howto-num">2</div>
                <div className="booking-howto-text">Selecione data e horário</div>
              </div>
              <div className="booking-howto-step">
                <div className="booking-howto-num">3</div>
                <div className="booking-howto-text">Confirme pelo WhatsApp</div>
              </div>
            </div>
          </>
        )}

        {/* Outros steps (date, time, info, done) usam layout simples sem hero */}
        {step !== 'service' && (
          <div className="booking-flow" style={{ padding: '20px 20px 40px', maxWidth: 540, margin: '0 auto' }}>
            {/* Resumo sempre visível durante o fluxo */}
            {step !== 'done' && selectedService && (
              <div className="booking-summary-sticky">
                <div className="booking-summary-label">Sua reserva</div>
                <div className="booking-summary-sticky-info">
                  <div className="booking-summary-sticky-name">{selectedService.name}</div>
                  <div className="booking-summary-sticky-meta">
                    {selectedService.duration_minutes} min · {money(selectedService.price)}
                    {professional && ` · com ${professional.name}`}
                  </div>
                </div>
                {selectedDate && selectedTime && (
                  <div className="booking-summary-sticky-when">
                    <strong>{new Date(selectedDate + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</strong>
                    <span>{selectedTime}</span>
                  </div>
                )}
              </div>
            )}

            {/* Indicador de passo */}
            {step !== 'done' && (
              <div className="booking-step-indicator">
                <span>Passo {step === 'service' ? 1 : step === 'date' ? 2 : step === 'time' ? 3 : 4} de 4</span>
                <StepBar step={step} />
              </div>
            )}

            {step === 'date' && selectedService && (
              <>
                <div className="booking-step-head">
                  <div className="booking-title">
                    <span>Serviço escolhido</span>
                    <h2>Escolha a melhor data</h2>
                    <p>{selectedService.name} · {money(selectedService.price)}</p>
                  </div>
                </div>
                <div className="booking-date-grid">
                  {availableDates.slice(0, 28).map((date) => {
                    const parsed = new Date(date + 'T00:00')
                    const active = date === selectedDate
                    const isPast = date < todayYmd
                    return (
                      <button
                        key={date}
                        className={`booking-date ${active ? 'is-active' : ''} ${isPast ? 'is-past' : ''}`}
                        onClick={() => {
                          if (isPast) return
                          setSelectedDate(date)
                          setSelectedTime('')
                          setSlots([])
                          setStep('time')
                          void fetchSlots(date, selectedService)
                        }}
                      >
                        <small>{dateLabel(date)}</small>
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
                  <div className="booking-title">
                    <span>{formatDate(selectedDate)}</span>
                    <h2>Escolha o horário</h2>
                    <p>{selectedService.name} · {selectedService.duration_minutes} min</p>
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
                  <div className="booking-time-groups">
                    {slotGroups.map((group) => (
                      <section className="booking-time-group" key={group.label}>
                        <div className="booking-time-label">{group.label}</div>
                        <div className="booking-time-grid">
                          {group.slots.map((time) => (
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
                      </section>
                    ))}
                  </div>
                )}
              </>
            )}

            {step === 'info' && selectedService && (
              <>
                <div className="booking-step-head">
                  <div className="booking-title">
                    <span>Último passo</span>
                    <h2>Seus dados</h2>
                    <p>Confirme nome e WhatsApp para reservar seu horário.</p>
                  </div>
                </div>
                <div className="booking-summary">
                  <span className="booking-summary-mark">{selectedService.name.slice(0, 1).toUpperCase()}</span>
                  <div>
                    <strong>{selectedService.name}</strong>
                    <p>{formatDate(selectedDate)} às {selectedTime} · {money(selectedService.price)}</p>
                  </div>
                </div>
                <p className="booking-trust-note">
                  Atendimento com hora marcada. Cancelamento com até {settings?.cancel_hours || 24}h de antecedência.
                </p>
                <div className="booking-field">
                  <label>Nome completo</label>
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex: Ana Silva" />
                </div>
                <div className="booking-field">
                  <label>WhatsApp</label>
                  <input
                    value={phoneMasked}
                    onChange={(event) => handlePhoneChange(event.target.value)}
                    placeholder="(66) 99999-0000"
                    inputMode="tel"
                    maxLength={15}
                  />
                  <p className="booking-field-help">
                    Digite o WhatsApp com DDD. Ex: (66) 99999-0000
                  </p>
                </div>
                <div className="booking-field">
                  <label>Observações (opcional)</label>
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Alergias, preferências de esmalte..." />
                </div>
                <button className="booking-primary" onClick={submit} disabled={loading || !name.trim() || phone.length < 10}>
                  {loading ? 'Confirmando...' : 'Confirmar horário'}
                </button>
                {bookingError && <div className="booking-error">{bookingError}</div>}
              </>
            )}

            {step === 'done' && (
              <div className="booking-done">
                <div className="booking-done-avatar">
                  {professional?.avatar_url
                    ? <img src={professional.avatar_url} alt={professional.name} />
                    : studio.avatar_url
                      ? <img src={studio.avatar_url} alt={studio.name} />
                      : (professional?.name || studio.name).slice(0, 1).toUpperCase()}
                </div>
                <div className="booking-check">✓</div>
                <div className="booking-title">
                  <span>Horário reservado</span>
                  <h1>Tudo certo, {(createdAppointment?.client_name || name).split(' ')[0]}!</h1>
                  <p>
                    Te esperamos {createdAppointment ? formatDateTime(createdAppointment.appointment_date) : `dia ${selectedDate} às ${selectedTime}`}
                    {studio.address && `, em ${studio.address}`}.
                  </p>
                </div>
                <div className="booking-confirm-card">
                  <div><span>Serviço</span><strong>{createdAppointment?.service_name || selectedService?.name}</strong></div>
                  {professional && <div><span>Com</span><strong>{professional.name}</strong></div>}
                  <div><span>Quando</span><strong>{createdAppointment ? formatDateTime(createdAppointment.appointment_date) : `${selectedDate} ${selectedTime}`}</strong></div>
                  <div><span>Valor</span><strong>{money((createdAppointment?.price ?? selectedService?.price) || 0)}</strong></div>
                </div>

                {/* Ações pós-agendamento */}
                <div className="booking-done-actions">
                  {studio.whatsapp && (
                    <a className="booking-whatsapp" href={whatsappLink()} target="_blank" rel="noreferrer">
                      💬 Confirmar no WhatsApp
                    </a>
                  )}
                  <a
                    className="booking-calendar"
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent((createdAppointment?.service_name || selectedService?.name || 'Agendamento') + (professional ? ` com ${professional.name}` : ''))}&dates=${(createdAppointment?.appointment_date || `${selectedDate}T${selectedTime}:00`).replace(/[-:]/g, '').slice(0,15)}/${(createdAppointment?.appointment_date || `${selectedDate}T${selectedTime}:00`).replace(/[-:]/g, '').slice(0,15)}&details=${encodeURIComponent(`${studio.name}${studio.address ? '\n' + studio.address : ''}${studio.phone || studio.whatsapp ? '\nContato: ' + (studio.phone || studio.whatsapp) : ''}`)}&location=${encodeURIComponent(studio.address || studio.name)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📅 Adicionar ao Google Agenda
                  </a>
                  {mapsUrl && (
                    <a className="booking-map-link" href={mapsUrl} target="_blank" rel="noreferrer">
                      📍 Ver endereço no mapa
                    </a>
                  )}
                </div>

                <button className="booking-back" onClick={reset}>Fazer outro agendamento</button>

                <p className="booking-policy">
                  Precisa cancelar? Avise pelo WhatsApp com pelo menos {settings?.cancel_hours || 24}h de antecedência.
                </p>
              </div>
            )}
          </div>
        )}

        {/* FAB do WhatsApp — só na tela inicial */}
        {step === 'service' && (studio.whatsapp || studio.phone) && (
          <a
            className="booking-fab"
            href={`https://wa.me/55${(studio.whatsapp || studio.phone || '').replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
          >
            💬
          </a>
        )}
      </section>

      {/* Rodapé com info do salão */}
      {step === 'service' && (
        <footer className="booking-footer">
          <div className="booking-footer-content">
            <div className="booking-footer-brand">{studio.name}</div>
            {studio.address && mapsUrl && (
              <div className="booking-footer-line">
                <a href={mapsUrl} target="_blank" rel="noreferrer">📍 {studio.address}</a>
              </div>
            )}
            {(studio.phone || studio.whatsapp) && <div className="booking-footer-line">📞 {studio.phone || studio.whatsapp}</div>}
            {studio.instagram && (
              <div className="booking-footer-line">
                <a href={`https://instagram.com/${studio.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                  {studio.instagram.startsWith('@') ? studio.instagram : '@' + studio.instagram}
                </a>
              </div>
            )}
            <div className="booking-footer-policy">
              Cancele com {settings?.cancel_hours || 24}h de antecedência.
            </div>
          </div>
        </footer>
      )}
    </main>
  )
}
