import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

const APP_NAME = "appointments-public-v1";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      studioId,
      serviceId,
      serviceName,
      durationMinutes,
      price,
      appointmentDate,
      clientName,
      clientPhone,
      clientEmail,
    } = body;

    if (!studioId || !serviceId || !appointmentDate || !clientName || !clientPhone) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    const db = admin.firestore(getApp());
    const now = admin.firestore.FieldValue.serverTimestamp();
    const apptTimestamp = admin.firestore.Timestamp.fromDate(new Date(appointmentDate));

    // 1. Verifica conflito no slot
    const apptDate = new Date(appointmentDate);
    const duration: number = durationMinutes ?? 30;
    const apptEnd = new Date(apptDate.getTime() + duration * 60000);

    const startOfDay = new Date(apptDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(apptDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await db
      .collection("studios")
      .doc(studioId)
      .collection("appointments")
      .where("appointmentDate", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
      .where("appointmentDate", "<=", admin.firestore.Timestamp.fromDate(endOfDay))
      .get();

    for (const doc of existing.docs) {
      const data = doc.data();
      if (data.status === "cancelled") continue;

      const existStart: Date = (data.appointmentDate as admin.firestore.Timestamp).toDate();
      const existDuration: number = data.durationMinutes ?? 30;
      const existEnd = new Date(existStart.getTime() + existDuration * 60000);

      // Sobreposição
      if (apptDate < existEnd && apptEnd > existStart) {
        return NextResponse.json(
          { error: "Este horário já está ocupado. Por favor escolha outro." },
          { status: 409 }
        );
      }
    }

    // 2. Cria ou encontra cliente pelo telefone
    const clientsRef = db.collection("studios").doc(studioId).collection("clients");
    const clientSnap = await clientsRef
      .where("phone", "==", clientPhone)
      .limit(1)
      .get();

    let clientId: string;
    if (!clientSnap.empty) {
      clientId = clientSnap.docs[0].id;
      // Atualiza nome/email se vieram
      await clientsRef.doc(clientId).set(
        { name: clientName, ...(clientEmail ? { email: clientEmail } : {}), updatedAt: now },
        { merge: true }
      );
    } else {
      const newClient = await clientsRef.add({
        name: clientName,
        phone: clientPhone,
        ...(clientEmail ? { email: clientEmail } : {}),
        studioId,
        isActive: true,
        source: "online_booking",
        createdAt: now,
        updatedAt: now,
      });
      clientId = newClient.id;
    }

    // 3. Cria o agendamento
    const apptRef = await db
      .collection("studios")
      .doc(studioId)
      .collection("appointments")
      .add({
        studioId,
        clientId,
        clientName,
        serviceId,
        serviceName,
        durationMinutes: duration,
        price: price ?? 0,
        appointmentDate: apptTimestamp,
        status: "pending",
        source: "online_booking",
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.json({ success: true, appointmentId: apptRef.id, clientId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/appointments/public]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
