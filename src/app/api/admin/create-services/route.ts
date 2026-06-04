import { NextRequest, NextResponse } from "next/server";

// Hardcodado para garantir projeto correto independente de env vars
const PROJECT_ID = "nailit-792a7";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const TESSY_UID = "lfnfXyrloMWHqDMTQjPwac8s7va2";

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
  const f: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string")  f[k] = { stringValue: v };
    if (typeof v === "boolean") f[k] = { booleanValue: v };
    if (typeof v === "number")  f[k] = { doubleValue: v };
  }
  return f;
}

async function fsReq(method: string, path: string, body: unknown, idToken: string) {
  const r = await fetch(`${BASE}/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${idToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { ok: r.ok, status: r.status, data: await r.json() };
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-setup-secret") !== (process.env.SETUP_SECRET ?? "nailit-setup-2024")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = req.headers.get("x-id-token");
  if (!idToken) {
    return NextResponse.json({ error: "x-id-token obrigatório" }, { status: 400 });
  }

  const errors: string[] = [];
  let created = 0, skipped = 0;

  // 1. Studio
  const sr = await fsReq("PATCH", `studios/${TESSY_UID}`, {
    fields: toFields({ name: "Tessy Nails", ownerId: TESSY_UID, slug: "tessy-nails", plan: "pro", isActive: true }),
  }, idToken);
  if (!sr.ok) errors.push(`studio(${sr.status}): ${JSON.stringify((sr.data as {error?:{message?:string}}).error?.message)}`);

  // 2. User
  await fsReq("PATCH", `users/${TESSY_UID}`, {
    fields: toFields({ uid: TESSY_UID, name: "Tessy Nails", email: "tessynails.contato@gmail.com", role: "professional", studioId: TESSY_UID, isActive: true }),
  }, idToken);

  // 3. Settings
  await fsReq("PATCH", `studios/${TESSY_UID}/settings/salon`, {
    fields: toFields({ studioId: TESSY_UID, name: "Tessy Nails", slotDuration: 30, advanceDays: 30, cancelHours: 2, autoConfirm: true }),
  }, idToken);

  // 4. Serviços existentes
  const listR = await fsReq("GET", `studios/${TESSY_UID}/services`, null, idToken);
  const existingNames = new Set<string>(
    (listR.ok ? (listR.data as {documents?: Array<{fields?: {name?: {stringValue?: string}}}>}).documents ?? [] : [])
      .map(d => d.fields?.name?.stringValue ?? "")
  );

  // 5. Cria serviços
  for (const svc of SERVICES) {
    if (existingNames.has(svc.name)) { skipped++; continue; }
    const r = await fsReq("POST", `studios/${TESSY_UID}/services`, {
      fields: toFields({ ...svc, bufferMinutes: 0, isActive: true, studioId: TESSY_UID }),
    }, idToken);
    if (r.ok) created++;
    else errors.push(`${svc.name}: ${JSON.stringify((r.data as {error?:{message?:string}}).error?.message)}`);
  }

  return NextResponse.json({
    success: errors.length === 0 || created > 0,
    project: PROJECT_ID,
    created, skipped, total: SERVICES.length,
    errors: errors.length ? errors : undefined,
  });
}
