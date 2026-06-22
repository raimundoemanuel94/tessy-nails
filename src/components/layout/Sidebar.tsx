"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  Calendar,
  CalendarDays,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Moon,
  Pencil,
  Scissors,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/agenda", icon: Calendar, label: "Agenda" },
  { href: "/disponibilidade", icon: CalendarDays, label: "Vagas" },
  { href: "/vitrine", icon: Sparkles, label: "Vitrine" },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/servicos", icon: Scissors, label: "Serviços" },
  { href: "/relatorios", icon: BarChart3, label: "Relatórios" },
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
];

const SECTIONS = [
  { label: "Atendimento", items: NAV.slice(0, 4) },
  { label: "Gestão", items: NAV.slice(4, 6) },
  { label: "Studio", items: NAV.slice(6) },
];

export function Sidebar({ profile }: { profile: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const isSuperadmin = profile?.role === "superadmin";
  const studio = profile?.studios;
  const [theme, setTheme] = useState<"dark" | "rose">("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("salon-theme");
    const initial = stored === "rose" ? "rose" : "dark";
    setTheme(initial);
    document.documentElement.dataset.salonTheme = initial;
  }, []);

  useEffect(() => {
    const routes = isSuperadmin ? ["/admin", "/dashboard", "/agenda", "/disponibilidade"] : NAV.map((item) => item.href);
    routes.forEach((href) => router.prefetch(href));
  }, [isSuperadmin, router]);

  function toggleTheme() {
    const next = theme === "rose" ? "dark" : "rose";
    setTheme(next);
    window.localStorage.setItem("salon-theme", next);
    document.documentElement.dataset.salonTheme = next;
  }

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/agenda" && pathname.startsWith("/agendamentos")) return true;
    return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  }

  const bottomItems = isSuperadmin
    ? [{ href: "/admin", icon: Shield, label: "Admin" }, ...NAV.slice(0, 4)]
    : [NAV[0], NAV[1], NAV[2], NAV[3], NAV[7]];
  const displayName = profile?.name ?? profile?.full_name ?? profile?.email?.split("@")[0] ?? "Usuário";
  const shortEmail = profile?.email ? (profile.email.length > 25 ? `${profile.email.slice(0, 22)}...` : profile.email) : "";
  const studioName = studio?.name ?? (isSuperadmin ? "Nailit Admin" : "Meu Studio");
  const initial = (studioName ?? displayName ?? "N").charAt(0).toUpperCase();
  const isRose = theme === "rose";

  const renderThemeToggle = () => (
    <button type="button" className="salon-theme-switch" onClick={toggleTheme} title="Alternar tema" aria-label="Alternar tema">
      <span className="salon-theme-switch-icon">
        {isRose ? <Moon size={13} /> : <Sun size={13} />}
      </span>
      <span>{isRose ? "Noite" : "Dia"}</span>
    </button>
  );

  return (
    <>
      <aside className="manicure-sidebar hidden md:flex">
        <div className="manicure-sidebar-shell">
          <div className="manicure-sidebar-brand">
            <div className={`manicure-logo ${isSuperadmin ? "is-admin" : ""}`}>
              {isSuperadmin ? <Shield size={16} /> : <Sparkles size={16} />}
            </div>
            <div className="manicure-brand-copy">
              <div>
                <strong>{studioName}</strong>
                <span>{isSuperadmin ? "Superadmin" : "Agenda e operação"}</span>
              </div>
              <small>{isSuperadmin ? "Admin" : studio?.plan ?? "Pro"}</small>
            </div>
          </div>

          {isSuperadmin && (
            <div className="manicure-admin-shortcut">
              <Link href="/admin">
                <Shield size={15} />
                <span>Painel Admin</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          )}

          <nav className="manicure-nav">
            {SECTIONS.map((section) => (
              <div key={section.label} className="manicure-nav-section">
                <p>{section.label}</p>
                <div>
                  {section.items.map(({ href, icon: Icon, label }) => {
                    const active = isActive(href);
                    return (
                      <Link key={href} href={href} className={`manicure-nav-link ${active ? "is-active" : ""}`}>
                        <Icon size={15} />
                        <span>{label}</span>
                        {active && <ChevronRight size={13} />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <footer className="manicure-sidebar-footer">
            <div className="manicure-account-card">
              <div className="manicure-avatar">
                <span>{initial}</span>
              </div>
              <div className="manicure-account-copy">
                <strong>{displayName}</strong>
                <span>{shortEmail}</span>
              </div>
              <div className="manicure-footer-actions">
                {renderThemeToggle()}
                <Link href="/configuracoes" title="Editar perfil" aria-label="Editar perfil">
                  <Pencil size={14} />
                </Link>
                <button type="button" onClick={signOut} title="Sair da conta" aria-label="Sair da conta">
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          </footer>
        </div>
      </aside>

      <div className="manicure-topbar">
        <div className="manicure-topbar-logo" style={{ overflow: "hidden", borderRadius: "50%" }}>
          {studio?.avatar_url ? (
            <img src={studio.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
          ) : (
            <Sparkles size={14} color="#a78bfa" />
          )}
        </div>
        <span className="manicure-topbar-name">{studioName}</span>
        {renderThemeToggle()}
      </div>

      <nav className="manicure-bottom-nav md:hidden">
        {bottomItems.map(({ href, icon: Icon, label }) => {
          const active = href === "/admin" ? pathname.startsWith("/admin") : isActive(href);
          return (
            <Link key={href} href={href} className={active ? "is-active" : ""}>
              <Icon size={20} />
              <span>{label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
