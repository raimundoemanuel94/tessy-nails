// @ts-nocheck
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";

const DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function toMin(t: string) { const [h,m] = t.split(":").map(Number); return h*60+m; }
function fromMin(m: number) { return `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`; }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studioId = searchParams.get("studioId");
  const dateStr  = searchParams.get("date");
  const duration = Number(searchParams.get("duration") ?? "30");

  if (!studioId || !dateStr) return NextResponse.json({ error: "studioId e date são obrigatórios" }, { status: 400 });

  const supabase = await createClient();
  const [y,mo,d] = dateStr.split("-").map(Number);
  const date = new Date(y, mo-1, d);
  const dayName = DAYS[date.getDay()];

  const { data: settings } = await supabase.from("salon_settings").select("*").eq("studio_id", studioId).single();
  const wh: Record<string, { open: string; close: string; is_open: boolean }> = (settings?.working_hours as Record<string, { open: string; close: string; is_open: boolean }>) ?? {};
  const dayConfig = wh[dayName];

  if (!dayConfig?.is_open) return NextResponse.json({ slots: [], reason: "closed" });

  const slotDur = settings?.slot_duration ?? 30;
  const dur     = duration > 0 ? duration : slotDur;
  const openMin = toMin(dayConfig.open);
  const closeMin = toMin(dayConfig.close);

  const allSlots: string[] = [];
  for (let t = openMin; t + dur <= closeMin; t += slotDur) allSlots.push(fromMin(t));

  const { data: appts } = await supabase.from("appointments").select("appointment_date, duration_minutes")
    .eq("studio_id", studioId)
    .gte("appointment_date", startOfDay(date).toISOString())
    .lte("appointment_date", endOfDay(date).toISOString())
    .not("status", "eq", "cancelled");

  const busy = (appts ?? []).map(a => {
    const dt = new Date(a.appointment_date);
    const start = dt.getHours() * 60 + dt.getMinutes();
    return { start, end: start + (a.duration_minutes ?? slotDur) };
  });

  const now = new Date();
  const isToday = now.getFullYear() === y && now.getMonth()+1 === mo && now.getDate() === d;

  const available = allSlots.filter(slot => {
    const s = toMin(slot);
    const e = s + dur;
    if (isToday && s < now.getHours() * 60 + now.getMinutes() + 60) return false;
    return !busy.some(b => s < b.end && e > b.start);
  });

  return NextResponse.json({ slots: available });
}
