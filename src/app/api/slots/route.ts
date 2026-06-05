import { NextRequest, NextResponse } from "next/server";
import { admin, getFirebaseAdminApp } from "@/lib/firebaseAdmin";
import { getCookieValue, APP_SESSION_COOKIE_NAME, verifyAppSessionToken } from "@/lib/server/session";

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

export async function GET(req: NextRequest) {
  try {
    const app = getFirebaseAdminApp();
    if (!app) return NextResponse.json({ error: "Firebase Admin nao configurado" }, { status: 503 });

    const db = admin.firestore(app);
    const { searchParams } = new URL(req.url);
    const hasNewFormat = searchParams.has("studioId") || searchParams.has("date");
    const hasOldFormat = searchParams.has("start") || searchParams.has("end");

    if (hasNewFormat) {
      const studioId = searchParams.get("studioId");
      const dateStr  = searchParams.get("date");
      const duration = Number(searchParams.get("duration") ?? "0");

      if (!studioId || !dateStr) {
        return NextResponse.json({ error: "Parametros obrigatorios: studioId, date" }, { status: 400 });
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

      const allSlots: string[] = [];
      for (let t = openMin; t + dur <= closeMin; t += slotDuration) {
        allSlots.push(fromMinutes(t));
      }

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

    if (hasOldFormat) {
      const start = searchParams.get("start");
      const end   = searchParams.get("end");

      if (!start || !end) {
        return NextResponse.json({ error: "Parametros obrigatorios: start, end" }, { status: 400 });
      }

      const startDate = new Date(start);
      const endDate   = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({ error: "Datas invalidas" }, { status: 400 });
      }

      let studioId: string | null = null;
      const token = getCookieValue(req.headers.get("cookie"), APP_SESSION_COOKIE_NAME);
      if (token) {
        const session = await verifyAppSessionToken(token);
        if (session?.uid) {
          const userDoc = await db.collection("users").doc(session.uid).get();
          studioId = userDoc.exists ? (userDoc.data()?.studioId as string | null) ?? null : null;
        }
      }

      let apptSnap;
      if (studioId) {
        apptSnap = await db
          .collection("studios").doc(studioId)
          .collection("appointments")
          .where("appointmentDate", ">=", admin.firestore.Timestamp.fromDate(startDate))
          .where("appointmentDate", "<=", admin.firestore.Timestamp.fromDate(endDate))
          .get();
      } else {
        apptSnap = await db.collection("appointments")
          .where("appointmentDate", ">=", admin.firestore.Timestamp.fromDate(startDate))
          .where("appointmentDate", "<=", admin.firestore.Timestamp.fromDate(endDate))
          .get();
      }

      const busySlots = apptSnap.docs
        .filter((d) => !["cancelled", "no_show"].includes(d.data().status ?? ""))
        .map((d) => {
          const data = d.data();
          const dt: Date = (data.appointmentDate as admin.firestore.Timestamp).toDate();
          return {
            time: `${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`,
            serviceId: data.serviceId ?? "",
            duration:  data.durationMinutes ?? 30,
          };
        });

      const DEFAULT_WORKING_DAYS = {
        monday:    { enabled: true,  start: "08:00", end: "18:00" },
        tuesday:   { enabled: true,  start: "08:00", end: "18:00" },
        wednesday: { enabled: true,  start: "08:00", end: "18:00" },
        thursday:  { enabled: true,  start: "08:00", end: "18:00" },
        friday:    { enabled: true,  start: "08:00", end: "18:00" },
        saturday:  { enabled: true,  start: "08:00", end: "14:00" },
        sunday:    { enabled: false, start: "09:00", end: "12:00" },
      };

      let workingDays: typeof DEFAULT_WORKING_DAYS = DEFAULT_WORKING_DAYS;

      if (studioId) {
        const settingsDoc = await db
          .collection("studios").doc(studioId)
          .collection("settings").doc("salon").get();

        if (settingsDoc.exists) {
          const wh = settingsDoc.data()?.workingHours;
          if (wh) {
            workingDays = Object.fromEntries(
              Object.entries(wh).map(([d, cfg]) => {
                const c = cfg as { isOpen?: boolean; open?: string; close?: string };
                return [d, { enabled: c.isOpen ?? false, start: c.open ?? "09:00", end: c.close ?? "18:00" }];
              })
            ) as typeof DEFAULT_WORKING_DAYS;
          }
        }
      }

      return NextResponse.json({ busySlots, workingDays });
    }

    return NextResponse.json({ error: "Use ?studioId=&date= ou ?start=&end=" }, { status: 400 });

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/slots]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
