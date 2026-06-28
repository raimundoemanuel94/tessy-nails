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
  Menu,
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
  const [moreOpen, setMoreOpen] = useState(false);

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
    ? [{ href: "/admin", icon: Shield, label: "Admin" }, ...NAV.slice(0, 3)]
    : [NAV[0], NAV[1], NAV[2], NAV[3]];
  const moreItems = isSuperadmin ? NAV.slice(3) : [NAV[4], NAV[5], NAV[6], NAV[7]];
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
        <button type="button" className={moreOpen ? "is-active" : ""} onClick={() => setMoreOpen(v => !v)} aria-label="Mais opções">
          <Menu size={20} />
          <span>Mais</span>
        </button>
      </nav>

      {moreOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 30, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setMoreOpen(false)}
        >
          <div
            style={{ position: "absolute", bottom: "calc(58px + env(safe-area-inset-bottom,0px))", left: 0, right: 0, background: "#0f0d1c", borderTop: "1px solid rgba(255,255,255,0.09)", borderRadius: "20px 20px 0 0", padding: "16px 12px 8px", display: "flex", flexDirection: "column", gap: 2, maxHeight: "calc(100vh - 160px - env(safe-area-inset-top,0px) - env(safe-area-inset-bottom,0px))", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.15)", margin: "0 auto 14px" }} />

            {/* Nav items */}
            {moreItems.map(({ href, icon: Icon, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, textDecoration: "none", background: active ? "rgba(167,139,250,0.10)" : "transparent", color: active ? "#a78bfa" : "#8d86a8" }}
                >
                  <Icon size={19} />
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
                </Link>
              );
            })}

            {/* Divisor */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "10px 4px" }} />

            {/* Card de perfil */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderRadius: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c5cbf,#f472b6)", display: "grid", placeItems: "center", flexShrink: 0, color: "#fff", fontSize: 14, fontWeight: 800 }}>
                {initial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, color: "#f0f0ff", fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</p>
                <p style={{ margin: "2px 0 0", color: "#8d86a8", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{studioName}</p>
              </div>
            </div>

            {/* Ações de perfil */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "4px 4px 12px" }}>
              <button
                type="button"
                onClick={() => { toggleTheme(); }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 8px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#8d86a8", cursor: "pointer", fontFamily: "inherit" }}
              >
                {isRose ? <Moon size={18} /> : <Sun size={18} />}
                <span style={{ fontSize: 10, fontWeight: 700 }}>{isRose ? "Noite" : "Dia"}</span>
              </button>

              <button
                type="button"
                onClick={() => { setMoreOpen(false); void signOut(); }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px 8px", borderRadius: 12, border: "1px solid rgba(248,113,113,0.18)", background: "rgba(248,113,113,0.06)", color: "#f87171", cursor: "pointer", fontFamily: "inherit" }}
              >
                <LogOut size={18} />
                <span style={{ fontSize: 10, fontWeight: 700 }}>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
