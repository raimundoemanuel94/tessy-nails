import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

const APP_NAME = "admin-studio-detail-v3";

function getApp(): admin.app.App {
  const existing = admin.apps.find((a) => a?.name === APP_NAME);
  if (existing) return existing;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID   ?? "nailit-792a7",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "firebase-adminsdk-fbsvc@nailit-792a7.iam.gserviceaccount.com",
      privateKey,
    }),
  }, APP_NAME);
}

type Params = { params: Promise<{ studioId: string }> };

function ts(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof admin.firestore.Timestamp) return val.toDate().toISOString();
  if (val instanceof Date) return val.toISOString();
  return null;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { studioId } = await params;
    const db = admin.firestore(getApp());

    const [studioDoc, servicesSnap, settingsDoc] = await Promise.all([
      db.collection("studios").doc(studioId).get(),
      db.collection("studios").doc(studioId).collection("services").get(),
      db.collection("studios").doc(studioId).collection("settings").doc("salon").get(),
    ]);

    if (!studioDoc.exists) {
      return NextResponse.json({ error: "Studio nao encontrado" }, { status: 404 });
    }

    const s = studioDoc.data()!;

    let owner: Record<string, unknown> | null = null;
    if (s.ownerId) {
      const ownerDoc = await db.collection("users").doc(String(s.ownerId)).get();
      if (ownerDoc.exists) owner = ownerDoc.data() ?? null;
    }

    const apptSnap = await db.collection("studios").doc(studioId).collection("appointments").count().get();

    const services = servicesSnap.docs.map((d) => ({
      id: d.id,
      name:            d.data().name            ?? "",
      price:           d.data().price           ?? 0,
      durationMinutes: d.data().durationMinutes ?? 30,
      bufferMinutes:   d.data().bufferMinutes   ?? 0,
      isActive:        d.data().isActive        ?? true,
    }));

    const settings = settingsDoc.exists ? settingsDoc.data() : null;

    return NextResponse.json({
      studio: {
        id: studioId,
        name:        s.name        ?? "",
        slug:        s.slug        ?? "",
        plan:        s.plan        ?? "free",
        isActive:    s.isActive    ?? true,
        ownerId:     s.ownerId     ?? "",
        createdAt:   ts(s.createdAt),
        updatedAt:   ts(s.updatedAt),
        trialEndsAt: ts(s.trialEndsAt),
      },
      owner: owner ? { uid: owner.uid, name: owner.name, email: owner.email, phone: owner.phone, role: owner.role } : null,
      services,
      settings: settings ? {
        slotDuration: settings.slotDuration ?? 30,
        advanceDays:  settings.advanceDays  ?? 30,
        cancelHours:  settings.cancelHours  ?? 2,
        autoConfirm:  settings.autoConfirm  ?? true,
        workingHours: settings.workingHours ?? {},
      } : null,
      stats: { appointments: apptSnap.data().count, services: services.length },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[GET /api/admin/studios/[studioId]]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { studioId } = await params;
    const body = await req.json();
    const db = admin.firestore(getApp());
    const allowed = ["name", "slug", "plan", "isActive"];
    const update: Record<string, unknown> = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    await db.collection("studios").doc(studioId).update(update);
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
