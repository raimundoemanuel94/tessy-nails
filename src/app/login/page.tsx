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

// ── Splash ─────────────────────────────────────────────────────────────
const SplashLoader = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 2000);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #2a1a18 0%, #3d2420 50%, #1e1210 100%)" }}
    >
      {/* Animated orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute top-[-15%] left-[-15%] h-[50vh] w-[50vh] rounded-full"
        style={{ background: "radial-gradient(circle, #6D4C41 0%, transparent 70%)" }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[45vh] w-[45vh] rounded-full"
        style={{ background: "radial-gradient(circle, #A1887F 0%, transparent 70%)" }}
      />

      <div className="relative z-10 flex flex-col items-center gap-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* glow ring behind logo */}
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-[-24px] rounded-full blur-2xl"
            style={{ background: "radial-gradient(circle, rgba(161,136,127,0.4) 0%, transparent 70%)" }}
          />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <img
              src="/brand/logo/logo.svg"
              alt="Tessy Nails"
              className="h-[160px] w-auto"
              style={{ filter: "brightness(0) invert(1) opacity(0.92)" }}
            />
          </motion.div>
        </motion.div>

        {/* text + bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.9 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="text-[11px] font-black uppercase tracking-[0.45em] text-white/50">
            Manicure & Pedicure
          </p>
          <div className="relative h-[1px] w-40 overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2.6, ease: [0.44, 0, 0.56, 1] }}
              className="absolute inset-0"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)" }}
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40"
          >
            Studio de Beleza Premium
          </motion.p>
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
  const { signIn, signUp, signInWithGoogle, user, loading: authLoading } = useAuth();

  const isRegisterMode = searchParams.get("mode") === "register";
  const [showSplash, setShowSplash] = useState(!user);

  useEffect(() => {
    if (user && !authLoading) {
      router.push(user.role === "admin" || user.role === "professional" ? "/dashboard" : "/cliente");
    }
  }, [user, authLoading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await signIn(email, password);
      if (ok) toast.success("Bem-vinda de volta!", { icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" /> });
      else toast.error("Credenciais inválidas.");
    } catch { toast.error("Erro ao entrar. Tente novamente."); }
    finally { setLoading(false); }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = await signUp(email, password, name);
      if (ok) toast.success("Conta criada! Boas-vindas.");
      else toast.error("Falha ao criar conta.");
    } catch { toast.error("Erro ao criar conta."); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const ok = await signInWithGoogle();
      if (ok) toast.success("Acesso realizado!");
    } catch { toast.error("Erro no login com Google."); }
    finally { setLoading(false); }
  };

  const visible = !showSplash;

  return (
    <>
      <AnimatePresence>{showSplash && <SplashLoader onComplete={() => setShowSplash(false)} />}</AnimatePresence>

      {/* ── Page ── */}
      <div
        className="relative min-h-dvh w-full flex flex-col items-center justify-center px-5 py-10 overflow-hidden"
        style={{ background: "linear-gradient(170deg, #FAF7F5 0%, #F2EDE9 50%, #EDE4DE 100%)" }}
      >
        {/* decorative orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 -left-20 h-80 w-80 rounded-full opacity-40"
            style={{ background: "radial-gradient(circle, rgba(75,46,43,0.12) 0%, transparent 70%)", filter: "blur(60px)" }}
          />
          <div
            className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, rgba(109,76,65,0.1) 0%, transparent 70%)", filter: "blur(60px)" }}
          />
          {/* subtle texture lines */}
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: "repeating-linear-gradient(0deg, #4B2E2B 0px, #4B2E2B 1px, transparent 1px, transparent 40px)" }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[380px] flex flex-col items-center gap-7">

          {/* ── Brand mark ── */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={visible ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-3"
          >
            <div className="relative">
              {/* soft shadow behind logo */}
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-30"
                style={{ background: "radial-gradient(circle, #6D4C41 0%, transparent 70%)", transform: "scale(1.4)" }}
              />
              <img
                src="/brand/logo/logo.svg"
                alt="Tessy Nails"
                className="relative h-20 w-auto drop-shadow-md"
              />
            </div>

            {/* divider */}
            <div className="flex items-center gap-3 w-full justify-center">
              <div className="h-px flex-1 max-w-[40px]" style={{ background: "linear-gradient(90deg, transparent, #4B2E2B)" }} />
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 0L5.8 3.8L9.5 5L5.8 6.2L5 10L4.2 6.2L0.5 5L4.2 3.8L5 0Z" fill="#A1887F" />
              </svg>
              <div className="h-px flex-1 max-w-[40px]" style={{ background: "linear-gradient(90deg, #4B2E2B, transparent)" }} />
            </div>
          </motion.div>

          {/* ── Headline ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-center space-y-1"
          >
            <h1 className="text-[2rem] font-black tracking-tight leading-none" style={{ color: "#2a1a18" }}>
              {isRegisterMode ? "Bem-vinda" : "Boas-vindas"}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: "#9a7060" }}>
              {isRegisterMode ? "Crie sua conta exclusiva" : "Sua jornada de beleza continua"}
            </p>
          </motion.div>

          {/* ── Form card ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.18, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            <div
              className="w-full rounded-[28px] overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.75)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(75,46,43,0.08)",
                boxShadow: "0 8px 40px rgba(75,46,43,0.10), 0 1px 0 rgba(255,255,255,0.9) inset",
              }}
            >
              <form onSubmit={isRegisterMode ? handleEmailRegister : handleEmailLogin} className="p-6 space-y-3.5">
                {/* name */}
                <AnimatePresence mode="wait">
                  {isRegisterMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-1.5"
                    >
                      <label className="text-[9px] font-black uppercase tracking-[0.22em] pl-1" style={{ color: "#9a7060" }}>
                        Nome Completo
                      </label>
                      <div className="relative">
                        <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" style={{ color: "#4B2E2B" }} />
                        <Input
                          type="text"
                          placeholder="Como podemos te chamar?"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="h-12 pl-10 rounded-2xl text-sm font-semibold transition-all"
                          style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(75,46,43,0.12)" }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* email */}
                <motion.div {...fadeUp(0, visible)} className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.22em] pl-1" style={{ color: "#9a7060" }}>
                    Endereço de E-mail
                  </label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" style={{ color: "#4B2E2B" }} />
                    <Input
                      type="email"
                      placeholder="seu@melhor-email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 pl-10 rounded-2xl text-sm font-semibold transition-all"
                      style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(75,46,43,0.12)" }}
                    />
                  </div>
                </motion.div>

                {/* password */}
                <motion.div {...fadeUp(1, visible)} className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-[0.22em] pl-1" style={{ color: "#9a7060" }}>
                    Senha Segura
                  </label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" style={{ color: "#4B2E2B" }} />
                    <Input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      minLength={6}
                      className="h-12 pl-10 rounded-2xl text-sm font-semibold transition-all"
                      style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(75,46,43,0.12)" }}
                    />
                  </div>
                </motion.div>

                {/* CTA */}
                <motion.div {...fadeUp(2, visible)}>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-13 rounded-2xl font-black uppercase tracking-[0.18em] text-xs text-white transition-all active:scale-[0.98] mt-1 border-0"
                    style={{
                      background: "linear-gradient(135deg, #4B2E2B 0%, #6D4C41 100%)",
                      boxShadow: "0 4px 20px rgba(75,46,43,0.35), 0 1px 0 rgba(255,255,255,0.1) inset",
                    }}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Aguarde...</span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        {isRegisterMode ? "Criar minha conta" : "Entrar Agora"}
                        <ArrowRight size={15} />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* divider + google */}
              <div className="px-6 pb-6 space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: "rgba(75,46,43,0.08)" }} />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "#c4a99a" }}>ou</span>
                  <div className="h-px flex-1" style={{ background: "rgba(75,46,43,0.08)" }} />
                </div>

                <motion.div {...fadeUp(3, visible)}>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full h-12 rounded-2xl flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      border: "1px solid rgba(75,46,43,0.10)",
                      boxShadow: "0 2px 8px rgba(75,46,43,0.06)",
                      color: "#4B2E2B",
                    }}
                  >
                    <img
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google"
                      className="h-4 w-4"
                    />
                    Continuar com Google
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* toggle mode */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={visible ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-center"
          >
            <button
              type="button"
              onClick={() => router.push(isRegisterMode ? "/login" : "/login?mode=register")}
              className="text-[10px] font-black uppercase tracking-[0.22em] transition-colors"
              style={{ color: "#9a7060" }}
            >
              {isRegisterMode ? "Já tem conta? Entrar" : "Não tem conta? Crie agora"}
            </button>
          </motion.div>

          {/* security tag */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={visible ? { opacity: 1 } : {}}
            transition={{ delay: 0.65, duration: 0.6 }}
            className="flex items-center gap-2 pb-2"
            style={{ opacity: 0.3 }}
          >
            {/* lock icon inline svg */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4B2E2B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p className="text-[9px] font-black uppercase tracking-[0.35em]" style={{ color: "#4B2E2B" }}>
              Acesso Seguro & Criptografado
            </p>
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
