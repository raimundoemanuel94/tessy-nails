'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Service } from '@/types/database'

const C = {
  bg: '#080812',
  card: '#10101f',
  card2: '#17172a',
  border: '#1c1c36',
  border2: '#26264a',
  purple: '#a78bfa',
  pink: '#f472b6',
  green: '#34d399',
  red: '#f87171',
  text: '#e8e8f8',
  muted: '#6b6b9a',
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

    load()
  }, [])

  const openNew = () => {
    setEdit(null)
    setForm({ name: '', price: '', duration_minutes: '60', category: '', description: '' })
    setModal(true)
  }

  const openEdit = (service: Service) => {
    setEdit(service)
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
    if (!form.name.trim() || !studioId) return

    setSaving(true)
    const supabase = createClient()
    const payload = {
      name: form.name,
      price: Number(form.price) || 0,
      duration_minutes: Number(form.duration_minutes) || 60,
      category: form.category || null,
      description: form.description || null,
      studio_id: studioId,
    }

    if (edit) {
      const { data } = await supabase.from('services').update(payload).eq('id', edit.id).select().single()
      if (data) setServices((current) => current.map((service) => service.id === edit.id ? data : service))
    } else {
      const { data } = await supabase.from('services').insert(payload).select().single()
      if (data) setServices((current) => [...current, data])
    }

    setSaving(false)
    setModal(false)
  }

  const toggle = async (service: Service) => {
    const supabase = createClient()
    await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id)
    setServices((current) => current.map((item) => item.id === service.id ? { ...item, is_active: !item.is_active } : item))
  }

  const remove = async (id: string) => {
    if (!confirm('Excluir este serviço?')) return

    const supabase = createClient()
    await supabase.from('services').delete().eq('id', id)
    setServices((current) => current.filter((service) => service.id !== id))
  }

  if (loading) {
    return (
      <div className="studio-loading">
        <div />
      </div>
    )
  }

  const [catFilter, setCatFilter] = useState<string>('all')

  const catOf = (name: string): string => {
    const n = name.toLowerCase()
    if (n.includes('pacote')) return 'pacote'
    if (n.includes('pedicure') || n.includes('pé') || n.includes('pe') || n.includes('spa')) return 'pes'
    if (n.includes('gel') || n.includes('postiça') || n.includes('postica') || n.includes('alongamento')) return 'gel'
    return 'maos'
  }

  const CAT_LABELS: Record<string, string> = { all: 'Todos', maos: 'Mãos', pes: 'Pés', gel: 'Gel / Postiça', pacote: 'Pacotes' }

  const filteredSvcs = catFilter === 'all' ? services : services.filter(s => catOf(s.name) === catFilter)
  const activeCount = services.filter((service) => service.is_active).length

  return (
    <div className="studio-page">
      <header className="studio-page-header">
        <div>
          <span className="studio-eyebrow">Catálogo</span>
          <h1>Serviços</h1>
          <p>{activeCount} ativos · {services.length - activeCount} inativos</p>
        </div>
        <button className="studio-primary-action" onClick={openNew}>Novo serviço</button>
      </header>

      {/* Filtros por categoria */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: '100%' }}>
        {Object.entries(CAT_LABELS).map(([key, label]) => (
          <button key={key} onClick={() => setCatFilter(key)} style={{
            padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: catFilter === key ? 'none' : `1px solid ${C.border2}`,
            background: catFilter === key ? C.purple : C.card2,
            color: catFilter === key ? '#fff' : C.muted,
            fontFamily: 'inherit', transition: 'all .15s',
          }}>{label}</button>
        ))}
      </div>

      <section className="studio-service-grid">
        {filteredSvcs.map((service) => {
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
                    <button className="danger" onClick={() => remove(service.id)}>Excluir</button>
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
            <strong>Nenhum serviço cadastrado</strong>
            <span>Crie o primeiro item do catálogo para liberar agendamentos online.</span>
          </div>
        )}
      </section>

      {modal && (
        <div className="studio-modal-backdrop" onClick={(event) => event.target === event.currentTarget && setModal(false)}>
          <div className="studio-modal">
            <header>
              <strong>{edit ? 'Editar serviço' : 'Novo serviço'}</strong>
              <button onClick={() => setModal(false)}>×</button>
            </header>

            <Field label="Nome do serviço" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Ex: Manicure em gel" />
            <div className="studio-form-grid">
              <Field label="Preço (R$)" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} type="number" />
              <Field label="Duração (min)" value={form.duration_minutes} onChange={(value) => setForm((current) => ({ ...current, duration_minutes: value }))} type="number" />
            </div>
            <Field label="Categoria" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} placeholder="Manicure, Pedicure, Gel..." />
            <Field label="Descrição (opcional)" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />

            <footer>
              <button className="studio-secondary-action" onClick={() => setModal(false)}>Cancelar</button>
              <button className="studio-primary-action" onClick={save} disabled={saving}>
                {saving ? 'Salvando...' : edit ? 'Salvar' : 'Criar serviço'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
