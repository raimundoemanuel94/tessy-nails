import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DAY_NAMES = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as const;

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2,"0")}:${String(minutes % 60).padStart(2,"0")}`;
}

export async function GET(req: NextRequest) {
  try {
    const supabase   = await createClient();
    const { searchParams } = new URL(req.url);

    const studioId = searchParams.get("studioId");
    const dateStr  = searchParams.get("date");       // "YYYY-MM-DD"
    const duration = Number(searchParams.get("duration") ?? "0");

    if (!studioId || !dateStr) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios: studioId, date" },
        { status: 400 }
      );
    }

    // Fetch settings
    const { data: settings } = await supabase
      .from("salon_settings")
      .select("slot_duration, working_hours")
      .eq("studio_id", studioId)
      .single();

    const slotDuration: number = settings?.slot_duration ?? 30;
    const workingHours         = settings?.working_hours ?? {};

    // Determine day config
    const [year, month, day] = dateStr.split("-").map(Number);
    const date    = new Date(year, month - 1, day);
    const dayName = DAY_NAMES[date.getDay()];
    const dayConfig = workingHours[dayName];

    if (!dayConfig || !dayConfig.is_open) {
      return NextResponse.json({ slots: [], reason: "closed" });
    }

    const openMin  = toMinutes(dayConfig.open);
    const closeMin = toMinutes(dayConfig.close);
    const dur      = duration > 0 ? duration : slotDuration;

    // All possible slots
    const allSlots: string[] = [];
    for (let t = openMin; t + dur <= closeMin; t += slotDuration) {
      allSlots.push(fromMinutes(t));
    }

    // Fetch existing appointments for that day
    const startISO = new Date(year, month - 1, day, 0, 0, 0).toISOString();
    const endISO   = new Date(year, month - 1, day, 23, 59, 59).toISOString();

    const { data: appts } = await supabase
      .from("appointments")
      .select("appointment_date, duration_minutes, status")
      .eq("studio_id", studioId)
      .gte("appointment_date", startISO)
      .lte("appointment_date", endISO)
      .neq("status", "cancelled");

    const busyBlocks = (appts ?? []).map(a => {
      const d   = new Date(a.appointment_date);
      const min = d.getHours() * 60 + d.getMinutes();
      return { start: min, end: min + (a.duration_minutes ?? slotDuration) };
    });

    const now     = new Date();
    const isToday = now.getFullYear() === year && (now.getMonth() + 1) === month && now.getDate() === day;

    const available = allSlots.filter(slot => {
      const s = toMinutes(slot);
      const e = s + dur;
      if (isToday && s < now.getHours() * 60 + now.getMinutes() + 60) return false;
      return !busyBlocks.some(b => s < b.end && e > b.start);
    });

    return NextResponse.json({ slots: available, date: dateStr, studioId });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/slots]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
