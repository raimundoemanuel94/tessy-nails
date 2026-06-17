import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOKING_TIME_ZONE, localDateTimeToUtc, zonedDateString, zonedDayRange, zonedWeekdayKey } from "@/lib/time";
import { normalizePhone } from "@/lib/booking/client-access";

type AppointmentBody = {
  slug?: string;
  studioId?: string;
  studio_id?: string;
  serviceId?: string;
  service_id?: string;
  appointmentDate?: string;
  appointment_date?: string;
  clientName?: string;
  client_name?: string;
  clientPhone?: string;
  client_phone?: string;
  clientEmail?: string;
  client_email?: string;
  notes?: string;
};

// Simple in-memory rate limit: max 3 agendamentos por IP em 10 minutos
const rateLimitMap = new Map<string, { count: number; firstAt: number }>()
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 10 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.firstAt > RATE_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, firstAt: now })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: Request) {
  // Rate limit por IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.' },
      { status: 429 }
    )
  }

  let body: AppointmentBody;

  try {
    body = (await req.json()) as AppointmentBody;
  } catch {
    return bad("JSON inválido");
  }

  const studioIdInput = body.studioId ?? body.studio_id ?? null;
  const slugInput = body.slug?.trim() ?? null;
  const serviceId = body.serviceId ?? body.service_id ?? null;
  const appointmentInput = body.appointmentDate ?? body.appointment_date ?? null;
  const clientName = body.clientName ?? body.client_name ?? "";
  const clientPhone = body.clientPhone ?? body.client_phone ?? "";
  const clientEmail = body.clientEmail ?? body.client_email ?? "";
  const notes = body.notes?.trim() || null;

  if (!appointmentInput || !serviceId || !clientName.trim() || !clientPhone.trim() || (!studioIdInput && !slugInput)) {
    return bad("Campos obrigatórios: studioId ou slug, serviceId, appointmentDate, clientName");
  }

  const when = localDateTimeToUtc(appointmentInput, BOOKING_TIME_ZONE);
  if (Number.isNaN(when.getTime())) return bad("appointmentDate inválido");
  if (when.getTime() < Date.now()) return bad("Não é possível agendar no passado");

  const supabase = createAdminClient();

  let studioQuery = supabase.from("studios").select("id, is_active, whatsapp, phone, name");
  if (studioIdInput) studioQuery = studioQuery.eq("id", studioIdInput);
  else if (slugInput) studioQuery = studioQuery.eq("slug", slugInput);

  const { data: studio, error: studioError } = await studioQuery.single();
  if (studioError || !studio || !studio.is_active) return bad("Studio indisponível", 404);
  const studioPhone = (studio as { whatsapp?: string | null; phone?: string | null }).whatsapp || (studio as { whatsapp?: string | null; phone?: string | null }).phone || null;

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name, price, duration_minutes, buffer_minutes")
    .eq("id", serviceId)
    .eq("studio_id", studio.id)
    .eq("is_active", true)
    .single();
  if (serviceError || !service) return bad("Serviço inválido para este studio");

  const durationMinutes = Number(service.duration_minutes ?? 30);
  const bufferMinutes = Number(service.buffer_minutes ?? 0);
  const reservedMinutes = durationMinutes + bufferMinutes;
  const appointmentEnd = new Date(when.getTime() + reservedMinutes * 60_000);
  const localDate = zonedDateString(when, BOOKING_TIME_ZONE);
  const { start: dayStart, end: dayEnd } = zonedDayRange(localDate, BOOKING_TIME_ZONE);

  const { data: sameDay, error: sameDayError } = await supabase
    .from("appointments")
    .select("appointment_date, duration_minutes, service_id")
    .eq("studio_id", studio.id)
    .neq("status", "cancelled")
    .gte("appointment_date", dayStart.toISOString())
    .lte("appointment_date", dayEnd.toISOString());

  if (sameDayError) return bad("Falha ao validar disponibilidade", 500);

  const serviceIds = Array.from(
    new Set((sameDay ?? []).map((appointment) => appointment.service_id).filter(Boolean) as string[]),
  );

  const serviceDurationById = new Map<string, number>();
  if (serviceIds.length > 0) {
    const { data: relatedServices } = await supabase
      .from("services")
      .select("id, duration_minutes, buffer_minutes")
      .eq("studio_id", studio.id)
      .in("id", serviceIds)
      .eq("is_active", true);

    (relatedServices ?? []).forEach((relatedService) => {
      serviceDurationById.set(
        relatedService.id,
        Number(relatedService.duration_minutes ?? 30) + Number(relatedService.buffer_minutes ?? 0),
      );
    });
  }

  const overlaps = (sameDay ?? []).some((appointment) => {
    const start = new Date(appointment.appointment_date).getTime();
    const reserved = appointment.service_id
      ? serviceDurationById.get(appointment.service_id) ?? Number(appointment.duration_minutes ?? 30)
      : Number(appointment.duration_minutes ?? 30);
    const end = start + reserved * 60_000;
    return when.getTime() < end && appointmentEnd.getTime() > start;
  });
  if (overlaps) return bad("Esse horário já está ocupado", 409);

  const { data: settings } = await supabase
    .from("salon_settings")
    .select("auto_confirm, working_hours, blocked_dates, slot_duration")
    .eq("studio_id", studio.id)
    .single();

  // Validate: blocked date
  const blockedDates = (settings?.blocked_dates as string[]) ?? []
  if (blockedDates.includes(localDate)) return bad("Esta data não está disponível para agendamentos.", 400)

  // Validate: working hours
  const wh = (settings?.working_hours as Record<string, { is_open: boolean; open: string; close: string }>) ?? {}
  const dateOverride = wh[localDate]
  const dayOfWeek = zonedWeekdayKey(when, BOOKING_TIME_ZONE) // returns "monday","tuesday" etc
  const dayConf = dateOverride || wh[dayOfWeek]
  if (!dayConf?.is_open) return bad("O salão não atende neste dia.", 400)

  // Validate: slot is valid (must align with slot grid)
  const slotDur = Number(settings?.slot_duration ?? 30)
  const openMin = Number(dayConf.open.split(":")[0]) * 60 + Number(dayConf.open.split(":")[1])
  const closeMin = Number(dayConf.close.split(":")[0]) * 60 + Number(dayConf.close.split(":")[1])
  const aptLocalMin = when.getUTCHours() * 60 + when.getUTCMinutes() // slot is in local time via localDateTimeToUtc
  // Re-derive local minute from input string
  const [, timePart] = appointmentInput.split("T")
  if (!timePart) return bad("appointmentDate deve ser formato YYYY-MM-DDTHH:MM", 400)
  const [hh, mm] = timePart.split(":").map(Number)
  const slotMin = hh * 60 + mm
  if (slotMin < openMin || slotMin + durationMinutes > closeMin) return bad("Horário fora do expediente.", 400)
  const validSlots: number[] = []
  for (let m = openMin; m + durationMinutes <= closeMin; m += slotDur) validSlots.push(m)
  if (!validSlots.includes(slotMin)) return bad("Horário inválido. Escolha um horário disponível.", 400)

  // Validate: phone
  const normalizedClientPhone = normalizePhone(clientPhone)
  if (!normalizedClientPhone || normalizedClientPhone.length < 10) return bad("Telefone inválido. Informe DDD + número.", 400)

  let status = settings?.auto_confirm ? "confirmed" : "pending";

  let clientId: string | null = null;
  const phone = normalizedClientPhone

  if (phone) {
    const { data: existingClients } = await supabase
      .from("clients")
      .select("id, phone")
      .eq("studio_id", studio.id)
      .not("phone", "is", null);
    const existing = (existingClients ?? []).find((client) => normalizePhone(client.phone) === phone);
    clientId = existing?.id ?? null;
  }

  if (clientId) {
    await supabase
      .from("clients")
      .update({
        name: clientName.trim(),
        phone,
        email: clientEmail.trim() || null,
        is_active: true,
      })
      .eq("id", clientId);
  } else {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        studio_id: studio.id,
        name: clientName.trim(),
        phone: phone || null,
        email: clientEmail.trim() || null,
        source: "public",
      })
      .select("id")
      .single();

    if (clientError || !newClient) return bad("Falha ao registrar cliente", 500);
    clientId = newClient.id;
  }

  const { data: history } = await supabase
    .from("appointments")
    .select("status")
    .eq("studio_id", studio.id)
    .eq("client_id", clientId);

  const noShows = (history ?? []).filter((appointment) => appointment.status === "no_show").length;
  const cancellations = (history ?? []).filter((appointment) => ["cancelled", "canceled"].includes(appointment.status)).length;
  const needsManualReview = noShows > 0 || cancellations >= 2;

  if (noShows >= 2) {
    return bad("Este WhatsApp tem faltas registradas. Para agendar novamente, fale com o salão pelo WhatsApp.", 403);
  }

  if (needsManualReview) status = "pending";

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      studio_id: studio.id,
      client_id: clientId,
      service_id: service.id,
      client_name: clientName.trim(),
      service_name: service.name,
      appointment_date: when.toISOString(),
      duration_minutes: reservedMinutes,
      price: service.price,
      status,
      source: "public",
      notes: [
        notes,
        needsManualReview ? "Atencao: cliente com historico de cancelamento/falta. Confirmar manualmente." : null,
      ].filter(Boolean).join("\n") || null,
    })
    .select(
      "id, status, appointment_date, client_name, service_name, price, duration_minutes, client_id, service_id, studio_id",
    )
    .single();

  if (appointmentError || !appointment) return bad("Falha ao criar agendamento", 500);

  const normalizedAppointment = {
    ...appointment,
    appointmentId: appointment.id,
    appointmentDate: appointment.appointment_date,
    clientName: appointment.client_name,
    serviceName: appointment.service_name,
    durationMinutes: appointment.duration_minutes,
    studioId: appointment.studio_id,
    serviceId: appointment.service_id,
    clientId: appointment.client_id,
  };

  return NextResponse.json(
    {
      ok: true,
      appointment: normalizedAppointment,
      studioPhone,
    },
    { status: 201 },
  );
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
