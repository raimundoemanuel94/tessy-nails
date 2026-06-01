"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Sparkles, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ITEMS = [
  { icon: LayoutDashboard, label: "Home",      href: "/dashboard"    },
  { icon: Calendar,        label: "Agenda",    href: "/agenda"       },
  { icon: Sparkles,        label: "Vitrine",   href: "/vitrine",     special: true },
  { icon: BarChart3,       label: "Relatórios",href: "/relatorios"   },
  { icon: Settings,        label: "Config",    href: "/configuracoes"},
];

export function AdminBottomNav() {
  const path = usePathname();

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <nav className="flex h-14 items-center rounded-[18px] px-1 gap-0.5 shadow-xl"
        style={{
          background: "#0F172A",
          border: "1px solid rgba(157,127,212,0.15)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}>
        {ITEMS.map((item, i) => {
          const active = path === item.href || path.startsWith(item.href + "/");

          if (item.special) return (
            <Link key={i} href={item.href} className="flex-1 flex justify-center">
              <div className="h-10 w-10 rounded-[14px] flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#5A3F9A,#9D7FD4)" }}>
                <item.icon size={17} className="text-white" strokeWidth={2} />
              </div>
            </Link>
          );

          return (
            <Link key={i} href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative group">
              {active && (
                <motion.div layoutId="admin-nav-pill"
                  className="absolute inset-x-1 inset-y-1.5 rounded-[12px]"
                  style={{ background: "rgba(157,127,212,0.12)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }} />
              )}
              <item.icon size={17}
                strokeWidth={active ? 2.5 : 1.8}
                className={cn(
                  "relative z-10 transition-colors",
                  active ? "text-[#9D7FD4]" : "text-white/30"
                )} />
              <span className={cn(
                "relative z-10 text-[8px] font-bold leading-none transition-colors",
                active ? "text-[#9D7FD4]" : "text-white/20"
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
