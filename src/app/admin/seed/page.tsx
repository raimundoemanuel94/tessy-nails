"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getIdToken } from "firebase/auth";

const PROJECT = "nailit-792a7";
const STUDIO  = "O1ei4o6KCehqd3bR8Bw2phPGCrU2";
const SERVICES = [
  { name: "Manicure simples",    price: 35,  durationMinutes: 45  },
  { name: "Pedicure simples",    price: 40,  durationMinutes: 60  },
  { name: "Manicure em gel",     price: 80,  durationMinutes: 90  },
  { name: "Pedicure em gel",     price: 90,  durationMinutes: 90  },
  { name: "Alongamento em gel",  price: 150, durationMinutes: 120 },
  { name: "Esmaltação em gel",   price: 60,  durationMinutes: 60  },
  { name: "Spa dos pés",         price: 70,  durationMinutes: 75  },
  { name: "Nail art",            price: 15,  durationMinutes: 30  },
];

export default function SeedPage() {
  const { firebaseUser } = useAuth();
  const [logs, setLogs]     = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const run = async () => {
    if (!firebaseUser) { addLog("❌ Não logado!"); return; }
    setLoading(true);
    setLogs([]);

    try {
      const token = await getIdToken(firebaseUser);
      addLog("✓ Token obtido");

      for (const svc of SERVICES) {
        const res = await fetch(
          `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/studios/${STUDIO}/services`,
          {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ fields: {
              name:            { stringValue:  svc.name },
              price:           { integerValue: String(svc.price) },
              durationMinutes: { integerValue: String(svc.durationMinutes) },
              isActive:        { booleanValue: true },
              studioId:        { stringValue:  STUDIO },
              bufferMinutes:   { integerValue: "0" },
            }})
          }
        );
        addLog(`${res.ok ? "✅" : "❌"} ${svc.name} ${res.ok ? "" : `(${res.status})`}`);
      }
      addLog("🎉 Pronto!");
      setDone(true);
    } catch (e) {
      addLog(`❌ Erro: ${String(e)}`);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 32, maxWidth: 500, fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Seed Serviços da Tessy</h1>
      
      <button onClick={run} disabled={loading || done}
        style={{ 
          padding: "12px 24px", background: done ? "#22c55e" : "#7C5CBF", 
          color: "white", border: "none", borderRadius: 8, 
          cursor: loading || done ? "not-allowed" : "pointer",
          fontSize: 14, fontWeight: "bold", marginBottom: 16
        }}>
        {loading ? "Criando..." : done ? "✅ Concluído!" : "▶ Criar 8 serviços"}
      </button>

      <div style={{ background: "#1a1a2e", padding: 16, borderRadius: 8, minHeight: 100 }}>
        {logs.length === 0 && <p style={{ color: "#666" }}>Clique no botão para começar</p>}
        {logs.map((log, i) => (
          <div key={i} style={{ color: log.startsWith("✅") ? "#22c55e" : log.startsWith("❌") ? "#ef4444" : "#9D7FD4", marginBottom: 4, fontSize: 13 }}>
            {log}
          </div>
        ))}
      </div>

      {done && (
        <a href="/admin/config" style={{ display: "block", marginTop: 16, color: "#9D7FD4" }}>
          ← Voltar para Config
        </a>
      )}
    </div>
  );
}
