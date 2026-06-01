"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft, Calendar, ChevronRight, LogOut,
  Sparkles, Star, Bell, Shield, HelpCircle,
  Pencil, Clock, Heart,
} from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ensureDate } from "@/lib/utils";
import { appointmentService } from "@/services/appointments";
import { cn } from "@/lib/utils";

function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1.5 py-3">
      <span className="text-xl">{icon}</span>
      <span className="text-[18px] font-black text-white leading-none">{value}</span>
      <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.15em] text-center">{label}</span>
    </div>
  );
}

export default function PerfilPage() {
  const router = useRouter();
  const { client, user, loading: authLoading, signOut } = useAuth();

  const [stats, setStats]         = useState({ total: 0, concluidos: 0, meses: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    appointmentService.getByClientId(user.uid, 200).then(appts => {
      const concluidos = appts.filter(a => a.status === "completed").length;
      const meses = user.createdAt
        ? differenceInMonths(new Date(), ensureDate(user.createdAt)) + 1
        : 1;
      setStats({ total: appts.length, concluidos, meses });
    }).catch(() => {}).finally(() => setLoadingStats(false));
  }, [user]);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    try { await signOut(); } catch {}
    router.push("/login");
  };

  if (authLoading) return (
    <div className="min-h-screen bg-[#FAF8FF]">
      <div className="h-72 animate-pulse" style={{ background: "#1E1A2E" }} />
      <div className="px-5 -mt-10 space-y-3 max-w-lg mx-auto">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-white border border-[#EDE5FF] animate-pulse" />
        ))}
      </div>
    </div>
  );

  const name      = String(client?.name || user?.name || "Usuário");
  const email     = String(client?.email || user?.email || "");
  const firstName = name.split(" ")[0];
  const lastName  = name.split(" ").slice(1).join(" ");
  const initials  = name.split(" ").filter(Boolean).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "U";
  const memberSince = user?.createdAt
    ? (() => { try { return format(ensureDate(user.createdAt), "MMM yyyy", { locale: ptBR }); } catch { return null; } })()
    : null;

  const menuSections = [
    {
      title: "Minha conta",
      items: [
        { icon: Calendar, label: "Meus agendamentos", sub: "Ver histórico completo",       href: "/cliente/agendamentos", accent: false },
        { icon: Sparkles, label: "Novo agendamento",  sub: "Reservar um horário",          href: "/cliente/servicos",     accent: true  },
      ],
    },
    {
      title: "Preferências",
      items: [
        { icon: Bell,     label: "Notificações",      sub: "Alertas e lembretes",          href: null, accent: false, badge: "Em breve" },
        { icon: Shield,   label: "Privacidade",        sub: "Dados e segurança",            href: null, accent: false, badge: "Em breve" },
      ],
    },
    {
      title: "Suporte",
      items: [
        { icon: HelpCircle, label: "Ajuda",            sub: "Central de suporte",           href: null, accent: false, badge: "Em breve" },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-[calc(7rem+env(safe-area-inset-bottom))]" style={{ background: "#FAF8FF" }}>

      {/* ── Modal de logout ───────────────────────────────────────── */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end justify-center px-4 pb-6"
            style={{ backgroundColor: "rgba(10,8,24,0.7)", backdropFilter: "blur(12px)" }}
          >
            <div className="absolute inset-0" onClick={() => setShowLogoutModal(false)} />
            <motion.div
              initial={{ y: 48, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 48, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-3xl bg-red-50 flex items-center justify-center">
                  <LogOut size={22} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-[#1E1A2E] mb-1">Sair da conta?</h3>
                  <p className="text-[11px] text-[#9B8FC0] leading-relaxed">
                    Você precisará fazer login novamente para acessar o app.
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setShowLogoutModal(false)}
                    className="flex-1 h-12 rounded-2xl border-2 border-[#EDE5FF] text-[#6B6480] text-sm font-black">
                    Cancelar
                  </button>
                  <button onClick={handleLogout}
                    className="flex-1 h-12 rounded-2xl bg-red-500 text-white text-sm font-black shadow-lg shadow-red-500/30">
                    Sair
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0F0C1E 0%, #1E1A2E 50%, #2A1A4E 100%)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        {/* Decorativos */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #9D7FD4, transparent)" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #7C5CBF, transparent)" }} />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
        </div>

        <div className="relative z-10 px-5 pt-4 max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => router.push("/cliente")}
              className="h-9 w-9 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center active:scale-90 transition-all">
              <ArrowLeft size={16} className="text-white/70" />
            </button>
            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.35em]">Perfil</span>
            <button
              onClick={() => toast.info("Edição de perfil em breve")}
              className="h-9 w-9 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center active:scale-90 transition-all">
              <Pencil size={14} className="text-white/50" />
            </button>
          </div>

          {/* Avatar + nome */}
          <div className="flex flex-col items-center text-center mb-6">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative mb-3"
            >
              {/* Anel externo */}
              <div className="absolute inset-[-4px] rounded-[28px] border border-[#9D7FD4]/30" />
              {/* Avatar */}
              <div className="h-20 w-20 rounded-[24px] flex items-center justify-center text-2xl font-black text-white shadow-xl overflow-hidden"
                style={{ background: "linear-gradient(135deg, #5A3F9A 0%, #9D7FD4 100%)" }}>
                {user?.photoURL
                  ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  : <span>{initials}</span>
                }
              </div>
              {/* Badge verified */}
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#9D7FD4] border-2 border-[#1E1A2E] flex items-center justify-center">
                <Star size={10} className="text-white fill-white" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h1 className="text-[20px] font-black text-white leading-none">
                {firstName}
                {lastName && <span className="text-white/50"> {lastName}</span>}
              </h1>
              <p className="text-[10px] text-white/30 mt-1">{email}</p>
              {memberSince && (
                <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-white/8 border border-white/10">
                  <Clock size={8} className="text-[#9D7FD4]" />
                  <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Membro desde {memberSince}</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl overflow-hidden mb-6"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(157,127,212,0.2)" }}
          >
            <div className="flex divide-x divide-white/8">
              <StatCard value={loadingStats ? "—" : String(stats.total)}      label="Serviços"   icon="💅" />
              <StatCard value={loadingStats ? "—" : String(stats.concluidos)} label="Concluídos" icon="✅" />
              <StatCard value={loadingStats ? "—" : `${stats.meses}m`}        label="Fidelidade" icon="💜" />
            </div>
          </motion.div>
        </div>

        {/* Curva de transição */}
        <div className="relative h-6 -mb-px"
          style={{ background: "linear-gradient(160deg, #0F0C1E 0%, #2A1A4E 100%)" }}>
          <div className="absolute bottom-0 inset-x-0 h-6 bg-[#FAF8FF] rounded-t-[28px]" />
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────── */}
      <div className="px-5 pt-5 space-y-4 max-w-lg mx-auto">

        {/* CTA rápido — Agendar */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/cliente/servicos")}
          className="w-full flex items-center gap-3 p-4 rounded-2xl text-left"
          style={{
            background: "linear-gradient(135deg, #1E1A2E 0%, #5A3F9A 60%, #9D7FD4 100%)",
            boxShadow: "0 8px 24px rgba(124,92,191,0.3)",
          }}
        >
          <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-black text-white uppercase tracking-[0.15em]">Novo agendamento</p>
            <p className="text-[10px] text-white/50 mt-0.5">Escolha um serviço e reserve</p>
          </div>
          <ChevronRight size={16} className="text-white/40" />
        </motion.button>

        {/* Menu sections */}
        {menuSections.map((section, si) => (
          <motion.div key={section.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + si * 0.07 }}
          >
            <p className="text-[8px] font-black text-[#9B8FC0] uppercase tracking-[0.28em] mb-2 px-1">
              {section.title}
            </p>
            <div className="bg-white rounded-2xl border border-[#EDE5FF] overflow-hidden divide-y divide-[#FAF8FF]">
              {section.items.map((item, ii) => (
                <button key={ii}
                  onClick={() => item.href ? router.push(item.href) : toast.info("Em breve! 🚀")}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 active:bg-[#FAF8FF] transition-colors text-left group"
                >
                  <div className={cn(
                    "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    item.accent ? "bg-[#1E1A2E]" : "bg-[#F0EBFF]"
                  )}>
                    <item.icon size={15} className={cn(
                      "transition-colors",
                      item.accent ? "text-[#9D7FD4]" : "text-[#7C5CBF]"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#1E1A2E]">{item.label}</p>
                    <p className="text-[10px] text-[#9B8FC0] mt-0.5">{item.sub}</p>
                  </div>
                  {"badge" in item && item.badge ? (
                    <span className="text-[8px] font-black text-[#9D7FD4] bg-[#EDE5FF] px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight size={14} className="text-[#DDD5F5] shrink-0" />
                  )}
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
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-red-50 border border-red-100 active:bg-red-100 transition-colors group"
        >
          <div className="h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <LogOut size={15} className="text-red-500" />
          </div>
          <span className="text-[13px] font-bold text-red-600 flex-1 text-left">Sair da conta</span>
          <ChevronRight size={14} className="text-red-300" />
        </motion.button>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 pt-1 pb-2 opacity-20">
          <div className="h-px w-8 bg-[#DDD5F5]" />
          <span className="text-[8px] font-black uppercase tracking-[0.5em] text-[#9D7FD4]"
            style={{ fontFamily: "Georgia,serif", fontStyle: "italic" }}>nailit</span>
          <div className="h-px w-8 bg-[#DDD5F5]" />
        </div>
      </div>
    </div>
  );
}
