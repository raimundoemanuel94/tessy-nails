"use client";

import { useState } from "react";

export default function SetupTessyPage() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setResult("Criando...");
    try {
      const res = await fetch("/api/admin/create-services", {
        method: "POST",
        headers: { "x-setup-secret": "nailit-setup-2024", "Content-Type": "application/json" },
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (e) {
      setResult("ERRO: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 30, fontFamily: "monospace", background: "#111", color: "#0f0", minHeight: "100vh" }}>
      <h2 style={{ color: "#fff" }}>Setup Tessy — UID alCK5NQbJSVSK1k6sjMAYOKBoR83</h2>
      <button onClick={run} disabled={loading}
        style={{ padding: "12px 24px", fontSize: 16, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", margin: "20px 0" }}>
        {loading ? "Criando..." : "▶ CRIAR USER + STUDIO + 8 SERVIÇOS"}
      </button>
      <pre style={{ whiteSpace: "pre-wrap", color: result.includes("ERRO") || result.includes("error") ? "#f55" : "#0f0" }}>{result}</pre>
    </div>
  );
}
