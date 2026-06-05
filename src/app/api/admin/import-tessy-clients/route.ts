import { NextRequest, NextResponse } from "next/server";

const OLD_PROJECT = "tessy-nails";
const NEW_PROJECT = "nailit-792a7";
const NEW_BASE    = `https://firestore.googleapis.com/v1/projects/${NEW_PROJECT}/databases/(default)/documents`;
const OLD_BASE    = `https://firestore.googleapis.com/v1/projects/${OLD_PROJECT}/databases/(default)/documents`;
const OLD_UID     = "alCK5NQbJSVSK1k6sjMAYOKBoR83";
const NEW_UID     = "lfnfXyrloMWHqDMTQjPwac8s7va2";

type FsDoc = { name: string; fields: Record<string, unknown> };

async function listDocs(base: string, col: string, auth?: string): Promise<FsDoc[]> {
  const headers: Record<string, string> = {};
  if (auth) headers.Authorization = `Bearer ${auth}`;
  const r = await fetch(`${base}/${col}?pageSize=200`, { headers });
  if (!r.ok) return [];
  const d = await r.json() as { documents?: FsDoc[] };
  return d.documents ?? [];
}

async function writeDoc(path: string, fields: Record<string, unknown>, idToken: string) {
  const r = await fetch(`${NEW_BASE}/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ fields }),
  });
  return r.ok;
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-setup-secret") !== (process.env.SETUP_SECRET ?? "nailit-setup-2024"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const idToken = req.headers.get("x-id-token");
  if (!idToken) return NextResponse.json({ error: "x-id-token obrigatório" }, { status: 400 });

  const OLD_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY_OLD ?? "";
  const results: Record<string, unknown> = { oldProject: OLD_PROJECT, newProject: NEW_PROJECT };

  // Tenta todos os caminhos onde podem estar os clientes
  const allDocs: FsDoc[] = [];

  // 1. studio antigo com UID antigo
  const d1 = await listDocs(`${OLD_BASE}/studios/${OLD_UID}/clients`, undefined);
  results.path1 = d1.length;
  allDocs.push(...d1);

  // 2. coleção global do projeto antigo
  const d2 = await listDocs(`${OLD_BASE}/clients`, undefined);
  results.path2 = d2.length;
  allDocs.push(...d2);

  // 3. Se tiver API key do projeto antigo
  if (OLD_API_KEY) {
    const r = await fetch(`${OLD_BASE}/studios/${OLD_UID}/clients?key=${OLD_API_KEY}&pageSize=200`);
    if (r.ok) {
      const d = await r.json() as { documents?: FsDoc[] };
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

  // Deduplicar
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
      message: "Nenhum cliente encontrado no projeto tessy-nails. Os dados podem precisar do API key antigo.",
      hint: "Configure NEXT_PUBLIC_FIREBASE_API_KEY_OLD com o API key do projeto tessy-nails",
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
