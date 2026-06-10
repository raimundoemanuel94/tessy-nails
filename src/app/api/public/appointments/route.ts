import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BOOKING_TIME_ZONE, localDateTimeToUtc, zonedDateString, zonedDayRange } from "@/lib/time";

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
  const appointmentInput = body.appointmentDate ?? body.appointment_date ?? null;
  const clientName = body.clientName ?? body.client_name ?? "";
  const clientPhone = body.clientPhone ?? body.client_phone ?? "";
  const clientEmail = body.clientEmail ?? body.client_email ?? "";
  const notes = body.notes?.trim() || null;

  if (!appointmentInput || !serviceId || !clientName.trim() || (!studioIdInput && !slugInput)) {
    return bad("Campos obrigatórios: studioId ou slug, serviceId, appointmentDate, clientName");
  }

  const when = localDateTimeToUtc(appointmentInput, BOOKING_TIME_ZONE);
  if (Number.isNaN(when.getTime())) return bad("appointmentDate inválido");
  if (when.getTime() < Date.now()) return bad("Não é possível agendar no passado");

  const supabase = createAdminClient();

  let studioQuery = supabase.from("studios").select("id, is_active");
  if (studioIdInput) studioQuery = studioQuery.eq("id", studioIdInput);
  else if (slugInput) studioQuery = studioQuery.eq("slug", slugInput);

  const { data: studio, error: studioError } = await studioQuery.single();
  if (studioError || !studio || !studio.is_active) return bad("Studio indisponível", 404);

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
    .select("auto_confirm")
    .eq("studio_id", studio.id)
    .single();

  const status = settings?.auto_confirm ? "confirmed" : "pending";

  let clientId: string | null = null;
  const phone = clientPhone.trim();

  if (phone) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("studio_id", studio.id)
      .eq("phone", phone)
      .maybeSingle();
    clientId = existing?.id ?? null;
  }

  if (!clientId) {
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
      notes,
    })
    .select(
      "id, status, appointment_date, client_name, service_name, price, duration_minutes, client_id, service_id, studio_id",
    )
    .single();

  if (appointmentError || !appointment) return bad("Falha ao criar agendamento", 500);

  return NextResponse.json(
    {
      ok: true,
      appointment,
    },
    { status: 201 },
  );
}

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
