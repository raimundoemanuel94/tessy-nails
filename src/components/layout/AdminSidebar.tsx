// @ts-nocheck
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Building2, Users, LogOut, BarChart3, LayoutGrid, ChevronRight } from "lucide-react";

const NAV = [
  { href: "/admin",               label: "Overview",      icon: LayoutDashboard, exact: true  },
  { href: "/admin/studios",       label: "Studios",       icon: Building2                     },
  { href: "/admin/profissionais", label: "Profissionais", icon: Users                         },
  { href: "/admin/relatorios",    label: "Relatórios",    icon: BarChart3                     },
];

export function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const router   = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login"); router.refresh();
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%", width: 240,
      display: "flex", flexDirection: "column",
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      zIndex: 10,
    }} className="hidden md:flex">

      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 14,
            background: "linear-gradient(135deg, #7C5CBF 0%, #9D7FD4 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 20px rgba(124,92,191,0.4), inset 0 1px 0 rgba(255,255,255,.2)",
            fontSize: 20, flexShrink: 0,
          }}>💅</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "var(--text)", letterSpacing: "-.01em" }}>Nailit</div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 9, fontWeight: 800, letterSpacing: ".18em",
              color: "var(--gold)", textTransform: "uppercase",
              background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)",
              borderRadius: 6, padding: "1px 7px",
            }}>⚡ Superadmin</div>
          </div>
        </div>
      </div>

      {/* Dashboard link */}
      <div style={{ padding: "10px 10px 0" }}>
        <Link href="/dashboard" style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 12px", borderRadius: 12, textDecoration: "none",
          background: "rgba(124,92,191,0.06)", border: "1px solid rgba(124,92,191,0.12)",
          color: "var(--muted)", fontSize: 12, fontWeight: 600, transition: "all .15s",
        }}>
          <LayoutGrid size={14} /> Ir para Dashboard
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px", display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", padding: "8px 12px 4px" }}>
          Gerenciamento
        </div>
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 12, textDecoration: "none",
              fontSize: 13, fontWeight: active ? 700 : 500, transition: "all .15s",
              background: active ? "rgba(124,92,191,0.15)" : "transparent",
              border: active ? "1px solid rgba(124,92,191,0.25)" : "1px solid transparent",
              color: active ? "var(--brand-light)" : "var(--muted)",
            }}>
              <Icon size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {active && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "10px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10,
          background: "rgba(124,92,191,0.06)", border: "1px solid rgba(124,92,191,0.1)",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,#7C5CBF,#f0b64a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: "#fff",
          }}>{name.charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
            <div style={{ fontSize: 10, color: "var(--gold)" }}>Superadmin</div>
          </div>
        </div>
        <button onClick={signOut} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "9px 12px", borderRadius: 10, background: "none",
          border: "1px solid transparent", cursor: "pointer",
          fontSize: 12, fontWeight: 600, color: "var(--muted)", transition: "all .15s", fontFamily: "inherit",
        }}
          onMouseEnter={(e: any) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.06)"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.2)"; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; }}>
          <LogOut size={14} /> Sair da conta
        </button>
      </div>
    </aside>
  );
}
