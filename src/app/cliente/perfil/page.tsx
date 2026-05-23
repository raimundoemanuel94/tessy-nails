"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorState } from "@/components/shared/ErrorState";
import { toast } from "sonner";
import {
  ArrowLeft, User, Mail, Phone, Calendar, ChevronRight,
  LogOut, Settings, HelpCircle, Sparkles, Star,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ensureDate } from "@/lib/utils";

export default function PerfilPage() {
  const router = useRouter();
  const { client, user, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) setLoading(false);
    if (!authLoading && !user) setError("Você precisa estar logado.");
  }, [authLoading, user]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch { /* ignora */ }
    router.push("/login");
  };

  const menuItems = [
    {
      group: "Conta",
      items: [
        { icon: Calendar, label: "Meus Agendamentos", sub: "Ver histórico completo", onClick: () => router.push("/cliente/agendamentos"), accent: false },
        { icon: Sparkles, label: "Novo Agendamento", sub: "Reservar um horário", onClick: () => router.push("/cliente/servicos"), accent: true },
      ],
    },
    {
      group: "Suporte",
      items: [
        { icon: Settings, label: "Configurações", sub: "Preferências do app", onClick: () => toast.info("Em breve"), accent: false },
        { icon: HelpCircle, label: "Ajuda", sub: "Central de suporte", onClick: () => toast.info("Em breve"), accent: false },
      ],
    },
  ];

  if (loading || authLoading) return (
    <div className="min-h-screen bg-[#FAF8FF]">
      <div className="bg-[#1E1A2E] h-64 animate-pulse" />
      <div className="px-5 -mt-12 space-y-4 max-w-lg mx-auto">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-white border border-[#EDE5FF] animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#FAF8FF] flex items-center justify-center p-5">
      <ErrorState title="Erro no Perfil" message={error} onRetry={() => window.location.reload()} />
    </div>
  );

  const name = String(client?.name || user?.name || "Usuário");
  const email = String(client?.email || user?.email || "");
  const phone = String(client?.phone || "");
  const firstName = name.split(" ")[0];
  const initials = name.split(" ").filter(Boolean).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "U";
  const memberSince = user?.createdAt
    ? (() => { try { return format(ensureDate(user.createdAt), "MMMM 'de' yyyy", { locale: ptBR }); } catch { return null; } })()
    : null;

  return (
    <div className="min-h-screen bg-[#FAF8FF] pb-32">

      {/* Hero dark */}
      <div className="bg-[#1E1A2E] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#9D7FD4]/8 blur-3xl translate-x-20 -translate-y-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-amber-600/6 blur-2xl -translate-x-10 translate-y-10" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />

        <div className="relative z-10 px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-16 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => router.push("/cliente")}
              className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-90 transition-all">
              <ArrowLeft size={16} className="text-white/80" />
            </button>
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Perfil</span>
            <div className="w-9" />
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="relative mb-4"
            >
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-[#9D7FD4] to-[#5A3F9A] flex items-center justify-center shadow-xl shadow-black/20">
                <span className="text-2xl font-black text-white">{initials}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-[#1E1A2E] flex items-center justify-center">
                <Star size={10} className="text-white fill-white" />
              </div>
            </motion.div>

            <h1 className="text-xl font-black text-white mb-0.5">{firstName}</h1>
            <p className="text-xs text-white/40">{email}</p>
            {memberSince && (
              <p className="text-[9px] text-white/25 mt-1 uppercase tracking-widest">Membro desde {memberSince}</p>
            )}
          </div>
        </div>
      </div>

      {/* Info card flutuante */}
      <div className="px-5 -mt-8 mb-5 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-[#EDE5FF] shadow-xl shadow-stone-200/50 overflow-hidden"
        >
          <div className="h-0.5 bg-gradient-to-r from-[#1E1A2E]/0 via-[#9D7FD4] to-[#1E1A2E]/0" />
          <div className="divide-y divide-stone-50">
            {[
              { icon: User,     label: "Nome",     value: name },
              { icon: Mail,     label: "E-mail",   value: email || "Não informado" },
              { icon: Phone,    label: "Telefone", value: phone || "Não informado" },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="h-8 w-8 rounded-xl bg-[#FAF8FF] flex items-center justify-center shrink-0">
                  <row.icon size={14} className="text-[#1E1A2E]/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-[#9B8FC0] uppercase tracking-widest">{row.label}</p>
                  <p className="text-xs font-bold text-[#2A2440] truncate mt-0.5">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Menu groups */}
      <div className="px-5 space-y-4 max-w-lg mx-auto">
        {menuItems.map((group, gi) => (
          <motion.div key={group.group}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + gi * 0.08 }}>
            <p className="text-[9px] font-black text-[#9B8FC0] uppercase tracking-[0.25em] mb-2 px-1">
              {group.group}
            </p>
            <div className="bg-white rounded-2xl border border-[#EDE5FF] overflow-hidden divide-y divide-stone-50">
              {group.items.map((item, ii) => (
                <button key={ii} onClick={item.onClick}
                  className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-[#FAF8FF] transition-colors text-left group">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    item.accent ? "bg-[#1E1A2E]" : "bg-[#FAF8FF] group-hover:bg-[#1E1A2E]"
                  }`}>
                    <item.icon size={15} className={item.accent ? "text-[#9D7FD4]" : "text-[#6B6480] group-hover:text-[#9D7FD4] transition-colors"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1E1A2E]">{item.label}</p>
                    <p className="text-[10px] text-[#9B8FC0]">{item.sub}</p>
                  </div>
                  <ChevronRight size={14} className="text-[#DDD5F5] shrink-0" />
                </button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Logout */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border border-red-100 bg-red-50/50 active:bg-red-50 transition-colors group"
        >
          <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center">
            <LogOut size={15} className="text-red-500" />
          </div>
          <span className="text-sm font-bold text-red-600 flex-1 text-left">Sair da conta</span>
          <ChevronRight size={14} className="text-red-300" />
        </motion.button>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 pt-2 opacity-25">
          <Sparkles size={9} className="text-[#1E1A2E]" />
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[#1E1A2E]">Tessy Nails</span>
        </div>
      </div>
    </div>
  );
}
