"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2,
  ArrowRight,
  Mail,
  Lock,
  User,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const ADMIN_ROOTS = [
  "/dashboard",
  "/agenda",
  "/agendamentos",
  "/clientes",
  "/servicos",
  "/relatorios",
  "/configuracoes",
] as const;

function isAdminRole(role: string): boolean {
  return role === "admin" || role === "professional" || role === "superadmin";
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_ROOTS.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isClientPath(pathname: string): boolean {
  return pathname === "/cliente" || pathname.startsWith("/cliente/");
}

function parseSafeInternalNext(nextValue: string | null): { pathname: string; fullPath: string } | null {
  if (!nextValue) return null;
  if (!nextValue.startsWith("/") || nextValue.startsWith("//")) return null;

  try {
    const parsedUrl = new URL(nextValue, "http://localhost");
    if (parsedUrl.origin !== "http://localhost") return null;
    return {
      pathname: parsedUrl.pathname,
      fullPath: `${parsedUrl.pathname}${parsedUrl.search}`,
    };
  } catch {
    return null;
  }
}

function resolvePostLoginTarget(role: string, nextValue: string | null): string {
  const parsedNext = parseSafeInternalNext(nextValue);
  const adminRole = isAdminRole(role);

  if (parsedNext) {
    if (adminRole && isAdminPath(parsedNext.pathname)) return parsedNext.fullPath;
    if (!adminRole && isClientPath(parsedNext.pathname)) return parsedNext.fullPath;
  }

  if (role === "superadmin") return "/admin";
  return adminRole ? "/dashboard" : "/cliente";
}

// ── Splash Nailit ─────────────────────────────────────────────────────────
const SplashLoader = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    // 2s — rápido, não frustra o usuário
    const t = setTimeout(onComplete, 1000);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "#0A0818" }}
    >
      {/* Glow de fundo */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, #1E0A38 0%, #0A0818 70%)" }} />

      {/* Partículas leves */}
      {[
        { x:"15%", y:"20%", s:18, d:0   },
        { x:"80%", y:"15%", s:12, d:0.3 },
        { x:"20%", y:"75%", s:14, d:0.6 },
        { x:"78%", y:"70%", s:20, d:0.2 },
      ].map((p,i) => (
        <motion.span key={i}
          className="absolute select-none pointer-events-none text-[#9D7FD4]"
          style={{ left: p.x, top: p.y, fontSize: p.s, fontFamily:"serif" }}
          animate={{ y: [0,-10,0], opacity: [0.1,0.4,0.1] }}
          transition={{ duration: 3, repeat: Infinity, ease:"easeInOut", delay: p.d }}
        >✦</motion.span>
      ))}

      {/* Centro — tudo centralizado */}
      <div className="relative z-10 flex flex-col items-center gap-8">

        {/* Ícone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Glow */}
          <div className="absolute inset-0 rounded-[32px] blur-xl opacity-50"
            style={{ background: "rgba(157,127,212,0.4)", transform: "scale(1.3)" }} />
          {/* Ícone */}
          <div className="relative h-24 w-24 rounded-[28px] flex items-center justify-center overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #2A1A50, #150E30)",
              border: "1.5px solid rgba(157,127,212,0.3)",
              boxShadow: "0 16px 48px rgba(124,92,191,0.4)",
            }}>
            <img src="/brand/nailit/icon.svg" alt="nailit"
              className="h-[72px] w-[72px] object-contain" />
          </div>
        </motion.div>

        {/* Logo wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-3"
        >
          <img src="/brand/nailit/logo-dark.svg" alt="nailit" className="h-9 w-auto" />
          <motion.div
            initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="h-px w-24 rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, #9D7FD4, transparent)" }}
          />
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }}
            transition={{ delay: 0.9 }}
            className="text-[9px] font-bold uppercase tracking-[0.5em] text-[#9D7FD4]"
          >
            Agende. Apareça. Brilhe.
          </motion.p>
        </motion.div>

        {/* Loading dots simples */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex gap-1.5"
        >
          {[0,1,2].map(i => (
            <motion.div key={i}
              className="h-1 rounded-full bg-[#9D7FD4]"
              animate={{ width: ["5px","16px","5px"], opacity:[0.3,1,0.3] }}
              transition={{ duration: 1, repeat: Infinity, ease:"easeInOut", delay: i*0.15 }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

// ── stagger helper ──────────────────────────────────────────────────────
function fadeUp(i: number, visible: boolean) {
  return {
    initial: { opacity: 0, y: 18 },
    animate: visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { delay: i * 0.09, duration: 0.55, ease: "easeOut" as const },
  };
}

// ── Login form ──────────────────────────────────────────────────────────
function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, signInWithGoogle, signInWithApple, resetPassword, user, loading: authLoading, firestoreLoaded } = useAuth();

  const isRegisterMode = searchParams.get("mode") === "register";
  const nextParam = searchParams.get("next");
  // Pula o splash se já foi exibido nesta sessão (PWA / visita repetida)
  const [showSplash, setShowSplash] = useState(
    () => {
      if (typeof window === "undefined") return false;
      if (user) return false;
      // Splash aparece uma vez por sessão do browser
      // sessionStorage é limpo quando fecha o app/aba (correto para PWA)
      try {
        return !sessionStorage.getItem("nailit_splash_v2");
      } catch {
        return true;
      }
    }
  );

  useEffect(() => {
    if (!user || authLoading) return;

    const SUPERADMIN_EMAILS = [
      "raimundoemanuel94@gmail.com",
      "raiiimundoemanuel2018@gmail.com",
    ];

    // Se é email de superadmin → vai para /admin imediatamente sem esperar Firestore
    if (SUPERADMIN_EMAILS.includes(user.email ?? "")) {
      router.replace("/admin");
      return;
    }

    // Para outros usuários, aguardar Firestore carregar o role correto
    if (!firestoreLoaded) return;

    const targetPath = resolvePostLoginTarget(user.role, nextParam);
    router.replace(targetPath);
  }, [user, authLoading, firestoreLoaded, router, nextParam]);

  const buildModeToggleUrl = (registerMode: boolean): string => {
    const params = new URLSearchParams();
    if (registerMode) params.set("mode", "register");
    if (nextParam) params.set("next", nextParam);
    const queryString = params.toString();
    return queryString ? `/login?${queryString}` : "/login";
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { ok, error } = await signIn(email, password);
      if (ok) toast.success("Bem-vinda de volta! ✨");
      else toast.error(error ?? "Credenciais inválidas.");
    } catch { toast.error("Erro ao entrar. Tente novamente."); }
    finally { setLoading(false); }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { ok, error } = await signUp(email, password, name);
      if (ok) toast.success("Conta criada! Boas-vindas ✨");
      else toast.error(error ?? "Falha ao criar conta.");
    } catch { toast.error("Erro ao criar conta."); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { ok, error } = await signInWithGoogle();
      if (!ok) {
        toast.error(error ?? "Erro no login com Google.");
        setLoading(false);
      }
      // No mobile com redirect, a página vai embora — não setar loading(false)
      // O loading some quando o app volta do redirect
    } catch {
      toast.error("Erro no login com Google.");
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      const { ok, error } = await signInWithApple();
      if (!ok) toast.error(error ?? "Erro no login com Apple.");
    } catch { toast.error("Erro no login com Apple."); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Digite seu e-mail primeiro.");
      return;
    }

    setLoading(true);
    try {
      const ok = await resetPassword(email);
      if (ok) {
        toast.success("E-mail enviado!", {
          description: "Verifique sua caixa de entrada.",
        });
      } else {
        toast.error("NÃ£o foi possÃ­vel enviar o e-mail.");
      }
    } catch {
      toast.error("Erro ao enviar e-mail de recuperaÃ§Ã£o.");
    } finally {
      setLoading(false);
    }
  };

  const visible = !showSplash;

  return (
    <>
      <AnimatePresence>{showSplash && <SplashLoader onComplete={() => { try { sessionStorage.setItem("nailit_splash_v2","1"); } catch {} setShowSplash(false); }} />}</AnimatePresence>

      <div className="relative min-h-dvh w-full flex flex-col items-center justify-center px-5 py-10 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #FAF8FF 0%, #F0EBFF 50%, #EDE5FF 100%)" }}>

        {/* Orbs de fundo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-20 h-96 w-96 rounded-full opacity-50"
            style={{ background: "radial-gradient(circle, rgba(157,127,212,0.25) 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full opacity-40"
            style={{ background: "radial-gradient(circle, rgba(124,92,191,0.20) 0%, transparent 70%)", filter: "blur(60px)" }} />
          {/* Grade pontilhada sutil */}
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #9D7FD4 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        </div>

        <div className="relative z-10 w-full max-w-[390px] flex flex-col items-center gap-6">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.92 }}
            animate={visible ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-3"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-40"
                style={{ background: "radial-gradient(circle, rgba(157,127,212,0.5) 0%, transparent 70%)", transform: "scale(1.6)" }} />
              <img src="/brand/nailit/logo.svg" alt="nailit" className="relative h-16 w-auto drop-shadow-lg" />
            </div>

            {/* Linha ornamental */}
            <div className="flex items-center gap-3">
              <div className="h-px w-10" style={{ background: "linear-gradient(90deg, transparent, #9D7FD4)" }} />
              <svg width="8" height="8" viewBox="0 0 8 8"><path d="M4 0L4.6 3L8 4L4.6 5L4 8L3.4 5L0 4L3.4 3Z" fill="#9D7FD4"/></svg>
              <div className="h-px w-10" style={{ background: "linear-gradient(90deg, #9D7FD4, transparent)" }} />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.08, duration: 0.7 }}
            className="text-center space-y-1.5"
          >
            <h1 className="text-[2.1rem] font-black tracking-tight leading-none text-[#1E1A2E]">
              {isRegisterMode ? "Bem-vinda ✨" : "Boas-vindas 💜"}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#9D7FD4]">
              {isRegisterMode ? "Crie sua conta grátis" : "Agende. Apareça. Brilhe."}
            </p>
          </motion.div>

          {/* Card do formulário */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.14, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="w-full rounded-[28px] overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(32px)",
              border: "1px solid rgba(157,127,212,0.2)",
              boxShadow: "0 12px 48px rgba(30,26,46,0.10), 0 1px 0 rgba(255,255,255,1) inset",
            }}
          >
            <form onSubmit={isRegisterMode ? handleEmailRegister : handleEmailLogin} className="p-6 space-y-4">

              {/* Nome (só no cadastro) */}
              <AnimatePresence mode="wait">
                {isRegisterMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[10px] font-black uppercase tracking-[0.22em] pl-1 text-[#9D7FD4]">Nome</label>
                    <div className="relative">
                      <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9D7FD4] opacity-50" />
                      <Input type="text" autoComplete="name" placeholder="Como te chamamos?" value={name}
                        onChange={e => setName(e.target.value)} required
                        className="h-12 pl-10 rounded-2xl text-sm font-semibold bg-[#FAF8FF] border-[#DDD5F5] focus:border-[#9D7FD4] focus:ring-[#9D7FD4]/20" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <motion.div {...fadeUp(0, visible)} className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] pl-1 text-[#9D7FD4]">E-mail</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9D7FD4] opacity-50" />
                  <Input type="email" placeholder="seu@melhor-email.com" value={email}
                    onChange={e => setEmail(e.target.value)} required
                    className="h-12 pl-10 rounded-2xl text-sm font-semibold bg-[#FAF8FF] border-[#DDD5F5] focus:border-[#9D7FD4] focus:ring-[#9D7FD4]/20" />
                </div>
              </motion.div>

              {/* Senha */}
              <motion.div {...fadeUp(1, visible)} className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.22em] pl-1 text-[#9D7FD4]">Senha</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9D7FD4] opacity-50" />
                  <Input type="password" placeholder="Mínimo 6 caracteres" value={password}
                    onChange={e => setPassword(e.target.value)} required
                    autoComplete={isRegisterMode ? "new-password" : "current-password"}
                    minLength={6}
                    className="h-12 pl-10 rounded-2xl text-sm font-semibold bg-[#FAF8FF] border-[#DDD5F5] focus:border-[#9D7FD4] focus:ring-[#9D7FD4]/20" />
                </div>
              </motion.div>

              {/* Esqueci senha */}
              {!isRegisterMode && (
                <div className="flex justify-end -mt-1">
                  <button type="button" onClick={handleForgotPassword} disabled={loading}
                    className="text-[9px] font-black uppercase tracking-[0.2em] text-[#9D7FD4] hover:text-[#7C5CBF] transition-colors disabled:opacity-50">
                    Esqueci minha senha
                  </button>
                </div>
              )}

              {/* Botão principal */}
              <motion.div {...fadeUp(2, visible)}>
                <Button type="submit" disabled={loading}
                  className="w-full h-[52px] rounded-2xl font-black text-xs text-white uppercase tracking-[0.2em] border-0 active:scale-[0.98] transition-all"
                  style={{
                    background: "linear-gradient(135deg, #1E1A2E 0%, #5A3F9A 55%, #9D7FD4 100%)",
                    boxShadow: "0 6px 24px rgba(124,92,191,0.35), 0 1px 0 rgba(255,255,255,0.12) inset",
                  }}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Aguarde...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      {isRegisterMode ? "Criar minha conta" : "Entrar agora"}
                      <ArrowRight size={15} />
                    </span>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Divider + Social */}
            <div className="px-6 pb-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-[#EDE5FF]" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C4B0E8]">ou</span>
                <div className="h-px flex-1 bg-[#EDE5FF]" />
              </div>

              <motion.div {...fadeUp(3, visible)}>
                <button type="button" onClick={handleGoogleLogin} disabled={loading}
                  className="w-full h-11 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-[11px] uppercase tracking-[0.15em] active:scale-[0.98] transition-all"
                  style={{ background: "#fff", border: "1.5px solid #EDE5FF", boxShadow: "0 2px 8px rgba(157,127,212,0.10)", color: "#6B6480" }}>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="h-4 w-4" />
                  Continuar com Google
                </button>
              </motion.div>

              <motion.div {...fadeUp(4, visible)}>
                <button type="button" onClick={handleAppleLogin} disabled={loading}
                  className="w-full h-11 rounded-2xl flex items-center justify-center gap-2.5 font-bold text-[11px] uppercase tracking-[0.15em] active:scale-[0.98] transition-all text-white"
                  style={{ background: "#0D0D0D", border: "1.5px solid #1A1A1A", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                  <svg width="15" height="15" viewBox="0 0 814 1000" fill="white">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-37.3-165.9-111.7c-71.6-91-131.5-236.1-131.5-374.4 0-67.5 12.8-134.4 38.4-194.6 37.4-89.3 121.1-145.8 213.3-145.8 75.6 0 127.5 38.8 160.6 38.8 31.8 0 91.3-43.2 171.5-43.2 29.3 0 108.2 2.6 168.5 79.3zm-234.4-191.1c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                  </svg>
                  Continuar com Apple
                </button>
              </motion.div>
            </div>
          </motion.div>

          {/* Toggle cadastro/login */}
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={visible ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
            onClick={() => router.push(buildModeToggleUrl(!isRegisterMode))}
            className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9D7FD4] hover:text-[#7C5CBF] transition-colors"
          >
            {isRegisterMode ? "Já tem conta? Entrar →" : "Não tem conta? Crie grátis →"}
          </motion.button>

          {/* Segurança */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={visible ? { opacity: 0.25 } : {}}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-2"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9D7FD4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#9D7FD4]">Acesso seguro & criptografado</p>
          </motion.div>

        </div>
      </div>
    </>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

