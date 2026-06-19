import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOKING_TIME_ZONE, localDateTimeToUtc, zonedDateString, zonedDayRange } from "@/lib/time";
import { normalizePhone } from "@/lib/booking/client-access";

type AppointmentBody = {
  slug?: string;
  studioId?: string;
  studio_id?: string;
  serviceId?: string;
  service_id?: string;
  professionalId?: string;
  professional_id?: string;
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

export async function POST(req: Request) {
  let body: AppointmentBody;

  try {
    body = (await req.json()) as AppointmentBody;
  } catch {
    return bad("JSON inválido");
  }

  const studioIdInput = body.studioId ?? body.studio_id ?? null;
  const slugInput = body.slug?.trim() ?? null;
  const serviceId = body.serviceId ?? body.service_id ?? null;
  const professionalId = body.professionalId ?? body.professional_id ?? null;
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
  const studioPhone = (studio as any).whatsapp || (studio as any).phone || null;

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name, price, duration_minutes, buffer_minutes")
    .eq("id", serviceId)
    .eq("studio_id", studio.id)
    .eq("is_active", true)
    .single();
  if (serviceError || !service) return bad("Serviço inválido para este studio");

  if (professionalId) {
    const { data: professional, error: professionalError } = await supabase
      .from("profiles")
      .select("id, role, studio_id")
      .eq("id", professionalId)
      .eq("studio_id", studio.id)
      .in("role", ["owner", "professional"])
      .maybeSingle();

    if (professionalError || !professional) return bad("Profissional invalido para este studio");
  }

  const durationMinutes = Number(service.duration_minutes ?? 30);
  const bufferMinutes = Number(service.buffer_minutes ?? 0);
  const reservedMinutes = durationMinutes + bufferMinutes;
  const appointmentEnd = new Date(when.getTime() + reservedMinutes * 60_000);
  const localDate = zonedDateString(when, BOOKING_TIME_ZONE);
  const { start: dayStart, end: dayEnd } = zonedDayRange(localDate, BOOKING_TIME_ZONE);

  let sameDayQuery = supabase
    .from("appointments")
    .select(professionalId ? "appointment_date, duration_minutes, service_id, professional_id" : "appointment_date, duration_minutes, service_id")
    .eq("studio_id", studio.id)
    .neq("status", "cancelled")
    .gte("appointment_date", dayStart.toISOString())
    .lte("appointment_date", dayEnd.toISOString());

  if (professionalId) {
    sameDayQuery = sameDayQuery.or(`professional_id.eq.${professionalId},professional_id.is.null`);
  }

  let { data: sameDay, error: sameDayError } = await sameDayQuery;

  if (sameDayError && professionalId) {
    const fallback = await supabase
      .from("appointments")
      .select("appointment_date, duration_minutes, service_id")
      .eq("studio_id", studio.id)
      .neq("status", "cancelled")
      .gte("appointment_date", dayStart.toISOString())
      .lte("appointment_date", dayEnd.toISOString());

    sameDay = fallback.data;
    sameDayError = fallback.error;
  }

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
    .select("auto_confirm")
    .eq("studio_id", studio.id)
    .single();

  let status = "pending";

  let clientId: string | null = null;
  const phone = normalizePhone(clientPhone);

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

  const appointmentPayload: Record<string, unknown> = {
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
  };

  if (professionalId) appointmentPayload.professional_id = professionalId;

  let { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert(appointmentPayload)
    .select(
      professionalId
        ? "id, status, appointment_date, client_name, service_name, price, duration_minutes, client_id, service_id, studio_id, professional_id"
        : "id, status, appointment_date, client_name, service_name, price, duration_minutes, client_id, service_id, studio_id",
    )
    .single();

  if (appointmentError && professionalId) {
    const { professional_id: _professionalId, ...fallbackPayload } = appointmentPayload;
    const fallback = await supabase
      .from("appointments")
      .insert(fallbackPayload)
      .select("id, status, appointment_date, client_name, service_name, price, duration_minutes, client_id, service_id, studio_id")
      .single();

    appointment = fallback.data;
    appointmentError = fallback.error;
  }

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
    professionalId: appointment.professional_id ?? null,
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
