// @ts-nocheck
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Building2, Users, LogOut, Shield, BarChart3 } from "lucide-react";

const NAV = [
  { href: "/admin",               icon: LayoutDashboard, label: "Overview",      exact: true },
  { href: "/admin/studios",       icon: Building2,       label: "Studios"                    },
  { href: "/admin/profissionais", icon: Users,           label: "Profissionais"              },
  { href: "/admin/relatorios",    icon: BarChart3,       label: "Relatórios"                 },
];

export function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  const router   = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login"); router.refresh();
  }

  function active(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex-col hidden md:flex z-10"
      style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}>

      <div className="p-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f59e0b" }}>
            <Shield size={16} color="#000" />
          </div>
          <div>
            <p className="text-sm font-black" style={{ color: "var(--text)" }}>Nailit Admin</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{name} · Superadmin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-1">
        {NAV.map(({ href, icon: Icon, label, exact }) => (
          <Link key={href} href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={active(href, exact)
              ? { background: "#f59e0b20", color: "#f59e0b", border: "1px solid #f59e0b40" }
              : { color: "var(--muted)" }}>
            <Icon size={17} /> {label}
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <Link href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold mb-1"
          style={{ color: "var(--muted)" }}>
          <LayoutDashboard size={17} /> Meu Dashboard
        </Link>
        <button onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold"
          style={{ color: "var(--muted)" }}>
          <LogOut size={17} /> Sair
        </button>
      </div>
    </aside>
  );
}
