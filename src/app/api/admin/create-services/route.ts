import { NextRequest, NextResponse } from "next/server";

// Usa o mesmo projeto que o frontend
const PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  process.env.FIREBASE_PROJECT_ID ??
  "tessy-nails";

const API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "";

const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

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

function fields(data: Record<string, unknown>) {
  const f: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string")  f[k] = { stringValue: v };
    if (typeof v === "boolean") f[k] = { booleanValue: v };
    if (typeof v === "number")  f[k] = { doubleValue: v };
  }
  return f;
}

async function req(
  method: string,
  path: string,
  body: unknown,
  idToken?: string,
) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // Prefere idToken (autenticado); fallback para API key (funciona com regras abertas)
  const url = idToken
    ? `${BASE}/${path}`
    : `${BASE}/${path}?key=${API_KEY}`;
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

  const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { ok: r.ok, status: r.status, body: await r.json() };
}

export async function POST(request: NextRequest) {
  const secret = process.env.SETUP_SECRET ?? "nailit-setup-2024";
  if (request.headers.get("x-setup-secret") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const idToken = request.headers.get("x-id-token") ?? undefined;

  const errors: string[] = [];
  let created = 0, skipped = 0;

  // ── 1. Studio ──────────────────────────────────────────────────
  const studioBody = { fields: fields({ name: "Tessy Nails", ownerId: TESSY_UID, slug: "tessy-nails", plan: "pro", isActive: true }) };
  const sr = await req("PATCH", `studios/${TESSY_UID}`, studioBody, idToken);
  if (!sr.ok) errors.push(`studio(${sr.status}): ${JSON.stringify(sr.body)}`);

  // ── 2. User ─────────────────────────────────────────────────────
  const userBody = { fields: fields({ uid: TESSY_UID, name: "Tessy Nails", email: "tessynails.contato@gmail.com", role: "professional", studioId: TESSY_UID, isActive: true }) };
  await req("PATCH", `users/${TESSY_UID}`, userBody, idToken);

  // ── 3. Settings ─────────────────────────────────────────────────
  const settingsBody = { fields: fields({ studioId: TESSY_UID, name: "Tessy Nails", slotDuration: 30, advanceDays: 30, cancelHours: 2, autoConfirm: true }) };
  await req("PATCH", `studios/${TESSY_UID}/settings/salon`, settingsBody, idToken);

  // ── 4. Serviços existentes ──────────────────────────────────────
  const listUrl = idToken
    ? `${BASE}/studios/${TESSY_UID}/services`
    : `${BASE}/studios/${TESSY_UID}/services?key=${API_KEY}`;
  const listHeaders: Record<string, string> = idToken
    ? { Authorization: `Bearer ${idToken}` }
    : {};
  const listR = await fetch(listUrl, { headers: listHeaders });
  const listBody = listR.ok ? await listR.json() as { documents?: Array<{ fields?: { name?: { stringValue?: string } } }> } : { documents: [] };
  const existing = new Set((listBody.documents ?? []).map(d => d.fields?.name?.stringValue ?? ""));

  // ── 5. Cria serviços ────────────────────────────────────────────
  for (const svc of SERVICES) {
    if (existing.has(svc.name)) { skipped++; continue; }
    const r = await req("POST", `studios/${TESSY_UID}/services`,
      { fields: fields({ ...svc, bufferMinutes: 0, isActive: true, studioId: TESSY_UID }) },
      idToken,
    );
    if (r.ok) created++;
    else errors.push(`${svc.name}(${r.status}): ${(r.body as { error?: { message?: string } }).error?.message ?? "erro"}`);
  }

  return NextResponse.json({
    success: errors.length === 0 || created > 0,
    project: PROJECT_ID,
    hasToken: !!idToken,
    tessyUid: TESSY_UID,
    created, skipped, total: SERVICES.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
