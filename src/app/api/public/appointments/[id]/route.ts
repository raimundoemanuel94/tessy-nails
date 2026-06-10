import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
