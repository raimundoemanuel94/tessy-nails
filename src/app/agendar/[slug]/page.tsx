import { createAdminClient } from '@/lib/supabase/admin'
import AgendarClient from './AgendarClient'
import { notFound, redirect } from 'next/navigation'

export default async function AgendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { slug } = await params
  const sp = await searchParams
  const professionalIdParam = sp?.profissional ?? null

  const sb = createAdminClient()

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
      .select('slot_duration, advance_days, cancel_hours, auto_confirm, working_hours, blocked_dates')
      .eq('studio_id', studio.id)
      .single(),
  ])

  // Compatibilidade: link antigo ?profissional=UUID redireciona pro link curto
  let professional = null
  if (professionalIdParam) {
    const { data: prof } = await sb
      .from('profiles')
      .select('id, name, avatar_url, role, slug')
      .eq('id', professionalIdParam)
      .in('role', ['owner', 'professional'])
      .maybeSingle()
    if (prof?.slug) {
      // Redireciona pro link bonito
      redirect(`/agendar/${slug}/${prof.slug}`)
    }
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
