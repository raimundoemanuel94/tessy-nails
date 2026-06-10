import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: studio, error: studioErr } = await supabase
      .from("studios")
      .select("id, name, slug, plan, brand_color, whatsapp, instagram")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (studioErr || !studio) {
      return NextResponse.json({ error: "Studio não encontrado" }, { status: 404 });
    }

    const [{ data: services }, { data: settings }] = await Promise.all([
      supabase.from("services")
        .select("id, name, description, price, duration_minutes, category")
        .eq("studio_id", studio.id)
        .eq("is_active", true)
        .order("name"),
      supabase.from("salon_settings")
        .select("slot_duration, advance_days, cancel_hours, auto_confirm, working_hours")
        .eq("studio_id", studio.id)
        .single(),
    ]);

    return NextResponse.json({
      studio: {
        id:         studio.id,
        name:       studio.name,
        slug:       studio.slug,
        plan:       studio.plan,
        brandColor: studio.brand_color,
        whatsapp:   studio.whatsapp,
        instagram:  studio.instagram,
      },
      services: (services ?? []).map(s => ({
        id:              s.id,
        name:            s.name,
        description:     s.description,
        price:           Number(s.price),
        durationMinutes: s.duration_minutes,
        category:        s.category,
      })),
      settings: settings ? {
        slotDuration: settings.slot_duration  ?? 30,
        advanceDays:  settings.advance_days   ?? 30,
        cancelHours:  settings.cancel_hours   ?? 2,
        autoConfirm:  settings.auto_confirm   ?? true,
        // normalise to camelCase for frontend compatibility
        workingHours: Object.fromEntries(
          Object.entries(settings.working_hours ?? {}).map(([day, cfg]: [string, any]) => [
            day,
            { isOpen: cfg.is_open ?? false, open: cfg.open ?? "09:00", close: cfg.close ?? "18:00" },
          ])
        ),
      } : null,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/studios/slug]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
