import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

const APP_NAME = "admin-studios-services-v1";

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

type Params = { params: Promise<{ studioId: string }> };

// POST: cria serviço
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { studioId } = await params;
    const body = await req.json();
    const { name, price, durationMinutes, bufferMinutes } = body;

    if (!name || price == null || !durationMinutes) {
      return NextResponse.json({ error: "name, price e durationMinutes são obrigatórios" }, { status: 400 });
    }

    const db = admin.firestore(getApp());
    const now = admin.firestore.FieldValue.serverTimestamp();

    const ref = await db.collection("studios").doc(studioId).collection("services").add({
      name,
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      bufferMinutes: Number(bufferMinutes ?? 0),
      isActive: true,
      studioId,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, serviceId: ref.id });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
