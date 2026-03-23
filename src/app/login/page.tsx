"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  CheckCircle2, 
  Fingerprint
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// --- Components ---

const SplashLoader = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2800); // 2.8s for a more luxurious experience
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0, 
        transition: { duration: 1, ease: [0.22, 1, 0.36, 1] } 
      }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF9F6] dark:bg-slate-950 overflow-hidden"
    >
      {/* Animated Immersive Ambient Background */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1.1, 1.3, 1],
            opacity: [0.3, 0.5, 0.4, 0.6, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-primary/10 rounded-full blur-[140px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1.2, 1.4, 1],
            opacity: [0.2, 0.4, 0.3, 0.5, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-secondary/10 rounded-full blur-[140px]" 
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-12">
        {/* Animated Brand Container */}
        <div className="relative">
          {/* Outer Magnetic Glow */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-brand-primary/20 blur-[60px] rounded-full"
          />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30, rotate: -5 }}
            animate={{ 
              scale: 1,
              opacity: 1,
              y: 0,
              rotate: 0
            }}
            transition={{ 
              duration: 1.5, 
              ease: [0.16, 1, 0.3, 1] 
            }}
            className="relative"
          >
            <motion.div
              animate={{ 
                y: [0, -12, 0],
                rotate: [0, -2, 2, 0]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="flex flex-col items-center"
            >
              <img 
                src="/brand/logo/logo.svg" 
                alt="Tessy Nails" 
                className="h-[180px] w-auto drop-shadow-[0_30px_60px_rgba(75,46,43,0.4)]"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Dynamic Loading Message */}
        <div className="flex flex-col items-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex flex-col items-center gap-3"
          >
             <p className="text-[12px] font-black text-[#4B2E2B] dark:text-brand-accent uppercase tracking-[0.4em] text-center">
              Luxo &amp; Elegância
            </p>
            
            {/* Premium Progress Bar */}
            <div className="w-56 h-[2px] bg-brand-primary/5 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ 
                  duration: 2.8, 
                  ease: [0.44, 0, 0.56, 1] 
                }}
                className="absolute inset-0 bg-linear-to-r from-transparent via-brand-primary to-transparent w-full"
              />
            </div>
          </motion.div>

          {/* Staggered Subtext */}
          <div className="overflow-hidden">
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 0.5 }}
              transition={{ delay: 1.8, duration: 0.8 }}
              className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]"
            >
              Studio de Beleza Premium
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  
  const mode = searchParams.get('mode') || 'login';
  const isRegisterMode = mode === 'login' ? false : true;

  useEffect(() => {
    if (user && !showSplash) {
      if (user.role === 'admin' || user.role === 'professional') {
        router.push('/dashboard');
      } else {
        router.push('/cliente');
      }
    }
  }, [user, router, showSplash]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await signIn(email, password);
      if (success) {
        toast.success("Bem-vinda de volta!", {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        });
      } else {
        toast.error("Login falhou. Verifique suas credenciais.");
      }
    } catch (error: any) {
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await signUp(email, password, name);
      if (success) {
        toast.success("Conta criada! Boas-vindas à Tessy Nails.");
      } else {
        toast.error("Falha ao criar conta. Verifique os dados.");
      }
    } catch (error: any) {
      toast.error("Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const success = await signInWithGoogle();
      if (success) {
        toast.success("Acesso com Google realizado!");
      }
    } catch (error: any) {
      toast.error("Erro inesperado no login com Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashLoader onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <div className="h-dvh w-full flex flex-col items-center justify-start pt-10 sm:justify-center sm:pt-0 overflow-hidden bg-[#FAF9F6] dark:bg-slate-950 font-sans relative px-2 sm:px-6 md:px-8">
        
        {/* Immersive Background Elements */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
           <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-primary/10 dark:bg-brand-primary/5 rounded-full blur-[120px]" />
           <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-brand-secondary/10 dark:bg-brand-secondary/5 rounded-full blur-[120px]" />
           <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-primary/10 dark:bg-brand-primary/5 rounded-full blur-[100px] lg:hidden" />
           <div className="absolute top-1/2 -left-32 w-[600px] h-[600px] bg-brand-secondary/5 dark:bg-brand-secondary/5 rounded-full blur-[120px] lg:hidden" />
        </div>

        {/* Centered Login Card Container */}
        <div className="w-full flex items-center justify-center relative z-10 lg:w-[420px]">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={!showSplash ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[420px]"
          >
            <Card className="w-full border-none sm:border-solid sm:border border-brand-soft/60 dark:border-white/5 bg-transparent sm:bg-brand-background dark:bg-slate-900/60 backdrop-blur-3xl shadow-none sm:shadow-[8px_8px_16px_rgba(0,0,0,0.06),-6px_-6px_12px_rgba(255,255,255,0.8)] dark:shadow-none sm:dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-none sm:rounded-2xl overflow-hidden transition-all duration-500">
              <CardHeader className="space-y-2 sm:space-y-4 text-center pt-2 sm:pt-8 pb-2 sm:pb-4 px-2 sm:px-6 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1.5 bg-linear-to-r from-transparent via-[#4B2E2B]/30 to-transparent rounded-full" />
                
                {/* Brand Identity Inside Card */}
                <div className="flex flex-col items-center justify-center space-y-4 pb-2">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center justify-center"
                  >
                    <img src="/brand/logo/logo.svg" alt="Tessy Nails" className="h-[90px] sm:h-[120px] w-auto drop-shadow-sm" />
                  </motion.div>
                  
                  {/* Decorative Sparkle Divider */}
                  <div className="flex items-center gap-4 w-full justify-center opacity-20">
                    <div className="h-px w-8 bg-brand-primary" />
                    <Sparkles className="h-3 w-3 text-brand-primary fill-brand-primary" />
                    <div className="h-px w-8 bg-brand-primary" />
                  </div>
                </div>

                <div className="pt-1">
                  <CardTitle className="text-3xl font-serif font-bold text-brand-primary tracking-tight">
                    {isRegisterMode ? "Bem-vinda" : "Boas-vindas"}
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold text-brand-text-sub dark:text-slate-500 uppercase tracking-[0.2em] mt-2 leading-relaxed">
                    {isRegisterMode ? "Sua experiência de beleza começa aqui" : "Sua jornada luxuosa continua"}
                  </CardDescription>
                </div>
              </CardHeader>

              <form onSubmit={isRegisterMode ? handleEmailRegister : handleEmailLogin}>
                <CardContent className="space-y-2.5 px-2 sm:px-8">
                  <AnimatePresence mode="wait">
                    {isRegisterMode && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1.5"
                      >
                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400 dark:text-slate-500">Nome Completo</Label>
                        <div className="relative group">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={18} />
                           <Input 
                            id="name" 
                            type="text" 
                            placeholder="Como podemos te chamar?" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required 
                            className="h-12 sm:h-14 pl-12 rounded-xl bg-white/50 sm:bg-brand-background dark:bg-slate-950/30 border-white/80 dark:border-white/5 sm:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.04),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] shadow-sm dark:shadow-none font-bold text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400 dark:text-slate-500">Endereço de E-mail</Label>
                    <div className="relative group">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={18} />
                       <Input 
                        id="email" 
                        type="email" 
                        placeholder="seu@melhor-email.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                        className="h-12 sm:h-14 pl-12 rounded-xl bg-white/50 sm:bg-brand-background dark:bg-slate-950/30 border-white/80 dark:border-white/5 sm:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.04),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] shadow-sm dark:shadow-none font-bold text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400 dark:text-slate-500">Senha Segura</Label>
                    <div className="relative group">
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={18} />
                       <Input 
                        id="password" 
                        type="password" 
                        placeholder="Sua senha secreta" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                        autoComplete="current-password"
                        minLength={6}
                        className="h-12 sm:h-14 pl-12 rounded-xl bg-white/50 sm:bg-brand-background dark:bg-slate-950/30 border-white/80 dark:border-white/5 sm:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.04),inset_-4px_-4px_8px_rgba(255,255,255,0.8)] shadow-sm dark:shadow-none font-bold text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                      />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-2.5 px-2 sm:px-8 pb-4 sm:pb-8 pt-1">
                  <Button 
                    type="submit" 
                    className="w-full h-12 sm:h-14 rounded-2xl bg-linear-to-br from-brand-primary to-brand-secondary text-white font-black uppercase tracking-[0.2em] shadow-[4px_4px_10px_rgba(75,46,43,0.25)] sm:shadow-[6px_6px_14px_rgba(75,46,43,0.25),-4px_-4px_10px_rgba(255,255,255,0.8)] transition-all duration-300 hover:opacity-90 hover:shadow-[8px_8px_20px_rgba(75,46,43,0.35)] active:scale-[0.97] py-0" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Entrando...</span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        {isRegisterMode ? "Confirmar" : "Entrar Agora"}
                        <ArrowRight size={20} className="ml-1" />
                      </span>
                    )}
                  </Button>
                  
                  <div className="flex flex-col items-center w-full gap-3">
                    <button
                      type="button"
                      onClick={() => router.push(isRegisterMode ? '/login' : '/login?mode=register')}
                      className="text-[11px] font-black text-slate-400 dark:text-slate-500 hover:text-brand-primary dark:hover:text-brand-accent transition-colors uppercase tracking-[0.25em]"
                    >
                      {isRegisterMode 
                        ? "Já tem conta? Entrar" 
                        : "Não tem conta? Crie agora"
                      }
                    </button>

                    <div className="relative w-full flex items-center gap-3 py-1">
                      <div className="h-px bg-slate-200 dark:bg-white/5 grow" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-600">Ou</span>
                      <div className="h-px bg-slate-200 dark:bg-white/5 grow" />
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleLogin}
                      className="w-full h-11 sm:h-14 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-800/50 font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md flex items-center justify-center gap-3"
                      disabled={loading}
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                      <span>Google</span>
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={!showSplash ? { opacity: 1 } : {}}
              className="mt-4 flex items-center justify-center gap-2 opacity-40 pb-4"
            >
               <Fingerprint size={16} className="text-slate-400" />
               <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">
                 Acesso Seguro & Criptografado
               </p>
            </motion.div>
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
