import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminApp, admin } from "@/lib/firebaseAdmin";

const TESSY_UID = "GGa8qA08whMNfvs3V5AOG65NmfC3";

const SERVICES = [
  { name: "Pedicure simples",   price: 40,  durationMinutes: 60  },
  { name: "Manicure em gel",    price: 80,  durationMinutes: 90  },
  { name: "Pedicure em gel",    price: 90,  durationMinutes: 90  },
  { name: "Alongamento em gel", price: 150, durationMinutes: 120 },
  { name: "Esmaltação em gel",  price: 60,  durationMinutes: 60  },
  { name: "Spa dos pés",        price: 70,  durationMinutes: 75  },
  { name: "Nail art",           price: 15,  durationMinutes: 30  },
];

export async function POST(req: NextRequest) {
  if (req.headers.get("x-setup-secret") !== "nailit-setup-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const app = getFirebaseAdminApp();
  if (!app) {
    return NextResponse.json({ error: "Firebase Admin não configurado. Verifique FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY nas env vars." }, { status: 500 });
  }

  const db = admin.firestore(app);
  const servicesRef = db.collection("studios").doc(TESSY_UID).collection("services");

  // Checa serviços já existentes para evitar duplicatas
  const existing = await servicesRef.get();
  const existingNames = new Set(existing.docs.map(d => d.data().name as string));

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const svc of SERVICES) {
    if (existingNames.has(svc.name)) {
      skipped++;
      continue;
    }
    try {
      await servicesRef.add({
        name: svc.name,
        price: svc.price,
        durationMinutes: svc.durationMinutes,
        bufferMinutes: 0,
        isActive: true,
        studioId: TESSY_UID,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      created++;
    } catch (e) {
      errors.push(`${svc.name}: ${String(e)}`);
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    created,
    skipped,
    total: SERVICES.length,
    tessyUid: TESSY_UID,
    errors,
  });
}
