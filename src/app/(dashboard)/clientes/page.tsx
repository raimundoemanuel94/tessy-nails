'use client'

import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Clock, Mail, Phone, Plus, Search, Sparkles, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, Client } from '@/types/database'

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

const colors = ['#a78bfa', '#f472b6', '#818cf8', '#c084fc', '#fbbf24', '#34d399']
const money = (n: number) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`
const dateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const dateOnly = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

type ClientStats = {
  appointments: Appointment[]
  completed: Appointment[]
  next: Appointment | null
  last: Appointment | null
  spent: number
}

function sourceLabel(source?: string | null) {
  if (source === 'public') return 'Link publico'
  if (source === 'manual') return 'Cadastro manual'
  return source || 'Cadastro manual'
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <label style={{ display: 'grid', gap: 7 }}>
      <span style={{ color: C.muted, fontSize: 11, fontWeight: 850, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </label>
  )
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [studioId, setStudioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Client | null>(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', birth_date: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', birth_date: '', notes: '' })
  const PAGE_SIZE = 30
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase.from('profiles').select('studio_id').eq('id', user.id).single()
      if (!profile?.studio_id) { setLoading(false); return }

      setStudioId(profile.studio_id)
      const [{ data: clientRows }, { data: appointmentRows }] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .eq('studio_id', profile.studio_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('appointments')
          .select('*')
          .eq('studio_id', profile.studio_id)
          .order('appointment_date', { ascending: true }),
      ])

      setClients(clientRows || [])
      setAppointments(appointmentRows || [])
      setLoading(false)
    }

    void load()
  }, [])

  const statsByClient = useMemo(() => {
    const now = new Date().toISOString()
    const map = new Map<string, ClientStats>()

    for (const client of clients) {
      const rows = appointments.filter((appointment) => (
        appointment.client_id === client.id ||
        (!appointment.client_id && appointment.client_name?.toLowerCase() === client.name.toLowerCase())
      ))
      const completed = rows.filter((appointment) => appointment.status === 'completed')
      const future = rows
        .filter((appointment) => appointment.appointment_date >= now && !['completed', 'cancelled'].includes(appointment.status))
        .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))
      const past = rows
        .filter((appointment) => appointment.appointment_date < now || appointment.status === 'completed')
        .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))

      map.set(client.id, {
        appointments: rows,
        completed,
        next: future[0] || null,
        last: past[0] || null,
        spent: completed.reduce((sum, appointment) => sum + Number(appointment.price || 0), 0),
      })
    }

    return map
  }, [appointments, clients])

  const filtered = useMemo(() => {
    setVisibleCount(PAGE_SIZE)
    const term = query.trim().toLowerCase()
    return clients.filter((client) => {
      const stats = statsByClient.get(client.id)
      return !term ||
        client.name.toLowerCase().includes(term) ||
        client.phone?.includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        sourceLabel(client.source).toLowerCase().includes(term) ||
        stats?.appointments.some((appointment) => appointment.service_name.toLowerCase().includes(term))
    })
  }, [clients, query, statsByClient])

  const publicClients = clients.filter((client) => client.source === 'public').length
  const withNext = clients.filter((client) => statsByClient.get(client.id)?.next).length
  const totalSpent = Array.from(statsByClient.values()).reduce((sum, stats) => sum + stats.spent, 0)

  const save = async () => {
    if (!form.name.trim() || !studioId) return

    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('clients')
      .insert({
        studio_id: studioId,
        name: form.name.trim(),
        phone: form.phone || null,
        email: form.email || null,
        birth_date: form.birth_date || null,
        notes: form.notes || null,
        source: 'manual',
      })
      .select()
      .single()

    if (data) setClients((current) => [data, ...current])
    setSaving(false)
    setModal(false)
    setForm({ name: '', phone: '', email: '', birth_date: '', notes: '' })
  }

  const openEdit = (client: Client) => {
    setEditForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      birth_date: client.birth_date || '',
      notes: client.notes || '',
    })
    setEditModal(true)
  }

  const saveEdit = async () => {
    if (!selected || !editForm.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('clients')
      .update({
        name: editForm.name.trim(),
        phone: editForm.phone || null,
        email: editForm.email || null,
        birth_date: editForm.birth_date || null,
        notes: editForm.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selected.id)
      .select()
      .single()
    if (data) {
      setClients(prev => prev.map(c => c.id === data.id ? data : c))
      setSelected(data)
    }
    setSaving(false)
    setEditModal(false)
  }

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh', color: C.muted }}>Carregando clientes...</div>

  const selectedStats = selected ? statsByClient.get(selected.id) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1180 }}>
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: '0 0 6px', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>
            Relacionamento
          </p>
          <h1 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 900 }}>Clientes</h1>
          <p style={{ color: C.muted, fontSize: 12, margin: '5px 0 0' }}>
            {clients.length} cadastradas - {filtered.length} visiveis
          </p>
        </div>
        <button onClick={() => setModal(true)} style={primaryButton}>
          <Plus size={15} /> Nova cliente
        </button>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        <Metric label="Base ativa" value={clients.length} sub={`${publicClients} vieram do link`} color={C.purple} />
        <Metric label="Com retorno" value={withNext} sub="proximos horarios" color={C.green} />
        <Metric label="Receita historica" value={money(totalSpent)} sub="atendimentos concluidos" color={C.amber} />
        <Metric label="Busca atual" value={filtered.length} sub="clientes filtradas" color={C.pink} />
      </section>

      <label style={{
        height: 44,
        borderRadius: 13,
        border: `1px solid ${C.border2}`,
        background: C.card,
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: C.muted,
      }}>
        <Search size={16} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome, telefone, email, origem ou servico"
          style={{ width: '100%', background: 'transparent', border: 0, outline: 'none', color: C.text, fontSize: 13, fontFamily: 'inherit' }}
        />
      </label>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filtered.slice(0, visibleCount).map((client, index) => {
          const accent = colors[index % colors.length]
          const stats = statsByClient.get(client.id)
          const active = selected?.id === client.id

          return (
            <article
              key={client.id}
              onClick={() => setSelected(active ? null : client)}
              style={{
                borderRadius: 16,
                border: `1px solid ${active ? accent : C.border}`,
                background: active ? `${accent}12` : C.card,
                padding: 16,
                cursor: 'pointer',
                display: 'grid',
                gap: 14,
                minHeight: 208,
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: 15,
                  display: 'grid',
                  placeItems: 'center',
                  background: `linear-gradient(135deg, ${accent}, ${colors[(index + 1) % colors.length]})`,
                  color: '#fff',
                  fontWeight: 900,
                  flexShrink: 0,
                }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', color: C.text, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</strong>
                  <span style={{ display: 'block', color: C.muted, fontSize: 11, marginTop: 3 }}>{sourceLabel(client.source)}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <Contact icon={Phone} value={client.phone || 'Sem telefone'} />
                <Contact icon={Mail} value={client.email || 'Sem email'} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Mini label="Visitas" value={stats?.completed.length ?? 0} color={C.purple} />
                <Mini label="Gasto" value={money(stats?.spent ?? 0)} color={C.green} />
              </div>

              <div style={{
                borderRadius: 12,
                border: `1px solid ${stats?.next ? `${C.green}30` : C.border}`,
                background: stats?.next ? `${C.green}08` : C.card2,
                padding: 10,
              }}>
                <span style={{ display: 'block', color: stats?.next ? C.green : C.muted, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  Proximo horario
                </span>
                <strong style={{ display: 'block', color: C.text, fontSize: 12, marginTop: 4 }}>
                  {stats?.next ? `${dateTime(stats.next.appointment_date)} - ${stats.next.service_name} - ${money(stats.next.price)}` : 'Nenhum marcado'}
                </strong>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); openEdit(client) }}
                style={{
                  width: '100%', height: 34, borderRadius: 10,
                  border: `1px solid ${C.purple}44`,
                  background: `${C.purple}12`,
                  color: C.purple, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                ✏️ Editar dados
              </button>
            </article>
          )
        })}

        {filtered.length > visibleCount && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <button
              onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              style={{ padding: '10px 28px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Carregar mais ({filtered.length - visibleCount} restantes)
            </button>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', minHeight: 220, display: 'grid', placeItems: 'center', textAlign: 'center', color: C.muted, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16 }}>
            <div>
              <Sparkles size={30} color={C.purple} style={{ margin: '0 auto 10px' }} />
              <strong style={{ color: C.text, fontSize: 14 }}>Nenhuma cliente encontrada</strong>
              <p style={{ margin: '6px 0 0', fontSize: 12 }}>Revise a busca ou cadastre uma nova cliente.</p>
            </div>
          </div>
        )}
      </section>

      {selected && selectedStats && (
        <section style={{
          borderRadius: 18,
          border: `1px solid ${C.border}`,
          background: C.card,
          overflow: 'hidden',
        }}>
          <header style={{ padding: 18, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: '0 0 6px', color: C.purple, fontSize: 11, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase' }}>
                Ficha da cliente
              </p>
              <h2 style={{ margin: 0, color: C.text, fontSize: 20 }}>{selected.name}</h2>
              <p style={{ margin: '6px 0 0', color: C.muted, fontSize: 12 }}>{sourceLabel(selected.source)}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openEdit(selected)} style={{ ...iconButton, background: `${C.purple}22`, color: C.purple, border: `1px solid ${C.purple}44`, padding: '0 14px', fontSize: 12, fontWeight: 700, borderRadius: 8, height: 32 }}>✏️ Editar</button>
              <button onClick={() => setSelected(null)} style={iconButton}>x</button>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, padding: 18 }}>
            <Detail label="Telefone" value={selected.phone || '-'} />
            <Detail label="Email" value={selected.email || '-'} />
            <Detail label="Aniversario" value={selected.birth_date ? dateOnly(`${selected.birth_date}T12:00:00`) : '-'} />
            <Detail label="Cliente desde" value={dateOnly(selected.created_at)} />
            <Detail label="Ultima visita" value={selectedStats.last ? dateTime(selectedStats.last.appointment_date) : '-'} icon={Clock} />
            <Detail label="Proximo horario" value={selectedStats.next ? dateTime(selectedStats.next.appointment_date) : '-'} icon={CalendarCheck} />
            <Detail label="Visitas concluidas" value={String(selectedStats.completed.length)} />
            <Detail label="Receita" value={money(selectedStats.spent)} />
          </div>

          {selected.notes && (
            <div style={{ margin: '0 18px 18px', borderRadius: 14, border: `1px solid ${C.border2}`, background: C.card2, padding: 14 }}>
              <span style={{ color: C.muted, fontSize: 11, fontWeight: 850, textTransform: 'uppercase', letterSpacing: '.08em' }}>Observacoes</span>
              <p style={{ margin: '6px 0 0', color: C.text, fontSize: 13, lineHeight: 1.55 }}>{selected.notes}</p>
            </div>
          )}
        </section>
      )}

      {editModal && selected && (
        <div onClick={(e) => e.target === e.currentTarget && setEditModal(false)} style={{
          position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.62)',
          display: 'grid', placeItems: 'center', padding: 18,
        }}>
          <div style={{
            width: '100%', maxWidth: 520, borderRadius: 18, background: C.card,
            border: `1px solid ${C.border2}`, boxShadow: '0 26px 90px rgba(0,0,0,0.42)',
            padding: 18, display: 'grid', gap: 14,
          }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: C.text, fontSize: 16 }}>Editar — {selected.name}</strong>
              <button onClick={() => setEditModal(false)} style={iconButton}>x</button>
            </header>
            <Field label="Nome completo" value={editForm.name} onChange={(v) => setEditForm(f => ({ ...f, name: v }))} placeholder="Ex: Maria Silva" />
            <Field label="Telefone / WhatsApp" value={editForm.phone} onChange={(v) => setEditForm(f => ({ ...f, phone: v }))} placeholder="(66) 99999-0000" />
            <Field label="Email opcional" value={editForm.email} onChange={(v) => setEditForm(f => ({ ...f, email: v }))} type="email" />
            <Field label="Data de aniversario" value={editForm.birth_date} onChange={(v) => setEditForm(f => ({ ...f, birth_date: v }))} type="date" />
            <Field label="Observacoes" value={editForm.notes} onChange={(v) => setEditForm(f => ({ ...f, notes: v }))} placeholder="Alergias, preferencias..." />
            <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button style={secondaryButton} onClick={() => setEditModal(false)}>Cancelar</button>
              <button style={primaryButton} onClick={saveEdit} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </footer>
          </div>
        </div>
      )}

      {modal && (
        <div onClick={(event) => event.target === event.currentTarget && setModal(false)} style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(0,0,0,0.62)',
          display: 'grid',
          placeItems: 'center',
          padding: 18,
        }}>
          <div style={{
            width: '100%',
            maxWidth: 520,
            borderRadius: 18,
            background: C.card,
            border: `1px solid ${C.border2}`,
            boxShadow: '0 26px 90px rgba(0,0,0,0.42)',
            padding: 18,
            display: 'grid',
            gap: 14,
          }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: C.text, fontSize: 16 }}>Nova cliente</strong>
              <button onClick={() => setModal(false)} style={iconButton}>x</button>
            </header>
            <Field label="Nome completo" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Ex: Maria Silva" />
            <Field label="Telefone / WhatsApp" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} placeholder="(66) 99999-0000" />
            <Field label="Email opcional" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} type="email" />
            <Field label="Data de aniversario" value={form.birth_date} onChange={(value) => setForm((current) => ({ ...current, birth_date: value }))} type="date" />
            <Field label="Observacoes" value={form.notes} onChange={(value) => setForm((current) => ({ ...current, notes: value }))} placeholder="Alergias, preferencias..." />
            <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button style={secondaryButton} onClick={() => setModal(false)}>Cancelar</button>
              <button style={primaryButton} onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar'}</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: C.card, padding: 16 }}>
      <span style={{ color: C.muted, fontSize: 10, fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</span>
      <strong style={{ display: 'block', color: C.text, fontSize: 24, marginTop: 8 }}>{value}</strong>
      <p style={{ margin: '5px 0 0', color, fontSize: 11, fontWeight: 800 }}>{sub}</p>
    </div>
  )
}

function Contact({ icon: Icon, value }: { icon: typeof Phone; value: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.muted, fontSize: 12, minWidth: 0 }}>
      <Icon size={13} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </span>
  )
}

function Mini({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ borderRadius: 11, background: C.card2, border: `1px solid ${C.border}`, padding: 10 }}>
      <span style={{ display: 'block', color: C.muted, fontSize: 10, fontWeight: 800 }}>{label}</span>
      <strong style={{ display: 'block', color, fontSize: 13, marginTop: 4 }}>{value}</strong>
    </div>
  )
}

function Detail({ label, value, icon: Icon = UserRound }: { label: string; value: string; icon?: typeof UserRound }) {
  return (
    <div style={{ borderRadius: 13, border: `1px solid ${C.border}`, background: C.card2, padding: 13, minWidth: 0 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.muted, fontSize: 10, fontWeight: 850, textTransform: 'uppercase', letterSpacing: '.08em' }}>
        <Icon size={13} /> {label}
      </span>
      <strong style={{ display: 'block', color: C.text, fontSize: 13, marginTop: 8, overflowWrap: 'anywhere' }}>{value}</strong>
    </div>
  )
}

const inputStyle: CSSProperties = {
  height: 42,
  borderRadius: 12,
  border: `1px solid ${C.border2}`,
  background: '#0b0b18',
  color: C.text,
  padding: '0 12px',
  outline: 'none',
  fontFamily: 'inherit',
  fontSize: 13,
}

const primaryButton: CSSProperties = {
  height: 40,
  padding: '0 14px',
  borderRadius: 12,
  border: `1px solid ${C.purple}42`,
  background: `${C.purple}22`,
  color: C.purple,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  fontWeight: 850,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const secondaryButton: CSSProperties = {
  height: 40,
  padding: '0 14px',
  borderRadius: 12,
  border: `1px solid ${C.border2}`,
  background: 'transparent',
  color: C.muted,
  fontWeight: 800,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const iconButton: CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 10,
  border: `1px solid ${C.border2}`,
  background: C.card2,
  color: C.muted,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 900,
}
