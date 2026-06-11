// @ts-nocheck
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Building2, Users, LogOut,
  BarChart3, ExternalLink, ChevronRight
} from "lucide-react";

/* ─── Design tokens ─────────────────────────────── */
const T = {
  bg:         "#0c0c0e",
  bgHover:    "rgba(255,255,255,0.04)",
  bgActive:   "rgba(99,102,241,0.09)",
  border:     "rgba(255,255,255,0.07)",
  sep:        "rgba(255,255,255,0.05)",
  accent:     "#6366f1",
  accentText: "#818cf8",
  text:       "#f4f4f5",
  sub:        "#a1a1aa",
  muted:      "#52525b",
  dimmer:     "#3f3f46",
};

/* ─── Nav groups ─────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: "Plataforma",
    items: [
      { href: "/admin",               icon: LayoutDashboard, label: "Overview",    exact: true },
      { href: "/admin/studios",       icon: Building2,       label: "Studios",     badge: "studios" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { href: "/admin/profissionais", icon: Users,    label: "Usuários",   badge: "users" },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { href: "/admin/relatorios",    icon: BarChart3, label: "Relatórios" },
    ],
  },
];

/* ─── Logo mark ──────────────────────────────────── */
function LogoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 2L17.5 6.25V13.75L10 18L2.5 13.75V6.25L10 2Z"
        stroke="#6366f1" strokeWidth="1.4" fill="rgba(99,102,241,0.12)"
      />
      <circle cx="10" cy="10" r="2.5" fill="#6366f1"/>
    </svg>
  );
}

/* ─── Badge pill ──────────────────────────────────── */
function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 18, height: 16, padding: "0 5px", borderRadius: 20,
      fontSize: 10, fontWeight: 600, lineHeight: 1,
      background: "rgba(255,255,255,0.07)",
      color: T.muted,
      border: `1px solid ${T.sep}`,
      letterSpacing: 0,
      flexShrink: 0,
    }}>{count}</span>
  );
}

/* ─── Nav item ───────────────────────────────────── */
function NavItem({
  href, icon: Icon, label, badge, active, count,
}: {
  href: string; icon: any; label: string; badge?: string;
  active: boolean; count?: number;
}) {
  return (
    <Link href={href} style={{
      position: "relative",
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 10px 7px 14px",
      borderRadius: 7, textDecoration: "none",
      fontSize: 13, fontWeight: active ? 600 : 400,
      color: active ? T.text : T.sub,
      background: active ? T.bgActive : "transparent",
      borderLeft: active ? `2px solid ${T.accent}` : "2px solid transparent",
      marginLeft: 0,
      transition: "color .15s, background .15s",
    }}
      className={active ? undefined : "a-nav-item"}
    >
      <Icon
        size={14}
        style={{
          flexShrink: 0,
          color: active ? T.accentText : "inherit",
          transition: "color .15s",
        }}
      />
      <span style={{ flex: 1, lineHeight: 1 }}>{label}</span>
      {badge && count != null && count > 0 && <Badge count={count}/>}
      {active && (
        <ChevronRight size={10} style={{ color: T.accentText, opacity: 0.6, flexShrink: 0 }}/>
      )}
    </Link>
  );
}

/* ─── Main component ──────────────────────────────── */
export function AdminSidebar({ name, email }: { name: string; email?: string }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [counts, setCounts] = useState<{ studios: number; users: number }>({ studios: 0, users: 0 });

  /* Fetch lightweight counts for badges */
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("studios").select("id", { count: "exact", head: true }),
      sb.from("profiles").select("id", { count: "exact", head: true }),
    ]).then(([s, u]) => {
      setCounts({ studios: s.count ?? 0, users: u.count ?? 0 });
    });
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login"); router.refresh();
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const getBadgeCount = (key?: string) => {
    if (!key) return undefined;
    return counts[key as keyof typeof counts] ?? 0;
  };

  const initials = (name || "A").charAt(0).toUpperCase();

  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%", width: 220,
      display: "flex", flexDirection: "column",
      background: T.bg,
      borderRight: `1px solid ${T.border}`,
      zIndex: 20,
    }}>

      {/* ── Workspace / Logo ── */}
      <div style={{
        padding: "14px 12px 13px",
        borderBottom: `1px solid ${T.border}`,
      }}>
        {/* Product wordmark */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 8px", borderRadius: 8,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${T.sep}`,
          cursor: "default",
        }}>
          <LogoMark/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: T.text,
              letterSpacing: "-0.02em", lineHeight: 1,
            }}>Nailit</div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 2, fontWeight: 400 }}>
              Admin Console
            </div>
          </div>
          {/* Environment badge */}
          <span style={{
            fontSize: 9, fontWeight: 700, color: T.accentText,
            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)",
            padding: "2px 6px", borderRadius: 4, letterSpacing: "0.04em",
            textTransform: "uppercase", flexShrink: 0,
          }}>Admin</span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{
        flex: 1, padding: "8px 8px",
        display: "flex", flexDirection: "column",
        gap: 0, overflowY: "auto",
      }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: gi < NAV_GROUPS.length - 1 ? 4 : 0 }}>

            {/* Group label */}
            <div style={{
              fontSize: 9, fontWeight: 600, color: T.dimmer,
              letterSpacing: "0.10em", textTransform: "uppercase",
              padding: "10px 12px 5px",
              userSelect: "none",
            }}>
              {group.label}
            </div>

            {/* Items */}
            {group.items.map(item => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                active={isActive(item.href, item.exact)}
                count={getBadgeCount(item.badge)}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div style={{
        padding: "8px",
        borderTop: `1px solid ${T.border}`,
        display: "flex", flexDirection: "column", gap: 1,
      }}>

        {/* User card */}
        <div style={{
          display: "flex", alignItems: "center", gap: 9,
          padding: "9px 10px", borderRadius: 8,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${T.sep}`,
          marginBottom: 4,
        }}>
          {/* Avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.28)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: T.accentText,
            letterSpacing: 0,
          }}>{initials}</div>

          {/* Name + email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: T.text,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              lineHeight: 1.2,
            }}>{name || "Admin"}</div>
            {email && (
              <div style={{
                fontSize: 10, color: T.muted, marginTop: 2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{email}</div>
            )}
          </div>

          {/* Superadmin badge */}
          <span style={{
            fontSize: 8, fontWeight: 700, color: T.accentText, flexShrink: 0,
            background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.20)",
            padding: "2px 5px", borderRadius: 3,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>SA</span>
        </div>

        {/* Actions */}
        <Link
          href="/dashboard"
          className="a-footer-btn"
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 10px", borderRadius: 7, textDecoration: "none",
            fontSize: 12, fontWeight: 400,
            color: T.muted,
          }}
        >
          <ExternalLink size={12} style={{ flexShrink: 0 }}/> Ver como usuário
        </Link>

        <button
          onClick={signOut}
          className="a-signout-btn"
          style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%",
            padding: "7px 10px", borderRadius: 7,
            background: "none", border: "none", cursor: "pointer",
            fontSize: 12, fontWeight: 400, color: T.muted,
            fontFamily: "inherit", textAlign: "left",
          }}
        >
          <LogOut size={12} style={{ flexShrink: 0 }}/> Sair
        </button>
      </div>
    </aside>
  );
}
