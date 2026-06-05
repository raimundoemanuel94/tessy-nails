import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

const APP_NAME = "admin-studios-detail-v1";

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

// ─── GET: studio completo (info + owner + services + settings + stats) ────────

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
      return NextResponse.json({ error: "Studio não encontrado" }, { status: 404 });
    }

    const studioData = studioDoc.data()!;

    // Busca dados do owner
    let owner: Record<string, unknown> | null = null;
    if (studioData.ownerId) {
      const ownerDoc = await db.collection("users").doc(studioData.ownerId as string).get();
      if (ownerDoc.exists) owner = ownerDoc.data() ?? null;
    }

    // Contagem de agendamentos
    const appointmentsSnap = await db
      .collection("studios")
      .doc(studioId)
      .collection("appointments")
      .count()
      .get();
    const appointmentsCount = appointmentsSnap.data().count;

    const services = servicesSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name ?? "",
        price: data.price ?? 0,
        durationMinutes: data.durationMinutes ?? 30,
        bufferMinutes: data.bufferMinutes ?? 0,
        isActive: data.isActive ?? true,
      };
    });

    const settings = settingsDoc.exists ? settingsDoc.data() : null;

    // Serializa timestamps
    function serializeTimestamp(val: unknown): string | null {
      if (!val) return null;
      if (val instanceof admin.firestore.Timestamp) return val.toDate().toISOString();
      if (val instanceof Date) return val.toISOString();
      return String(val);
    }

    return NextResponse.json({
      studio: {
        id: studioId,
        name: studioData.name ?? "",
        slug: studioData.slug ?? "",
        plan: studioData.plan ?? "free",
        isActive: studioData.isActive ?? true,
        ownerId: studioData.ownerId ?? "",
        createdAt: serializeTimestamp(studioData.createdAt),
        updatedAt: serializeTimestamp(studioData.updatedAt),
        trialEndsAt: serializeTimestamp(studioData.trialEndsAt),
      },
      owner: owner
        ? {
            uid: owner.uid,
            name: owner.name,
            email: owner.email,
            phone: owner.phone,
            role: owner.role,
          }
        : null,
      services,
      settings: settings
        ? {
            slotDuration: settings.slotDuration ?? 30,
            advanceDays: settings.advanceDays ?? 30,
            cancelHours: settings.cancelHours ?? 2,
            autoConfirm: settings.autoConfirm ?? true,
            workingHours: settings.workingHours ?? {},
          }
        : null,
      stats: { appointments: appointmentsCount, services: services.length },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── PUT: atualiza studio ─────────────────────────────────────────────────────

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
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
