import { NextRequest, NextResponse } from "next/server";

const OLD_PROJECT = "tessy-nails";
const NEW_PROJECT = "nailit-792a7";
const NEW_BASE    = `https://firestore.googleapis.com/v1/projects/${NEW_PROJECT}/databases/(default)/documents`;
const OLD_BASE    = `https://firestore.googleapis.com/v1/projects/${OLD_PROJECT}/databases/(default)/documents`;
const OLD_UID     = "alCK5NQbJSVSK1k6sjMAYOKBoR83";
const NEW_UID     = "lfnfXyrloMWHqDMTQjPwac8s7va2";

type FsDoc = { name: string; fields: Record<string, unknown> };

async function listDocs(url: string, auth?: string): Promise<FsDoc[]> {
  const headers: Record<string, string> = {};
  if (auth) headers.Authorization = `Bearer ${auth}`;
  try {
    const r = await fetch(`${url}?pageSize=200`, { headers });
    if (!r.ok) return [];
    const d = await r.json() as { documents?: FsDoc[] };
    return d.documents ?? [];
  } catch {
    return [];
  }
}

async function writeDoc(path: string, fields: Record<string, unknown>, idToken: string) {
  try {
    const r = await fetch(`${NEW_BASE}/${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ fields }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-setup-secret") !== (process.env.SETUP_SECRET ?? "nailit-setup-2024"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const idToken = req.headers.get("x-id-token");
  if (!idToken) return NextResponse.json({ error: "x-id-token obrigatório" }, { status: 400 });

  const OLD_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY_OLD ?? "";
  const results: Record<string, unknown> = { oldProject: OLD_PROJECT, newProject: NEW_PROJECT };

  const allDocs: FsDoc[] = [];

  // 1. studio antigo (sem auth — pode falhar por rules)
  const d1 = await listDocs(`${OLD_BASE}/studios/${OLD_UID}/clients`);
  results.path1_noauth = d1.length;
  allDocs.push(...d1);

  // 2. coleção global (sem auth)
  const d2 = await listDocs(`${OLD_BASE}/clients`);
  results.path2_noauth = d2.length;
  allDocs.push(...d2);

  // 3. Com API key do projeto antigo (se configurada)
  if (OLD_API_KEY) {
    const r1 = await fetch(`${OLD_BASE}/studios/${OLD_UID}/clients?key=${OLD_API_KEY}&pageSize=200`);
    if (r1.ok) {
      const d = await r1.json() as { documents?: FsDoc[] };
      const docs = d.documents ?? [];
      results.path1_apikey = docs.length;
      allDocs.push(...docs);
    }
    const r2 = await fetch(`${OLD_BASE}/clients?key=${OLD_API_KEY}&pageSize=200`);
    if (r2.ok) {
      const d = await r2.json() as { documents?: FsDoc[] };
      allDocs.push(...(d.documents ?? []));
    }
  }

  // Deduplicar por docId
  const seen = new Set<string>();
  const unique = allDocs.filter(d => {
    const id = d.name.split("/").pop()!;
    if (seen.has(id)) return false;
    seen.add(id); return true;
  });
  results.totalFound = unique.length;

  if (unique.length === 0) {
    return NextResponse.json({
      success: false,
      message: "Nenhum cliente encontrado. Configure NEXT_PUBLIC_FIREBASE_API_KEY_OLD com o API key do projeto tessy-nails",
      results,
    });
  }

  let imported = 0;
  for (const src of unique) {
    const docId = src.name.split("/").pop()!;
    const ok = await writeDoc(`studios/${NEW_UID}/clients/${docId}`, {
      ...src.fields,
      studioId: { stringValue: NEW_UID },
    }, idToken);
    if (ok) imported++;
  }

  results.imported = imported;
  return NextResponse.json({ success: true, results });
}
