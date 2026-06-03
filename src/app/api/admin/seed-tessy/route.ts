import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = "nailit-792a7";
const API_KEY    = "AIzaSyCyi190uiOnAO_xlZ8TcgXd-DcCBVgMwpc";
const BASE_URL   = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const TESSY_UID  = "O1ei4o6KCehqd3bR8Bw2phPGCrU2";

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
  return res.ok;
}

async function post(path: string, data: Record<string, unknown>, idToken?: string) {
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (typeof v === "string")       fields[k] = { stringValue: v };
    else if (typeof v === "boolean") fields[k] = { booleanValue: v };
    else if (typeof v === "number")  fields[k] = { doubleValue: v };
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
  
  const url = idToken 
    ? `${BASE_URL}/${path}`
    : `${BASE_URL}/${path}?key=${API_KEY}`;
    
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[seed-tessy] POST ${path} failed:`, err);
  }
  return res.ok;
}

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

export async function POST(req: NextRequest) {
  if (req.headers.get("x-setup-secret") !== "nailit-setup-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = req.headers.get("x-id-token") ?? undefined;
  const results: Record<string, string> = {};

  // User + Studio via PATCH (funciona com API key)
  await patch(`users/${TESSY_UID}`, { uid: TESSY_UID, name: "Tessy", email: "tessynails.contato@gmail.com", role: "professional", studioId: TESSY_UID, isActive: true });
  await patch(`studios/${TESSY_UID}`, { name: "Tessy Nails", ownerId: TESSY_UID, slug: "tessy-nails", plan: "pro", isActive: true });
  results.studio = "✓";

  // Serviços via POST com idToken
  let svcOk = 0;
  for (const svc of SERVICES) {
    const ok = await post(`studios/${TESSY_UID}/services`, { ...svc, isActive: true, studioId: TESSY_UID, bufferMinutes: 0 }, idToken);
    if (ok) svcOk++;
  }
  results.services = svcOk > 0 ? `✓ ${svcOk}/${SERVICES.length} criados` : `⚠️ 0/${SERVICES.length} — envie x-id-token`;

  // Settings
  await patch(`studios/${TESSY_UID}/settings/salon`, {
    studioId: TESSY_UID, name: "Tessy Nails", slotDuration: 30, advanceDays: 30, cancelHours: 2, autoConfirm: true,
  });
  results.settings = "✓";

  return NextResponse.json({ success: true, results });
}
