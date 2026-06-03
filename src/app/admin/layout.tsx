"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  LayoutDashboard, Users, Building2, DollarSign,
  Settings, Bell, LogOut, Shield,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { icon: LayoutDashboard, label: "Overview",   href: "/admin" },
  { icon: Building2,       label: "Studios",    href: "/admin/studios" },
  { icon: Users,           label: "Usuários",   href: "/admin/usuarios" },
  { icon: DollarSign,      label: "Financeiro", href: "/admin/financeiro" },
  { icon: Bell,            label: "Comunicados",href: "/admin/comunicados" },
  { icon: Settings,        label: "Config",     href: "/admin/config" },
];

const SUPERADMIN_EMAILS = ["raimundoemanuel94@gmail.com", "raiiimundoemanuel2018@gmail.com"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, firestoreLoaded, signOut } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const isSuperAdmin = user?.role === "superadmin" || 
    SUPERADMIN_EMAILS.includes(user?.email ?? "");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    // Aguarda Firestore OU verifica pelo email
    if (!firestoreLoaded && !SUPERADMIN_EMAILS.includes(user?.email ?? "")) return;
    if (!isSuperAdmin) router.replace("/login");
  }, [user, loading, firestoreLoaded, isSuperAdmin]);

  // Mostrar loading só se não consegue confirmar superadmin
  if (loading || !user || (!isSuperAdmin && !firestoreLoaded)) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background:"#0A0818" }}>
        <div className="flex gap-1.5">
          {[0,1,2].map(i => (
            <motion.div key={i} className="w-2 h-2 rounded-full bg-[#9D7FD4]"
              animate={{ y:[0,-8,0] }}
              transition={{ duration:0.6, delay:i*0.12, repeat:Infinity }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background:"#0A0818" }}>

      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col shrink-0 border-r border-white/5"
        style={{ background:"#0D0A1E" }}>

        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/5">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background:"linear-gradient(135deg,#7C5CBF,#9D7FD4)" }}>
            <Shield size={13} className="text-white" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-white leading-none"
              style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>nailit</p>
            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/30 mt-0.5">Super Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(item => {
            const active = pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all",
                  active
                    ? "bg-[#9D7FD4]/15 text-[#C4A8E8]"
                    : "text-white/30 hover:text-white/60 hover:bg-white/5"
                )}>
                <item.icon size={14} strokeWidth={active ? 2.5 : 1.8} />
                {item.label}
                {active && <ChevronRight size={10} className="ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ background:"linear-gradient(135deg,#7C5CBF,#9D7FD4)" }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-white truncate">{user.name}</p>
              <p className="text-[8px] text-white/25 uppercase tracking-widest">superadmin</p>
            </div>
            <button onClick={() => signOut().then(() => router.push("/login"))}
              className="text-white/25 hover:text-white/60 transition-colors">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar mobile */}
        <div className="md:hidden h-14 flex items-center justify-between px-4 border-b border-white/5"
          style={{ background:"#0D0A1E" }}>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ background:"linear-gradient(135deg,#7C5CBF,#9D7FD4)" }}>
              <Shield size={13} className="text-white" />
            </div>
            <span className="text-[13px] font-bold text-white"
              style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>nailit admin</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 md:p-7 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
