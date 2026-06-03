import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = "nailit-792a7";
const API_KEY    = "AIzaSyCyi190uiOnAO_xlZ8TcgXd-DcCBVgMwpc";
const BASE_URL   = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// UID correto da Tessy (autenticação atual do projeto nailit)
const TESSY_UID = "GGa8qA08whMNfvs3V5AOG65NmfC3";

async function patch(path: string, data: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string")       fields[k] = { stringValue: v };
    else if (typeof v === "boolean") fields[k] = { booleanValue: v };
    else if (typeof v === "number")  fields[k] = { doubleValue: v };
    else if (v instanceof Date)      fields[k] = { timestampValue: v.toISOString() };
  }
  const res = await fetch(`${BASE_URL}/${path}?key=${API_KEY}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `HTTP ${res.status} em ${path}`);
  }
  return true;
}

async function postDoc(path: string, data: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string")       fields[k] = { stringValue: v };
    else if (typeof v === "boolean") fields[k] = { booleanValue: v };
    else if (typeof v === "number")  fields[k] = { doubleValue: v };
    else if (v instanceof Date)      fields[k] = { timestampValue: v.toISOString() };
  }
  const res = await fetch(`${BASE_URL}/${path}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `HTTP ${res.status} em ${path}`);
  }
  return true;
}

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

  const results: Record<string, string> = {};

  // 1. Atualiza/cria users/GGa8qA08... com studioId correto
  try {
    await patch(`users/${TESSY_UID}`, {
      uid: TESSY_UID,
      name: "Tessy",
      email: "tessy@nails.com",
      role: "professional",
      studioId: TESSY_UID,
      isActive: true,
    });
    results.user = "✓ users/" + TESSY_UID;
  } catch (e) { results.user = "✗ " + String(e); }

  // 2. Cria/atualiza studios/GGa8qA08... 
  try {
    const trial = new Date();
    trial.setDate(trial.getDate() + 30);
    await patch(`studios/${TESSY_UID}`, {
      name: "Tessy Nails",
      ownerId: TESSY_UID,
      slug: "tessy-nails",
      plan: "pro",
      isActive: true,
      trialEndsAt: trial,
    });
    results.studio = "✓ studios/" + TESSY_UID;
  } catch (e) { results.studio = "✗ " + String(e); }

  // 3. Cria os 7 serviços em studios/GGa8qA08.../services
  let created = 0;
  const svcErrors: string[] = [];
  for (const svc of SERVICES) {
    try {
      await postDoc(`studios/${TESSY_UID}/services`, {
        name: svc.name,
        price: svc.price,
        durationMinutes: svc.durationMinutes,
        bufferMinutes: 0,
        isActive: true,
        studioId: TESSY_UID,
      });
      created++;
    } catch (e) {
      svcErrors.push(`${svc.name}: ${String(e)}`);
    }
  }
  results.services = created === SERVICES.length
    ? `✓ ${created}/${SERVICES.length} serviços criados`
    : `⚠️ ${created}/${SERVICES.length} — erros: ${svcErrors.join("; ")}`;

  const allOk = Object.values(results).every(v => v.startsWith("✓"));
  return NextResponse.json({ success: allOk, results, tessyUid: TESSY_UID });
}
