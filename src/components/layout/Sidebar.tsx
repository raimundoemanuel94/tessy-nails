"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import {
  BarChart3,
  Calendar,
  CalendarDays,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  PanelLeft,
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
  { href: "/agendamentos", icon: CalendarDays, label: "Agendamentos" },
  { href: "/disponibilidade", icon: CalendarDays, label: "Disponibilidade" },
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
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null)
  const openDrawer = (key: string) => setActiveDrawer(key)
  const closeDrawer = () => setActiveDrawer(null)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })
  const toggleCollapsed = () => setCollapsed(v => {
    const next = !v
    localStorage.setItem('sidebar-collapsed', String(next))
    document.body.setAttribute('data-sidebar', next ? 'collapsed' : 'expanded')
    return next
  })

  // Set initial data attribute
  if (typeof window !== 'undefined') {
    document.body.setAttribute('data-sidebar', collapsed ? 'collapsed' : 'expanded')
  }
  const studio = profile?.studios;

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  }

  const bottomItems = isSuperadmin
    ? [{ href: "/admin", icon: Shield, label: "Admin" }, ...NAV.slice(0, 4)]
    : [
        { href: "/dashboard",      icon: NAV[0].icon, label: "Início" },
        { href: "/agenda",         icon: NAV[1].icon, label: "Agenda" },
        { href: "/agendamentos",   icon: NAV[2].icon, label: "Horários" },
        { href: "/disponibilidade",icon: NAV[3].icon, label: "Vagas" },
        { href: "/clientes",       icon: NAV[4].icon, label: "Clientes" },
      ];
  const displayName = profile?.full_name ?? profile?.email?.split("@")[0] ?? "Usuário";
  const shortEmail = profile?.email ? (profile.email.length > 25 ? `${profile.email.slice(0, 22)}...` : profile.email) : "";
  const initial = (studio?.name ?? displayName ?? "N").charAt(0).toUpperCase();

  return (
    <>
      <aside className={`manicure-sidebar hidden md:flex${collapsed ? " is-collapsed" : ""}`}>
        <div className="manicure-sidebar-shell">
          <div className="manicure-sidebar-brand">
            <div className={`manicure-logo ${isSuperadmin ? "is-admin" : ""}`}>
              {isSuperadmin ? <Shield size={16} /> : <Sparkles size={16} />}
            </div>
            {!collapsed && (
              <div className="manicure-brand-copy">
                <div>
                  <strong>{studio?.name ?? (isSuperadmin ? "Nailit Admin" : "Meu Studio")}</strong>
                  <span>{isSuperadmin ? "Superadmin" : "Agenda e operação"}</span>
                </div>
                <small>{isSuperadmin ? "Admin" : studio?.plan ?? "Pro"}</small>
              </div>
            )}
            <button
              onClick={toggleCollapsed}
              title={collapsed ? "Expandir menu" : "Recolher menu"}
              style={{
                marginLeft: 'auto', flexShrink: 0,
                width: 28, height: 28, borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                cursor: 'pointer', display: 'grid', placeItems: 'center',
                color: '#6b648a', transition: 'background .15s',
              }}
            >
              <PanelLeft size={14} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .25s ease' }} />
            </button>
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
                {!collapsed && <p>{section.label}</p>}
                <div>
                  {section.items.map(({ href, icon: Icon, label }) => {
                    const active = isActive(href);
                    return (
                      <Link key={href} href={href} className={`manicure-nav-link ${active ? "is-active" : ""}`} title={collapsed ? label : undefined}>
                        <Icon size={15} />
                        {!collapsed && <span>{label}</span>}
                        {!collapsed && active && <ChevronRight size={13} />}
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
              {!collapsed && (
                <div className="manicure-account-copy">
                  <strong>{displayName}</strong>
                  <span>{shortEmail}</span>
                </div>
              )}
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
        <span className="manicure-topbar-name">
          {studio?.name
            ? studio.name
            : profile?.full_name
              ? profile.full_name.split(' ')[0]
              : 'Meu Studio'}
        </span>
        <button
          type="button"
          onClick={signOut}
          title="Sair da conta"
          style={{
            marginLeft: 'auto',
            flexShrink: 0,
            width: 34, height: 34,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <LogOut size={14} color="#6b6b9a" />
        </button>
      </div>

      {/* Bottom nav — drawer mode */}
      <nav className="manicure-bottom-nav md:hidden">
        {[
          { key: 'inicio',    icon: LayoutDashboard, label: 'Início',    href: '/dashboard' },
          { key: 'agenda',    icon: Calendar,        label: 'Agenda',    href: null },
          { key: 'clientes',  icon: Users,           label: 'Clientes',  href: null },
          { key: 'vagas',     icon: CalendarDays,    label: 'Vagas',     href: null },
        ].map(({ key, icon: Icon, label, href }) => {
          const active = href ? isActive(href) : activeDrawer === key
          return href ? (
            <Link key={key} href={href} className={active ? 'is-active' : ''} onClick={closeDrawer}>
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ) : (
            <button key={key} className={active ? 'is-active' : ''} onClick={() => openDrawer(key)}
              style={{ flex: 1, minWidth: 0, minHeight: 54, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: active ? '#a78bfa' : '#8d86a8', fontSize: 9, fontWeight: 700, fontFamily: 'inherit', letterSpacing: '.01em', whiteSpace: 'nowrap', padding: '0 2px' }}>
              <Icon size={20} />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Drawers */}
      <MobileDrawer open={activeDrawer === 'agenda'} onClose={closeDrawer} title="Agenda">
        <div style={{ padding: 16 }}>
          <a href="/agenda" onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(124,92,191,0.08)', border: '1px solid rgba(124,92,191,0.2)', marginBottom: 10, textDecoration: 'none' }}>
            <Calendar size={20} color="#a78bfa" />
            <div><div style={{ color: '#f0f0ff', fontSize: 14, fontWeight: 700 }}>Agenda da semana</div><div style={{ color: '#8d86a8', fontSize: 12, marginTop: 2 }}>Calendário + banner de vagas</div></div>
          </a>
          <a href="/agendamentos" onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10, textDecoration: 'none' }}>
            <CalendarDays size={20} color="#a78bfa" />
            <div><div style={{ color: '#f0f0ff', fontSize: 14, fontWeight: 700 }}>Agendamentos</div><div style={{ color: '#8d86a8', fontSize: 12, marginTop: 2 }}>Lista completa + confirmar + concluir</div></div>
          </a>
          <a href="/relatorios" onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none' }}>
            <BarChart3 size={20} color="#a78bfa" />
            <div><div style={{ color: '#f0f0ff', fontSize: 14, fontWeight: 700 }}>Relatórios</div><div style={{ color: '#8d86a8', fontSize: 12, marginTop: 2 }}>Faturamento e métricas</div></div>
          </a>
        </div>
      </MobileDrawer>

      <MobileDrawer open={activeDrawer === 'clientes'} onClose={closeDrawer} title="Clientes">
        <div style={{ padding: 16 }}>
          <a href="/clientes" onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(244,114,182,0.08)', border: '1px solid rgba(244,114,182,0.2)', marginBottom: 10, textDecoration: 'none' }}>
            <Users size={20} color="#f472b6" />
            <div><div style={{ color: '#f0f0ff', fontSize: 14, fontWeight: 700 }}>Meus clientes</div><div style={{ color: '#8d86a8', fontSize: 12, marginTop: 2 }}>Histórico, WhatsApp e stats</div></div>
          </a>
          <a href="/servicos" onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none' }}>
            <Scissors size={20} color="#f472b6" />
            <div><div style={{ color: '#f0f0ff', fontSize: 14, fontWeight: 700 }}>Serviços</div><div style={{ color: '#8d86a8', fontSize: 12, marginTop: 2 }}>Preços e catálogo</div></div>
          </a>
        </div>
      </MobileDrawer>

      <MobileDrawer open={activeDrawer === 'vagas'} onClose={closeDrawer} title="Disponibilidade">
        <div style={{ padding: 16 }}>
          <a href="/disponibilidade" onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', marginBottom: 10, textDecoration: 'none' }}>
            <CalendarDays size={20} color="#34d399" />
            <div><div style={{ color: '#f0f0ff', fontSize: 14, fontWeight: 700 }}>Disponibilidade</div><div style={{ color: '#8d86a8', fontSize: 12, marginTop: 2 }}>Dias e horários disponíveis</div></div>
          </a>
          <a href="/configuracoes" onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none' }}>
            <Settings size={20} color="#34d399" />
            <div><div style={{ color: '#f0f0ff', fontSize: 14, fontWeight: 700 }}>Configurações</div><div style={{ color: '#8d86a8', fontSize: 12, marginTop: 2 }}>Studio, horários e perfil</div></div>
          </a>
        </div>
      </MobileDrawer>
    </>
  );
}
