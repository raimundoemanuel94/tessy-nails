// @ts-nocheck
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Building2, Users, LogOut,
  BarChart3, ExternalLink
} from "lucide-react";

const T = {
  bg:     "#0c0c0e",
  border: "rgba(255,255,255,0.07)",
  text:   "#f4f4f5",
  sub:    "#a1a1aa",
  muted:  "#52525b",
  active: "#6366f1",
};

const NAV = [
  { href: "/admin",               icon: LayoutDashboard, label: "Overview",      exact: true },
  { href: "/admin/studios",       icon: Building2,       label: "Studios"                    },
  { href: "/admin/profissionais", icon: Users,           label: "Usuários"                   },
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
      background: T.bg,
      borderRight: `1px solid ${T.border}`,
      zIndex: 20,
    }}>

      {/* Logo */}
      <div style={{
        padding: "18px 16px 16px",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.30)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" stroke="#6366f1" strokeWidth="1.4" fill="none"/>
              <circle cx="7" cy="7" r="2" fill="#6366f1"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, letterSpacing: "-0.02em", lineHeight: 1 }}>
              Nailit
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 2, fontWeight: 500 }}>
              Admin Console
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "8px 8px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: T.muted,
          letterSpacing: "0.08em", textTransform: "uppercase",
          padding: "10px 8px 4px",
        }}>Plataforma</div>

        {NAV.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "8px 9px",
              borderRadius: 7, textDecoration: "none",
              fontSize: 13, fontWeight: active ? 600 : 400,
              color: active ? T.text : T.sub,
              background: active ? "rgba(99,102,241,0.10)" : "transparent",
              transition: "all .12s",
            }}
              className={active ? undefined : "a-nav-link"}
            >
              <Icon size={14} style={{ flexShrink: 0, color: active ? T.active : "inherit" }}/>
              <span style={{ flex: 1 }}>{label}</span>
              {active && (
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.active, flexShrink: 0 }}/>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "8px", borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 1 }}>
        {/* User chip */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 9px", borderRadius: 8,
          background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`,
          marginBottom: 4,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
            background: "rgba(99,102,241,0.20)", border: "1px solid rgba(99,102,241,0.30)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: "#818cf8",
          }}>
            {(name || "A").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name || "Admin"}
            </div>
            {email && (
              <div style={{ fontSize: 10, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                {email}
              </div>
            )}
          </div>
        </div>

        <Link href="/dashboard" style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 9px", borderRadius: 7, textDecoration: "none",
          fontSize: 12, fontWeight: 500, color: T.sub,
        }}
          className="a-nav-link"
        >
          <ExternalLink size={12}/> Ver como usuário
        </Link>

        <button onClick={signOut} style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "7px 9px", borderRadius: 7,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 500, color: T.sub,
          fontFamily: "inherit", textAlign: "left",
          transition: "color .12s, background .12s",
        }}
          onMouseEnter={(e: any) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.color = T.sub; e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut size={12}/> Sair
        </button>
      </div>
    </aside>
  );
}
