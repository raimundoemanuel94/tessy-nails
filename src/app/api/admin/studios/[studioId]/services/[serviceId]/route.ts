import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

const APP_NAME = "admin-studios-service-item-v1";

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

type Params = { params: Promise<{ studioId: string; serviceId: string }> };

// PUT: atualiza serviço
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { studioId, serviceId } = await params;
    const body = await req.json();
    const db = admin.firestore(getApp());

    const allowed = ["name", "price", "durationMinutes", "bufferMinutes", "isActive"];
    const update: Record<string, unknown> = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    for (const key of allowed) {
      if (key in body) {
        update[key] = ["price", "durationMinutes", "bufferMinutes"].includes(key)
          ? Number(body[key])
          : body[key];
      }
    }

    await db.collection("studios").doc(studioId).collection("services").doc(serviceId).update(update);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE: remove serviço
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { studioId, serviceId } = await params;
    const db = admin.firestore(getApp());
    await db.collection("studios").doc(studioId).collection("services").doc(serviceId).delete();
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
