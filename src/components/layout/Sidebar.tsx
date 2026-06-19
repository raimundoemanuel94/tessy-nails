"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  BarChart3,
  Calendar,
  CalendarDays,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Pencil,
  Scissors,
  Settings,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/agenda", icon: Calendar, label: "Agenda" },
  { href: "/disponibilidade", icon: CalendarDays, label: "Vagas" },
  { href: "/clientes", icon: Users, label: "Clientes" },
  { href: "/servicos", icon: Scissors, label: "Serviços" },
  { href: "/relatorios", icon: BarChart3, label: "Relatórios" },
  { href: "/configuracoes", icon: Settings, label: "Configurações" },
];

const SECTIONS = [
  { label: "Atendimento", items: NAV.slice(0, 3) },
  { label: "Gestão", items: NAV.slice(3, 5) },
  { label: "Studio", items: NAV.slice(5) },
];

export function Sidebar({ profile }: { profile: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const isSuperadmin = profile?.role === "superadmin";
  const studio = profile?.studios;

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
    ? [{ href: "/admin", icon: Shield, label: "Admin" }, ...NAV.slice(0, 3)]
    : [NAV[0], NAV[1], NAV[2], NAV[3], NAV[6]];
  const displayName = profile?.full_name ?? profile?.email?.split("@")[0] ?? "Usuário";
  const shortEmail = profile?.email ? (profile.email.length > 25 ? `${profile.email.slice(0, 22)}...` : profile.email) : "";
  const initial = (studio?.name ?? displayName ?? "N").charAt(0).toUpperCase();

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
                <strong>{studio?.name ?? (isSuperadmin ? "Nailit Admin" : "Meu Studio")}</strong>
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

      {/* Mobile topbar */}
      <div className="manicure-topbar">
        <div className="manicure-topbar-logo" style={{ overflow: 'hidden', borderRadius: '50%' }}>
          {(profile as any)?.avatar_url
            ? <img src={(profile as any).avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            : <Sparkles size={14} color="#a78bfa" />
          }
        </div>
        <span className="manicure-topbar-name">{studio?.name ?? displayName ?? "Meu Studio"}</span>
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
