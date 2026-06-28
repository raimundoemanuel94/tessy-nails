import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BOOKING_TIME_ZONE,
  isSameZonedDate,
  zonedDayRange,
  zonedMinutes,
} from "@/lib/time";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function toMin(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function fromMin(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

async function resolveStudioId(supabase: ReturnType<typeof createAdminClient>, params: URLSearchParams) {
  const studioId = params.get("studioId") ?? params.get("studio_id");
  const slug = params.get("slug");

  if (studioId) return studioId;
  if (!slug) return null;

  const { data: studio } = await supabase
    .from("studios")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  return studio?.id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    const supabase = createAdminClient();
    const studioId = await resolveStudioId(supabase, searchParams);

    if (!studioId || !dateStr) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios: studioId (ou slug) e date" },
        { status: 400 },
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json({ error: "date inválido" }, { status: 400 });
    }

    const { data: settings, error: settingsError } = await supabase
      .from("salon_settings")
      .select("slot_duration, working_hours, blocked_dates")
      .eq("studio_id", studioId)
      .single();

    if (settingsError) {
      return NextResponse.json(
        { error: "Não foi possível carregar as configurações do studio" },
        { status: 500 },
      );
    }

    const dayRange = zonedDayRange(dateStr, BOOKING_TIME_ZONE);
    const workingHours =
      (settings?.working_hours as Record<string, { open: string; close: string; is_open: boolean }>) ?? {};
    // Check if this date is manually blocked
    const blockedDates = (settings.blocked_dates as string[]) ?? []
    if (blockedDates.includes(dateStr)) {
      return NextResponse.json({ slots: [], reason: "blocked", date: dateStr })
    }

    // Resolve effective config: date override first, then weekday default
    const WEEKDAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as const
    const dateOverride = (workingHours as Record<string, { is_open: boolean; open: string; close: string }>)[dateStr]
    const weekdayKey = WEEKDAY_KEYS[new Date(dateStr + 'T12:00:00').getDay()]
    const weekdayConfig = (workingHours as Record<string, { is_open: boolean; open: string; close: string }>)[weekdayKey]
    const effectiveConfig = dateOverride ?? weekdayConfig

    if (!effectiveConfig?.is_open) {
      return NextResponse.json({ slots: [], reason: "not_released", date: dateStr });
    }

    const slotDuration = Number(settings?.slot_duration ?? 30);
    const serviceId = searchParams.get("serviceId") ?? searchParams.get("service_id");
    let selectedDuration = Number(searchParams.get("duration") ?? slotDuration);

    if (serviceId) {
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("id, duration_minutes, buffer_minutes")
        .eq("studio_id", studioId)
        .eq("id", serviceId)
        .eq("is_active", true)
        .single();

      if (serviceError || !service) {
        return NextResponse.json({ error: "Serviço inválido para este studio" }, { status: 404 });
      }

      selectedDuration = Number(service.duration_minutes ?? 30) + Number(service.buffer_minutes ?? 0);
    }

    const duration = Number.isFinite(selectedDuration) && selectedDuration > 0 ? selectedDuration : slotDuration;
    const openMin = toMin(effectiveConfig.open);
    const closeMin = toMin(effectiveConfig.close);

    const allSlots: string[] = [];
    for (let minute = openMin; minute + duration <= closeMin; minute += slotDuration) {
      allSlots.push(fromMin(minute));
    }

    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("appointment_date, duration_minutes, status, service_id")
      .eq("studio_id", studioId)
      .gte("appointment_date", dayRange.start.toISOString())
      .lte("appointment_date", dayRange.end.toISOString())
      .neq("status", "cancelled");

    if (appointmentsError) {
      return NextResponse.json(
        { error: "Não foi possível carregar os agendamentos do dia" },
        { status: 500 },
      );
    }

    const appointmentServiceIds = Array.from(
      new Set((appointments ?? []).map((appointment) => appointment.service_id).filter(Boolean) as string[]),
    );

    const serviceDurationById = new Map<string, number>();
    if (appointmentServiceIds.length > 0) {
      const { data: services } = await supabase
        .from("services")
        .select("id, duration_minutes, buffer_minutes")
        .eq("studio_id", studioId)
        .in("id", appointmentServiceIds)
        .eq("is_active", true);

      (services ?? []).forEach((service) => {
        serviceDurationById.set(
          service.id,
          Number(service.duration_minutes ?? 30) + Number(service.buffer_minutes ?? 0),
        );
      });
    }

    const busyRanges = (appointments ?? []).map((appointment) => {
      const start = zonedMinutes(new Date(appointment.appointment_date), BOOKING_TIME_ZONE);
      const reserved = appointment.service_id
        ? serviceDurationById.get(appointment.service_id) ?? Number(appointment.duration_minutes ?? slotDuration)
        : Number(appointment.duration_minutes ?? slotDuration);
      const end = start + reserved;
      return { start, end };
    });

    const now = new Date();
    const isToday = isSameZonedDate(now, dayRange.start, BOOKING_TIME_ZONE);
    const currentMinutes = zonedMinutes(now, BOOKING_TIME_ZONE);

    const available = allSlots.filter((slot) => {
      const start = toMin(slot);
      const end = start + duration;

      if (isToday && start < currentMinutes + 60) return false;

      return !busyRanges.some((busy) => start < busy.end && end > busy.start);
    });

    return NextResponse.json({
      slots: available,
      date: dateStr,
      studioId,
      duration,
    });
  } catch {
    return NextResponse.json(
      { error: "Erro inesperado ao calcular os horários disponíveis" },
      { status: 500 },
    );
  }
}
