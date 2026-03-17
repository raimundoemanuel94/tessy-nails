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
    <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div className="mx-auto max-w-[430px] px-3 pb-3">
        <nav className="rounded-[28px] border border-white/70 bg-white/90 px-2 py-2 shadow-[0_-10px_40px_rgba(124,58,237,0.12)] backdrop-blur-2xl">
          <div className="flex items-end justify-between gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              if (item.isSpecial) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-w-[74px] flex-col items-center justify-end gap-1"
                  >
                    <div
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-[20px] shadow-lg transition-all duration-200",
                        isActive
                          ? "bg-linear-to-br from-fuchsia-600 via-violet-600 to-indigo-600 scale-[1.02] shadow-violet-500/40"
                          : "bg-linear-to-br from-fuchsia-500 via-violet-500 to-indigo-500 shadow-violet-400/25 hover:scale-[1.02]"
                      )}
                    >
                      <item.icon size={24} className="text-white" strokeWidth={2.6} />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-bold tracking-wide",
                        isActive ? "text-violet-700" : "text-slate-500"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-w-[62px] flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 transition-all"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-2xl transition-all",
                      isActive ? "bg-violet-100 text-violet-700" : "text-slate-400"
                    )}
                  >
                    <item.icon size={20} strokeWidth={isActive ? 2.6 : 2.2} />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-semibold tracking-wide transition-colors",
                      isActive ? "text-violet-700" : "text-slate-500"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
