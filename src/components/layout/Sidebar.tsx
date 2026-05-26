"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Calendar, ClipboardList, BarChart3,
  Users, Sparkles, Settings, LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  {
    group: "Operação",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",     href: "/dashboard"    },
      { icon: Calendar,        label: "Agenda",         href: "/agenda"       },
      { icon: ClipboardList,   label: "Agendamentos",   href: "/agendamentos" },
      { icon: Sparkles,        label: "Vitrine do Dia", href: "/vitrine"      },
      { icon: BarChart3,       label: "Relatórios",     href: "/relatorios"   },
    ],
  },
  {
    group: "Cadastros",
    items: [
      { icon: Users,    label: "Clientes",  href: "/clientes" },
      { icon: Sparkles, label: "Serviços",  href: "/servicos" },
    ],
  },
  {
    group: "Sistema",
    items: [
      { icon: Settings, label: "Configurações", href: "/configuracoes" },
    ],
  },
];

export function Sidebar() {
  const pathname  = usePathname();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside className={cn(
      "relative h-screen flex flex-col transition-all duration-400 ease-in-out z-40",
      "border-r border-white/5",
      collapsed ? "w-[72px]" : "w-64",
    )}
      style={{ background: "#0F172A" }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div key="logo-full"
              initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-8 }}
              transition={{ duration:0.2 }}
              className="flex items-center gap-2.5 min-w-0"
            >
              <div className="h-9 w-9 rounded-xl shrink-0 overflow-hidden border border-[#9D7FD4]/20 bg-[#2A2044]">
                <img src="/brand/icon.svg" alt="TN" className="w-full h-full object-cover p-0.5" />
              </div>
              <div>
                <p className="text-[14px] text-white leading-none"
                  style={{ fontFamily:"Georgia,serif", fontStyle:"italic", fontWeight:700 }}>
                  Tessy Nails
                </p>
                <p className="text-[8px] text-white/30 font-bold uppercase tracking-[0.2em] mt-0.5">
                  Manicure & Pedicure
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="logo-icon"
              initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.8 }}
              className="mx-auto h-10 w-10 rounded-xl overflow-hidden border border-[#9D7FD4]/20 bg-[#2A2044]"
            >
              <img src="/brand/icon.svg" alt="TN" className="w-full h-full object-cover p-0.5" />
            </motion.div>
          )}
        </AnimatePresence>

        {!collapsed && (
          <button onClick={() => setCollapsed(true)}
            className="h-7 w-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
            <ChevronLeft size={13} className="text-white/40" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-hide">
        {NAV.map(section => (
          <div key={section.group} className="mb-3">
            {!collapsed && (
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em] px-3 mb-1.5">
                {section.group}
              </p>
            )}
            {section.items.map(item => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl transition-all duration-200 group",
                    collapsed ? "h-11 w-11 mx-auto justify-center" : "h-10 px-3",
                    active
                      ? "bg-[#9D7FD4]/15 text-[#C4B0E8]"
                      : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  )}
                >
                  {/* Active indicator */}
                  {active && (
                    <motion.div layoutId="active-sidebar"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[#9D7FD4]"
                      transition={{ type:"spring", stiffness:400, damping:35 }} />
                  )}
                  <item.icon size={17} strokeWidth={active ? 2.5 : 1.8}
                    className={active ? "text-[#9D7FD4]" : ""} />
                  {!collapsed && (
                    <span className="text-[13px] font-bold">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Expand button quando collapsed */}
      {collapsed && (
        <button onClick={() => setCollapsed(false)}
          className="mx-auto mb-3 h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
          <ChevronRight size={13} className="text-white/30" />
        </button>
      )}

      {/* Footer */}
      <div className={cn(
        "border-t border-white/5 p-3",
        collapsed ? "flex justify-center" : ""
      )}>
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors group">
            <div className="h-8 w-8 rounded-xl shrink-0 flex items-center justify-center text-sm font-black text-white overflow-hidden"
              style={{ background:"linear-gradient(135deg,#7C5CBF,#9D7FD4)" }}>
              {user?.photoURL
                ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                : <span>{user?.name?.charAt(0) ?? "T"}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-black text-white/80 truncate leading-none">{user?.name ?? "Admin"}</p>
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Administrador</p>
            </div>
            <button onClick={() => signOut()}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button onClick={() => signOut()}
            className="h-10 w-10 rounded-xl flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
