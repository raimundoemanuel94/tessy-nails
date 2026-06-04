import { NextRequest, NextResponse } from "next/server";
import {
  collection, doc, getDocs, getDoc, setDoc,
  writeBatch, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const OWNER_UID   = "alCK5NQbJSVSK1k6sjMAYOKBoR83";
const STUDIO_ID   = "alCK5NQbJSVSK1k6sjMAYOKBoR83";
const STUDIO_NAME = "Tessy Nails";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-migrate-secret");
  if (secret !== "nailit-migrate-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  try {
    // 1. Criar studio da Tessy
    const studioRef  = doc(db!, "studios", STUDIO_ID);
    const studioSnap = await getDoc(studioRef);

    if (!studioSnap.exists()) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);
      await setDoc(studioRef, {
        name: STUDIO_NAME, ownerId: OWNER_UID, slug: "tessy-nails",
        plan: "pro", trialEndsAt: Timestamp.fromDate(trialEndsAt),
        isActive: true, createdAt: serverTimestamp(), migratedAt: serverTimestamp(),
      });
      results.studio = "✓ criado";
    } else {
      results.studio = "já existe";
    }

    // 2. Migrar coleções
    for (const colName of ["appointments", "services", "clients"]) {
      const srcSnap  = await getDocs(collection(db!, colName));
      let migrated = 0, skipped = 0;
      const batch = writeBatch(db!);
      for (const d of srcSnap.docs) {
        const destRef  = doc(db!, "studios", STUDIO_ID, colName, d.id);
        const destSnap = await getDoc(destRef);
        if (!destSnap.exists()) {
          batch.set(destRef, { ...d.data(), studioId: STUDIO_ID, migratedAt: serverTimestamp() });
          migrated++;
        } else skipped++;
      }
      if (migrated > 0) await batch.commit();
      results[colName] = `✓ ${migrated} migrados (${skipped} já existiam)`;
    }

    // 3. Settings
    const settSnap = await getDoc(doc(db!, "settings", "salon"));
    if (settSnap.exists()) {
      const destRef  = doc(db!, "studios", STUDIO_ID, "settings", "salon");
      const destSnap = await getDoc(destRef);
      if (!destSnap.exists()) {
        await setDoc(destRef, { ...settSnap.data(), studioId: STUDIO_ID, migratedAt: serverTimestamp() });
        results.settings = "✓ migrado";
      } else results.settings = "já existe";
    }

    // 4. Atualizar user profile
    await setDoc(doc(db!, "users", OWNER_UID), {
      studioId: STUDIO_ID, role: "professional", updatedAt: serverTimestamp(),
    }, { merge: true });
    results.userProfile = "✓ studioId atualizado";

    return NextResponse.json({ success: true, studioId: STUDIO_ID, results });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
