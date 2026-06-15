// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin'
import AgendarClient from '../AgendarClient'
import { notFound } from 'next/navigation'

export default async function AgendarComProfissionalPage({
  params,
}: {
  params: Promise<{ slug: string; prof: string }>
}) {
  const { slug, prof: profSlug } = await params
  const sb = createAdminClient()

  const { data: studio } = await sb
    .from('studios')
    .select('id, name, slug, avatar_url, brand_color, whatsapp, instagram, address, phone, is_active')
    .eq('slug', slug)
    .single()

  if (!studio || !studio.is_active) notFound()

  const [{ data: services }, { data: settings }, { data: professional }] = await Promise.all([
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
    sb
      .from('profiles')
      .select('id, name, avatar_url, role, slug')
      .eq('studio_id', studio.id)
      .eq('slug', profSlug)
      .in('role', ['owner', 'professional'])
      .maybeSingle(),
  ])

  if (!professional) notFound()

  return (
    <AgendarClient
      studio={studio}
      services={services || []}
      settings={settings}
      professional={professional}
    />
  )
}
