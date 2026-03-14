"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Bell, User, Settings, LogOut, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <header className="h-20 flex items-center justify-between px-6 sticky top-0 z-30 transition-all duration-300 border-b border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-pink-500/10">
            <Scissors className="text-white" size={16} />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Tessy<span className="text-pink-600">Nails</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        {/* Search Bar Placeholder (Visual only) */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 w-64 group focus-within:w-80 transition-all duration-500">
          <Bell size={16} className="text-slate-400" />
          <span className="ml-2 text-xs text-slate-400 font-medium">Pesquisar... (⌘K)</span>
        </div>

        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-all shadow-sm">
          <Bell size={20} strokeWidth={2} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative h-11 px-2 gap-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                <Avatar className="h-9 w-9 border-2 border-white dark:border-white/10 shadow-sm transition-transform group-hover:scale-105">
                  <AvatarImage src={user?.photoURL} alt={user?.name} className="object-cover" />
                  <AvatarFallback className="bg-linear-to-br from-pink-100 to-rose-100 text-pink-700 font-bold dark:from-pink-900 dark:to-rose-900 dark:text-pink-100">
                    {user?.name?.substring(0, 2).toUpperCase() || "TN"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex flex-col items-start leading-tight">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Administrador</span>
                </div>
              </Button>
            }
          />
          <DropdownMenuContent className="w-64 mt-2 p-2 rounded-2xl border-slate-200/60 dark:border-white/5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl" align="end">
            <DropdownMenuLabel className="p-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{user?.name}</p>
                <p className="text-xs font-medium leading-none text-slate-400 dark:text-slate-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
            <DropdownMenuItem className="p-3 cursor-pointer rounded-xl gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-pink-600 dark:hover:text-pink-400 transition-all" onClick={() => router.push("/configuracoes")}>
              <User size={18} /> Ver Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="p-3 cursor-pointer rounded-xl gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-pink-600 dark:hover:text-pink-400 transition-all" onClick={() => router.push("/configuracoes")}>
              <Settings size={18} /> Preferências
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5" />
            <DropdownMenuItem className="p-3 cursor-pointer rounded-xl gap-3 text-sm font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all" onClick={() => signOut()}>
              <LogOut size={18} /> Encerrar Sessão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
