import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SUPER_ADMIN_UID = "TXRAIYsikRYTahOQS8cFXji4qSb2";
const TESSY_UID       = "O1ei4o6KCehqd3bR8Bw2phPGCrU2";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-setup-secret");
  if (secret !== "nailit-setup-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  try {
    // 1. Superadmin (Raimundo)
    await setDoc(doc(db!, "users", SUPER_ADMIN_UID), {
      uid: SUPER_ADMIN_UID, name: "Admin Nailit",
      role: "superadmin", isActive: true, createdAt: serverTimestamp(),
    }, { merge: true });
    results.superadmin = "✓ criado";

    // 2. Tessy como profissional
    await setDoc(doc(db!, "users", TESSY_UID), {
      uid: TESSY_UID, name: "Tessy", email: "tessy@nails.com",
      role: "professional", studioId: TESSY_UID,
      isActive: true, createdAt: serverTimestamp(),
    }, { merge: true });
    results.tessy_user = "✓ criado";

    // 3. Studio da Tessy com 30 dias Pro
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    await setDoc(doc(db!, "studios", TESSY_UID), {
      name: "Tessy Nails", ownerId: TESSY_UID,
      slug: "tessy-nails", plan: "pro",
      trialEndsAt: Timestamp.fromDate(trialEndsAt),
      isActive: true, createdAt: serverTimestamp(),
    }, { merge: true });
    results.tessy_studio = "✓ criado";

    return NextResponse.json({ success: true, results });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
