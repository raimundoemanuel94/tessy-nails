import { NextRequest, NextResponse } from "next/server";

const PROJECT  = "nailit-792a7";
const BASE     = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const OLD_UID  = "alCK5NQbJSVSK1k6sjMAYOKBoR83"; // UID antigo da Tessy (mesmo projeto)
const NEW_UID  = "lfnfXyrloMWHqDMTQjPwac8s7va2"; // UID atual da Tessy
const STUDIO_NAME = "Tessy Nails";

type FsDoc = { name: string; fields: Record<string, unknown> };

async function listCol(path: string, idToken: string): Promise<FsDoc[]> {
  try {
    const r = await fetch(`${BASE}/${path}?pageSize=200`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!r.ok) return [];
    const d = await r.json() as { documents?: FsDoc[] };
    return d.documents ?? [];
  } catch { return []; }
}

async function docExists(path: string, idToken: string): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/${path}`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    return r.ok;
  } catch { return false; }
}

async function patchDoc(path: string, fields: Record<string, unknown>, idToken: string) {
  try {
    const r = await fetch(`${BASE}/${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ fields }),
    });
    return r.ok;
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-migrate-secret") !== "nailit-migrate-2024")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const idToken = req.headers.get("x-id-token");
  if (!idToken) return NextResponse.json({ error: "x-id-token obrigatório" }, { status: 400 });

  const results: Record<string, unknown> = {};

  // 1. Criar/garantir studio no UID novo
  const trialDate = new Date();
  trialDate.setDate(trialDate.getDate() + 30);
  await patchDoc(`studios/${NEW_UID}`, {
    name:        { stringValue: STUDIO_NAME },
    ownerId:     { stringValue: NEW_UID },
    slug:        { stringValue: "tessy-nails" },
    plan:        { stringValue: "pro" },
    isActive:    { booleanValue: true },
    trialEndsAt: { timestampValue: trialDate.toISOString() },
  }, idToken);
  results.studio = "✓ garantido";

  // 2. Migrar cada coleção:
  // Fontes: global + studio antigo (mesmo projeto, UID antigo)
  for (const col of ["clients", "appointments", "services"]) {
    const fromGlobal = await listCol(col, idToken);
    const fromOldStudio = await listCol(`studios/${OLD_UID}/${col}`, idToken);

    // Deduplicar por docId
    const seen = new Set<string>();
    const all = [...fromGlobal, ...fromOldStudio].filter(d => {
      const id = d.name.split("/").pop()!;
      if (seen.has(id)) return false;
      seen.add(id); return true;
    });

    let migrated = 0, skipped = 0;
    for (const src of all) {
      const docId = src.name.split("/").pop()!;
      const destPath = `studios/${NEW_UID}/${col}/${docId}`;
      if (await docExists(destPath, idToken)) { skipped++; continue; }
      const ok = await patchDoc(destPath, {
        ...src.fields,
        studioId: { stringValue: NEW_UID },
      }, idToken);
      if (ok) migrated++; else skipped++;
    }
    results[col] = `✓ ${migrated} migrados, ${skipped} pulados (global:${fromGlobal.length} + antigo:${fromOldStudio.length})`;
  }

  // 3. Settings
  const settingsOld = await listCol(`studios/${OLD_UID}/settings`, idToken);
  const settingsGlobal = await listCol("settings", idToken);
  for (const src of [...settingsOld, ...settingsGlobal]) {
    const docId = src.name.split("/").pop()!;
    const destPath = `studios/${NEW_UID}/settings/${docId}`;
    if (!(await docExists(destPath, idToken))) {
      await patchDoc(destPath, { ...src.fields, studioId: { stringValue: NEW_UID } }, idToken);
    }
  }
  results.settings = `✓ ${settingsOld.length + settingsGlobal.length} verificados`;

  // 4. Atualizar user doc da Tessy
  await patchDoc(`users/${NEW_UID}`, {
    studioId: { stringValue: NEW_UID },
    role:     { stringValue: "professional" },
  }, idToken);
  results.userProfile = "✓ studioId atualizado";

  return NextResponse.json({ success: true, studioId: NEW_UID, project: PROJECT, results });
}
