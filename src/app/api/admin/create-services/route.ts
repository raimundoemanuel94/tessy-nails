import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ?? process.env.FIREBASE_PROJECT_ID
  ?? "tessy-nails";
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const TESSY_UID = "alCK5NQbJSVSK1k6sjMAYOKBoR83";

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

function toFields(data: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string")       fields[k] = { stringValue: v };
    else if (typeof v === "boolean") fields[k] = { booleanValue: v };
    else if (typeof v === "number")  fields[k] = { doubleValue: v };
  }
  return fields;
}

export async function POST(req: NextRequest) {
  const secret = (process.env.SETUP_SECRET ?? "nailit-setup-2024");
  if (req.headers.get("x-setup-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = req.headers.get("x-id-token");
  if (!idToken) {
    return NextResponse.json({ error: "idToken obrigatório (x-id-token)" }, { status: 400 });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${idToken}`,
  };

  const errors: string[] = [];
  let created = 0;
  let skipped = 0;

  // 1. Garante studio + user
  const studioRes = await fetch(`${BASE_URL}/studios/${TESSY_UID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields: toFields({
      name: "Tessy Nails", ownerId: TESSY_UID, slug: "tessy-nails",
      plan: "pro", isActive: true,
    })}),
  });
  if (!studioRes.ok) errors.push(`studio: ${await studioRes.text()}`);

  await fetch(`${BASE_URL}/users/${TESSY_UID}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields: toFields({
      uid: TESSY_UID, name: "Tessy Nails", email: "tessynails.contato@gmail.com",
      role: "professional", studioId: TESSY_UID, isActive: true,
    })}),
  });

  // 2. Verifica serviços existentes
  const listRes = await fetch(
    `${BASE_URL}/studios/${TESSY_UID}/services`, { headers }
  );
  const existingNames = new Set<string>();
  if (listRes.ok) {
    const body = await listRes.json() as { documents?: Array<{ fields?: { name?: { stringValue?: string } } }> };
    for (const doc of body.documents ?? []) {
      const name = doc.fields?.name?.stringValue;
      if (name) existingNames.add(name);
    }
  }

  // 3. Cria serviços faltando
  for (const svc of SERVICES) {
    if (existingNames.has(svc.name)) { skipped++; continue; }
    const r = await fetch(`${BASE_URL}/studios/${TESSY_UID}/services`, {
      method: "POST",
      headers,
      body: JSON.stringify({ fields: toFields({
        ...svc, bufferMinutes: 0, isActive: true, studioId: TESSY_UID,
      })}),
    });
    if (r.ok) created++;
    else errors.push(`${svc.name}: ${(await r.json() as { error?: { message?: string } }).error?.message ?? "erro"}`);
  }

  return NextResponse.json({
    success: errors.length === 0,
    project: PROJECT_ID,
    tessyUid: TESSY_UID,
    created,
    skipped,
    total: SERVICES.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
