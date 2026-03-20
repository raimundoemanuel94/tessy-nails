"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Plus, Sparkles, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.role === 'professional';

  const navItems = [
    { label: "Home", icon: Home, href: "/cliente", active: pathname === "/cliente" },
    { label: "Agenda", icon: Calendar, href: "/cliente/agendamentos", active: pathname === "/cliente/agendamentos" },
    { label: "Agendar", icon: Plus, href: "/cliente/agendar", isSpecial: true },
    { label: "Serviços", icon: Sparkles, href: "/cliente/servicos", active: pathname === "/cliente/servicos" },
    { label: "Perfil", icon: User, href: "/cliente/perfil", active: pathname === "/cliente/perfil" },
  ];

  // If admin is browsing specialized client pages, show a return button
  const items = isAdmin 
    ? [...navItems.slice(0, 2), { label: "Painel", icon: LayoutDashboard, href: "/dashboard", active: false }, ...navItems.slice(3)]
    : navItems;

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 px-4 pointer-events-none sm:hidden">
      <nav className="mx-auto flex h-20 max-w-[400px] items-center justify-around gap-1 rounded-[2.5rem] border border-white/20 bg-white/80 px-2 shadow-[0_20px_50px_-12px_rgba(139,92,246,0.3)] backdrop-blur-xl pointer-events-auto">
        {items.map((item) => {
          if ('isSpecial' in item && item.isSpecial) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-6 flex flex-col items-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-brand-primary to-brand-secondary p-1 shadow-[0_12px_24px_-8px_rgba(139,92,246,0.6)] ring-4 ring-white transition-all duration-300 hover:scale-110 active:scale-95">
                  <Plus className="h-8 w-8 text-white" strokeWidth={3} />
                </div>
                <span className="mt-1 text-[10px] font-black uppercase tracking-widest text-brand-primary">
                  {item.label}
                </span>
              </Link>
            );
          }

          const isActive = 'active' in item && item.active;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-1.5 transition-all duration-300"
            >
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300",
                  isActive 
                    ? "bg-brand-primary/10 text-brand-primary shadow-inner" 
                    : "text-brand-text-muted hover:bg-brand-primary/5 hover:text-brand-primary"
                )}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  "text-[9px] font-bold uppercase tracking-wider transition-colors duration-300",
                  isActive ? "text-brand-primary font-black scale-105" : "text-brand-text-muted opacity-80"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
