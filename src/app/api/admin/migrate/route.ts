import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID  = "nailit-792a7";
const BASE        = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const OWNER_UID   = "lfnfXyrloMWHqDMTQjPwac8s7va2";
const STUDIO_ID   = "lfnfXyrloMWHqDMTQjPwac8s7va2";
const STUDIO_NAME = "Tessy Nails";

async function fsGet(path: string, idToken: string) {
  const r = await fetch(`${BASE}/${path}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!r.ok) return null;
  return r.json();
}

async function fsPatch(path: string, fields: Record<string, unknown>, idToken: string) {
  const r = await fetch(`${BASE}/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields }),
  });
  return r.ok;
}

async function fsListDocs(colPath: string, idToken: string): Promise<Array<{ name: string; fields: Record<string, unknown> }>> {
  const r = await fetch(`${BASE}/${colPath}?pageSize=100`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!r.ok) return [];
  const data = await r.json() as { documents?: Array<{ name: string; fields: Record<string, unknown> }> };
  return data.documents ?? [];
}

async function fsSet(path: string, fields: Record<string, unknown>, idToken: string) {
  // PATCH with all fields = create or update
  const r = await fetch(`${BASE}/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields }),
  });
  return r.ok;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-migrate-secret");
  if (secret !== "nailit-migrate-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = req.headers.get("x-id-token");
  if (!idToken) {
    return NextResponse.json({ error: "x-id-token obrigatório" }, { status: 400 });
  }

  const results: Record<string, unknown> = {};

  try {
    // 1. Criar/atualizar studio
    const trialDate = new Date();
    trialDate.setDate(trialDate.getDate() + 30);
    await fsSet(`studios/${STUDIO_ID}`, {
      name:         { stringValue: STUDIO_NAME },
      ownerId:      { stringValue: OWNER_UID },
      slug:         { stringValue: "tessy-nails" },
      plan:         { stringValue: "pro" },
      isActive:     { booleanValue: true },
      trialEndsAt:  { timestampValue: trialDate.toISOString() },
    }, idToken);
    results.studio = "✓ criado/atualizado";

    // 2. Migrar coleções globais → studios/{id}/colName
    for (const colName of ["appointments", "services", "clients"]) {
      const srcDocs = await fsListDocs(colName, idToken);
      let migrated = 0, skipped = 0;

      for (const srcDoc of srcDocs) {
        const docId = srcDoc.name.split("/").pop()!;
        const destPath = `studios/${STUDIO_ID}/${colName}/${docId}`;
        const existing = await fsGet(destPath, idToken);

        if (!existing) {
          // Adicionar studioId ao documento
          const fields = { ...srcDoc.fields, studioId: { stringValue: STUDIO_ID } };
          await fsSet(destPath, fields, idToken);
          migrated++;
        } else {
          skipped++;
        }
      }
      results[colName] = `✓ ${migrated} migrados (${skipped} já existiam)`;
    }

    // 3. Settings
    const settDoc = await fsGet("settings/salon", idToken);
    if (settDoc?.fields) {
      const destPath = `studios/${STUDIO_ID}/settings/salon`;
      const existing = await fsGet(destPath, idToken);
      if (!existing) {
        await fsSet(destPath, { ...settDoc.fields, studioId: { stringValue: STUDIO_ID } }, idToken);
        results.settings = "✓ migrado";
      } else {
        results.settings = "já existe";
      }
    }

    // 4. Atualizar user profile
    await fsPatch(`users/${OWNER_UID}`, {
      studioId: { stringValue: STUDIO_ID },
      role:     { stringValue: "professional" },
    }, idToken);
    results.userProfile = "✓ studioId atualizado";

    return NextResponse.json({ success: true, studioId: STUDIO_ID, results });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
