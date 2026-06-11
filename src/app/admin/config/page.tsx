// @ts-nocheck
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ConfigPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "superadmin") redirect("/dashboard");

  return (
    <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 500, color: "#52525b", letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 5px" }}>
          Sistema
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f4f4f5", margin: 0, letterSpacing: "-0.025em" }}>
          Configurações da Plataforma
        </h1>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "20px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f4f4f5", marginBottom: 4 }}>
              Configurações gerais
            </div>
            <p style={{ fontSize: 12, color: "#71717a", margin: 0, lineHeight: 1.5 }}>
              Dados da empresa, integrações e e-mails automáticos.
            </p>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 5,
            background: "rgba(113,113,122,0.10)", color: "#71717a",
            border: "1px solid rgba(113,113,122,0.18)", whiteSpace: "nowrap",
          }}>
            Em breve
          </span>
        </div>
      </div>

      <Link href="/admin/config/planos" style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 12, fontWeight: 500, color: "#818cf8", textDecoration: "none",
      }}>
        ← Ver Planos &amp; Preços
      </Link>
    </div>
  );
}
