// @ts-nocheck
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Building2, Users, LogOut,
  Shield, BarChart3, ChevronRight, ExternalLink, Zap
} from "lucide-react";

const A = {
  accent: "#f59e0b", accent2: "#fcd34d",
  glow: "rgba(245,158,11,0.2)",
  surface: "#0f0e1a", border: "rgba(255,255,255,0.06)",
  text: "#f0f0ff", muted: "#6b6585",
};

const NAV = [
  { href: "/admin",               icon: LayoutDashboard, label: "Overview",      exact: true },
  { href: "/admin/studios",       icon: Building2,       label: "Studios"                    },
  { href: "/admin/profissionais", icon: Users,           label: "Profissionais"              },
  { href: "/admin/relatorios",    icon: BarChart3,       label: "Relatórios"                 },
];

export function AdminSidebar({ name, email }: { name: string; email?: string }) {
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
      position: "fixed", left: 0, top: 0, height: "100%", width: 220,
      display: "flex", flexDirection: "column",
      background: A.surface, borderRight: `1px solid ${A.border}`, zIndex: 20,
    }}>

      {/* Logo */}
      <div style={{ padding: "18px 14px 14px", borderBottom: `1px solid ${A.border}` }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 8px", borderRadius: 6, marginBottom: 10,
          background: `${A.accent}15`, border: `1px solid ${A.accent}28`,
        }}>
          <Zap size={9} color={A.accent} fill={A.accent} />
          <span style={{ fontSize: 9, fontWeight: 800, color: A.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Admin Console
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: `linear-gradient(135deg,${A.accent},${A.accent2})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 12px ${A.glow}`,
          }}>
            <Shield size={15} color="#000" fill="#000" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: A.text, lineHeight: 1 }}>Nailit</div>
            <div style={{ fontSize: 10, color: A.muted, marginTop: 2 }}>Platform</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
        <div style={{
          fontSize: 9, fontWeight: 800, color: A.muted,
          letterSpacing: "0.1em", textTransform: "uppercase",
          padding: "8px 8px 4px",
        }}>Plataforma</div>

        {NAV.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "9px 10px", borderRadius: 9, textDecoration: "none",
              fontSize: 13, fontWeight: active ? 700 : 500,
              transition: "all .12s",
              background: active ? `${A.accent}14` : "transparent",
              border: `1px solid ${active ? `${A.accent}35` : "transparent"}`,
              color: active ? A.accent : A.muted,
            }}
              onMouseEnter={(e: any) => { if (!active) { e.currentTarget.style.color = A.text; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}}
              onMouseLeave={(e: any) => { if (!active) { e.currentTarget.style.color = A.muted; e.currentTarget.style.background = "transparent"; }}}
            >
              <Icon size={14} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {active && <ChevronRight size={11} style={{ opacity: 0.5 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "8px", borderTop: `1px solid ${A.border}`, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* User chip */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 10px", borderRadius: 9,
          background: `${A.accent}08`, border: `1px solid ${A.accent}18`,
          marginBottom: 2,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg,${A.accent},${A.accent2})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 900, color: "#000",
          }}>
            {(name || "A").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: A.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name || "Admin"}</div>
            {email && <div style={{ fontSize: 10, color: A.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>}
          </div>
        </div>

        <Link href="/dashboard" style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "8px 10px", borderRadius: 9, textDecoration: "none",
          fontSize: 12, fontWeight: 600, color: A.muted, transition: "all .12s",
        }}
          onMouseEnter={(e: any) => { e.currentTarget.style.color = A.text; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.color = A.muted; e.currentTarget.style.background = "transparent"; }}
        >
          <ExternalLink size={13} /> Ver como usuário
        </Link>

        <button onClick={signOut} style={{
          display: "flex", alignItems: "center", gap: 9, width: "100%",
          padding: "8px 10px", borderRadius: 9,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 600, color: A.muted, transition: "all .12s", fontFamily: "inherit",
        }}
          onMouseEnter={(e: any) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.07)"; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.color = A.muted; e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut size={13} /> Sair da conta
        </button>
      </div>
    </aside>
  );
}
