import { NextResponse } from "next/server";

/**
 * GET /api/slots?start=ISO&end=ISO
 *
 * Retorna slots ocupados E configuração de horários do salão.
 * Usa settings/salon.workingDays para saber quais dias/horários Tessy atende.
 * Fallback: 08h–18h, todos os dias exceto domingo.
 */

interface FirestoreValue {
  timestampValue?: string; stringValue?: string; integerValue?: string;
  doubleValue?: number; booleanValue?: boolean; nullValue?: null;
  mapValue?: { fields: Record<string, FirestoreValue> };
}
interface FirestoreDocument {
  name?: string;
  fields?: Record<string, FirestoreValue>;
}
interface RunQueryResponse { document?: FirestoreDocument; }

function extractValue(val: FirestoreValue | undefined): unknown {
  if (!val) return undefined;
  if ("timestampValue" in val) return val.timestampValue;
  if ("stringValue"   in val) return val.stringValue;
  if ("integerValue"  in val) return Number(val.integerValue);
  if ("doubleValue"   in val) return val.doubleValue;
  if ("booleanValue"  in val) return val.booleanValue;
  if ("nullValue"     in val) return null;
  return undefined;
}

// Padrão quando settings/salon não existe ou não carregou
const DEFAULT_WORKING_DAYS = {
  monday:    { enabled: true,  start: "08:00", end: "18:00" },
  tuesday:   { enabled: true,  start: "08:00", end: "18:00" },
  wednesday: { enabled: true,  start: "08:00", end: "18:00" },
  thursday:  { enabled: true,  start: "08:00", end: "18:00" },
  friday:    { enabled: true,  start: "08:00", end: "18:00" },
  saturday:  { enabled: true,  start: "08:00", end: "14:00" },
  sunday:    { enabled: false, start: "09:00", end: "12:00" },
};

const DAY_NAMES = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"] as const;

function parseTime(timeStr: string, baseDate: Date): Date {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end   = searchParams.get("end");

    if (!start || !end) return NextResponse.json({ error: "Parâmetros obrigatórios" }, { status: 400 });

    const startDate = new Date(start);
    const endDate   = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
      return NextResponse.json({ error: "Datas inválidas" }, { status: 400 });

    // ── 1. Tentar Admin SDK (mais eficiente, não precisa de token) ──────
    try {
      const { admin, getFirebaseAdminApp } = await import("@/lib/firebaseAdmin");
      const app = getFirebaseAdminApp();

      if (app) {
        const db = admin.firestore(app);

        // Carregar agendamentos E configuração em paralelo
        const [snapshot, salonSnap] = await Promise.all([
          db.collection("appointments")
            .where("appointmentDate", ">=", startDate)
            .where("appointmentDate", "<=", endDate)
            .get(),
          db.collection("settings").doc("salon").get(),
        ]);

        const workingDays = salonSnap.exists()
          ? (salonSnap.data()?.workingDays ?? DEFAULT_WORKING_DAYS)
          : DEFAULT_WORKING_DAYS;

        const busySlots = snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              appointmentDate: (data.appointmentDate?.toDate?.() ?? new Date(data.appointmentDate)).toISOString(),
              serviceId: data.serviceId as string,
              status: data.status as string,
            };
          })
          .filter(s => ["pending","confirmed"].includes(s.status))
          .map(({ appointmentDate, serviceId }) => ({ appointmentDate, serviceId }));

        return NextResponse.json({ busySlots, workingDays });
      }
    } catch { /* Admin SDK indisponível */ }

    // ── 2. Fallback: Firestore REST API com token do cliente ─────────────
    const authHeader  = req.headers.get("Authorization");
    const clientToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const projectId   = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!projectId) return NextResponse.json({ busySlots: [], workingDays: DEFAULT_WORKING_DAYS });

    const firestoreBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (clientToken) headers["Authorization"] = `Bearer ${clientToken}`;

    // Carregar configuração do salão e agendamentos em paralelo
    const [salonRes, queryRes] = await Promise.allSettled([
      fetch(`${firestoreBase}/settings/salon`, { headers }),
      fetch(`${firestoreBase}:runQuery`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: "appointments" }],
            where: {
              compositeFilter: {
                op: "AND",
                filters: [
                  { fieldFilter: { field: { fieldPath: "appointmentDate" }, op: "GREATER_THAN_OR_EQUAL", value: { timestampValue: startDate.toISOString() } } },
                  { fieldFilter: { field: { fieldPath: "appointmentDate" }, op: "LESS_THAN_OR_EQUAL",    value: { timestampValue: endDate.toISOString()   } } },
                  { fieldFilter: { field: { fieldPath: "status"           }, op: "IN", value: { arrayValue: { values: [{ stringValue:"pending" },{ stringValue:"confirmed" }] } } } },
                ],
              },
            },
            select: { fields: [{ fieldPath: "appointmentDate" }, { fieldPath: "serviceId" }] },
          },
        }),
      }),
    ]);

    // Processar configuração do salão
    let workingDays = DEFAULT_WORKING_DAYS;
    if (salonRes.status === "fulfilled" && salonRes.value.ok) {
      try {
        const salonData = await salonRes.value.json();
        if (salonData.fields?.workingDays?.mapValue?.fields) {
          const wdf = salonData.fields.workingDays.mapValue.fields;
          const parsed: Record<string, { enabled: boolean; start: string; end: string }> = {};
          for (const [day, val] of Object.entries(wdf)) {
            if ((val as FirestoreValue).mapValue?.fields) {
              const f = (val as FirestoreValue).mapValue!.fields;
              parsed[day] = {
                enabled: f.enabled?.booleanValue ?? true,
                start:   f.start?.stringValue ?? "08:00",
                end:     f.end?.stringValue   ?? "18:00",
              };
            }
          }
          if (Object.keys(parsed).length > 0) workingDays = parsed as typeof DEFAULT_WORKING_DAYS;
        }
      } catch { /* usa default */ }
    }

    // Processar agendamentos
    let busySlots: { appointmentDate: string; serviceId: string }[] = [];
    if (queryRes.status === "fulfilled" && queryRes.value.ok) {
      try {
        const results = await queryRes.value.json() as RunQueryResponse[];
        busySlots = results
          .filter(r => r.document?.fields)
          .map(r => ({
            appointmentDate: extractValue(r.document!.fields!.appointmentDate) as string,
            serviceId:       extractValue(r.document!.fields!.serviceId)       as string,
          }))
          .filter(s => s.appointmentDate);
      } catch { /* ignora */ }
    }

    return NextResponse.json({ busySlots, workingDays });

  } catch (error) {
    console.error("Error in /api/slots:", error);
    // Nunca retorna 500 — fallback seguro
    return NextResponse.json({ busySlots: [], workingDays: DEFAULT_WORKING_DAYS });
  }
}
