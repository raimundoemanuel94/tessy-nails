"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronDown,
  Command,
  DollarSign,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  Users,
  X,
} from "lucide-react";

const NAV = [
  {
    section: "Plataforma",
    items: [
      {
        key: "operacao",
        icon: LayoutDashboard,
        label: "Visão geral",
        children: [
          { href: "/admin", label: "Dashboard", exact: true },
          { href: "/admin/studios", label: "Salões", badge: "studios" },
          { href: "/admin/clientes", label: "Clientes", badge: "clients" },
          { href: "/admin/agendamentos", label: "Agendamentos", badge: "appointments" },
          { href: "/admin/relatorios", label: "Relatórios" },
        ],
      },
    ],
  },
  {
    section: "Equipe",
    items: [
      {
        key: "equipe",
        icon: Users,
        label: "Profissionais",
        children: [
          { href: "/admin/profissionais", label: "Contas & Vínculos", badge: "users" },
          { href: "/admin/comissoes", label: "Comissões" },
        ],
      },
    ],
  },
  {
    section: "Financeiro",
    items: [
      {
        key: "financeiro",
        icon: DollarSign,
        label: "Financeiro",
        children: [
          { href: "/admin/financeiro", label: "Resumo", exact: true },
          { href: "/admin/financeiro/assinaturas", label: "Assinaturas" },
          { href: "/admin/financeiro/inadimplencia", label: "Inadimplência" },
          { href: "/admin/config/planos", label: "Planos e preços" },
        ],
      },
    ],
  },
  {
    section: "Sistema",
    items: [
      {
        key: "sistema",
        icon: Settings,
        label: "Configurações",
        children: [
          { href: "/admin/config", label: "Preferências", exact: true },
          { href: "/admin/mensagens", label: "Mensagens" },
        ],
      },
    ],
  },
] as const;

function LogoMark() {
  return (
    <div className="adm-logo-mark">
      <Command size={16} strokeWidth={2.35} />
    </div>
  );
}

function CountBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="adm-count" aria-label={`${n} itens`}>
      {n > 99 ? "99+" : n}
    </span>
  );
}

