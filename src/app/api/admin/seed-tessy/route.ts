import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc, getDoc, serverTimestamp, Timestamp, collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const TESSY_UID = "O1ei4o6KCehqd3bR8Bw2phPGCrU2";
const STUDIO_ID = "O1ei4o6KCehqd3bR8Bw2phPGCrU2";

const SERVICES = [
  { name: "Manicure simples",    price: 35,  durationMinutes: 45  },
  { name: "Pedicure simples",    price: 40,  durationMinutes: 60  },
  { name: "Manicure em gel",     price: 80,  durationMinutes: 90  },
  { name: "Pedicure em gel",     price: 90,  durationMinutes: 90  },
  { name: "Alongamento em gel",  price: 150, durationMinutes: 120 },
  { name: "Esmaltação em gel",   price: 60,  durationMinutes: 60  },
  { name: "Spa dos pés",         price: 70,  durationMinutes: 75  },
  { name: "Nail art",            price: 15,  durationMinutes: 30  },
];

export async function POST(req: NextRequest) {
  if (req.headers.get("x-setup-secret") !== "nailit-setup-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  try {
    // User
    await setDoc(doc(db!, "users", TESSY_UID), {
      uid: TESSY_UID, name: "Tessy", email: "tessy@nails.com",
      role: "professional", studioId: STUDIO_ID, isActive: true,
    }, { merge: true });
    results.user = "✓";

    // Studio
    const trial = new Date();
    trial.setDate(trial.getDate() + 30);
    await setDoc(doc(db!, "studios", STUDIO_ID), {
      name: "Tessy Nails", ownerId: TESSY_UID, slug: "tessy-nails",
      plan: "pro", trialEndsAt: Timestamp.fromDate(trial), isActive: true,
    }, { merge: true });
    results.studio = "✓";

    // Serviços — só cria se não tiver
    const svcsCol = collection(db!, "studios", STUDIO_ID, "services");
    const existing = await getDocs(svcsCol);
    if (existing.empty) {
      for (const svc of SERVICES) {
        await addDoc(svcsCol, { ...svc, isActive: true, studioId: STUDIO_ID, bufferMinutes: 0, createdAt: serverTimestamp() });
      }
      results.services = `✓ ${SERVICES.length} criados`;
    } else {
      results.services = `já tem ${existing.size} serviços`;
    }

    // Settings
    const settRef = doc(db!, "studios", STUDIO_ID, "settings", "salon");
    if (!(await getDoc(settRef)).exists()) {
      await setDoc(settRef, {
        studioId: STUDIO_ID, name: "Tessy Nails", slotDuration: 30,
        advanceDays: 30, cancelHours: 2, autoConfirm: true,
        workingDays: {
          seg: { open: true,  start: "09:00", end: "18:00" },
          ter: { open: true,  start: "09:00", end: "18:00" },
          qua: { open: true,  start: "09:00", end: "18:00" },
          qui: { open: true,  start: "09:00", end: "18:00" },
          sex: { open: true,  start: "09:00", end: "18:00" },
          sab: { open: true,  start: "09:00", end: "13:00" },
          dom: { open: false, start: "09:00", end: "18:00" },
        },
      });
      results.settings = "✓";
    } else {
      results.settings = "já existe";
    }

    return NextResponse.json({ success: true, results });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
