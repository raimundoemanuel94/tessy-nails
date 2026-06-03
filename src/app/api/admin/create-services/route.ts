import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = "nailit-792a7";
const TESSY_UID  = "O1ei4o6KCehqd3bR8Bw2phPGCrU2";
const BASE_URL   = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

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

  const idToken = req.headers.get("x-id-token");
  if (!idToken) return NextResponse.json({ error: "idToken required" }, { status: 400 });

  let created = 0;
  const errors: string[] = [];

  for (const svc of SERVICES) {
    const res = await fetch(`${BASE_URL}/studios/${TESSY_UID}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
      body: JSON.stringify({ fields: {
        name:            { stringValue:  svc.name },
        price:           { integerValue: String(svc.price) },
        durationMinutes: { integerValue: String(svc.durationMinutes) },
        bufferMinutes:   { integerValue: "0" },
        isActive:        { booleanValue: true },
        studioId:        { stringValue:  TESSY_UID },
      }}),
    });
    if (res.ok) created++;
    else errors.push(`${svc.name}: ${(await res.json() as {error?:{message?:string}}).error?.message ?? "erro"}`);
  }

  return NextResponse.json({ success: created > 0, created, total: SERVICES.length, errors });
}
