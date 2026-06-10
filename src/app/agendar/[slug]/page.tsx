// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import AgendarClient from './AgendarClient'
import { notFound } from 'next/navigation'

export default async function AgendarPage({ params }: { params: { slug: string } }) {
  const sb = await createClient()
  const { data: studio } = await sb
    .from('studios')
    .select('id, name, slug, avatar_url, brand_color, whatsapp, instagram, address, phone, is_active')
    .eq('slug', params.slug)
    .single()

  if (!studio || !studio.is_active) notFound()

  const { data: services } = await sb
    .from('services')
    .select('id, name, description, price, duration_minutes, category')
    .eq('studio_id', studio.id)
    .eq('is_active', true)
    .order('name')

  const { data: settings } = await sb
    .from('salon_settings')
    .select('slot_duration, advance_days, cancel_hours, auto_confirm, working_hours')
    .eq('studio_id', studio.id)
    .single()

  return (
    <AgendarClient
      studio={studio}
      services={services || []}
      settings={settings}
    />
  )
}
