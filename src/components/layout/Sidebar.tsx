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
      "relative h-screen flex flex-col transition-all duration-500 ease-in-out border-r border-brand-accent/10 bg-white/40 backdrop-blur-2xl z-40",
      collapsed ? "w-[80px]" : "w-80"
    )}>
      {/* Brand Section */}
      <div className="flex h-20 items-center px-6 mb-2">
        {!collapsed ? (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
            <img src="/brand/logo/horizontal.png" alt="Tessy Nails" className="h-10 w-auto" />
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center animate-in zoom-in duration-500">
            <img src="/brand/icons/icon-app.png" alt="T" className="w-10 h-10 rounded-xl shadow-md" />
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "h-8 w-8 rounded-full border border-brand-accent/20 bg-white shadow-premium hover:scale-110 transition-all duration-300",
            collapsed ? "mx-auto" : "ml-auto"
          )}
        >
          {collapsed ? <ChevronRight size={14} className="text-brand-text-sub" /> : <ChevronLeft size={14} className="text-brand-text-sub" />}
        </Button>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto custom-scrollbar">
        {/* Operação */}
        {!collapsed && (
          <div className="px-4 pt-6 pb-2">
            <p className="text-[10px] font-black text-brand-text-sub/40 uppercase tracking-[2px] opacity-100">
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
                  "group relative flex items-center gap-4 rounded-2xl px-4 h-12 text-sm font-semibold tracking-wide transition-all duration-300",
                  isActive
                    ? "bg-brand-soft/50 text-brand-primary border border-brand-accent/20 shadow-sm"
                    : "text-brand-text-sub hover:text-brand-primary hover:bg-brand-soft/30 hover:translate-x-1",
                  collapsed && "justify-center px-0 mx-auto w-12"
                )}
              >
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "text-[#EE428F]" : "group-hover:scale-110 group-hover:text-[#EE428F]"
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
            <p className="text-[10px] font-black text-brand-text-sub/40 uppercase tracking-[2px] opacity-100">
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
                  "group relative flex items-center gap-3 rounded-2xl px-3 h-12 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-brand-soft/50 text-brand-primary border border-brand-accent/20 shadow-sm"
                    : "text-brand-text-sub hover:text-brand-primary hover:bg-brand-soft/30 hover:translate-x-1",
                  collapsed && "justify-center px-0 mx-auto w-12"
                )}
              >
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "text-[#EE428F]" : "group-hover:scale-110 group-hover:text-[#EE428F]"
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
            <p className="text-[10px] font-black text-brand-text-sub/40 uppercase tracking-[2px] opacity-100">
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
                  "group relative flex items-center gap-3 rounded-2xl px-3 h-12 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-brand-soft/50 text-brand-primary border border-brand-accent/20 shadow-sm"
                    : "text-brand-text-sub hover:text-brand-primary hover:bg-brand-soft/30 hover:translate-x-1",
                  collapsed && "justify-center px-0 mx-auto w-12"
                )}
              >
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    "transition-all duration-300",
                    isActive ? "text-brand-accent" : "group-hover:scale-110 group-hover:text-brand-primary"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer Section */}
      <div className="p-4 mt-auto border-t border-brand-accent/10">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-2xl bg-brand-soft/10 border border-brand-accent/10",
          collapsed ? "justify-center" : "px-3"
        )}>
          {!collapsed ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-[#EE428F]/10 dark:bg-[#EE428F]/20 flex items-center justify-center text-[#EE428F] font-bold overflow-hidden shadow-inner">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0) || "U"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-brand-text-main truncate">
                  {user?.name || "Usuário"}
                </p>
                <p className="text-[10px] text-brand-text-sub font-black truncate uppercase tracking-[1.5px]">
                  Administrador
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="h-8 w-8 rounded-lg text-brand-text-sub hover:text-red-500 hover:bg-red-50 transition-colors"
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
