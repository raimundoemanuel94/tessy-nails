// @ts-nocheck
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Building2, Users, LogOut,
  BarChart3, ExternalLink, Menu, X, ChevronRight,
} from "lucide-react";

/* ── Tokens ─────────────────────────────────────── */
const T = {
  bg:      "#0c0c0e",
  border:  "rgba(255,255,255,0.07)",
  sep:     "rgba(255,255,255,0.05)",
  accent:  "#6366f1",
  acBg:    "rgba(99,102,241,0.09)",
  acTx:    "#818cf8",
  text:    "#f4f4f5",
  sub:     "#a1a1aa",
  muted:   "#52525b",
  dim:     "#3f3f46",
};

/* ── Nav definition ─────────────────────────────── */
const GROUPS = [
  {
    label: "Plataforma",
    items: [
      { href: "/admin",               icon: LayoutDashboard, label: "Overview",  exact: true              },
      { href: "/admin/studios",       icon: Building2,       label: "Studios",   badge: "studios" as const },
    ],
  },
  {
    label: "Gestão",
    items: [
      { href: "/admin/profissionais", icon: Users,     label: "Usuários",   badge: "users" as const },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { href: "/admin/relatorios",    icon: BarChart3, label: "Relatórios" },
    ],
  },
];

/* ── Sub-components ─────────────────────────────── */
function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 2L19.5 7V15L11 20L2.5 15V7L11 2Z"
        stroke="#6366f1" strokeWidth="1.5" fill="rgba(99,102,241,0.12)" strokeLinejoin="round"/>
      <circle cx="11" cy="11" r="2.5" fill="#6366f1"/>
    </svg>
  );
}

function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span style={{
      minWidth: 18, height: 16, padding: "0 5px", borderRadius: 20,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 600, lineHeight: 1,
      background: "rgba(255,255,255,0.06)", color: T.dim,
      border: `1px solid ${T.sep}`, flexShrink: 0,
    }}>{n}</span>
  );
}

/* ── Single nav link ─────────────────────────────── */
function NavLink({ href, icon: Icon, label, badge, active, count, onClick }: {
  href: string; icon: any; label: string; badge?: string;
  active: boolean; count?: number; onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 10px 7px 12px", borderRadius: 7, textDecoration: "none",
      fontSize: 13, fontWeight: active ? 600 : 400,
      color: active ? T.text : T.sub,
      background: active ? T.acBg : "transparent",
      borderLeft: `2px solid ${active ? T.accent : "transparent"}`,
      transition: "color .15s, background .15s",
    }} className={active ? undefined : "a-nav-item"}>
      <Icon size={14} style={{ flexShrink: 0, color: active ? T.acTx : "inherit" }}/>
      <span style={{ flex: 1, lineHeight: 1 }}>{label}</span>
      {badge && !!count && <CountBadge n={count}/>}
      {active && <ChevronRight size={10} style={{ color: T.acTx, opacity: 0.5, flexShrink: 0 }}/>}
    </Link>
  );
}

