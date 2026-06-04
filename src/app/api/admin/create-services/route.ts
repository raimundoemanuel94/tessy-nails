import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

// UID REAL da Tessy (descoberto via /debug)
const TESSY_UID = "alCK5NQbJSVSK1k6sjMAYOKBoR83";
const APP_NAME  = "create-services-v4";

const SERVICES = [
  { name: "Manicure simples",   price: 35,  durationMinutes: 45  },
  { name: "Pedicure simples",   price: 40,  durationMinutes: 60  },
  { name: "Manicure em gel",    price: 80,  durationMinutes: 90  },
  { name: "Pedicure em gel",    price: 90,  durationMinutes: 90  },
  { name: "Alongamento em gel", price: 150, durationMinutes: 120 },
  { name: "Esmaltação em gel",  price: 60,  durationMinutes: 60  },
  { name: "Spa dos pés",        price: 70,  durationMinutes: 75  },
  { name: "Nail art",           price: 15,  durationMinutes: 30  },
];

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
  if (req.headers.get("x-setup-secret") !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db  = admin.firestore(getApp());
    const now = admin.firestore.FieldValue.serverTimestamp();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // 1. Atualiza users/{uid} com studioId correto
    await db.collection("users").doc(TESSY_UID).set({
      uid: TESSY_UID, name: "Tessy Nails", email: "tessynails.contato@gmail.com",
      role: "professional", studioId: TESSY_UID, isActive: true, updatedAt: now,
    }, { merge: true });

    // 2. Cria/atualiza studios/{uid}
    await db.collection("studios").doc(TESSY_UID).set({
      name: "Tessy Nails", ownerId: TESSY_UID, slug: "tessy-nails",
      plan: "pro", isActive: true,
      trialEndsAt: admin.firestore.Timestamp.fromDate(trialEndsAt), updatedAt: now,
    }, { merge: true });

    // 3. Cria serviços (sem duplicar)
    const ref = db.collection("studios").doc(TESSY_UID).collection("services");
    const existing = await ref.get();
    const existingNames = new Set(existing.docs.map(d => d.data().name as string));

    let created = 0, skipped = 0;
    for (const svc of SERVICES) {
      if (existingNames.has(svc.name)) { skipped++; continue; }
      await ref.add({ ...svc, bufferMinutes: 0, isActive: true, studioId: TESSY_UID, createdAt: now });
      created++;
    }

    return NextResponse.json({ success: true, tessyUid: TESSY_UID, created, skipped, total: SERVICES.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
