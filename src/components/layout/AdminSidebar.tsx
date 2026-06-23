"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AlertCircle, BarChart3, Building2, CalendarCheck,
  Command, CreditCard, DollarSign, ExternalLink,
  FileText, LayoutDashboard, LogOut, Menu,
  MessageSquare, Moon, PanelLeftClose, PanelLeftOpen,
  ReceiptText, Settings, SlidersHorizontal, Sun,
  Users, UserCog, WalletCards, X,
} from "lucide-react";

// NAV flat — sem grupos, igual Sales.io
const NAV_ITEMS = [
  // Plataforma
  { href: "/admin",                    label: "Dashboard",      icon: LayoutDashboard, exact: true,  badge: null,           group: "Plataforma" },
  { href: "/admin/studios",            label: "Salões",         icon: Building2,       exact: false, badge: "studios",      group: "Plataforma" },
  { href: "/admin/clientes",           label: "Clientes",       icon: Users,           exact: false, badge: "clients",      group: "Plataforma" },
  { href: "/admin/agendamentos",       label: "Agendamentos",   icon: CalendarCheck,   exact: false, badge: "appointments", group: "Plataforma" },
  { href: "/admin/relatorios",         label: "Relatórios",     icon: BarChart3,       exact: false, badge: null,           group: "Plataforma" },
  // Equipe
  { href: "/admin/profissionais",      label: "Profissionais",  icon: UserCog,         exact: false, badge: "users",        group: "Equipe"     },
  { href: "/admin/comissoes",          label: "Comissões",      icon: ReceiptText,     exact: false, badge: null,           group: "Equipe"     },
  // Financeiro
  { href: "/admin/financeiro",         label: "Financeiro",     icon: WalletCards,     exact: true,  badge: null,           group: "Financeiro" },
  { href: "/admin/financeiro/assinaturas",  label: "Assinaturas",   icon: CreditCard,      exact: false, badge: null,      group: "Financeiro" },
  { href: "/admin/financeiro/inadimplencia",label: "Inadimplência", icon: AlertCircle,     exact: false, badge: null,      group: "Financeiro" },
  { href: "/admin/config/planos",      label: "Planos",         icon: SlidersHorizontal,exact:false, badge: null,           group: "Financeiro" },
  // Sistema
  { href: "/admin/config",             label: "Configurações",  icon: Settings,        exact: true,  badge: null,           group: "Sistema"    },
  { href: "/admin/mensagens",          label: "Mensagens",      icon: MessageSquare,   exact: false, badge: null,           group: "Sistema"    },
] as const;

const GROUPS = ["Plataforma", "Equipe", "Financeiro", "Sistema"] as const;

function LogoMark() {
  return (
    <div className="adm-logo-mark">
      <Command size={16} strokeWidth={2.35} />
    </div>
  );
}

function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return <span className="adm-count">{n > 99 ? "99+" : n}</span>;
}

function readBrowserStorage(key: string) {
  try { return window.localStorage?.getItem(key) ?? null; } catch { return null; }
}
function writeBrowserStorage(key: string, value: string) {
  try { window.localStorage?.setItem(key, value); } catch {}
}