/* ── Sidebar body (shared desktop + mobile) ─────── */
function SidebarBody({
  name, email, onNav,
  isActive, getCount, signOut,
}: {
  name: string; email?: string;
  onNav?: () => void;
  isActive: (h: string, e?: boolean) => boolean;
  getCount: (k?: string) => number;
  signOut: () => void;
}) {
  const initial = (name || "A").charAt(0).toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Logo */}
      <div style={{ padding: "13px 12px 12px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 9px", borderRadius: 8,
          background: "rgba(255,255,255,0.03)", border: `1px solid ${T.sep}`,
        }}>
          <LogoMark/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: "-0.02em", lineHeight: 1 }}>
              Nailit
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>Admin Console</div>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700, color: T.acTx, flexShrink: 0,
            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)",
            padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.05em",
          }}>SA</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "6px 8px", overflowY: "auto" }}>
        {GROUPS.map((g, gi) => (
          <div key={g.label} style={{ marginBottom: gi < GROUPS.length - 1 ? 2 : 0 }}>
            <div style={{
              fontSize: 9, fontWeight: 600, color: T.dim,
              letterSpacing: "0.10em", textTransform: "uppercase",
              padding: "9px 12px 4px", userSelect: "none",
            }}>{g.label}</div>
            {g.items.map(item => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                badge={item.badge}
                active={isActive(item.href, item.exact)}
                count={getCount(item.badge)}
                onClick={onNav}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* ── Footer user card ── */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px 10px 10px", flexShrink: 0 }}>
        <div style={{
          borderRadius: 10,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${T.sep}`,
          overflow: "hidden",
        }}>
          {/* User row */}
          <div style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "11px 12px 10px",
          }}>
            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: T.acTx,
            }}>{initial}</div>

            {/* Name / email */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: T.text,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3,
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
              fontSize: 8, fontWeight: 700, color: T.acTx, flexShrink: 0,
              background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.20)",
              padding: "2px 5px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.05em",
            }}>SA</span>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: T.sep }}/>

          {/* Actions */}
          <div style={{ padding: "4px 6px" }}>
            <Link href="/dashboard" onClick={onNav} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "7px 8px", borderRadius: 6, textDecoration: "none",
              fontSize: 12, color: T.muted, transition: "color .15s, background .15s",
            }} className="a-nav-item">
              <ExternalLink size={12} style={{ flexShrink: 0 }}/>
              <span>Ver como usuário</span>
            </Link>

            <button onClick={signOut} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "7px 8px", borderRadius: 6,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: T.muted, fontFamily: "inherit", textAlign: "left",
              transition: "color .15s, background .15s",
            }} className="a-signout-btn">
              <LogOut size={12} style={{ flexShrink: 0 }}/>
              <span>Sair da conta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main export ─────────────────────────────────── */
export function AdminSidebar({ name, email }: { name: string; email?: string }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState({ studios: 0, users: 0 });

  /* Fetch badge counts */
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("studios").select("id", { count: "exact", head: true }),
      sb.from("profiles").select("id", { count: "exact", head: true }),
    ]).then(([s, u]) => setCounts({ studios: s.count ?? 0, users: u.count ?? 0 }));
  }, []);

  /* Close mobile drawer on route change */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  /* Prevent body scroll when mobile sidebar open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login"); router.refresh();
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const getCount = (key?: string): number =>
    key ? (counts[key as keyof typeof counts] ?? 0) : 0;

  const sharedProps = { name, email, isActive, getCount, signOut };

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="admin-topbar">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: T.sub, display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            transition: "color .15s, background .15s",
          }}
          className="a-nav-item"
        >
          <Menu size={18}/>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1 }}>
          <LogoMark/>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
            Nailit
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: T.acTx,
            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.22)",
            padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.05em",
          }}>Admin</span>
        </div>
      </div>

      {/* ── Desktop sidebar ── */}
      <aside
        className="admin-sidebar-desktop"
        style={{
          position: "fixed", left: 0, top: 0, height: "100%", width: 220,
          background: T.bg, borderRight: `1px solid ${T.border}`, zIndex: 20,
        }}
      >
        <SidebarBody {...sharedProps}/>
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 28,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        className={`admin-sidebar-mobile${mobileOpen ? " open" : ""}`}
        style={{
          position: "fixed", left: 0, top: 0, height: "100%", width: 300,
          background: T.bg, borderRight: `1px solid ${T.border}`, zIndex: 29,
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
          style={{
            position: "absolute", top: 10, right: 10, zIndex: 1,
            background: "rgba(255,255,255,0.05)", border: `1px solid ${T.sep}`,
            borderRadius: 7, padding: 6, cursor: "pointer", color: T.muted,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color .15s, background .15s",
          }}
          className="a-nav-item"
        >
          <X size={14}/>
        </button>
        <SidebarBody {...sharedProps} onNav={() => setMobileOpen(false)}/>
      </aside>
    </>
  );
}
