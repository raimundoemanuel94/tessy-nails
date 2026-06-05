import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

const APP_NAME = "studios-slug-v1";

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const db = admin.firestore(getApp());

    // Busca studio pelo slug
    const snapshot = await db
      .collection("studios")
      .where("slug", "==", slug)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ error: "Studio não encontrado" }, { status: 404 });
    }

    const studioDoc = snapshot.docs[0];
    const studioData = studioDoc.data();
    const studioId = studioDoc.id;

    // Busca serviços ativos
    const servicesSnap = await db
      .collection("studios")
      .doc(studioId)
      .collection("services")
      .where("isActive", "==", true)
      .get();

    const services = servicesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Busca settings (workingHours, slotDuration, advanceDays)
    const settingsDoc = await db
      .collection("studios")
      .doc(studioId)
      .collection("settings")
      .doc("salon")
      .get();

    const settings = settingsDoc.exists ? settingsDoc.data() : null;

    return NextResponse.json({
      studio: {
        id: studioId,
        name: studioData.name,
        slug: studioData.slug,
        plan: studioData.plan,
      },
      services,
      settings: settings
        ? {
            slotDuration: settings.slotDuration ?? 30,
            advanceDays: settings.advanceDays ?? 30,
            cancelHours: settings.cancelHours ?? 2,
            workingHours: settings.workingHours ?? {},
          }
        : null,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/studios/slug]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
