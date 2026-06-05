import { NextRequest, NextResponse } from "next/server";
import { admin, getFirebaseAdminApp } from "@/lib/firebaseAdmin";
import { getCookieValue, APP_SESSION_COOKIE_NAME, verifyAppSessionToken } from "@/lib/server/session";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAY_NAMES = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as const;

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

// ─── GET /api/slots ────────────────────────────────────────────────────────────
//
// Suporta DOIS formatos:
//
//  Formato A (novo — /agendar/[slug] público):
//    ?studioId=xxx&date=YYYY-MM-DD&duration=45
//    → { slots: ["09:00","09:30",...], date, studioId }
//
//  Formato B (antigo — /cliente/agendar autenticado):
//    ?start=ISO&end=ISO
//    → { busySlots: [{time, serviceId},...], workingDays: {...} }
//
export async function GET(req: NextRequest) {
  try {
    const app = getFirebaseAdminApp();
    if (!app) return NextResponse.json({ error: "Firebase Admin não configurado" }, { status: 503 });

    const db = admin.firestore(app);
    const { searchParams } = new URL(req.url);

    const hasNewFormat = searchParams.has("studioId") || searchParams.has("date");
    const hasOldFormat = searchParams.has("start") || searchParams.has("end");

    // ── Formato A: novo ──────────────────────────────────────────────────────
    if (hasNewFormat) {
      const studioId = searchParams.get("studioId");
      const dateStr  = searchParams.get("date"); // "YYYY-MM-DD"
      const duration = Number(searchParams.get("duration") ?? "0");

      if (!studioId || !dateStr) {
        return NextResponse.json({ error: "Parâmetros obrigatórios: studioId, date" }, { status: 400 });
      }

      const settingsDoc = await db
        .collection("studios").doc(studioId)
        .collection("settings").doc("salon").get();

      const settings = settingsDoc.exists ? settingsDoc.data()! : null;
      const slotDuration: number = settings?.slotDuration ?? 30;
      const workingHours = settings?.workingHours ?? {};

      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      const dayName = DAY_NAMES[date.getDay()];
      const dayConfig = workingHours[dayName];

      if (!dayConfig || !dayConfig.isOpen) {
        return NextResponse.json({ slots: [], reason: "closed" });
      }

      const openMin  = toMinutes(dayConfig.open);
      const closeMin = toMinutes(dayConfig.close);
      const dur      = duration > 0 ? duration : slotDuration;

      // Todos os slots possíveis
      const allSlots: string[] = [];
      for (let t = openMin; t + dur <= closeMin; t += slotDuration) {
        allSlots.push(fromMinutes(t));
      }

      // Agendamentos do dia
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
      const endOfDay   = new Date(year, month - 1, day, 23, 59, 59);

      const snap = await db
        .collection("studios").doc(studioId)
        .collection("appointments")
        .where("appointmentDate", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
        .where("appointmentDate", "<=", admin.firestore.Timestamp.fromDate(endOfDay))
        .get();

      const busyBlocks: Array<{ start: number; end: number }> = [];
      for (const doc of snap.docs) {
        const data = doc.data();
        if (data.status === "cancelled") continue;
        const apptDate: Date = (data.appointmentDate as admin.firestore.Timestamp).toDate();
        const apptMin  = apptDate.getHours() * 60 + apptDate.getMinutes();
        const apptDur: number = data.durationMinutes ?? slotDuration;
        busyBlocks.push({ start: apptMin, end: apptMin + apptDur });
      }

      const now = new Date();
      const isToday = now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day;

      const available = allSlots.filter((slot) => {
        const slotStart = toMinutes(slot);
        const slotEnd   = slotStart + dur;
        if (isToday) {
          const nowMin = now.getHours() * 60 + now.getMinutes() + 60;
          if (slotStart < nowMin) return false;
        }
        return !busyBlocks.some((b) => slotStart < b.end && slotEnd > b.start);
      });

      return NextResponse.json({ slots: available, date: dateStr, studioId });
    }

    // ── Formato B: antigo (?start=ISO&end=ISO) ───────────────