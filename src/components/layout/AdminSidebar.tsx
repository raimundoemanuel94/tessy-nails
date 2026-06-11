// @ts-nocheck
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard, Building2, Users, LogOut,
  BarChart3, DollarSign, Settings, Tag,
  ExternalLink, Menu, X, ChevronRight, ChevronDown,
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

/* ── Nav structure
   type "link"  → item simples, navega direto
   type "group" → colapsável, children são sub-links
────────────────────────────────────────────────── */
const NAV = [
  {
    section: "Plataforma",
    items: [
      { type: "link",  href: "/admin",     icon: LayoutDashboard, label: "Overview",  exact: true },
      { type: "link",  href: "/admin/studios", icon: Building2,   label: "Studios",   badge: "studios" as const },
    ],
  },
  {
    section: "Gestão",
    items: [
      { type: "link",  href: "/admin/profissionais", icon: Users, label: "Usuários",  badge: "users" as const },
    ],
  },
  {
    section: "Relatórios",
    items: [
      { type: "link",  href: "/admin/relatorios", icon: BarChart3, label: "Relatórios" },
    ],
  },
  {
    section: "Financeiro",
    items: [
      {
        type: "group", key: "financeiro", icon: DollarSign, label: "Financeiro",
        children: [
          { href: "/admin/financeiro",                    label: "Receita",       exact: true },
          { href: "/admin/financeiro/assinaturas",        label: "Assinaturas"               },
          { href: "/admin/financeiro/inadimplencia",      label: "Inadimplência"             },
        ],
      },
    ],
  },
  {
    section: "Sistema",
    items: [
      {
        type: "group", key: "plataforma", icon: Settings, label: "Plataforma",
        children: [
          { href: "/admin/config/planos", label: "Planos & Preços" },
          { href: "/admin/config",        label: "Configurações", exact: true },
        ],
      },
    ],
  },
] as const;

/* ── Logo mark ───────────────────────────────────── */
function LogoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 1.5L17.5 5.75V14.25L10 18.5L2.5 14.25V5.75L10 1.5Z"
        stroke="#818cf8" strokeWidth="1.4" fill="rgba(99,102,241,0.10)" strokeLinejoin="round"/>
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
      fontSize: 10, fontWeight: 600, lineHeight: 1, flexShrink: 0,
      background: "rgba(255,255,255,0.05)", color: T.muted,
      border: "1px solid rgba(255,255,255,0.05)",
    }}>{n}</span>
  );
}

/* ── Simple nav link ─────────────────────────────── */
function NavLink({ href, icon: Icon, label, badge, active, count, onClick }: {
  href: string; icon: any; label: string; badge?: string;
  active: boolean; count?: number; onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className="adm-nav-link" style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "8px 10px", borderRadius: 7, textDecoration: "none",
      fontSize: 13, fontWeight: active ? 600 : 400,
      color: active ? T.text : T.sub,
      background: active ? T.acBg : "transparent",
      borderLeft: active ? `2px solid ${T.accent}` : "2px solid transparent",
    }}>
      <Icon size={15} style={{ flexShrink: 0, color: active ? T.acTx : "inherit" }} />
      <span style={{ flex: 1, lineHeight: 1 }}>{label}</span>
      {badge && !!count && <CountBadge n={count} />}
      {active && <ChevronRight size={11} style={{ color: T.acTx, opacity: 0.45, flexShrink: 0 }} />}
    </Link>
  );
}

