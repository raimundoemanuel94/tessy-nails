import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = "nailit-792a7";
const API_KEY    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";
const BASE_URL   = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const SUPER_ADMIN_UID = "TXRAIYsikRYTahOQS8cFXji4qSb2";
const TESSY_UID       = "alCK5NQbJSVSK1k6sjMAYOKBoR83";

async function firestoreSet(path: string, data: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string")       fields[k] = { stringValue: v };
    else if (typeof v === "boolean") fields[k] = { booleanValue: v };
    else if (typeof v === "number")  fields[k] = { integerValue: String(v) };
    else if (v instanceof Date)      fields[k] = { timestampValue: v.toISOString() };
  }
  const res = await fetch(`${BASE_URL}/${path}?key=${API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  return res.ok;
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-setup-secret") !== (process.env.SETUP_SECRET ?? "nailit-setup-2024")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  try {
    // 1. Superadmin
    const ok1 = await firestoreSet(`users/${SUPER_ADMIN_UID}`, {
      uid: SUPER_ADMIN_UID, name: "Raimundo", email: "raimundoemanuel94@gmail.com",
      phone: "97991394382", role: "superadmin", isActive: true,
    });
    results.superadmin = ok1 ? "✓ criado" : "✗ erro";

    // 2. Tessy user
    const ok2 = await firestoreSet(`users/${TESSY_UID}`, {
      uid: TESSY_UID, name: "Tessy", email: "tessynails.contato@gmail.com",
      role: "professional", studioId: TESSY_UID, isActive: true,
    });
    results.tessy_user = ok2 ? "✓ criado" : "✗ erro";

    // 3. Studio da Tessy
    const trial = new Date();
    trial.setDate(trial.getDate() + 30);
    const ok3 = await firestoreSet(`studios/${TESSY_UID}`, {
      name: "Tessy Nails", ownerId: TESSY_UID, slug: "tessy-nails",
      plan: "pro", isActive: true, trialEndsAt: trial,
    });
    results.tessy_studio = ok3 ? "✓ criado" : "✗ erro";

    return NextResponse.json({ success: true, results });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
