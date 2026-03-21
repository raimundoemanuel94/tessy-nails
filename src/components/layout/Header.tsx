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
    <header className="h-20 flex items-center justify-between px-6 sticky top-0 pt-[env(safe-area-inset-top)] z-30 transition-all duration-300 border-b border-brand-border/40 bg-white/40 backdrop-blur-xl">
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
            <SheetContent side="left" className="w-80 p-0 bg-white border-r border-brand-accent/10">
              <SheetHeader className="p-6 h-20 border-b border-brand-accent/5 flex flex-row items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/20">
                  <Sparkle className="text-white" size={18} strokeWidth={2.5} />
                </div>
                <SheetTitle className="text-lg font-black tracking-tight text-brand-text dark:text-white uppercase m-0">
                  Tessy<span className="text-brand-primary">Nails</span>
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
                          ? "bg-brand-primary/10 text-brand-primary shadow-sm border border-brand-primary/10"
                          : "text-brand-text-sub hover:text-brand-primary hover:bg-brand-primary/5"
                      )}
                    >
                      <item.icon
                        size={20}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={cn(
                          "transition-all duration-300",
                          isActive ? "text-brand-primary scale-110" : "group-hover:text-slate-900 dark:group-hover:text-white group-hover:scale-110"
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-brand-border/40">
                <Button
                  variant="ghost"
                  className="w-full flex items-center gap-3 justify-start rounded-xl text-brand-text-muted hover:text-red-600 hover:bg-red-50 transition-all duration-300 font-semibold"
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
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-md shadow-brand-primary/10 transition-transform hover:scale-110">
            <Sparkle className="text-white" size={16} />
          </div>
          <span className="text-lg font-black tracking-[0.3em] text-brand-text uppercase ml-1">
            Tessy<span className="text-brand-primary">Nails</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <div className="hidden sm:flex items-center bg-white/60 border border-brand-border/50 rounded-xl px-4 py-2 w-64 group focus-within:w-80 transition-all duration-500 cursor-text shadow-sm">
          <Search size={16} className="text-brand-text-muted group-focus-within:text-brand-primary transition-colors" />
          <span className="ml-3 text-xs text-brand-text-muted font-bold tracking-tight">Pesquisar...</span>
          <div className="ml-auto flex gap-1">
            <kbd className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-md bg-white border border-brand-border text-[10px] font-black text-brand-text-muted shadow-xs">⌘</kbd>
            <kbd className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-md bg-white border border-brand-border text-[10px] font-black text-brand-text-muted shadow-xs">K</kbd>
          </div>
        </div>

        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl bg-white/60 border border-brand-border/50 text-brand-text-muted hover:text-brand-primary hover:bg-brand-primary/5 transition-all shadow-sm">
          <Bell size={20} strokeWidth={2} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-primary rounded-full border-2 border-white animate-pulse" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-11 px-2 gap-3 rounded-xl hover:bg-brand-primary/5 transition-all">
                <Avatar className="h-9 w-9 border-2 border-white shadow-lg shadow-brand-primary/10 transition-transform group-hover:scale-110">
                  <AvatarImage src={user?.photoURL} alt={String(user?.name || "")} className="object-cover" />
                  <AvatarFallback className="bg-linear-to-br from-brand-primary to-brand-secondary text-white font-black">
                    {user?.name ? user.name.substring(0, 2).toUpperCase() : "TN"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start leading-tight">
                  <span className="text-sm font-bold text-brand-text">{String(user?.name || "")}</span>
                  <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-tighter">Administrador</span>
                </div>
              </Button>
            }
          />
          <DropdownMenuContent className="w-64 mt-2 p-2 rounded-2xl border border-brand-accent/10 bg-white/95 backdrop-blur-xl shadow-premium-xl" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-black text-brand-text-main leading-none">{String(user?.name || "")}</p>
                  <p className="text-xs font-bold leading-none text-brand-text-sub/70">{String(user?.email || "")}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-brand-accent/10" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="p-3 cursor-pointer rounded-xl gap-3 text-sm font-black text-brand-text-sub hover:bg-brand-primary/5 hover:text-brand-primary transition-all" onClick={() => router.push("/configuracoes")}>
                <User size={18} /> Ver Perfil
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3 cursor-pointer rounded-xl gap-3 text-sm font-black text-brand-text-sub hover:bg-brand-primary/5 hover:text-brand-primary transition-all" onClick={() => router.push("/configuracoes")}>
                <Settings size={18} /> Preferências
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
            <DropdownMenuGroup>
              <DropdownMenuItem className="p-3 cursor-pointer rounded-xl gap-3 text-sm font-extrabold text-brand-primary hover:bg-brand-primary/5 transition-all" onClick={() => signOut()}>
                <LogOut size={18} /> Encerrar Sessão
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
