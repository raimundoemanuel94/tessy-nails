// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studioId, serviceId, serviceName, durationMinutes, price, appointmentDate, clientName, clientPhone, clientEmail } = body;

  if (!studioId || !appointmentDate || !clientName || !clientPhone) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const supabase = await createClient();
  const apptDate = new Date(appointmentDate);
  const apptEnd  = new Date(apptDate.getTime() + (durationMinutes ?? 30) * 60000);

  // Check conflict
  const { data: existing } = await supabase.from("appointments").select("appointment_date, duration_minutes")
    .eq("studio_id", studioId).not("status", "eq", "cancelled")
    .gte("appointment_date", new Date(apptDate.getTime() - 120*60000).toISOString())
    .lte("appointment_date", new Date(apptDate.getTime() + 120*60000).toISOString());

  for (const e of existing ?? []) {
    const eStart = new Date(e.appointment_date).getTime();
    const eEnd   = eStart + (e.duration_minutes ?? 30) * 60000;
    if (apptDate.getTime() < eEnd && apptEnd.getTime() > eStart) {
      return NextResponse.json({ error: "Horário já ocupado. Escolha outro." }, { status: 409 });
    }
  }

  // Find or create client
  let clientId: string | null = null;
  const { data: existingClient } = await supabase.from("clients").select("id").eq("studio_id", studioId).eq("phone", clientPhone).maybeSingle();
  if (existingClient) {
    clientId = existingClient.id;
    await supabase.from("clients").update({ name: clientName, email: clientEmail || null }).eq("id", clientId);
  } else {
    const { data: newClient } = await supabase.from("clients").insert({
      studio_id: studioId, name: clientName, phone: clientPhone, email: clientEmail || null, source: "online_booking",
    }).select("id").single();
    clientId = newClient?.id ?? null;
  }

  const { data: appt, error } = await supabase.from("appointments").insert({
    studio_id: studioId, client_id: clientId, service_id: serviceId || null,
    client_name: clientName, service_name: serviceName || "",
    appointment_date: appointmentDate, duration_minutes: durationMinutes ?? 30,
    price: price ?? 0, source: "online_booking",
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, appointmentId: appt.id });
}
