import { NextResponse } from "next/server";

/**
 * GET /api/slots?start=ISO&end=ISO
 *
 * Rota pública (sem autenticação) — usada pelo PWA do cliente para verificar
 * quais horários estão ocupados em um intervalo de datas.
 * Retorna apenas appointmentDate e serviceId (sem dados pessoais).
 *
 * Usa a Firestore REST API com Firebase Admin SDK (server-side).
 * Fallback: se Admin SDK não estiver configurado, usa a REST API pública.
 */

interface FirestoreValue {
  timestampValue?: string;
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
}

interface FirestoreDocument {
  name?: string;
  fields?: Record<string, FirestoreValue>;
}

interface RunQueryResponse {
  document?: FirestoreDocument;
  skippedResults?: number;
}

function extractValue(val: FirestoreValue | undefined): string | number | boolean | null | undefined {
  if (!val) return undefined;
  if ("timestampValue" in val) return val.timestampValue;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) return Number(val.integerValue);
  if ("doubleValue" in val) return val.doubleValue;
  if ("booleanValue" in val) return val.booleanValue;
  if ("nullValue" in val) return null;
  return undefined;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end   = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { error: "Parametros 'start' e 'end' sao obrigatorios" },
        { status: 400 }
      );
    }

    const startDate = new Date(start);
    const endDate   = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Datas invalidas" }, { status: 400 });
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "start deve ser anterior a end" },
        { status: 400 }
      );
    }

    // ✅ Try Admin SDK first (if credentials are configured)
    try {
      const { admin, getFirebaseAdminApp } = await import("@/lib/firebaseAdmin");
      const app = getFirebaseAdminApp();

      if (app) {
        const snapshot = await admin
          .firestore(app)
          .collection("appointments")
          .where("appointmentDate", ">=", startDate)
          .where("appointmentDate", "<=", endDate)
          .get();

        const busySlots = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              appointmentDate: (data.appointmentDate?.toDate?.() ?? new Date(data.appointmentDate)).toISOString(),
              serviceId: data.serviceId as string,
              status: data.status as string,
            };
          })
          .filter((s) => ["pending", "confirmed"].includes(s.status))
          .map(({ appointmentDate, serviceId }) => ({ appointmentDate, serviceId }));

        return NextResponse.json({ busySlots });
      }
    } catch {
      // Admin SDK not available, fall through to REST API
    }

    // ✅ Fallback: Firestore REST API (no admin credentials needed)
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!projectId) {
      return NextResponse.json(
        { error: "Configuracao do Firebase nao encontrada" },
        { status: 500 }
      );
    }

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;

    const queryBody = {
      structuredQuery: {
        from: [{ collectionId: "appointments" }],
        where: {
          compositeFilter: {
            op: "AND",
            filters: [
              {
                fieldFilter: {
                  field: { fieldPath: "appointmentDate" },
                  op: "GREATER_THAN_OR_EQUAL",
                  value: { timestampValue: startDate.toISOString() },
                },
              },
              {
                fieldFilter: {
                  field: { fieldPath: "appointmentDate" },
                  op: "LESS_THAN_OR_EQUAL",
                  value: { timestampValue: endDate.toISOString() },
                },
              },
              {
                fieldFilter: {
                  field: { fieldPath: "status" },
                  op: "IN",
                  value: {
                    arrayValue: {
                      values: [
                        { stringValue: "pending" },
                        { stringValue: "confirmed" },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
        select: {
          fields: [
            { fieldPath: "appointmentDate" },
            { fieldPath: "serviceId" },
          ],
        },
      },
    };

    const firestoreRes = await fetch(firestoreUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(queryBody),
    });

    if (!firestoreRes.ok) {
      const errText = await firestoreRes.text();
      console.error("Firestore REST error:", errText);
      return NextResponse.json(
        { error: "Erro ao consultar disponibilidade" },
        { status: 500 }
      );
    }

    const results = (await firestoreRes.json()) as RunQueryResponse[];

    const busySlots = results
      .filter((r) => r.document?.fields)
      .map((r) => {
        const fields = r.document!.fields!;
        const rawDate = extractValue(fields.appointmentDate);
        const serviceId = extractValue(fields.serviceId);
        return {
          appointmentDate: rawDate ? new Date(rawDate as string).toISOString() : null,
          serviceId: serviceId as string,
        };
      })
      .filter((s) => s.appointmentDate !== null);

    return NextResponse.json({ busySlots });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("Error in /api/slots:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
