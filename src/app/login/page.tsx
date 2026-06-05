// @ts-nocheck
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Scissors } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google"|"apple"|null>(null);
  const [isRegister, setIsRegister] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name: name || email.split("@")[0] } },
      });
      if (error) { toast.error(error.message); setLoading(false); return; }
      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error("E-mail ou senha incorretos."); setLoading(false); return; }
    router.push("/");
    router.refresh();
  }

  async function signInWithGoogle() {
    setSocialLoading("google");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { toast.error(error.message); setSocialLoading(null); }
  }

  async function signInWithApple() {
    setSocialLoading("apple");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { toast.error(error.message); setSocialLoading(null); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "var(--brand)" }}>
            <Scissors size={30} color="#fff" />
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Nailit</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>ERP para Manicures</p>
        </div>

        <div className="card space-y-4">
          <h2 className="text-base font-black" style={{ color: "var(--text)" }}>
            {isRegister ? "Criar conta" : "Entrar"}
          </h2>

          {/* Social logins */}
          <div className="flex flex-col gap-2">
            <button onClick={signInWithGoogle} disabled={!!socialLoading}
              className="flex items-center justify-center gap-3 w-full h-11 rounded-xl font-bold text-sm transition-all"
              style={{ background: "#fff", color: "#1a1a1a", border: "1px solid #e0e0e0" }}>
              {socialLoading === "google"
                ? <Loader2 size={16} className="animate-spin" />
                : <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
              }
              Continuar com Google
            </button>

            <button onClick={signInWithApple} disabled={!!socialLoading}
              className="flex items-center justify-center gap-3 w-full h-11 rounded-xl font-bold text-sm transition-all"
              style={{ background: "#000", color: "#fff", border: "1px solid #333" }}>
              {socialLoading === "apple"
                ? <Loader2 size={16} className="animate-spin" />
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
              }
              Continuar com Apple
            </button>
          </div>

          {/* Divisor */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--muted)" }}>ou</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {/* Form e-mail/senha */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {isRegister && (
              <input className="input-base" placeholder="Seu nome"
                value={name} onChange={e => setName(e.target.value)} />
            )}
            <input className="input-base" type="email" placeholder="E-mail"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="input-base" type="password" placeholder="Senha"
              value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : isRegister ? "Criar conta" : "Entrar com e-mail"}
            </button>
          </form>

          <button onClick={() => setIsRegister(v => !v)}
            className="w-full text-center text-xs" style={{ color: "var(--muted)" }}>
            {isRegister ? "Já tenho conta → Entrar" : "Não tenho conta → Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}
