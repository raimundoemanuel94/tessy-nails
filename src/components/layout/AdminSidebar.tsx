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
  bg:      "#06060f",
  bgHdr:   "rgba(245,158,11,0.04)",
  accent:  "#f59e0b",
  accent2: "#fcd34d",
  glow:    "rgba(245,158,11,0.25)",
  border:  "rgba(255,255,255,0.09)",
  text:    "#ede9fe",
  muted:   "#504d6a",
  muted2:  "#8884a0",
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
      background: A.bg,
      borderRight: `1px solid ${A.border}`,
      zIndex: 20,
      boxShadow: "4px 0 32px rgba(0,0,0,0.5)",
    }}>

      {/* Logo */}
      <div style={{
        padding: "16px 14px 14px",
        borderBottom: `1px solid ${A.border}`,
        background: A.bgHdr,
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 9px", borderRadius: 6, marginBottom: 13,
          background: `${A.accent}18`, border: `1px solid ${A.accent}35`,
        }}>
          <Zap size={9} color={A.accent} fill={A.accent} />
          <span style={{ fontSize: 9, fontWeight: 800, color: A.accent, letterSpacing: "0.13em", textTransform: "uppercase" }}>
            Admin Console
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: `linear-gradient(135deg,${A.accent},${A.accent2})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 4px 16px ${A.glow}`,
          }}>
            <Shield size={17} color="#000" fill="#000" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: A.text, lineHeight: 1, letterSpacing: "-0.03em" }}>
              Nailit
            </div>
            <div style={{ fontSize: 10, color: A.muted2, marginTop: 3, fontWeight: 500, letterSpacing: "0.04em" }}>
              Platform
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
        <div style={{
          fontSize: 9, fontWeight: 800, color: A.muted,
          letterSpacing: "0.14em", textTransform: "uppercase",
          padding: "8px 10px 5px",
        }}>Plataforma</div>

        {NAV.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px 9px 12px",
              borderRadius: 9, textDecoration: "none",
              fontSize: 13, fontWeight: active ? 700 : 500,
              transition: "all .12s",
              background: active ? `${A.accent}13` : "transparent",
              borderLeft: active ? `3px solid ${A.accent}` : "3px solid transparent",
              color: active ? A.accent : A.muted2,
              boxShadow: active ? `inset 0 0 0 1px ${A.accent}22` : "none",
            }}
              onMouseEnter={(e: any) => {
                if (!active) {
                  e.currentTarget.style.color = A.text;
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderLeft = "3px solid rgba(255,255,255,0.1)";
                }
              }}
              onMouseLeave={(e: any) => {
                if (!active) {
                  e.currentTarget.style.color = A.muted2;
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderLeft = "3px solid transparent";
                }
              }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {active && <ChevronRight size={11} style={{ opacity: 0.55 }} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "8px", borderTop: `1px solid ${A.border}`, display: "flex", flexDirection: "column", gap: 1 }}>
        {/* User chip */}
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "10px 11px", borderRadius: 10,
          background: `${A.accent}0c`, border: `1px solid ${A.accent}22`,
          marginBottom: 3,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg,${A.accent},${A.accent2})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 900, color: "#000",
            boxShadow: `0 2px 10px ${A.glow}`,
          }}>
            {(name || "A").charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: A.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {name || "Admin"}
            </div>
            {email && (
              <div style={{ fontSize: 10, color: A.muted2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                {email}
              </div>
            )}
          </div>
        </div>

        <Link href="/dashboard" style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 11px", borderRadius: 8, textDecoration: "none",
          fontSize: 12, fontWeight: 600, color: A.muted2, transition: "all .12s",
        }}
          onMouseEnter={(e: any) => { e.currentTarget.style.color = A.text; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.color = A.muted2; e.currentTarget.style.background = "transparent"; }}
        >
          <ExternalLink size={12} /> Ver como usuário
        </Link>

        <button onClick={signOut} style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          padding: "8px 11px", borderRadius: 8,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 600, color: A.muted2, transition: "all .12s",
          fontFamily: "inherit",
        }}
          onMouseEnter={(e: any) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.07)"; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.color = A.muted2; e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut size={12} /> Sair da conta
        </button>
      </div>
    </aside>
  );
}
