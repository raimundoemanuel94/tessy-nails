"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Scissors, 
  Clock, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const operationItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Calendar, label: "Agenda", href: "/agenda" },
  { icon: Clock, label: "Agendamentos", href: "/agendamentos" },
];

const cadastrosItems = [
  { icon: Users, label: "Clientes", href: "/clientes" },
  { icon: Scissors, label: "Serviços", href: "/servicos" },
];

const systemItems = [
  { icon: Settings, label: "Configurações", href: "/configuracoes" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "relative h-screen flex flex-col transition-all duration-500 ease-in-out border-r border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl z-40",
      collapsed ? "w-[70px]" : "w-72"
    )}>
      {/* Brand Section */}
      <div className="flex h-20 items-center px-6 mb-2">
        {!collapsed && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              < Scissors className="text-white" size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Tessy<span className="text-pink-600">Nails</span>
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
          <p className="px-4 pt-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Operação
          </p>
        )}
        <div className="space-y-1.5">
          {operationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-white dark:bg-slate-800 text-pink-600 shadow-sm border border-slate-200/50 dark:border-white/5"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5",
                  collapsed && "justify-center px-0"
                )}
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    "transition-all duration-300",
                    isActive
                      ? "text-pink-600 scale-110"
                      : "group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-110"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}

                {isActive && !collapsed && (
                  <div className="absolute left-0 w-1 h-6 bg-pink-600 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Cadastros */}
        {!collapsed && (
          <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Cadastros
          </p>
        )}
        <div className="space-y-1.5">
          {cadastrosItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-white dark:bg-slate-800 text-pink-600 shadow-sm border border-slate-200/50 dark:border-white/5"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5",
                  collapsed && "justify-center px-0"
                )}
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    "transition-all duration-300",
                    isActive
                      ? "text-pink-600 scale-110"
                      : "group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-110"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}

                {isActive && !collapsed && (
                  <div className="absolute left-0 w-1 h-6 bg-pink-600 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Sistema */}
        {!collapsed && (
          <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Sistema
          </p>
        )}
        <div className="space-y-1.5">
          {systemItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-white dark:bg-slate-800 text-pink-600 shadow-sm border border-slate-200/50 dark:border-white/5"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5",
                  collapsed && "justify-center px-0"
                )}
              >
                <item.icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    "transition-all duration-300",
                    isActive
                      ? "text-pink-600 scale-110"
                      : "group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-110"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}

                {isActive && !collapsed && (
                  <div className="absolute left-0 w-1 h-6 bg-pink-600 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer Section */}
      <div className="p-4 mt-auto">
        <div className={cn(
          "rounded-2xl p-2 transition-all duration-500",
          !collapsed && "bg-linear-to-br from-pink-500/5 to-rose-500/5 dark:from-pink-500/10 dark:to-rose-500/10 border border-pink-100/50 dark:border-pink-500/20 mb-4"
        )}>
          {!collapsed && (
            <div className="px-3 py-4 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <Scissors className="text-pink-600" size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">Plano Premium</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Suporte 24/7 Ativo</p>
              </div>
              <Button size="sm" className="w-full h-8 bg-white dark:bg-slate-800 text-pink-600 border border-pink-100 dark:border-pink-500/30 hover:bg-pink-50 dark:hover:bg-pink-900/20 text-[10px] font-black uppercase tracking-widest">Gerenciar</Button>
            </div>
          )}
          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center gap-3 justify-start rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all duration-300 font-semibold",
              collapsed && "justify-center p-0 h-10 w-10 mx-auto"
            )}
            onClick={() => signOut()}
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && <span>Encerrar Sessão</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
