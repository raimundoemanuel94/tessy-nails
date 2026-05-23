"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Plus, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "professional";

  const navItems = [
    { label: "Home",   icon: Home,     href: "/cliente",              key: "home"   },
    { label: "Agenda", icon: Calendar, href: "/cliente/agendamentos", key: "agenda" },
    { label: "Novo",   icon: Plus,     href: "/cliente/servicos",     key: "new", isSpecial: true },
    { label: "Perfil", icon: User,     href: "/cliente/perfil",       key: "perfil" },
  ];

  const items = isAdmin
    ? [navItems[0], navItems[1], { label: "Painel", icon: LayoutDashboard, href: "/dashboard", key: "painel", isSpecial: false }, navItems[3]]
    : navItems;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pointer-events-none max-w-lg mx-auto left-0 right-0">
      <nav className="flex h-[62px] items-center rounded-[28px] bg-[#2C1810] shadow-2xl shadow-[#2C1810]/40 border border-white/5 pointer-events-auto overflow-hidden relative">

        {/* Shimmer line */}
        <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />

        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/cliente" && pathname.startsWith(item.href));

          if ("isSpecial" in item && item.isSpecial) {
            return (
              <Link
                key={item.key}
                href={item.href}
                className="relative flex flex-1 items-center justify-center"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="h-12 w-12 rounded-[18px] bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/40"
                >
                  <Plus className="h-6 w-6 text-white" strokeWidth={3} />
                </motion.div>
              </Link>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-1 h-full transition-all duration-200 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-x-3 inset-y-2 rounded-2xl bg-white/8"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon
                size={19}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={cn(
                  "transition-all duration-200 relative z-10",
                  isActive ? "text-amber-400" : "text-white/40"
                )}
              />
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-widest transition-all duration-200 relative z-10",
                isActive ? "text-amber-400" : "text-white/30"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
