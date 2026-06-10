// @ts-nocheck
import Link from "next/link";

export function AdminPlaceholder({ title, description, icon = "🚧", backHref = "/admin", backLabel = "Voltar à Visão Geral" }: {
  title: string; description?: string; icon?: string; backHref?: string; backLabel?: string;
}) {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>⚡ Superadmin</div>
        <h1 style={{ fontSize: 27, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: "-.02em" }}>{title}</h1>
      </div>

      <div style={{
        background: "var(--surface)", border: "1px dashed var(--border2)", borderRadius: 22,
        padding: "52px 28px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
      }}>
        <div style={{ fontSize: 44, opacity: .8 }}>{icon}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>Em construção</div>
        {description && <p style={{ fontSize: 13, color: "var(--muted)", maxWidth: 420, lineHeight: 1.6, margin: 0 }}>{description}</p>}
        <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 20, background: "rgba(245,200,66,.1)", color: "var(--yellow)", border: "1px solid rgba(245,200,66,.25)", marginTop: 4 }}>
          Disponível em breve
        </span>
        <Link href={backHref} style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: "var(--brand-light)", textDecoration: "none", padding: "9px 18px", borderRadius: 11, background: "rgba(124,92,191,.1)", border: "1px solid rgba(124,92,191,.25)" }}>
            ← {backLabel}
        </Link>
      </div>
    </div>
  );
}
