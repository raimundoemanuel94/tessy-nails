import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { phonesMatch } from "@/lib/booking/client-access";
import { extractIp, isAllowed, rateLimitResponse } from "@/lib/rate-limit";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "appointmentId é obrigatório" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, status, appointment_date, client_name, service_name, price, duration_minutes, client_id, service_id, studio_id")
      .eq("id", id)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
    }

    const { data: studio, error: studioError } = await supabase
      .from("studios")
      .select("id, name, slug, brand_color, avatar_url, whatsapp, phone")
      .eq("id", appointment.studio_id)
      .single();

    if (studioError || !studio) {
      return NextResponse.json({ error: "Studio não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      appointment: {
        ...appointment,
        appointmentId: appointment.id,
        appointmentDate: appointment.appointment_date,
        clientName: appointment.client_name,
        serviceName: appointment.service_name,
        durationMinutes: appointment.duration_minutes,
        studioId: appointment.studio_id,
        serviceId: appointment.service_id,
        clientId: appointment.client_id,
      },
      studio,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao buscar o agendamento";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const ip = extractIp(req)
    if (!isAllowed(`patch-apt:${ip}`, 5, 10 * 60 * 1000)) {
      return rateLimitResponse()
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "");
    const phone = String(body?.phone || "");

    if (!id || !phone || !["confirm", "cancel"].includes(action)) {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, status, appointment_date, client_id, studio_id")
      .eq("id", id)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("phone")
      .eq("id", appointment.client_id)
      .maybeSingle();

    if (!phonesMatch(client?.phone, phone)) {
      return NextResponse.json({ error: "WhatsApp não confere com este agendamento." }, { status: 403 });
    }

    if (["completed", "cancelled", "canceled", "no_show"].includes(appointment.status)) {
      return NextResponse.json({ error: "Este agendamento não pode mais ser alterado pela cliente." }, { status: 409 });
    }

    if (action === "cancel") {
      const { data: settings } = await supabase
        .from("salon_settings")
        .select("cancel_hours")
        .eq("studio_id", appointment.studio_id)
        .single();
      const cancelHours = Number(settings?.cancel_hours ?? 24);
      const appointmentTime = new Date(appointment.appointment_date).getTime();
      if (appointmentTime - Date.now() < cancelHours * 60 * 60 * 1000) {
        return NextResponse.json({
          error: `Cancelamento online permitido até ${cancelHours}h antes. Fale com o salão pelo WhatsApp.`,
        }, { status: 409 });
      }
    }

    const nextStatus = action === "confirm" ? "confirmed" : "cancelled";
    const { data: updated, error: updateError } = await supabase
      .from("appointments")
      .update({ status: nextStatus })
      .eq("id", id)
      .select("id, status, appointment_date, client_name, service_name, price, duration_minutes, client_id, service_id, studio_id")
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: "Não foi possível atualizar o agendamento." }, { status: 500 });
    }

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao atualizar o agendamento";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
