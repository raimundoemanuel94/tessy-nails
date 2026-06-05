import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

const APP_NAME = "slots-v1";

function getApp(): admin.app.App {
  const existing = admin.apps.find((a) => a?.name === APP_NAME);
  if (existing) return existing;

  const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  if (!privateKey) throw new Error("FIREBASE_PRIVATE_KEY não configurada");

  return admin.initializeApp(
    {
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID ?? "nailit-792a7",
        clientEmail:
          process.env.FIREBASE_CLIENT_EMAIL ??
          "firebase-adminsdk-fbsvc@nailit-792a7.iam.gserviceaccount.com",
        privateKey,
      }),
    },
    APP_NAME
  );
}

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

/** "09:30" → minutos desde meia-noite */
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** minutos → "09:30" */
function fromMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studioId = searchParams.get("studioId");
    const dateStr = searchParams.get("date"); // "YYYY-MM-DD"
    const serviceDuration = Number(searchParams.get("duration") ?? "0");

    if (!studioId || !dateStr) {
      return NextResponse.json(
        { error: "Parâmetros obrigatórios: studioId, date" },
        { status: 400 }
      );
    }

    const db = admin.firestore(getApp());

    // 1. Busca settings
    const settingsDoc = await db
      .collection("studios")
      .doc(studioId)
      .collection("settings")
      .doc("salon")
      .get();

    if (!settingsDoc.exists) {
      return NextResponse.json({ error: "Settings não encontradas" }, { status: 404 });
    }

    const settings = settingsDoc.data()!;
    const slotDuration: number = settings.slotDuration ?? 30;
    const workingHours = settings.workingHours ?? {};

    // 2. Determina dia da semana
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const dayName = DAY_NAMES[date.getDay()];
    const dayConfig = workingHours[dayName];

    if (!dayConfig || !dayConfig.isOpen) {
      return NextResponse.json({ slots: [], reason: "closed" });
    }

    const openMinutes = toMinutes(dayConfig.open);
    const closeMinutes = toMinutes(dayConfig.close);
    const duration = serviceDuration > 0 ? serviceDuration : slotDuration;

    // 3. Gera todos os slots possíveis
    const allSlots: string[] = [];
    for (let t = openMinutes; t + duration <= closeMinutes; t += slotDuration) {
      allSlots.push(fromMinutes(t));
    }

    // 4. Busca agendamentos do dia (status != cancelled)
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

    const appointmentsSnap = await db
      .collection("studios")
      .doc(studioId)
      .collection("appointments")
      .where("appointmentDate", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
      .where("appointmentDate", "<=", admin.firestore.Timestamp.fromDate(endOfDay))
      .get();

    // 5. Monta blocos ocupados (início + duração de cada agendamento)
    const busyBlocks: Array<{ start: number; end: number }> = [];

    for (const doc of appointmentsSnap.docs) {
      const data = doc.data();
      if (data.status === "cancelled") continue;

      const apptDate: admin.firestore.Timestamp = data.appointmentDate;
      const apptDateObj = apptDate.toDate();
      const apptMinutes = apptDateObj.getHours() * 60 + apptDateObj.getMinutes();
      const apptDuration: number = data.durationMinutes ?? slotDuration;

      busyBlocks.push({ start: apptMinutes, end: apptMinutes + apptDuration });
    }

    // 6. Filtra slots disponíveis
    const now = new Date();
    const isToday =
      now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day;

    const availableSlots = allSlots.filter((slot) => {
      const slotStart = toMinutes(slot);
      const slotEnd = slotStart + duration;

      // Ignora slots no passado (se hoje)
      if (isToday) {
        const nowMinutes = now.getHours() * 60 + now.getMinutes() + 60; // +1h buffer
        if (slotStart < nowMinutes) return false;
      }

      // Verifica conflito com agendamentos existentes
      for (const busy of busyBlocks) {
        if (slotStart < busy.end && slotEnd > busy.start) return false;
      }

      return true;
    });

    return NextResponse.json({ slots: availableSlots, date: dateStr, studioId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/slots]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
