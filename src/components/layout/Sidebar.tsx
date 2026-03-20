"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Calendar, 
  CalendarDays,
  Users, 
  Sparkles, 
  Clock4, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Sparkle,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const operationItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", description: "Visão geral do negócio" },
  { icon: Calendar, label: "Calendário", href: "/agenda", description: "Visualização e planejamento" },
  { icon: ClipboardList, label: "Agendamentos", href: "/agendamentos", description: "Histórico e gestão" },
  { icon: BarChart3, label: "Relatórios", href: "/relatorios", description: "Análises e exportações" },
];

const cadastrosItems = [
  { icon: Users, label: "Clientes", href: "/clientes", description: "Lista e gestão" },
  { icon: Sparkles, label: "Serviços", href: "/servicos", description: "Catálogo e preços" },
];

const systemItems = [
  { icon: Settings, label: "Configurações", href: "/configuracoes", description: "Preferências do sistema" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside className={cn(
      "relative h-screen flex flex-col transition-all duration-500 ease-in-out border-r border-slate-200/40 dark:border-white/5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl z-40",
      collapsed ? "w-[80px]" : "w-72"
    )}>
      {/* Brand Section */}
      <div className="flex h-20 items-center px-6 mb-2">
        {!collapsed && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/30">
              <Sparkle className="text-white" size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black tracking-[0.3em] text-brand-text dark:text-white uppercase ml-1">
              Tessy<span className="text-brand-primary">Nails</span>
            </span>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "h-8 w-8 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-sm hover:scale-110 transition-all duration-300",
            collapsed ? "mx-auto" : "ml-auto"
          )}
        >
          {collapsed ? <ChevronRight size={14} className="text-slate-600" /> : <ChevronLeft size={14} className="text-slate-600" />}
        </Button>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto custom-scrollbar">
        {/* Operação */}
        {!collapsed && (
          <div className="px-4 pt-6 pb-2">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[1.5px] opacity-60">
              Operação
            </p>
          </div>
        )}
        <div className="space-y-2">
          {operationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl px-3 h-12 text-sm font-bold transition-all duration-300",
                  isActive
                    ? "bg-linear-to-br from-brand-primary to-brand-secondary text-white shadow-xl shadow-brand-primary/30 border border-white/10"
                    : "text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-accent hover:bg-brand-primary/10 hover:translate-x-1",
                  collapsed && "justify-center px-0 mx-auto w-12"
                )}
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "text-white" : "group-hover:scale-110"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Cadastros */}
        {!collapsed && (
          <div className="px-4 pt-6 pb-2">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[1.5px] opacity-60">
              Cadastros
            </p>
          </div>
        )}
        <div className="space-y-2">
          {cadastrosItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl px-3 h-12 text-sm font-bold transition-all duration-300",
                  isActive
                    ? "bg-linear-to-br from-brand-primary to-brand-secondary text-white shadow-xl shadow-brand-primary/30 border border-white/10"
                    : "text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-accent hover:bg-brand-primary/10 hover:translate-x-1",
                  collapsed && "justify-center px-0 mx-auto w-12"
                )}
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "text-white" : "group-hover:scale-110"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Sistema */}
        {!collapsed && (
          <div className="px-4 pt-6 pb-2">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[1.5px] opacity-60">
              Sistema
            </p>
          </div>
        )}
        <div className="space-y-2">
          {systemItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl px-3 h-12 text-sm font-bold transition-all duration-300",
                  isActive
                    ? "bg-linear-to-br from-brand-primary to-brand-secondary text-white shadow-xl shadow-brand-primary/30 border border-white/10"
                    : "text-slate-500 dark:text-slate-400 hover:text-brand-primary dark:hover:text-brand-accent hover:bg-brand-primary/10 hover:translate-x-1",
                  collapsed && "justify-center px-0 mx-auto w-12"
                )}
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "text-white" : "group-hover:scale-110"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer Section */}
      <div className="p-4 mt-auto border-t border-slate-200/40 dark:border-white/5">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-white/5",
          collapsed ? "justify-center" : "px-3"
        )}>
          {!collapsed ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/20 flex items-center justify-center text-brand-primary dark:text-brand-accent font-bold overflow-hidden shadow-inner">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0) || "U"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user?.name || "Usuário"}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate uppercase tracking-wider">
                  Administrador
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut size={16} />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut size={20} />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
