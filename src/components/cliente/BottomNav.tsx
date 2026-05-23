"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const ITEMS = [
  { label:"Início",  icon: Home,     href:"/cliente"              },
  { label:"Agenda",  icon: Calendar, href:"/cliente/agendamentos" },
  { label:"",        icon: Plus,     href:"/cliente/servicos", special: true },
  { label:"Perfil",  icon: User,     href:"/cliente/perfil"       },
];

export function BottomNav() {
  const path = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <nav className="max-w-lg mx-auto">
        <div className="flex h-16 items-center rounded-[22px] bg-white border border-[#EDE5FF] shadow-xl shadow-[#9D7FD4]/10 px-2 gap-1">
          {ITEMS.map((item, i) => {
            const active = item.href === "/cliente"
              ? path === "/cliente"
              : path.startsWith(item.href);

            if (item.special) return (
              <Link key={i} href={item.href} className="flex-1 flex justify-center">
                <motion.div whileTap={{ scale: 0.88 }}
                  className="h-12 w-12 rounded-[16px] flex items-center justify-center shadow-lg"
                  style={{ background: "linear-gradient(135deg, #7C5CBF 0%, #9D7FD4 100%)" }}>
                  <Plus size={22} className="text-white" strokeWidth={2.5} />
                </motion.div>
              </Link>
            );

            return (
              <Link key={i} href={item.href}
                className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative group">
                {active && (
                  <motion.div layoutId="nav-pill"
                    className="absolute inset-x-1 inset-y-2 rounded-xl bg-[#EDE5FF]"
                    transition={{ type:"spring", stiffness:400, damping:32 }} />
                )}
                <item.icon
                  size={19}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={cn(
                    "relative z-10 transition-all duration-200",
                    active ? "text-[#7C5CBF]" : "text-[#9B8FC0] group-hover:text-[#7C5CBF]"
                  )} />
                {item.label && (
                  <span className={cn(
                    "relative z-10 text-[9px] font-bold leading-none transition-all duration-200",
                    active ? "text-[#7C5CBF]" : "text-[#B8B0CC]"
                  )}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
