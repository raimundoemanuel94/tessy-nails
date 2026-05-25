"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Bell, User, Settings, LogOut, Menu,
  LayoutDashboard, Calendar, ClipboardList, BarChart3, Users, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NAV_MOBILE = [
  { icon: LayoutDashboard, label: "Dashboard",   href: "/dashboard"    },
  { icon: Calendar,        label: "Agenda",       href: "/agenda"       },
  { icon: ClipboardList,   label: "Agendamentos", href: "/agendamentos" },
  { icon: BarChart3,       label: "Relatórios",   href: "/relatorios"   },
  { icon: Users,           label: "Clientes",     href: "/clientes"     },
  { icon: Sparkles,        label: "Serviços",     href: "/servicos"     },
  { icon: Settings,        label: "Configurações",href: "/configuracoes"},
];

// Mapear href → título da página
const PAGE_TITLES: Record<string, string> = {
  "/dashboard":    "Dashboard",
  "/agenda":       "Agenda",
  "/agendamentos": "Agendamentos",
  "/relatorios":   "Relatórios",
  "/clientes":     "Clientes",
  "/servicos":     "Serviços",
  "/configuracoes":"Configurações",
};

export function Header() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen]       = useState(false);
  const [pendingCount, setPending] = useState(0);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "professional")) return;
    const q = query(collection(db, "appointments"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, snap => setPending(snap.size), () => setPending(0));
    return () => unsub();
  }, [user]);

  const pageTitle = PAGE_TITLES[pathname] ?? "Tessy Nails";
  const initials  = user?.name ? user.name.substring(0, 2).toUpperCase() : "TN";

  return (
    <header className="h-16 flex items-center justify-between px-5 lg:px-8 sticky top-0 z-30 bg-white border-b border-slate-100">

      {/* Left — mobile menu + page title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"
                className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-50">
                <Menu size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 border-r border-slate-100"
              style={{ background: "#0F172A" }}>
              <SheetHeader className="p-5 h-16 border-b border-white/5 flex flex-row items-center gap-3">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background:"linear-gradient(135deg,#7C5CBF,#9D7FD4)" }}>
                  <Sparkles size={14} className="text-white" />
                </div>
                <SheetTitle className="text-[14px] font-black text-white">Tessy Nails</SheetTitle>
              </SheetHeader>
              <nav className="p-3 space-y-1 mt-2">
                {NAV_MOBILE.map(item => {
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all",
                        active
                          ? "bg-[#9D7FD4]/15 text-[#C4B0E8]"
                          : "text-white/40 hover:text-white/70 hover:bg-white/5"
                      )}>
                      <item.icon size={16} strokeWidth={active ? 2.5 : 1.8}
                        className={active ? "text-[#9D7FD4]" : ""} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="absolute bottom-0 inset-x-0 p-3 border-t border-white/5">
                <button onClick={() => { setIsOpen(false); signOut(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <LogOut size={16} /> Encerrar sessão
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Page title */}
        <div>
          <h1 className="text-[15px] font-black text-slate-800 leading-none">{pageTitle}</h1>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5 hidden sm:block">
            {new Intl.DateTimeFormat("pt-BR", { weekday:"long", day:"numeric", month:"long" }).format(new Date())}
          </p>
        </div>
      </div>

      {/* Right — bell + avatar */}
      <div className="flex items-center gap-2">

        {/* Notificações */}
        <button
          onClick={() => router.push("/agendamentos?filter=pending")}
          className="relative h-9 w-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#7C5CBF] transition-all"
        >
          <Bell size={17} />
          <AnimatePresence>
            {pendingCount > 0 && (
              <motion.span
                initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black text-white flex items-center justify-center"
                style={{ background:"linear-gradient(135deg,#7C5CBF,#9D7FD4)" }}
              >
                {pendingCount > 9 ? "9+" : pendingCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 h-9 px-2 rounded-xl hover:bg-slate-50 transition-all">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center text-[12px] font-black text-white overflow-hidden shrink-0"
                style={{ background:"linear-gradient(135deg,#7C5CBF,#9D7FD4)" }}>
                {user?.photoURL
                  ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  : <span>{initials}</span>
                }
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-[12px] font-black text-slate-700 leading-none">{user?.name ?? "Admin"}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Administrador</p>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-slate-100 shadow-xl p-1.5 mt-1">
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-[13px] font-black text-slate-800">{user?.name ?? ""}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email ?? ""}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100 my-1" />
            <DropdownMenuItem onClick={() => router.push("/configuracoes")}
              className="rounded-xl px-3 py-2 cursor-pointer text-[13px] font-bold text-slate-600 hover:text-[#7C5CBF] hover:bg-[#F0EBFF] transition-all gap-2.5">
              <User size={14} /> Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/configuracoes")}
              className="rounded-xl px-3 py-2 cursor-pointer text-[13px] font-bold text-slate-600 hover:text-[#7C5CBF] hover:bg-[#F0EBFF] transition-all gap-2.5">
              <Settings size={14} /> Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100 my-1" />
            <DropdownMenuItem onClick={() => signOut()}
              className="rounded-xl px-3 py-2 cursor-pointer text-[13px] font-bold text-red-500 hover:bg-red-50 transition-all gap-2.5">
              <LogOut size={14} /> Encerrar sessão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