/* ── Collapsible group ───────────────────────────── */
function NavGroup({ item, isActive, onNav, open, onToggle }: {
  item: any; isActive: (h: string, e?: boolean) => boolean;
  onNav?: () => void; open: boolean; onToggle: () => void;
}) {
  const Icon = item.icon;
  const anyChildActive = item.children.some((c: any) =>
    c.exact ? isActive(c.href, true) : isActive(c.href)
  );

  return (
    <div>
      {/* Group header — button only, never navigates */}
      <button
        onClick={onToggle}
        className="adm-nav-link"
        style={{
          display: "flex", alignItems: "center", gap: 9, width: "100%",
          padding: "8px 10px", borderRadius: 7, cursor: "pointer",
          fontFamily: "inherit", textAlign: "left",
          fontSize: 13, fontWeight: anyChildActive ? 600 : 400,
          color: anyChildActive ? T.text : T.sub,
          background: anyChildActive && !open ? T.acBg : "transparent",
          borderLeft: anyChildActive && !open ? `2px solid ${T.accent}` : "2px solid transparent",
          border: "none",
        }}
      >
        <Icon size={15} style={{ flexShrink: 0, color: anyChildActive ? T.acTx : "inherit" }} />
        <span style={{ flex: 1, lineHeight: 1 }}>{item.label}</span>
        <ChevronDown
          size={12}
          style={{
            color: T.dim, flexShrink: 0,
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.18s ease",
          }}
        />
      </button>

      {/* Children — revealed by max-height (no JS animation, just CSS) */}
      <div style={{
        overflow: "hidden",
        maxHeight: open ? item.children.length * 38 + 4 + "px" : "0px",
        transition: "max-height 0.18s ease",
      }}>
        <div style={{
          marginLeft: 16,
          paddingLeft: 10,
          borderLeft: `1px solid ${T.sep}`,
          marginTop: 2,
          display: "flex", flexDirection: "column", gap: 1,
        }}>
          {item.children.map((c: any) => {
            const active = c.exact ? isActive(c.href, true) : isActive(c.href);
            return (
              <Link
                key={c.href}
                href={c.href}
                onClick={onNav}
                className="adm-nav-link"
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "7px 10px", borderRadius: 6, textDecoration: "none",
                  fontSize: 12.5, fontWeight: active ? 600 : 400,
                  color: active ? T.text : T.sub,
                  background: active ? "rgba(99,102,241,0.08)" : "transparent",
                  borderLeft: active ? `2px solid ${T.accent}` : "2px solid transparent",
                }}
              >
                <span style={{ flex: 1, lineHeight: 1 }}>{c.label}</span>
                {active && <ChevronRight size={10} style={{ color: T.acTx, opacity: 0.45, flexShrink: 0 }} />}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar body ────────────────────────────────── */
function SidebarBody({ name, email, onNav, isActive, getCount, signOut, openGroups, toggleGroup }: {
  name: string; email?: string; onNav?: () => void;
  isActive: (h: string, e?: boolean) => boolean;
  getCount: (k?: string) => number;
  signOut: () => void;
  openGroups: Record<string, boolean>;
  toggleGroup: (key: string) => void;
}) {
  const initial    = (name || "A").charAt(0).toUpperCase();
  const shortEmail = email ? (email.length > 26 ? email.slice(0, 24) + "…" : email) : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Workspace header */}
      <div style={{ padding: "14px 12px 13px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "9px 11px", borderRadius: 9,
          background: T.bgCard, border: `1px solid ${T.sep}`,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: T.acBg, border: `1px solid ${T.acBorder}`,
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
            background: T.acBg, border: `1px solid ${T.acBorder}`,
            padding: "3px 7px", borderRadius: 4,
            textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0,
          }}>Superadmin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {NAV.map((section, si) => (
          <div key={section.section} style={{ marginBottom: si < NAV.length - 1 ? 10 : 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: T.dim,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "12px 12px 6px", userSelect: "none",
            }}>{section.section}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {section.items.map((item: any) => {
                if (item.type === "link") {
                  return (
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
                  );
                }
                // type === "group"
                return (
                  <NavGroup
                    key={item.key}
                    item={item}
                    isActive={isActive}
                    onNav={onNav}
                    open={!!openGroups[item.key]}
                    onToggle={() => toggleGroup(item.key)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px", flexShrink: 0 }}>
        <div style={{ borderRadius: 10, background: T.bgCard, border: `1px solid ${T.sep}`, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 12px 11px" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: "rgba(99,102,241,0.14)", border: `1px solid ${T.acBorder}`,
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
                  background: T.acBg, border: `1px solid rgba(99,102,241,0.20)`,
                  padding: "1px 5px", borderRadius: 3,
                  textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0,
                }}>SA</span>
              </div>
              {shortEmail && (
                <div style={{ fontSize: 10, color: T.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {shortEmail}
                </div>
              )}
            </div>
          </div>
          <div style={{ height: 1, background: T.sep, margin: "0 10px" }} />
          <div style={{ padding: "5px 6px 6px" }}>
            <Link href="/dashboard" onClick={onNav} className="adm-footer-btn" style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 8px", borderRadius: 6, textDecoration: "none",
              fontSize: 12, fontWeight: 500, color: T.muted,
            }}>
              <ExternalLink size={13} style={{ flexShrink: 0 }} />
              <span>Ver como usuário</span>
            </Link>
            <button onClick={signOut} className="adm-signout-btn" style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "8px 8px", borderRadius: 6,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 500, color: T.muted,
              fontFamily: "inherit", textAlign: "left",
            }}>
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Auto-open the group that contains the active route
  useEffect(() => {
    const next: Record<string, boolean> = {};
    NAV.forEach(section => {
      section.items.forEach((item: any) => {
        if (item.type === "group") {
          const hasActive = item.children.some((c: any) =>
            c.exact ? pathname === c.href : pathname.startsWith(c.href)
          );
          if (hasActive) next[item.key] = true;
        }
      });
    });
    setOpenGroups(prev => ({ ...prev, ...next }));
  }, [pathname]);

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
    router.push("/login"); router.refresh();
  }

  const isActive  = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);
  const getCount  = (key?: string): number =>
    key ? (counts[key as keyof typeof counts] ?? 0) : 0;
  const toggleGroup = (key: string) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const sharedProps = { name, email, isActive, getCount, signOut, openGroups, toggleGroup };

  return (
    <>
      {/* Mobile top bar */}
      <div className="admin-topbar">
        <button onClick={() => setMobileOpen(true)} aria-label="Abrir menu" className="adm-icon-btn"
          style={{ background: "none", border: "none", cursor: "pointer", color: T.sub, display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, flexShrink: 0 }}>
          <Menu size={18} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <LogoMark />
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>Nailit</span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: T.acTx,
            background: T.acBg, border: `1px solid ${T.acBorder}`,
            padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em",
          }}>Admin</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="admin-sidebar-desktop" style={{
        position: "fixed", left: 0, top: 0, height: "100%", width: 240,
        background: T.bg, borderRight: `1px solid ${T.border}`, zIndex: 20,
      }}>
        <SidebarBody {...sharedProps} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: "fixed", inset: 0, zIndex: 28,
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }} />
      )}

      {/* Mobile drawer */}
      <aside className={"admin-sidebar-mobile" + (mobileOpen ? " open" : "")} style={{
        position: "fixed", left: 0, top: 0, height: "100%",
        width: "min(300px, 85vw)",
        background: T.bg, borderRight: `1px solid ${T.border}`, zIndex: 29,
      }}>
        <button onClick={() => setMobileOpen(false)} aria-label="Fechar menu" className="adm-icon-btn"
          style={{ position: "absolute", top: 12, right: 12, zIndex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${T.sep}`, borderRadius: 7, padding: 6, cursor: "pointer", color: T.muted, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={14} />
        </button>
        <SidebarBody {...sharedProps} onNav={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
