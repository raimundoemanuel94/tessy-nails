// @ts-nocheck
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Calendar, Users, Scissors, BarChart3, Settings, LogOut, Sparkles, CalendarDays, Shield } from "lucide-react";

const NAV = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { href: "/agenda",        icon: Calendar,        label: "Agenda" },
  { href: "/agendamentos",  icon: CalendarDays,    label: "Agendamentos" },
  { href: "/clientes",      icon: Users,           label: "Clientes" },
  { href: "/servicos",      icon: Scissors,        label: "Serviços" },
  { href: "/relatorios",    icon: BarChart3,       label: "Relatórios" },
  { href: "/configuracoes", icon: Settings,        label: "Configurações" },
];

export function Sidebar({ profile }: { profile: any }) {
  const pathname     = usePathname();
  const router       = useRouter();
  const isSuperadmin = profile?.role === "superadmin";
  const studio       = profile?.studios;

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Desktop */}
      <aside className="fixed left-0 top-0 h-full w-64 flex-col hidden md:flex z-10"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>

        <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: isSuperadmin ? "#f59e0b" : "var(--brand)" }}>
              {isSuperadmin
                ? <Shield size={16} color="#000" />
                : <Sparkles size={16} color="#fff" />}
            </div>
            <div>
              <p className="text-sm font-black" style={{ color: "var(--text)" }}>
                {studio?.name ?? (isSuperadmin ? "Nailit Admin" : "Meu Studio")}
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {isSuperadmin ? "Superadmin" : (studio?.plan ?? "Pro")}
              </p>
            </div>
          </div>
        </div>

        {isSuperadmin && (
          <div className="px-3 pt-3">
            <Link href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black w-full"
              style={{ background: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b40" }}>
              <Shield size={16} /> Painel Admin
            </Link>
          </div>
        )}

        <nav className="flex-1 p-3 flex flex-col gap-1">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={pathname === href
                ? { background: "var(--brand)", color: "#fff" }
                : { color: "var(--muted)" }}>
              <Icon size={17} /> {label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={signOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold"
            style={{ color: "var(--muted)" }}>
            <LogOut size={17} /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden z-10 flex"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        {(isSuperadmin
          ? [{ href: "/admin", icon: Shield, label: "Admin" }, ...NAV.slice(0, 4)]
          : NAV.slice(0, 5)
        ).map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-bold"
            style={{ color: pathname.startsWith(href) ? "var(--brand-light)" : "var(--muted)" }}>
            <Icon size={20} /> {label.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </>
  );
}
