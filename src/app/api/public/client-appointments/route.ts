import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePhone, phonesMatch } from "@/lib/booking/client-access";
import { checkRateLimit, rateLimitResponse, requestIp } from "@/lib/rate-limit";

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export async function GET(req: Request) {
  const ip = requestIp(req);
  if (!checkRateLimit(`public:client-appointments:get:${ip}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    return rateLimitResponse();
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim();
  const phone = normalizePhone(searchParams.get("phone"));

  if (!slug || !phone) {
    return NextResponse.json({ error: "Informe o link do studio e o WhatsApp." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: studio, error: studioError } = await supabase
    .from("studios")
    .select("id, name, slug, brand_color, avatar_url, whatsapp, phone")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (studioError || !studio) {
    return NextResponse.json({ error: "Studio não encontrado." }, { status: 404 });
  }

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id, name, phone")
    .eq("studio_id", studio.id)
    .not("phone", "is", null);

  if (clientsError) {
    return NextResponse.json({ error: "Não foi possível consultar clientes." }, { status: 500 });
  }

  const matchedClients = (clients ?? []).filter((client) => phonesMatch(client.phone, phone));
  if (matchedClients.length === 0) {
    return NextResponse.json({ studio, client: null, appointments: [] });
  }

  const clientIds = matchedClients.map((client) => client.id);
  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("id, status, appointment_date, client_name, service_name, price, duration_minutes, client_id, service_id, studio_id")
    .eq("studio_id", studio.id)
    .in("client_id", clientIds)
    .order("appointment_date", { ascending: false })
    .limit(20);

  if (appointmentsError) {
    return NextResponse.json({ error: "Não foi possível consultar agendamentos." }, { status: 500 });
  }

  return NextResponse.json({
    studio,
    client: matchedClients[0],
    appointments: appointments ?? [],
  });
}
