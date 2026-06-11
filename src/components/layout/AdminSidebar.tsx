// @ts-nocheck
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Building2, Users, LogOut,
  BarChart3, ExternalLink, Menu, X, ChevronRight,
} from "lucide-react";

/* ── Design tokens ───────────────────────────────── */
const T = {
  bg:       "#0d0d10",
  bgCard:   "rgba(255,255,255,0.025)",
  border:   "rgba(255,255,255,0.08)",
  sep:      "rgba(255,255,255,0.05)",
  accent:   "#6366f1",
  acBg:     "rgba(99,102,241,0.10)",
  acTx:     "#818cf8",
  acBorder: "rgba(99,102,241,0.25)",
  text:     "#f4f4f5",
  sub:      "#a1a1aa",
  muted:    "#71717a",
  dim:      "#52525b",
};

/* ── Nav groups ─────────────────────────────────── */
const GROUPS = [
  {
    label: "Plataforma",
    items: [
      { href: "/admin",               icon: LayoutDashboard, label: "Overview",    exact: true              },
      { href: "/admin/studios",       icon: Building2,       label: "Studios",     badge: "studios" as const },
    ],
  },
  {
    label: "Gestão",
    items: [
      { href: "/admin/profissionais", icon: Users,    label: "Usuários",    badge: "users" as const },
    ],
  },
  {
    label: "Relatórios",
    items: [
      { href: "/admin/relatorios",    icon: BarChart3, label: "Relatórios" },
    ],
  },
];

/* ── Logo mark ───────────────────────────────────── */
function LogoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 1.5L17.5 5.75V14.25L10 18.5L2.5 14.25V5.75L10 1.5Z"
        stroke="#818cf8" strokeWidth="1.4" fill="rgba(99,102,241,0.10)"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.2" fill="#818cf8"/>
    </svg>
  );
}

/* ── Count badge ─────────────────────────────────── */
function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span style={{
      minWidth: 20, height: 18, padding: "0 6px", borderRadius: 20,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 600, lineHeight: 1,
      background: "rgba(255,255,255,0.05)", color: T.muted,
      border: "1px solid rgba(255,255,255,0.05)", flexShrink: 0,
    }}>{n}</span>
  );
}

/* ── Nav link ────────────────────────────────────── */
function NavLink({ href, icon: Icon, label, badge, active, count, onClick }: {
  href: string; icon: any; label: string; badge?: string;
  active: boolean; count?: number; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="adm-nav-link"
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "8px 10px 8px 10px",
        borderRadius: 7, textDecoration: "none",
        fontSize: 13, fontWeight: active ? 600 : 400,
        color: active ? T.text : T.sub,
        background: active ? T.acBg : "transparent",
        borderLeft: active ? "2px solid " + T.accent : "2px solid transparent",
        transition: "color .15s, background .15s",
      }}
    >
      <Icon size={15} style={{ flexShrink: 0, color: active ? T.acTx : "inherit" }} />
      <span style={{ flex: 1, lineHeight: 1 }}>{label}</span>
      {badge && !!count && <CountBadge n={count} />}
      {active && <ChevronRight size={11} style={{ color: T.acTx, opacity: 0.45, flexShrink: 0 }} />}
    </Link>
  );
}

/* ── Sidebar body ────────────────────────────────── */
function SidebarBody({ name, email, onNav, isActive, getCount, signOut }: {
  name: string; email?: string; onNav?: () => void;
  isActive: (h: string, e?: boolean) => boolean;
  getCount: (k?: string) => number;
  signOut: () => void;
}) {
  const initial   = (name || "A").charAt(0).toUpperCase();
  const shortEmail = email
    ? (email.length > 26 ? email.slice(0, 24) + "…" : email)
    : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Workspace switcher */}
      <div style={{ padding: "14px 12px 13px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 11px", borderRadius: 9,
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <LogoMark />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, letterSpacing: "-0.02em", lineHeight: 1 }}>
              Nailit
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 3, lineHeight: 1 }}>Admin Console</div>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700, color: T.acTx,
            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
            padding: "3px 7px", borderRadius: 4,
            textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0,
          }}>Superadmin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {GROUPS.map((g, gi) => (
          <div key={g.label} style={{ marginBottom: gi < GROUPS.length - 1 ? 6 : 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: T.dim,
              letterSpacing: "0.09em", textTransform: "uppercase",
              padding: "10px 12px 5px", userSelect: "none",
            }}>{g.label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
          </div>
        ))}
      </nav>

      {/* Footer user card */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "10px", flexShrink: 0 }}>
        <div style={{
          borderRadius: 10, background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden",
        }}>
          {/* User row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 12px 11px" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: "rgba(99,102,241,0.14)", border: "1px solid rgba(99,102,241,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: T.acTx,
            }}>{initial}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: T.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  lineHeight: 1.3, maxWidth: 100,
                }}>{name || "Admin"}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: T.acTx,
                  background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.20)",
                  padding: "1px 5px", borderRadius: 3,
                  textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0,
                }}>SA</span>
              </div>
              {shortEmail && (
                <div style={{
                  fontSize: 10, color: T.muted, marginTop: 2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{shortEmail}</div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 10px" }} />

          {/* Actions */}
          <div style={{ padding: "5px 6px 6px" }}>
            <Link
              href="/dashboard"
              onClick={onNav}
              className="adm-footer-btn"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 8px", borderRadius: 6, textDecoration: "none",
                fontSize: 12, fontWeight: 500, color: T.muted,
                transition: "color .15s, background .15s",
              }}
            >
              <ExternalLink size={13} style={{ flexShrink: 0 }} />
              <span>Ver como usuário</span>
            </Link>
            <button
              onClick={signOut}
              className="adm-signout-btn"
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "8px 8px", borderRadius: 6,
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 500, color: T.muted,
                fontFamily: "inherit", textAlign: "left",
                transition: "color .15s, background .15s",
              }}
            >
              <LogOut size={13} style={{ flexShrink: 0 }} />
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
  const [counts, setCounts]         = useState({ studios: 0, users: 0 });

  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("studios").select("id", { count: "exact", head: true }),
      sb.from("profiles").select("id", { count: "exact", head: true }),
    ]).then(([s, u]) => setCounts({ studios: s.count ?? 0, users: u.count ?? 0 }));
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);
  const getCount = (key?: string): number =>
    key ? (counts[key as keyof typeof counts] ?? 0) : 0;
  const sharedProps = { name, email, isActive, getCount, signOut };

  return (
    <>
      {/* Mobile top bar */}
      <div className="admin-topbar">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="adm-icon-btn"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: T.sub, display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          }}
        >
          <Menu size={18} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <LogoMark />
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>Nailit</span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: T.acTx,
            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
            padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em",
          }}>Admin</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="admin-sidebar-desktop" style={{
        position: "fixed", left: 0, top: 0, height: "100%", width: 240,
        background: T.bg, borderRight: "1px solid rgba(255,255,255,0.08)", zIndex: 20,
      }}>
        <SidebarBody {...sharedProps} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 28,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={"admin-sidebar-mobile" + (mobileOpen ? " open" : "")}
        style={{
          position: "fixed", left: 0, top: 0, height: "100%",
          width: "min(300px, 85vw)",
          background: T.bg, borderRight: "1px solid rgba(255,255,255,0.08)", zIndex: 29,
        }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
          className="adm-icon-btn"
          style={{
            position: "absolute", top: 12, right: 12, zIndex: 1,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 7, padding: 6, cursor: "pointer", color: T.muted,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={14} />
        </button>
        <SidebarBody {...sharedProps} onNav={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
