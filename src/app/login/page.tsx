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
  Star, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  CheckCircle2, 
  Fingerprint
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Components ---

const SplashLoader = ({ onComplete }: { onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000); // 3s for a truly immersive build-up
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-slate-950 overflow-hidden"
    >
      {/* Animated Background Gradient - Ultra Slow & Subtle */}
      <motion.div 
        animate={{ 
          backgroundColor: ["rgba(250, 247, 245, 0.5)", "rgba(243, 239, 239, 0.5)", "rgba(250, 247, 245, 0.5)"],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 dark:hidden"
      />
      <motion.div 
        animate={{ 
          backgroundColor: ["rgba(30, 27, 75, 0.2)", "rgba(46, 16, 101, 0.2)", "rgba(30, 27, 75, 0.2)"],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 hidden dark:block"
      />

      {/* Stronger Glow Behind Icon */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/20 dark:bg-brand-secondary/10 rounded-full blur-[140px]" 
        />
      </div>

      <div className="relative flex flex-col items-center gap-10">
        {/* Animated Brand Icon - Premium Sequence */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotate: -5 }}
          animate={{ 
            scale: [0.7, 1.05, 1],
            opacity: 1,
            rotate: [5, -2, 0],
          }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 2, 0, -2, 0]
            }}
            transition={{ 
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-28 h-28 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-[0_20px_50px_rgba(75,46,43,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center justify-center ring-1 ring-brand-primary/10 relative z-10"
          >
            <Sparkles className="text-brand-primary drop-shadow-[0_0_15px_rgba(75,46,43,0.3)]" size={56} />
          </motion.div>
          
          {/* Enhanced Pulsing Glow Rings */}
          <motion.div 
            animate={{ scale: [1, 1.8, 2.2], opacity: [0.6, 0.2, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeOut" }}
            className="absolute inset-0 rounded-[2.5rem] bg-brand-primary/40 blur-2xl"
          />
          <motion.div 
            animate={{ scale: [1, 1.4, 1.7], opacity: [0.4, 0.1, 0] }}
            transition={{ repeat: Infinity, duration: 2.5, delay: 0.8, ease: "easeOut" }}
            className="absolute inset-0 rounded-[2.5rem] bg-brand-accent/30 blur-xl"
          />
        </motion.div>

        {/* Brand Name & Message - Staggered Entry */}
        <div className="space-y-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
            className="text-3xl font-black text-slate-900 dark:text-white tracking-[0.4em] uppercase italic"
          >
            TESSY<span className="text-brand-primary">NAILS</span>
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex flex-col items-center gap-4"
          >
             <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
              Preparando sua experiência...
            </p>
            
            {/* Shimmer Loading Bar */}
            <div className="w-48 h-1 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden relative">
              <motion.div 
                animate={{ 
                  x: ["-100%", "100%"] 
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2, 
                  ease: [0.44, 0, 0.56, 1] 
                }}
                className="absolute inset-0 bg-linear-to-r from-transparent via-brand-primary to-transparent w-full"
              />
            </div>
          </motion.div>
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

      <div className="min-h-[100dvh] w-full flex overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans relative">
        {/* Decorative Background for Desktop */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden hidden lg:block">
           <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-primary/10 dark:bg-brand-primary/5 rounded-full blur-[120px]" />
           <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-brand-secondary/10 dark:bg-brand-secondary/5 rounded-full blur-[120px]" />
        </div>

        {/* Left Pane: Branding & Motivation (Visible only on Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className="relative z-10 w-full flex flex-col justify-between p-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={!showSplash ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center ring-1 ring-brand-primary/10">
                <Sparkles className="text-brand-primary" size={28} />
              </div>
              <span className="text-3xl font-black text-brand-text dark:text-white tracking-[0.2em] uppercase italic">TESSY<span className="text-brand-primary">NAILS</span></span>
            </motion.div>

            <div className="flex-1 flex flex-col justify-center max-w-lg space-y-8">
               <motion.div
                 initial={{ opacity: 0, y: 30 }}
                 animate={!showSplash ? { opacity: 1, y: 0 } : {}}
                 transition={{ delay: 0.2, duration: 1 }}
               >
                 <h2 className="text-6xl font-black text-brand-text dark:text-white leading-[1.1] tracking-tight">
                    Sua beleza, <br />
                    <span className="text-brand-primary">sua agenda,</span> <br />
                    seu momento.
                 </h2>
                 <p className="mt-6 text-xl text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                    Entre e descubra por que centenas de mulheres escolhem a Tessy Nails para seus momentos de cuidado.
                 </p>
               </motion.div>

               {/* Social Proof */}
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={!showSplash ? { opacity: 1 } : {}}
                 transition={{ delay: 0.5, duration: 1 }}
                 className="flex flex-col gap-4"
               >
                 <div className="flex -space-x-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-950 bg-slate-200 overflow-hidden ring-1 ring-slate-100 dark:ring-white/5">
                        <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="Satisfied Customer" />
                      </div>
                    ))}
                    <div className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-950 bg-brand-primary flex items-center justify-center font-bold text-xs text-white">
                      +500
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-brand-accent fill-brand-accent" />)}
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                      Nota máxima das clientes
                    </span>
                 </div>
               </motion.div>
            </div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={!showSplash ? { opacity: 1 } : {}}
              className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]"
            >
              © 2024 Tessy Nails Studio. Todos os direitos reservados.
            </motion.p>
          </div>
        </div>

        {/* Right Pane: Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12 relative">
          {/* Immersive Mobile Background Elements */}
          <div className="absolute inset-0 overflow-hidden lg:hidden pointer-events-none">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-primary/10 dark:bg-brand-primary/5 rounded-full blur-[100px]" />
            <div className="absolute top-1/2 -left-32 w-[600px] h-[600px] bg-brand-secondary/5 dark:bg-brand-secondary/5 rounded-full blur-[120px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={!showSplash ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md z-10"
          >
            {/* Mobile Brand Identity */}
            <div className="text-center mb-10 lg:hidden flex flex-col items-center">
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="w-16 h-16 rounded-[1.5rem] bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center mb-4 ring-1 ring-brand-primary/10"
               >
                 <Sparkles className="text-brand-primary" size={32} />
               </motion.div>
               <h2 className="text-2xl font-black text-brand-text dark:text-white tracking-[0.2em] uppercase italic">TESSY<span className="text-brand-primary">NAILS</span></h2>
               <p className="mt-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic opacity-60">Sua beleza, sua agenda, seu momento.</p>
            </div>

            <Card className="border-brand-primary/20 dark:border-white/5 bg-white/70 dark:bg-slate-900/60 backdrop-blur-3xl shadow-[0_20px_50px_rgba(75,46,43,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden transition-all duration-500">
              <CardHeader className="space-y-2 text-center pt-12 pb-8 px-8 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1.5 bg-linear-to-r from-transparent via-brand-primary/30 to-transparent rounded-full" />
                <CardTitle className="text-4xl font-black text-brand-text dark:text-white tracking-tighter">
                  {isRegisterMode ? "Bem-vinda" : "Boas-vindas"}
                </CardTitle>
                <CardDescription className="text-xs font-black text-textSub dark:text-slate-500 uppercase tracking-[0.2em]">
                  {isRegisterMode ? "Crie sua conta de beleza hoje" : "Continue sua jornada luxuosa"}
                </CardDescription>
              </CardHeader>

              <form onSubmit={isRegisterMode ? handleEmailRegister : handleEmailLogin}>
                <CardContent className="space-y-6 px-4 sm:px-10">
                  <AnimatePresence mode="wait">
                    {isRegisterMode && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2"
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
                            className="h-14 pl-12 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border-slate-200/50 dark:border-white/5 font-bold text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="space-y-2">
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
                        className="h-14 pl-12 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border-slate-200/50 dark:border-white/5 font-bold text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
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
                        className="h-14 pl-12 rounded-2xl bg-slate-50/50 dark:bg-slate-950/30 border-slate-200/50 dark:border-white/5 font-bold text-sm focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                      />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-6 px-4 sm:px-10 pb-12 pt-6">
                  <Button 
                    type="submit" 
                    className="w-full h-15 rounded-2xl bg-linear-to-br from-brand-primary to-brand-secondary hover:opacity-90 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-primary/25 transition-all duration-300 hover:shadow-brand-primary/40 hover:-translate-y-1 active:scale-95 py-0" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Entrando...</span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2">
                        {isRegisterMode ? "Confirmar Cadastro" : "Entrar Agora"}
                        <ArrowRight size={20} className="ml-1" />
                      </span>
                    )}
                  </Button>
                  
                  <div className="flex flex-col items-center gap-4">
                    <button
                      type="button"
                      onClick={() => router.push(isRegisterMode ? '/login' : '/login?mode=register')}
                      className="text-[11px] font-black text-slate-400 dark:text-slate-500 hover:text-brand-primary dark:hover:text-brand-accent transition-colors uppercase tracking-[0.25em]"
                    >
                      {isRegisterMode 
                        ? "Já tem uma conta? Clique para entrar" 
                        : "Não tem conta? Crie em segundos"
                      }
                    </button>

                    <div className="relative w-full flex items-center gap-4 py-2">
                      <div className="h-px bg-slate-100 dark:bg-white/5 grow" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-600">Ou</span>
                      <div className="h-px bg-slate-100 dark:bg-white/5 grow" />
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleLogin}
                      className="w-full h-14 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md flex items-center justify-center gap-3"
                      disabled={loading}
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                      Entrar com Google
                    </Button>
                  </div>
                </CardFooter>
              </form>
            </Card>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={!showSplash ? { opacity: 1 } : {}}
              className="mt-8 flex items-center justify-center gap-4 opacity-40 lg:hidden"
            >
               <Fingerprint size={20} className="text-slate-400" />
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
