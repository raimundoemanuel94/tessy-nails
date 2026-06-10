// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'superadmin') redirect('/dashboard')

  const { data: studios } = await sb
    .from('studios')
    .select(`
      id, name, slug, avatar_url, brand_color, plan, is_active, created_at, trial_ends_at,
      phone, whatsapp, instagram, address,
      profiles!studios_owner_id_fkey(name, email)
    `)
    .order('created_at', { ascending: false })

  // Counters per studio
  const studioIds = (studios || []).map((s: any) => s.id)
  const [{ data: apptCounts }, { data: clientCounts }, { data: svcCounts }] = await Promise.all([
    sb.from('appointments').select('studio_id').in('studio_id', studioIds),
    sb.from('clients').select('studio_id').in('studio_id', studioIds),
    sb.from('services').select('studio_id').eq('is_active', true).in('studio_id', studioIds),
  ])

  const count = (rows: any[], id: string) => (rows || []).filter((r: any) => r.studio_id === id).length

  const studiosWithCounts = (studios || []).map((s: any) => ({
    ...s,
    appt_count:   count(apptCounts, s.id),
    client_count: count(clientCounts, s.id),
    svc_count:    count(svcCounts, s.id),
  }))

  return <AdminClient studios={studiosWithCounts} />
}
