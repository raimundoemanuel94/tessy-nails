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
  const [loading, setLoading]   = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName]         = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const supabase = createClient();

    if (isRegister) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { name: name || email.split("@")[0] } },
      });
      if (error) { toast.error(error.message); setLoading(false); return; }
      toast.success("Conta criada! Verifique seu e-mail.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error("E-mail ou senha incorretos."); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--brand)" }}>
            <Scissors size={28} color="#fff" />
          </div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Nailit</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>ERP para Manicures</p>
        </div>

        <div className="card">
          <h2 className="text-base font-black mb-6" style={{ color: "var(--text)" }}>
            {isRegister ? "Criar conta" : "Entrar"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {isRegister && (
              <input className="input-base" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} />
            )}
            <input className="input-base" type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="input-base" type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : isRegister ? "Criar conta" : "Entrar"}
            </button>
          </form>
          <button onClick={() => setIsRegister(v => !v)} className="w-full text-center text-xs mt-4" style={{ color: "var(--muted)" }}>
            {isRegister ? "Já tenho conta → Entrar" : "Não tenho conta → Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}
