import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface Body {
  slug: string;
  service_id: string;
  appointment_date: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  notes?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try { body = await req.json(); } catch { return bad('JSON inválido'); }

  const { slug, service_id, appointment_date, client_name } = body;
  if (!slug || !service_id || !appointment_date || !client_name?.trim())
    return bad('Campos obrigatórios: slug, service_id, appointment_date, client_name');

  const when = new Date(appointment_date);
  if (Number.isNaN(when.getTime())) return bad('appointment_date inválido');
  if (when.getTime() < Date.now()) return bad('Não é possível agendar no passado');

  const supabase = createAdminClient();

  const { data: studio } = await supabase
    .from('studios').select('id, is_active').eq('slug', slug).single();
  if (!studio || !studio.is_active) return bad('Studio indisponível', 404);

  const { data: service } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes, buffer_minutes')
    .eq('id', service_id).eq('studio_id', studio.id).eq('is_active', true).single();
  if (!service) return bad('Serviço inválido para este studio');

  const duration = service.duration_minutes ?? 30;
  const buffer = service.buffer_minutes ?? 0;
  const end = new Date(when.getTime() + (duration + buffer) * 60_000);

  const dayStart = new Date(when); dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(when); dayEnd.setUTCHours(23, 59, 59, 999);

  const { data: sameDay } = await supabase
    .from('appointments')
    .select('appointment_date, duration_minutes')
    .eq('studio_id', studio.id).neq('status', 'cancelled')
    .gte('appointment_date', dayStart.toISOString())
    .lte('appointment_date', dayEnd.toISOString());

  const overlaps = (sameDay ?? []).some(a => {
    const aStart = new Date(a.appointment_date).getTime();
    const aEnd = aStart + (a.duration_minutes ?? 30) * 60_000;
    return when.getTime() < aEnd && end.getTime() > aStart;
  });
  if (overlaps) return bad('Esse horário já está ocupado', 409);

  const { data: settings } = await supabase
    .from('salon_settings').select('auto_confirm').eq('studio_id', studio.id).single();
  const status = settings?.auto_confirm ? 'confirmed' : 'pending';

  let clientId: string | null = null;
  const phone = body.client_phone?.trim();
  if (phone) {
    const { data: existing } = await supabase
      .from('clients').select('id').eq('studio_id', studio.id).eq('phone', phone).maybeSingle();
    clientId = existing?.id ?? null;
  }
  if (!clientId) {
    const { data: newClient, error: cErr } = await supabase
      .from('clients')
      .insert({ studio_id: studio.id, name: client_name.trim(), phone: phone ?? null,
        email: body.client_email?.trim() ?? null, source: 'public' })
      .select('id').single();
    if (cErr || !newClient) return bad('Falha ao registrar cliente', 500);
    clientId = newClient.id;
  }

  const { data: appt, error: aErr } = await supabase
    .from('appointments')
    .insert({ studio_id: studio.id, client_id: clientId, service_id: service.id,
      client_name: client_name.trim(), service_name: service.name,
      appointment_date: when.toISOString(), duration_minutes: duration,
      price: service.price, status, source: 'public',
      notes: body.notes?.trim() ?? null })
    .select('id, status, appointment_date').single();
  if (aErr || !appt) return bad('Falha ao criar agendamento', 500);

  return NextResponse.json({ ok: true, appointment: appt }, { status: 201 });
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