function readBrowserStorage(key: string) {
  try {
    return window.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeBrowserStorage(key: string, value: string) {
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // Keep the UI state working even when browser storage is unavailable.
  }
}

function NavGroup({ item, isActive, onNav, open, onToggle, getCount, collapsed }: any) {
  const Icon = item.icon;
  const childActive = item.children.some((child: any) =>
    child.exact ? isActive(child.href, true) : isActive(child.href)
  );
  // Só mostra badge no grupo se tiver um único badge filho relevante
  const badgeCounts = item.children.map((child: any) => getCount(child.badge)).filter(Boolean);
  const totalCount = badgeCounts.length === 1 ? badgeCounts[0] : 0;

  return (
    <div className="adm-side-group">
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? item.label : undefined}
        className={`adm-side-link adm-side-group-trigger ${childActive ? "is-active" : ""}`}
      >
        <Icon size={15} />
        <span>{item.label}</span>
        <CountBadge n={totalCount} />
        <ChevronDown size={13} className={open ? "is-open" : ""} />
      </button>

      <div className={`adm-side-children ${open ? "is-open" : ""}`}>
        {item.children.map((child: any) => {
          const active = child.exact ? isActive(child.href, true) : isActive(child.href);
          return (
            <Link
              key={child.href}
              href={child.href}
              onClick={onNav}
              title={child.label}
              className={`adm-side-child ${active ? "is-active" : ""}`}
            >
              <span>{child.label}</span>
              <CountBadge n={getCount(child.badge)} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SidebarBody({
  name,
  email,
  onNav,
  isActive,
  getCount,
  signOut,
  openGroups,
  toggleGroup,
  theme,
  toggleTheme,
  collapsed,
  toggleCollapsed,
}: any) {
  const initial = (name || "A").charAt(0).toUpperCase();
  const shortEmail = email ? (email.length > 25 ? `${email.slice(0, 22)}...` : email) : "superadmin";
  const isDay = theme === "day";

  return (
    <div className="adm-sidebar-shell">
      <div className="adm-sidebar-brand">
        <LogoMark />
        <div className="adm-brand-copy">
          <div>
            <strong>Nailit</strong>
            <span>Central da plataforma</span>
          </div>
          <small>Admin</small>
        </div>
        <button
          type="button"
          className="adm-theme-icon"
          onClick={toggleTheme}
          title={isDay ? "Usar tema noite" : "Usar tema dia"}
          aria-label={isDay ? "Usar tema noite" : "Usar tema dia"}
        >
          {isDay ? <Moon size={14} /> : <Sun size={14} />}
        </button>
        {toggleCollapsed && (
          <button
            type="button"
            className="adm-collapse-icon"
            onClick={toggleCollapsed}
            title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
            aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        )}
      </div>

      <nav className="adm-sidebar-nav">
        {NAV.map((section) => (
          <div key={section.section} className="adm-nav-section">
            <p>{section.section}</p>
            <div>
              {section.items.map((item: any) => (
                <NavGroup
                  key={item.key}
                  item={item}
                  isActive={isActive}
                  onNav={onNav}
                  getCount={getCount}
                  collapsed={collapsed}
                  open={!!openGroups[item.key]}
                  onToggle={() => toggleGroup(item.key)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <footer className="adm-sidebar-footer">
        <div className="adm-account-card">
          <div className="adm-user-row">
            <div className="adm-user-avatar">{initial}</div>
            <div className="adm-user-copy">
              <strong>{name || "Admin"}</strong>
              <span>{shortEmail}</span>
            </div>
          </div>
          <div className="adm-footer-actions">
            <Link href="/dashboard" onClick={onNav} title="Ver app do salão" aria-label="Ver app do salão">
              <ExternalLink size={14} />
              <span>App</span>
            </Link>
            <button type="button" onClick={signOut} title="Sair da conta" aria-label="Sair da conta">
              <LogOut size={14} />
              <span>Sair</span>
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
  const [theme, setTheme] = useState<"night" | "day">("night");
  const [counts, setCounts] = useState({ studios: 0, users: 0, clients: 0, appointments: 0 });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = readBrowserStorage("admin-theme");
    const next = stored === "day" ? "day" : "night";
    setTheme(next);
    document.documentElement.setAttribute("data-admin-theme", next);
  }, []);

  useEffect(() => {
    const stored = readBrowserStorage("admin-sidebar-collapsed") === "1";
    setCollapsed(stored);
    document.documentElement.setAttribute("data-admin-sidebar", stored ? "collapsed" : "expanded");
  }, []);

  function toggleTheme() {
    const next = theme === "day" ? "night" : "day";
    setTheme(next);
    writeBrowserStorage("admin-theme", next);
    document.documentElement.setAttribute("data-admin-theme", next);
  }

  function setSidebarCollapsed(next: boolean) {
    setCollapsed(next);
    writeBrowserStorage("admin-sidebar-collapsed", next ? "1" : "0");
    document.documentElement.setAttribute("data-admin-sidebar", next ? "collapsed" : "expanded");
  }

  function toggleCollapsed() {
    setSidebarCollapsed(!collapsed);
  }

  useEffect(() => {
    const next: Record<string, boolean> = {};
    NAV.forEach((section) => {
      section.items.forEach((item: any) => {
        const hasActive = item.children.some((child: any) =>
          child.exact ? pathname === child.href : pathname.startsWith(child.href)
        );
        if (hasActive) next[item.key] = true;
      });
    });
    setOpenGroups((current) => ({ ...current, ...next }));
  }, [pathname]);

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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href);
  const getCount = (key?: string) => key ? counts[key as keyof typeof counts] ?? 0 : 0;
  const toggleGroup = (key: string) => setOpenGroups((current) => ({ ...current, [key]: !current[key] }));
  const toggleDesktopGroup = (key: string) => {
    if (collapsed) {
      setSidebarCollapsed(false);
      setOpenGroups((current) => ({ ...current, [key]: true }));
      return;
    }
    toggleGroup(key);
  };

  const sharedProps = { name, email, isActive, getCount, signOut, openGroups, theme, toggleTheme };

  return (
    <>
      <div className="admin-topbar">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="adm-mobile-menu"
          style={{ width: "auto", minWidth: 82, paddingInline: 12, gap: 7, fontSize: 12, fontWeight: 800 }}
        >
          <Menu size={18} />
          <span>Menu</span>
        </button>
        <LogoMark />
        <strong>Nailit</strong>
        <button type="button" className="admin-topbar-theme" onClick={toggleTheme} aria-label={theme === "day" ? "Usar tema noite" : "Usar tema dia"}>
          {theme === "day" ? <Moon size={14} /> : <Sun size={14} />}
          <span>{theme === "day" ? "Noite" : "Dia"}</span>
        </button>
      </div>

      <aside className="admin-sidebar-desktop">
        <SidebarBody
          {...sharedProps}
          collapsed={collapsed}
          toggleGroup={toggleDesktopGroup}
          toggleCollapsed={toggleCollapsed}
        />
      </aside>

      {mobileOpen && <div className="adm-mobile-backdrop" onClick={() => setMobileOpen(false)} />}

      <aside className={`admin-sidebar-mobile ${mobileOpen ? "open" : ""}`} aria-hidden={!mobileOpen}>
        <button type="button" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" className="adm-mobile-close">
          <X size={15} />
        </button>
        <SidebarBody
          {...sharedProps}
          collapsed={false}
          toggleGroup={toggleGroup}
          onNav={() => setMobileOpen(false)}
        />
      </aside>
    </>
  );
}
