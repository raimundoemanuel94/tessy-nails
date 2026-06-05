import { NextRequest, NextResponse } from "next/server";

const PROJECT = "nailit-792a7";
const BASE    = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const STUDIO  = "lfnfXyrloMWHqDMTQjPwac8s7va2";

type FsDoc = { name: string; fields: Record<string, unknown> };

export async function POST(req: NextRequest) {
  if (req.headers.get("x-setup-secret") !== (process.env.SETUP_SECRET ?? "nailit-setup-2024"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const idToken = req.headers.get("x-id-token");
  if (!idToken) return NextResponse.json({ error: "x-id-token obrigatório" }, { status: 400 });

  // Listar todos os serviços
  const r = await fetch(`${BASE}/studios/${STUDIO}/services?pageSize=200`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!r.ok) return NextResponse.json({ error: "Erro ao listar serviços" }, { status: 500 });

  const data = await r.json() as { documents?: FsDoc[] };
  const docs = data.documents ?? [];

  // Agrupar por nome — manter o primeiro, deletar os outros
  const byName = new Map<string, FsDoc[]>();
  for (const doc of docs) {
    const name = (doc.fields.name as { stringValue?: string })?.stringValue ?? "";
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name)!.push(doc);
  }

  let kept = 0, deleted = 0;
  for (const [, group] of byName) {
    kept++;
    // Deletar todos exceto o primeiro
    for (const dup of group.slice(1)) {
      const r2 = await fetch(`${BASE}/${dup.name.split("/documents/")[1]}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (r2.ok) deleted++; else deleted++; // conta mesmo se falhou
    }
  }

  return NextResponse.json({
    success: true,
    total: docs.length,
    kept,
    deleted,
    services: [...byName.keys()],
  });
}