function SidebarBody({ name, email, onNav, isActive, getCount, signOut, theme, toggleTheme, collapsed, toggleCollapsed }: any) {
  const initial = (name || "A").charAt(0).toUpperCase();
  const shortEmail = email ? (email.length > 26 ? `${email.slice(0, 23)}...` : email) : "superadmin";
  const isDay = theme === "day";

  return (
    <div className="adm-sidebar-shell">
      {/* Brand */}
      <div className="adm-sidebar-brand">
        <LogoMark />
        {!collapsed && (
          <div className="adm-brand-copy">
            <div>
              <strong>Nailit</strong>
              <span>Admin</span>
            </div>
          </div>
        )}
        <button type="button" className="adm-theme-icon" onClick={toggleTheme}
          title={isDay ? "Tema noite" : "Tema dia"}>
          {isDay ? <Moon size={14} /> : <Sun size={14} />}
        </button>
        {toggleCollapsed && (
          <button type="button" className="adm-collapse-icon" onClick={toggleCollapsed}
            title={collapsed ? "Expandir" : "Recolher"}>
            {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        )}
      </div>

      {/* Nav flat */}
      <nav className="adm-sidebar-nav">
        {GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group);
          return (
            <div key={group} className="adm-nav-section">
              {!collapsed && <p>{group}</p>}
              <div>
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = item.exact ? isActive(item.href, true) : isActive(item.href);
                  const count = item.badge ? getCount(item.badge) : 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNav}
                      title={collapsed ? item.label : undefined}
                      className={`adm-side-link ${active ? "is-active" : ""}`}
                    >
                      <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                      {!collapsed && <span>{item.label}</span>}
                      {!collapsed && <CountBadge n={count} />}
                      {collapsed && count > 0 && (
                        <span style={{ position: "absolute", top: 4, right: 4, width: 7, height: 7, borderRadius: "50%", background: "#7c3aed" }} />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <footer className="adm-sidebar-footer">
        <div className="adm-account-card">
          <div className="adm-user-row">
            <div className="adm-user-avatar">{initial}</div>
            {!collapsed && (
              <div className="adm-user-copy">
                <strong>{name || "Admin"}</strong>
                <span>{shortEmail}</span>
              </div>
            )}
          </div>
          <div className="adm-footer-actions">
            <Link href="/dashboard" onClick={onNav} title="Ver app">
              <ExternalLink size={14} />
              {!collapsed && <span>App</span>}
            </Link>
            <button type="button" onClick={signOut} title="Sair">
              <LogOut size={14} />
              {!collapsed && <span>Sair</span>}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function AdminSidebar({ name, email }: { name: string; email?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"night" | "day">("day");
  const [counts, setCounts] = useState({ studios: 0, users: 0, clients: 0, appointments: 0 });

  useEffect(() => {
    const stored = readBrowserStorage("admin-theme");
    const next = stored === "night" ? "night" : "day";
    setTheme(next);
    document.documentElement.setAttribute("data-admin-theme", next);
  }, []);

  useEffect(() => {
    const stored = readBrowserStorage("admin-sidebar-collapsed") === "1";
    setCollapsed(stored);
    document.documentElement.setAttribute("data-admin-sidebar", stored ? "collapsed" : "expanded");
  }, []);

  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from("studios").select("id", { count: "exact", head: true }),
      sb.from("profiles").select("id", { count: "exact", head: true }),
      sb.from("clients").select("id", { count: "exact", head: true }),
      sb.from("appointments").select("id", { count: "exact", head: true }),
    ]).then(([studios, users, clients, appointments]) =>
      setCounts({
        studios: studios.count ?? 0,
        users: users.count ?? 0,
        clients: clients.count ?? 0,
        appointments: appointments.count ?? 0,
      })
    );
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  function toggleTheme() {
    const next = theme === "day" ? "night" : "day";
    setTheme(next);
    writeBrowserStorage("admin-theme", next);
    document.documentElement.setAttribute("data-admin-theme", next);
  }

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    writeBrowserStorage("admin-sidebar-collapsed", next ? "1" : "0");
    document.documentElement.setAttribute("data-admin-sidebar", next ? "collapsed" : "expanded");
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);
  const getCount = (key?: string) =>
    key ? counts[key as keyof typeof counts] ?? 0 : 0;

  const sharedProps = { name, email, isActive, getCount, signOut, theme, toggleTheme, collapsed };

  return (
    <>
      {/* Mobile topbar */}
      <div className="admin-topbar">
        <button type="button" onClick={() => setMobileOpen(true)}
          className="adm-mobile-menu" style={{ minWidth: 80, paddingInline: 12, gap: 7, fontSize: 12, fontWeight: 700 }}>
          <Menu size={18} /><span>Menu</span>
        </button>
        <LogoMark />
        <strong style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", flex: 1 }}>Nailit</strong>
        <button type="button" className="admin-topbar-theme" onClick={toggleTheme}>
          {theme === "day" ? <Moon size={14} /> : <Sun size={14} />}
          <span>{theme === "day" ? "Noite" : "Dia"}</span>
        </button>
      </div>

      {/* Desktop */}
      <aside className="admin-sidebar-desktop">
        <SidebarBody {...sharedProps} toggleCollapsed={toggleCollapsed} onNav={() => {}} />
      </aside>

      {/* Mobile */}
      {mobileOpen && <div className="adm-mobile-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={`admin-sidebar-mobile ${mobileOpen ? "open" : ""}`} aria-hidden={!mobileOpen}>
        <button type="button" onClick={() => setMobileOpen(false)} className="adm-mobile-close">
          <X size={15} />
        </button>
        <SidebarBody {...sharedProps} collapsed={false} toggleCollapsed={undefined}
          onNav={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
