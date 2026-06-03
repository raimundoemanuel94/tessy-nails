import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = "nailit-792a7";
const API_KEY    = "AIzaSyCyi190uiOnAO_xlZ8TcgXd-DcCBVgMwpc";
const BASE_URL   = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// UID atual da Tessy no Firebase Authentication (novo projeto nailit)
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

async function createService(svc: typeof SERVICES[0]): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(
    `${BASE_URL}/studios/${TESSY_UID}/services?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          name:            { stringValue:  svc.name },
          price:           { doubleValue:  svc.price },
          durationMinutes: { integerValue: String(svc.durationMinutes) },
          bufferMinutes:   { integerValue: "0" },
          isActive:        { booleanValue: true },
          studioId:        { stringValue:  TESSY_UID },
        },
      }),
    }
  );

  if (res.ok) return { ok: true };
  const body = await res.json() as { error?: { message?: string } };
  return { ok: false, error: body.error?.message ?? `HTTP ${res.status}` };
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-setup-secret") !== "nailit-setup-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { name: string; ok: boolean; error?: string }[] = [];

  for (const svc of SERVICES) {
    const result = await createService(svc);
    results.push({ name: svc.name, ...result });
  }

  const created = results.filter(r => r.ok).length;
  const errors  = results.filter(r => !r.ok).map(r => `${r.name}: ${r.error}`);

  return NextResponse.json({
    success: created > 0,
    created,
    total: SERVICES.length,
    errors,
    results,
  });
}
