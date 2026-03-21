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
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pointer-events-none sm:hidden max-w-lg mx-auto">
      <nav className="flex h-16 items-center justify-around gap-1 rounded-full border border-[#EFEAE4]/50 bg-white/80 px-2 shadow-lg backdrop-blur-xl pointer-events-auto">
        {items.map((item) => {
          if ('isSpecial' in item && item.isSpecial) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-5 flex flex-col items-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C89B7B] p-1 shadow-lg ring-4 ring-white transition-all duration-300 hover:scale-110 active:scale-95">
                  <Plus className="h-7 w-7 text-white" strokeWidth={3} />
                </div>
              </Link>
            );
          }

          const isActive = 'active' in item && item.active;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-300"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300",
                  isActive 
                    ? "text-[#C89B7B]" 
                    : "text-[#6B6B6B] hover:text-[#C89B7B]"
                )}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  "text-[9px] font-medium transition-colors duration-300",
                  isActive ? "text-[#C89B7B] font-semibold" : "text-[#6B6B6B]"
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
