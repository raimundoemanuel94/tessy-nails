"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup 
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Scissors, 
  Search, 
  Menu, 
  LayoutDashboard, 
  Calendar, 
  Clock, 
  BarChart3, 
  Users,
  Sparkle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Calendar, label: "Agenda", href: "/agenda" },
    { icon: Clock, label: "Agendamentos", href: "/agendamentos" },
    { icon: BarChart3, label: "Relatórios", href: "/relatorios" },
    { icon: Users, label: "Clientes", href: "/clientes" },
    { icon: Scissors, label: "Serviços", href: "/servicos" },
    { icon: Settings, label: "Configurações", href: "/configuracoes" },
  ];

  return (
    <header className="h-20 flex items-center justify-between px-6 sticky top-0 z-30 transition-all duration-300 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu size={24} />
                </Button>
              }
            />
            <SheetContent side="left" className="w-72 p-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5">
              <SheetHeader className="p-6 h-20 border-b border-slate-100 dark:border-white/5 flex flex-row items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Sparkle className="text-white" size={18} strokeWidth={2.5} />
                </div>
                <SheetTitle className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase m-0">
                  Tessy<span className="text-violet-600">Nails</span>
                </SheetTitle>
              </SheetHeader>
              
              <nav className="p-3 space-y-1.5 mt-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300",
                        isActive
                          ? "bg-slate-100 dark:bg-slate-800 text-violet-600 shadow-xs border border-slate-200/50 dark:border-white/5"
                          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                      )}
                    >
                      <item.icon
                        size={20}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={cn(
                          "transition-all duration-300",
                          isActive ? "text-violet-600 scale-110" : "group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-110"
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 dark:border-white/5">
                <Button
                  variant="ghost"
                  className="w-full flex items-center gap-3 justify-start rounded-xl text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-300 font-semibold"
                  onClick={() => {
                    setIsOpen(false);
                    signOut();
                  }}
                >
                  <LogOut size={20} className="shrink-0" />
                  <span>Encerrar Sessão</span>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/10">
            <Sparkle className="text-white" size={16} />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Tessy<span className="text-violet-600">Nails</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        {/* Search Bar Placeholder (Visual only) */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 w-64 group focus-within:w-80 transition-all duration-500 cursor-text">
          <Search size={16} className="text-slate-400 group-hover:text-violet-500 transition-colors" />
          <span className="ml-3 text-xs text-slate-400 font-bold tracking-tight">Pesquisar...</span>
          <div className="ml-auto flex gap-1">
            <kbd className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-400 dark:text-slate-500 shadow-xs">⌘</kbd>
            <kbd className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-400 dark:text-slate-500 shadow-xs">K</kbd>
          </div>
        </div>

        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-all shadow-sm">
          <Bell size={20} strokeWidth={2} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-violet-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-11 px-2 gap-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                <Avatar className="h-9 w-9 border-2 border-white dark:border-white/20 shadow-lg shadow-violet-500/10 transition-transform group-hover:scale-110">
                  <AvatarImage src={user?.photoURL} alt={String(user?.name || "")} className="object-cover" />
                  <AvatarFallback className="bg-linear-to-br from-violet-100 to-purple-100 text-violet-700 font-black dark:from-violet-900 dark:to-purple-900 dark:text-violet-100">
                    {user?.name ? user.name.substring(0, 2).toUpperCase() : "TN"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start leading-tight">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{String(user?.name || "")}</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Administrador</span>
                </div>
              </Button>
            }
          />
          <DropdownMenuContent className="w-64 mt-2 p-2 rounded-2xl border-slate-200/60 dark:border-white/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{String(user?.name || "")}</p>
                  <p className="text-xs font-medium leading-none text-slate-400 dark:text-slate-500">{String(user?.email || "")}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="p-3 cursor-pointer rounded-xl gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-violet-600 dark:hover:text-violet-400 transition-all" onClick={() => router.push("/configuracoes")}>
                <User size={18} /> Ver Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 cursor-pointer rounded-xl gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-violet-600 dark:hover:text-violet-400 transition-all" onClick={() => router.push("/configuracoes")}>
                <Settings size={18} /> Preferências
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="p-3 cursor-pointer rounded-xl gap-3 text-sm font-extrabold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all" onClick={() => signOut()}>
                <LogOut size={18} /> Encerrar Sessão
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
