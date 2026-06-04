"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getDocFromServer, collection, getDocs, getDocsFromServer, query, where } from "firebase/firestore";

export default function DebugPage() {
  const [log, setLog] = useState<string[]>([]);
  const add = (s: string) => setLog(p => [...p, s]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth!, async (u) => {
      if (!u) { add("❌ NÃO LOGADO"); return; }
      add(`✅ Logado: ${u.email}`);
      add(`UID: ${u.uid}`);
      add(`🔧 CLIENT projectId: ${(db as any)?._databaseId?.projectId ?? "?"}`);
      add(`🔧 authDomain: ${auth?.app?.options?.authDomain ?? "?"}`);

      // Teste 1: ler próprio user doc
      try {
        const ud = await getDoc(doc(db!, "users", u.uid));
        add(`users/${u.uid}: ${ud.exists() ? "EXISTE — role=" + (ud.data() as any).role + " studioId=" + (ud.data() as any).studioId : "NÃO EXISTE"}`);
      } catch (e) { add(`❌ users read ERRO: ${(e as Error).message}`); }

      // Teste 2: ler studio pelo doc ID (FORÇA SERVIDOR, ignora cache)
      try {
        const sd = await getDocFromServer(doc(db!, "studios", u.uid));
        add(`studios/${u.uid} [SERVER]: ${sd.exists() ? "EXISTE — ownerId=" + (sd.data() as any).ownerId + " active=" + (sd.data() as any).isActive : "NÃO EXISTE"}`);
      } catch (e) { add(`❌ studio read ERRO: ${(e as Error).message}`); }

      // Teste 3: listar serviços (FORÇA SERVIDOR)
      try {
        const svc = await getDocsFromServer(collection(db!, "studios", u.uid, "services"));
        add(`services [SERVER]: ${svc.size} encontrados — ${svc.docs.map(d => (d.data() as any).name).join(", ")}`);
      } catch (e) { add(`❌ services read ERRO: ${(e as Error).message}`); }

      // Teste 4: query por ownerId
      try {
        const q = query(collection(db!, "studios"), where("ownerId", "==", u.uid));
        const r = await getDocs(q);
        add(`query ownerId==uid: ${r.size} studios — ${r.docs.map(d => d.id).join(", ")}`);
      } catch (e) { add(`❌ query ERRO: ${(e as Error).message}`); }
    });
    return () => unsub();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "monospace", fontSize: 13, background: "#111", color: "#0f0", minHeight: "100vh" }}>
      <h2 style={{ color: "#fff" }}>🔍 Debug Firestore</h2>
      {log.map((l, i) => <div key={i} style={{ marginBottom: 4, color: l.startsWith("❌") ? "#f55" : "#0f0" }}>{l}</div>)}
    </div>
  );
}
