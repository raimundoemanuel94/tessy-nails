// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import AgendarClient from './AgendarClient'
import { notFound } from 'next/navigation'

export default async function AgendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { slug } = await params
  const sp = await searchParams
  const professionalId = sp?.profissional ?? null

  const sb = await createClient()

  const { data: studio } = await sb
    .from('studios')
    .select('id, name, slug, avatar_url, brand_color, whatsapp, instagram, address, phone, is_active')
    .eq('slug', slug)
    .single()

  if (!studio || !studio.is_active) notFound()

  const [{ data: services }, { data: settings }] = await Promise.all([
    sb
      .from('services')
      .select('id, name, description, price, duration_minutes, category')
      .eq('studio_id', studio.id)
      .eq('is_active', true)
      .order('name'),
    sb
      .from('salon_settings')
      .select('slot_duration, advance_days, cancel_hours, auto_confirm, working_hours')
      .eq('studio_id', studio.id)
      .single(),
  ])

  let professional = null
  if (professionalId) {
    const { data: prof } = await sb
      .from('profiles')
      .select('id, name, avatar_url, role')
      .eq('id', professionalId)
      .in('role', ['owner', 'professional'])
      .maybeSingle()
    if (prof) professional = prof
  }

  return (
    <AgendarClient
      studio={studio}
      services={services || []}
      settings={settings}
      professional={professional}
    />
  )
}
