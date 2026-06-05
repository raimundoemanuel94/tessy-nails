import { NextRequest, NextResponse } from "next/server";

const PROJECT  = "nailit-792a7";
const BASE     = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const KEEP_UID = "lfnfXyrloMWHqDMTQjPwac8s7va2"; // studio correto da Tessy

type FsDoc = { name: string; fields: Record<string, unknown> };

export async function POST(req: NextRequest) {
  if (req.headers.get("x-setup-secret") !== (process.env.SETUP_SECRET ?? "nailit-setup-2024"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const idToken = req.headers.get("x-id-token");
  if (!idToken) return NextResponse.json({ error: "x-id-token obrigatório" }, { status: 400 });

  // Listar todos os studios
  const r = await fetch(`${BASE}/studios?pageSize=50`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!r.ok) return NextResponse.json({ error: "Erro ao listar studios" }, { status: 500 });

  const data = await r.json() as { documents?: FsDoc[] };
  const docs = data.documents ?? [];

  const kept: string[] = [];
  const deleted: string[] = [];

  for (const doc of docs) {
    const docId = doc.name.split("/").pop()!;
    const slug = (doc.fields.slug as { stringValue?: string })?.stringValue ?? "";
    const name = (doc.fields.name as { stringValue?: string })?.stringValue ?? "";

    // Manter apenas o studio com UID correto
    if (docId === KEEP_UID) {
      kept.push(docId);
      continue;
    }

    // Deletar studios duplicados do tessy-nails (slug = tessy-nails)
    if (slug === "tessy-nails" || name === "Tessy Nails") {
      const dr = await fetch(`${BASE}/studios/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (dr.ok) deleted.push(docId);
      else kept.push(`${docId}(erro ao deletar)`);
    } else {
      kept.push(docId);
    }
  }

  return NextResponse.json({ success: true, kept, deleted, total: docs.length });
}
