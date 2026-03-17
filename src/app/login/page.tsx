"use client";

import { useState, useEffect, Suspense } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, UserPlus, Scissors, Sparkles, Heart, Star, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  
  // ✅ Determinar modo (login ou cadastro)
  const mode = searchParams.get('mode') || 'login';
  const isRegisterMode = mode === 'register';

  useEffect(() => {
    // ✅ useAuth() movido para fora do useEffect
    if (user) {
      if (user.role === 'admin' || user.role === 'professional') {
        router.push('/dashboard');
      } else {
        router.push('/cliente');
      }
    }
  }, [user, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Attempting login with:', { email, password });
      const success = await signIn(email, password);
      console.log('Login result:', success);
      if (success) {
        toast.success("Login realizado com sucesso!");
        // ✅ AuthContext vai redirecionar automaticamente
      } else {
        toast.error("Login falhou. Verifique suas credenciais.");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error("Erro ao fazer login: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Attempting register with:', { name, email, password });
      const success = await signUp(email, password, name);
      console.log('Register result:', success);
      if (success) {
        toast.success("Conta criada com sucesso!");
        // ✅ AuthContext vai redirecionar automaticamente
      } else {
        toast.error("Falha ao criar conta. Verifique os dados.");
      }
    } catch (error: any) {
      console.error('Register error:', error);
      toast.error("Erro ao criar conta: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const success = await signInWithGoogle();
      if (success) {
        toast.success("Login com Google realizado!");
      } else {
        toast.error("Erro ao fazer login com Google.");
      }
    } catch (error: any) {
      console.error("Google Login Error:", error);
      toast.error("Erro inesperado no login com Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans relative">
      {/* Left Pane: Nail Gallery & Branding (Visible only on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-linear-to-br from-violet-50 via-fuchsia-50 to-purple-50 dark:bg-slate-900 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-violet-300/30 dark:bg-violet-900/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-fuchsia-300/30 dark:bg-purple-900/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full flex flex-col justify-between p-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center ring-1 ring-violet-500/10">
              <Sparkles className="text-violet-600" size={24} />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white tracking-[0.2em] uppercase italic">TESSY<span className="text-violet-600">NAILS</span></span>
          </motion.div>

          {/* Nail Gallery - 3 Images */}
          <div className="flex-1 flex items-center justify-center py-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="grid grid-cols-2 gap-4 max-w-lg"
            >
              {/* Image 1 - Large */}
              <div className="col-span-2 h-64 rounded-3xl overflow-hidden shadow-2xl shadow-violet-500/20 ring-1 ring-white/20">
                <img 
                  src="https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop" 
                  alt="Nail art design" 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                />
              </div>
              {/* Image 2 */}
              <div className="h-48 rounded-3xl overflow-hidden shadow-2xl shadow-fuchsia-500/20 ring-1 ring-white/20">
                <img 
                  src="https://images.unsplash.com/photo-1610992015732-2449b76344bc?q=80&w=800&auto=format&fit=crop" 
                  alt="Manicure service" 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                />
              </div>
              {/* Image 3 */}
              <div className="h-48 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/20 ring-1 ring-white/20">
                <img 
                  src="https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=800&auto=format&fit=crop" 
                  alt="Nail polish colors" 
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                />
              </div>
            </motion.div>
          </div>

          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.6, duration: 1 }}
             className="flex items-center justify-between"
          >
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 overflow-hidden ring-4 ring-violet-500/10">
                  <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                </div>
              ))}
            </div>
            <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="text-violet-500 fill-violet-500" size={16} /> 
              +500 Clientes Satisfeitas
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Pane: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 md:p-12 relative bg-transparent">
        {/* Dynamic Mobile Background */}
        <div className="absolute inset-0 overflow-hidden lg:hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-500/30 dark:bg-violet-600/20 rounded-full blur-[80px] animate-pulse" />
          <div className="absolute top-1/2 -left-32 w-96 h-96 bg-fuchsia-500/30 dark:bg-fuchsia-600/20 rounded-full blur-[80px]" style={{ animationDelay: '2s' }} />
          <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-purple-500/30 dark:bg-purple-600/20 rounded-full blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md z-10 relative"
        >
          <div className="text-center mb-10 lg:hidden flex flex-col items-center">
             <div className="w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center mb-4 ring-1 ring-violet-500/10">
               <Sparkles className="text-violet-600" size={32} />
             </div>
             <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-[0.2em] uppercase italic">TESSY<span className="text-violet-600">NAILS</span></h2>
          </div>

          <Card className="relative border border-white/40 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_16px_48px_rgba(139,92,246,0.25)]">
            {/* Glass Reflection */}
            <div className="absolute inset-0 bg-linear-to-br from-white/50 via-white/5 to-transparent dark:from-white/10 dark:via-transparent dark:to-transparent pointer-events-none" />
            
            <CardHeader className="space-y-2 text-center pt-10 pb-6 px-4 sm:px-8 relative z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-linear-to-r from-transparent via-violet-500 to-transparent opacity-50 shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
              <CardTitle className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-1 drop-shadow-sm">
                {isRegisterMode ? "Bem-vinda" : "Boas-vindas"}
              </CardTitle>
              <CardDescription className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4">
                {isRegisterMode ? "Crie sua conta e comece sua jornada" : "Continue de onde parou"}
              </CardDescription>
            </CardHeader>
            <form onSubmit={isRegisterMode ? handleEmailRegister : handleEmailLogin}>
              <CardContent className="space-y-6 px-8">
                {/* Campos com novo estilo */}
                <AnimatePresence mode="wait">
                  {isRegisterMode && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Nome Completo</Label>
                      <div className="relative group">
                        <Input 
                          id="name" 
                          type="text" 
                          placeholder="Como podemos te chamar?" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required 
                          autoComplete="name"
                          className="h-14 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-inner px-4 font-semibold text-slate-900 dark:text-white transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-800/70 focus:bg-white/80 dark:focus:bg-slate-800/80 focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 lg:text-sm text-base"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Endereço de Email</Label>
                  <div className="relative group">
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="seu@melhor-email.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                      autoComplete="username"
                      className="h-14 rounded-2xl bg-white/50 dark:bg-slate-800/50 border-slate-200/60 dark:border-white/5 px-4 font-semibold text-slate-900 dark:text-white transition-all focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" title="Mínimo 6 caracteres" className="text-[10px] font-black uppercase tracking-widest ml-1 text-slate-400">Senha Segura</Label>
                  <div className="relative group">
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      autoComplete="current-password"
                      minLength={6}
                      className="h-14 rounded-2xl bg-white/50 dark:bg-slate-800/50 border-slate-200/60 dark:border-white/5 px-4 font-semibold text-slate-900 dark:text-white transition-all focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500"
                    />
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col space-y-6 px-8 pb-10">
                <Button type="submit" className="w-full h-14 rounded-2xl bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-black uppercase tracking-widest shadow-[0_8px_20px_rgba(139,92,246,0.3)] transition-all duration-300 hover:shadow-[0_12px_25px_rgba(139,92,246,0.4)] hover:-translate-y-1 active:scale-95 group border border-violet-400/30" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      {isRegisterMode ? "Criar Minha Conta" : "Entrar No Sistema"}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
                
                <div className="text-center relative group">
                  <button
                    type="button"
                    onClick={() => router.push(isRegisterMode ? '/login' : '/login?mode=register')}
                    className="text-xs font-black text-slate-400 dark:text-slate-500 hover:text-violet-600 transition-colors uppercase tracking-[0.2em]"
                  >
                    {isRegisterMode 
                      ? "Já possui acesso? Clique aqui" 
                      : "Novo por aqui? Criar conta agora"
                    }
                  </button>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-violet-500 group-hover:w-1/2 transition-all duration-300" />
                </div>
                
                <div className="relative flex items-center gap-4 py-2">
                  <div className="h-px bg-slate-100 dark:bg-white/5 grow" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-600">Ou use</span>
                  <div className="h-px bg-slate-100 dark:bg-white/5 grow" />
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full h-14 rounded-2xl border border-white/50 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-800/60 hover:shadow-lg flex items-center justify-center gap-3 relative z-10"
                  disabled={loading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Entrar com Google
                </Button>
              </CardFooter>
            </form>
          </Card>
          
          <p className="mt-8 text-center text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em]">
            © 2024 Tessy Nails Studio. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-slate-950 p-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-20 h-20 rounded-3xl bg-violet-50 dark:bg-slate-900 shadow-2xl flex items-center justify-center border border-violet-100 dark:border-violet-900/30"
          >
            <Sparkles className="text-violet-600" size={40} />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-[0.3em] uppercase italic">TESSY<span className="text-violet-600">NAILS</span></h1>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">Iniciando experiência de luxo...</p>
          </div>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
