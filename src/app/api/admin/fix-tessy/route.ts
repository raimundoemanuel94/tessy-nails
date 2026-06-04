import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

const TESSY_UID = "alCK5NQbJSVSK1k6sjMAYOKBoR83";
const APP_NAME  = "fix-tessy-v2";

function getApp(): admin.app.App {
  const existing = admin.apps.find(a => a?.name === APP_NAME);
  if (existing) return existing;

  const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  if (!privateKey) throw new Error("FIREBASE_PRIVATE_KEY não configurada");

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID ?? "nailit-792a7",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "firebase-adminsdk-fbsvc@nailit-792a7.iam.gserviceaccount.com",
      privateKey,
    }),
  }, APP_NAME);
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-setup-secret") !== (process.env.SETUP_SECRET ?? "nailit-setup-2024")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const app = getApp();
    const db  = admin.firestore(app);
    const now = admin.firestore.FieldValue.serverTimestamp();

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // 1. Garante users/{uid} com role=professional e studioId correto
    await db.collection("users").doc(TESSY_UID).set({
      uid:      TESSY_UID,
      name:     "Tessy Nails",
      email:    "tessynails.contato@gmail.com",
      role:     "professional",
      studioId: TESSY_UID,
      isActive: true,
      updatedAt: now,
    }, { merge: true });

    // 2. Garante studios/{uid} com ownerId correto
    await db.collection("studios").doc(TESSY_UID).set({
      name:         "Tessy Nails",
      ownerId:      TESSY_UID,
      slug:         "tessy-nails",
      plan:         "pro",
      isActive:     true,
      trialEndsAt:  admin.firestore.Timestamp.fromDate(trialEndsAt),
      updatedAt:    now,
    }, { merge: true });

    // 3. Garante settings
    await db.collection("studios").doc(TESSY_UID)
      .collection("settings").doc("salon").set({
        studioId:     TESSY_UID,
        name:         "Tessy Nails",
        slotDuration: 30,
        advanceDays:  30,
        cancelHours:  2,
        autoConfirm:  true,
        workingHours: {
          monday:    { open: "09:00", close: "18:00", isOpen: true },
          tuesday:   { open: "09:00", close: "18:00", isOpen: true },
          wednesday: { open: "09:00", close: "18:00", isOpen: true },
          thursday:  { open: "09:00", close: "18:00", isOpen: true },
          friday:    { open: "09:00", close: "18:00", isOpen: true },
          saturday:  { open: "09:00", close: "13:00", isOpen: true },
          sunday:    { open: "09:00", close: "18:00", isOpen: false },
        },
        updatedAt: now,
      }, { merge: true });

    // 4. Verifica serviços
    const services = await db.collection("studios").doc(TESSY_UID)
      .collection("services").get();

    return NextResponse.json({
      success:   true,
      tessyUid:  TESSY_UID,
      user:      "✓ users/" + TESSY_UID,
      studio:    "✓ studios/" + TESSY_UID,
      settings:  "✓ settings/salon",
      services:  `✓ ${services.size} serviços encontrados`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[fix-tessy]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
