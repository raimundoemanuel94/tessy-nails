import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: studio, error } = await supabase
    .from("studios").select("id, name, slug, avatar_url, brand_color, address, whatsapp, phone, instagram").eq("slug", slug).eq("is_active", true).single();

  if (error || !studio) return NextResponse.json({ error: "Studio não encontrado" }, { status: 404 });

  const [{ data: services }, { data: settings }] = await Promise.all([
    supabase.from("services").select("id, name, price, duration_minutes").eq("studio_id", studio.id).eq("is_active", true).order("name"),
    // Only expose fields needed for booking UI - no internal rules
    supabase.from("salon_settings").select("slot_duration, advance_days").eq("studio_id", studio.id).maybeSingle(),
  ]);

  return NextResponse.json({ studio, services: services ?? [], settings });
}
