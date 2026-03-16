"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, PlusCircle, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", icon: Home, href: "/cliente", isSpecial: false },
    { label: "Agenda", icon: Calendar, href: "/cliente/agendamentos", isSpecial: false },
    { label: "Agendar", icon: PlusCircle, href: "/cliente/agendar", isSpecial: true },
    { label: "Serviços", icon: Sparkles, href: "/cliente/servicos", isSpecial: false },
    { label: "Perfil", icon: User, href: "/cliente/perfil", isSpecial: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-violet-100/50 shadow-2xl shadow-violet-500/5 z-50 md:hidden">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          if (item.isSpecial) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 -mt-6"
              >
                <div className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all",
                  isActive 
                    ? "bg-gradient-to-br from-fuchsia-600 via-violet-600 to-indigo-600 shadow-violet-500/50 scale-110" 
                    : "bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 shadow-violet-400/40 hover:scale-105"
                )}>
                  <item.icon size={28} className="text-white" strokeWidth={2.5} />
                </div>
                <span className={cn(
                  "text-[9px] font-bold mt-1",
                  isActive ? "text-violet-700" : "text-violet-600"
                )}>{item.label}</span>
              </Link>
            );
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1.5 py-2 px-3 transition-all"
            >
              <item.icon 
                size={22} 
                className={cn(
                  "transition-colors",
                  isActive ? "text-violet-600" : "text-slate-400"
                )}
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className={cn(
                "text-[9px] font-semibold transition-colors",
                isActive ? "text-violet-700" : "text-slate-500"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
