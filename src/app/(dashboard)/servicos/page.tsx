'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Service } from '@/types/database'

const C = {
  purple: '#a78bfa',
  pink: '#f472b6',
  green: '#34d399',
  red: '#f87171',
}

const colors = ['#a78bfa', '#f472b6', '#818cf8', '#c084fc', '#a5b4fc', '#f9a8d4', '#fbbf24', '#34d399']
const price = (n: number) => `R$ ${Number(n || 0).toFixed(2).replace('.', ',')}`
const colorByName = (name: string) => colors[(name.charCodeAt(0) || 0) % colors.length]

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div className="studio-field">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [studioId, setStudioId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [edit, setEdit] = useState<Service | null>(null)
  const [form, setForm] = useState({ name: '', price: '', duration_minutes: '60', category: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase.from('profiles').select('studio_id').eq('id', user.id).single()
      if (!profile?.studio_id) { setLoading(false); return }

      setStudioId(profile.studio_id)
      const { data } = await supabase.from('services').select('*').eq('studio_id', profile.studio_id).order('name')
      setServices(data || [])
      setLoading(false)
    }

    void load()
  }, [])

  const openNew = () => {
    setEdit(null)
    setMessage(null)
    setForm({ name: '', price: '', duration_minutes: '60', category: '', description: '' })
    setModal(true)
  }

  const openEdit = (service: Service) => {
    setEdit(service)
    setMessage(null)
    setForm({
      name: service.name,
      price: String(service.price),
      duration_minutes: String(service.duration_minutes),
      category: service.category || '',
      description: service.description || '',
    })
    setModal(true)
  }

  const save = async () => {
    if (!studioId) return

    const name = form.name.trim()
    const servicePrice = Number(form.price)
    const duration = Number(form.duration_minutes)

    if (!name) {
      setMessage({ type: 'err', text: 'Informe o nome do servico.' })
      return
    }
    if (!Number.isFinite(servicePrice) || servicePrice < 0) {
      setMessage({ type: 'err', text: 'Informe um preco valido.' })
      return
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      setMessage({ type: 'err', text: 'Informe uma duracao maior que zero.' })
      return
    }

    setSaving(true)
    const supabase = createClient()
    const payload = {
      name,
      price: servicePrice,
      duration_minutes: duration,
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      studio_id: studioId,
    }

    if (edit) {
      const { data, error } = await supabase.from('services').update(payload).eq('id', edit.id).select().single()
      if (error) {
        setSaving(false)
        setMessage({ type: 'err', text: 'Erro ao salvar servico.' })
        return
      }
      if (data) setServices((current) => current.map((service) => service.id === edit.id ? data : service))
    } else {
      const { data, error } = await supabase.from('services').insert(payload).select().single()
      if (error) {
        setSaving(false)
        setMessage({ type: 'err', text: 'Erro ao criar servico.' })
        return
      }
      if (data) setServices((current) => [...current, data])
    }

    setSaving(false)
    setModal(false)
    setMessage({ type: 'ok', text: 'Servico salvo.' })
  }

  const toggle = async (service: Service) => {
    const supabase = createClient()
    const { error } = await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id)
    if (error) {
      setMessage({ type: 'err', text: 'Erro ao atualizar servico.' })
      return
    }
    setServices((current) => current.map((item) => item.id === service.id ? { ...item, is_active: !item.is_active } : item))
  }

  const deactivate = async (service: Service) => {
    // confirm removido

    const supabase = createClient()
    const { error } = await supabase.from('services').update({ is_active: false }).eq('id', service.id)
    if (error) {
      setMessage({ type: 'err', text: 'Erro ao desativar servico.' })
      return
    }
    setServices((current) => current.map((item) => item.id === service.id ? { ...item, is_active: false } : item))
    setMessage({ type: 'ok', text: 'Servico desativado.' })
  }

  if (loading) {
    return (
      <div className="studio-loading">
        <div />
      </div>
    )
  }

  const activeCount = services.filter((service) => service.is_active).length

  return (
    <div className="studio-page">
      <header className="studio-page-header">
        <div>
          <span className="studio-eyebrow">Catalogo</span>
          <h1>Servicos</h1>
          <p>{activeCount} ativos - {services.length - activeCount} inativos</p>
        </div>
        <button className="studio-primary-action" onClick={openNew}>Novo servico</button>
      </header>

      {message && (
        <div style={{
          border: `1px solid ${message.type === 'err' ? C.red : C.green}55`,
          background: `${message.type === 'err' ? C.red : C.green}16`,
          color: message.type === 'err' ? C.red : C.green,
          borderRadius: 12,
          padding: '10px 14px',
          fontSize: 13,
          fontWeight: 800,
        }}>
          {message.text}
        </div>
      )}

      <section className="studio-service-grid">
        {services.map((service) => {
          const accent = colorByName(service.name)

          return (
            <article key={service.id} className="studio-service-card" style={{ opacity: service.is_active ? 1 : 0.58 }}>
              <div className="studio-service-accent" style={{ background: accent }} />
              <div className="studio-service-body">
                <div className="studio-service-topline">
                  <div>
                    <h2>{service.name}</h2>
                    <span><i style={{ background: accent }} />{service.category || 'Geral'}</span>
                  </div>
                  <div className="studio-card-actions">
                    <button onClick={() => openEdit(service)}>Editar</button>
                    <button className="danger" onClick={() => deactivate(service)}>Desativar</button>
                  </div>
                </div>

                {service.description && <p className="studio-service-description">{service.description}</p>}

                <div className="studio-service-footer">
                  <div>
                    <strong>{price(service.price)}</strong>
                    <span>{service.duration_minutes} min</span>
                  </div>
                  <button
                    className={service.is_active ? 'studio-status-pill active' : 'studio-status-pill'}
                    onClick={() => toggle(service)}
                  >
                    {service.is_active ? 'Ativo' : 'Inativo'}
                  </button>
                </div>
              </div>
            </article>
          )
        })}

        {services.length === 0 && (
          <div className="studio-empty">
            <strong>Nenhum servico cadastrado</strong>
            <span>Crie o primeiro item do catalogo para liberar agendamentos online.</span>
          </div>
        )}
      </section>

      {modal && (
        <div className="studio-modal-backdrop" onClick={(event) => event.target === event.currentTarget && setModal(false)}>
          <div className="studio-modal">
            <header>
              <strong>{edit ? 'Editar servico' : 'Novo servico'}</strong>
              <button onClick={() => setModal(false)}>x</button>
            </header>

            <Field label="Nome do servico" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Ex: Manicure em gel" />
            <div className="studio-form-grid">
              <Field label="Preco (R$)" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} type="number" />
              <Field label="Duracao (min)" value={form.duration_minutes} onChange={(value) => setForm((current) => ({ ...current, duration_minutes: value }))} type="number" />
            </div>
            <Field label="Categoria" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} placeholder="Manicure, Pedicure, Gel..." />
            <Field label="Descricao (opcional)" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />

            <footer>
              <button className="studio-secondary-action" onClick={() => setModal(false)}>Cancelar</button>
              <button className="studio-primary-action" onClick={save} disabled={saving}>
                {saving ? 'Salvando...' : edit ? 'Salvar' : 'Criar servico'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
