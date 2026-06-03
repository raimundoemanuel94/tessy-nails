"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getIdToken } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Database, CheckCircle2, AlertCircle,
  RefreshCw, Shield, UserPlus, Search, Sparkles,
} from "lucide-react";


// ── Setup inicial do projeto ───────────────────────────────────
function SetupInicial() {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<Record<string,string> | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const run = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const res  = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "x-setup-secret": "nailit-setup-2024" },
      });
      const data = await res.json() as { success: boolean; results?: Record<string,string>; error?: string };
      if (data.success) { setResult(data.results ?? {}); }
      else              { setError(data.error ?? "Erro"); }
    } catch (e) { setError(String(e)); }
    setLoading(false);
  };

  if (result) return (
    <div className="rounded-2xl p-5"
      style={{ background:"rgba(74,222,128,0.06)", border:"1px solid rgba(74,222,128,0.2)" }}>
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={16} className="text-emerald-400" />
        <p className="text-[13px] font-black text-emerald-400">Setup concluído!</p>
      </div>
      {Object.entries(result).map(([k, v]) => (
        <div key={k} className="flex justify-between text-[10px] py-1">
          <span className="text-white/40 capitalize">{k.replace("_"," ")}</span>
          <span className="text-white/70">{v}</span>
        </div>
      ))}
      <p className="text-[9px] text-white/20 mt-3">
        Agora feche e abra o app — você já é superadmin! ✨
      </p>
    </div>
  );

  return (
    <div className="rounded-2xl p-5 space-y-4"
      style={{ background:"rgba(157,127,212,0.08)", border:"1.5px solid rgba(157,127,212,0.3)" }}>
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background:"rgba(157,127,212,0.2)" }}>
          <Sparkles size={15} className="text-[#9D7FD4]" />
        </div>
        <div>
          <p className="text-[13px] font-black text-white">Setup inicial do Nailit</p>
          <p className="text-[9px] text-white/30 mt-0.5">
            Configura superadmin + studio da Tessy no novo projeto Firebase
          </p>
        </div>
      </div>

      <div className="space-y-2 text-[10px] text-white/40">
        {[
          `Cria /users/${SUPER_ADMIN_UID.slice(0,8)}... → role: superadmin`,
          `Cria /users/${TESSY_UID.slice(0,8)}... → role: professional`,
          `Cria /studios/${TESSY_UID.slice(0,8)}... → plano Pro 30 dias`,
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#9D7FD4] opacity-50 shrink-0" />
            <span className="font-mono">{item}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl p-3" style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)" }}>
          <p className="text-[10px] text-red-300/70 font-mono break-all">{error}</p>
        </div>
      )}

      <button onClick={run} disabled={loading}
        className="w-full h-12 rounded-xl text-[12px] font-black text-white uppercase tracking-widest disabled:opacity-40"
        style={{ background:"linear-gradient(135deg,#5A3F9A,#9D7FD4)" }}>
        {loading ? "Configurando..." : "▶ Executar Setup"}
      </button>
    </div>
  );
}

const SUPER_ADMIN_UID = "TXRAIYsikRYTahOQS8cFXji4qSb2";
const TESSY_UID       = "O1ei4o6KCehqd3bR8Bw2phPGCrU2";


// ── Seed dados da Tessy ────────────────────────────────────────
function SeedTessy() {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<Record<string,string> | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const { firebaseUser } = useAuth();

  const run = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const idToken = firebaseUser ? await getIdToken(firebaseUser) : "";
      const res  = await fetch("/api/admin/seed-tessy", {
        method: "POST",
        headers: { 
          "x-setup-secret": "nailit-setup-2024",
          "x-id-token": idToken,
        },
      });
      const data = await res.json() as { success: boolean; results?: Record<string,string>; error?: string };
      if (data.success) setResult(data.results ?? {});
      else              setError(data.error ?? "Erro");
    } catch (e) { setError(String(e)); }
    setLoading(false);
  };

  if (result) return (
    <div className="rounded-2xl p-5" style={{ background:"rgba(74,222,128,0.06)", border:"1px solid rgba(74,222,128,0.2)" }}>
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 size={16} className="text-emerald-400" />
        <p className="text-[13px] font-black text-emerald-400">Tessy configurada!</p>
      </div>
      {Object.entries(result).map(([k, v]) => (
        <div key={k} className="flex justify-between text-[10px] py-1">
          <span className="text-white/40 capitalize">{k}</span>
          <span className="text-white/70">{v}</span>
        </div>
      ))}
      <p className="text-[9px] text-white/20 mt-3">A Tessy já pode entrar e ver os serviços no dashboard.</p>
    </div>
  );

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.2)" }}>
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background:"rgba(251,191,36,0.15)" }}>
          <span className="text-lg">💅</span>
        </div>
        <div>
          <p className="text-[13px] font-black text-white">Configurar Tessy (1ª manicure)</p>
          <p className="text-[9px] text-white/30 mt-0.5">Cria studio, 8 serviços e settings padrão</p>
        </div>
      </div>
      {error && (
        <div className="rounded-xl p-3" style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)" }}>
          <p className="text-[10px] text-red-300/70 break-all">{error}</p>
        </div>
      )}
      <button onClick={run} disabled={loading}
        className="w-full h-12 rounded-xl text-[12px] font-black text-white uppercase tracking-widest disabled:opacity-40"
        style={{ background:"linear-gradient(135deg,#92400e,#d97706)" }}>
        {loading ? "Configurando..." : "▶ Configurar Tessy"}
      </button>
    </div>
  );
}


// ── Criar serviços da Tessy ────────────────────────────────────
function CreateServices() {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{created:number;total:number} | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const { firebaseUser } = useAuth();

  const run = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const idToken = firebaseUser ? await getIdToken(firebaseUser) : "";
      const res = await fetch("/api/admin/create-services", {
        method: "POST",
        headers: { "x-setup-secret": "nailit-setup-2024", "x-id-token": idToken },
      });
      const data = await res.json() as { success: boolean; created: number; total: number; errors?: string[] };
      if (data.success) setResult({ created: data.created, total: data.total });
      else setError(data.errors?.join(", ") ?? "Erro");
    } catch (e) { setError(String(e)); }
    setLoading(false);
  };

  if (result) return (
    <div className="rounded-2xl p-5" style={{ background:"rgba(74,222,128,0.06)", border:"1px solid rgba(74,222,128,0.2)" }}>
      <div className="flex items-center gap-2">
        <CheckCircle2 size={16} className="text-emerald-400" />
        <p className="text-[13px] font-black text-emerald-400">
          {result.created} serviços criados! ✅
        </p>
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background:"rgba(255,200,50,0.06)", border:"1px solid rgba(255,200,50,0.2)" }}>
      <div className="flex items-center gap-2.5">
        <span className="text-xl">💅</span>
        <div>
          <p className="text-[13px] font-black text-white">Criar 7 serviços restantes da Tessy</p>
          <p className="text-[9px] text-white/30 mt-0.5">Pedicure, gel, spa, nail art... (Manicure simples já existe)</p>
        </div>
      </div>
      {error && <p className="text-[10px] text-red-300/70 break-all">{error}</p>}
      <button onClick={run} disabled={loading}
        className="w-full h-12 rounded-xl text-[12px] font-black text-white uppercase tracking-widest disabled:opacity-40"
        style={{ background:"linear-gradient(135deg,#7a5c00,#d4a017)" }}>
        {loading ? "Criando..." : "▶ Criar serviços da Tessy"}
      </button>
    </div>
  );
}


// ── Componente para promover usuário a superadmin ──────────────
function PromoteUser() {
  const [uid,     setUid]     = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  const promote = async () => {
    if (!uid.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const userRef  = doc(db!, "users", uid.trim());
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setError("Usuário não encontrado. Verifique o UID.");
        setLoading(false);
        return;
      }

      const data = userSnap.data() as Record<string, unknown>;
      await setDoc(userRef, {
        ...data,
        role:      "superadmin",
        updatedAt: serverTimestamp(),
      });

      setResult(`✓ ${String(data.name || data.email || uid)} agora é superadmin!`);
    } catch (e) {
      setError(String(e));
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl p-5 space-y-4"
      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>

      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background:"rgba(96,165,250,0.15)" }}>
          <UserPlus size={15} className="text-blue-400" />
        </div>
        <div>
          <p className="text-[13px] font-black text-white">Promover a Super Admin</p>
          <p className="text-[9px] text-white/30 mt-0.5">
            Cole o UID do usuário para dar acesso total
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            value={uid}
            onChange={e => setUid(e.target.value)}
            placeholder="Cole o UID do Firebase aqui..."
            className="w-full h-11 pl-8 pr-3 rounded-xl text-[12px] font-mono text-white placeholder-white/15 outline-none"
            style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }}
          />
        </div>
        <button onClick={promote} disabled={loading || !uid.trim()}
          className="h-11 px-4 rounded-xl text-[11px] font-black text-white disabled:opacity-40 transition-all shrink-0"
          style={{ background:"linear-gradient(135deg,#1E3A5F,#3B82F6)" }}>
          {loading ? "..." : "Promover"}
        </button>
      </div>

      {result && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)" }}>
          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
          <p className="text-[11px] font-bold text-emerald-400">{result}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)" }}>
          <AlertCircle size={13} className="text-red-400 shrink-0" />
          <p className="text-[10px] text-red-300/70">{error}</p>
        </div>
      )}

      <p className="text-[8px] text-white/15">
        ⚠️ Use com cuidado — superadmin tem acesso total à plataforma.
      </p>
    </div>
  );
}

export default function AdminConfigPage() {
  const [migrating, setMigrating]   = useState(false);
  const [migResult, setMigResult]   = useState<Record<string, unknown> | null>(null);
  const [migError,  setMigError]    = useState<string | null>(null);

  const runMigration = async () => {
    setMigrating(true);
    setMigResult(null);
    setMigError(null);
    try {
      const res = await fetch("/api/admin/migrate", {
        method: "POST",
        headers: { "x-migrate-secret": "nailit-migrate-2024" },
      });
      const data = await res.json() as { success: boolean; results?: Record<string, unknown>; error?: string };
      if (data.success) {
        setMigResult(data.results ?? {});
        toast.success("Migração concluída! ✅");
      } else {
        setMigError(data.error ?? "Erro desconhecido");
        toast.error("Erro na migração");
      }
    } catch (e) {
      setMigError(String(e));
      toast.error("Erro de rede");
    }
    setMigrating(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-[24px] font-bold text-white"
          style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>
          Configurações ⚙️
        </h1>
        <p className="text-[11px] text-white/25 mt-0.5">Configurações globais da plataforma</p>
      </div>

      {/* Migração multi-tenant */}
      <div className="rounded-2xl p-5 space-y-4"
        style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>

        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background:"rgba(157,127,212,0.15)" }}>
            <Database size={15} className="text-[#9D7FD4]" />
          </div>
          <div>
            <p className="text-[13px] font-black text-white">Migração Multi-tenant</p>
            <p className="text-[9px] text-white/30 mt-0.5">
              Move dados da Tessy para /studios/{"{uid}"}/... — seguro e idempotente
            </p>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2 text-[10px] text-white/40">
          {[
            "Cria /studios/O1ei4o6K... com plano Pro (30 dias trial)",
            "Copia appointments → /studios/.../appointments",
            "Copia services → /studios/.../services",
            "Copia clients → /studios/.../clients",
            "Copia settings/salon → /studios/.../settings/salon",
            "Atualiza /users/{uid} com studioId",
            "Dados originais mantidos como backup",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#9D7FD4] shrink-0 opacity-50" />
              {item}
            </div>
          ))}
        </div>

        {/* Resultado */}
        {migResult && (
          <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
            className="rounded-xl p-4 space-y-1.5"
            style={{ background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span className="text-[11px] font-black text-emerald-400">Migração concluída!</span>
            </div>
            {Object.entries(migResult).map(([k, v]) => (
              <div key={k} className="flex justify-between text-[10px]">
                <span className="text-white/40 capitalize">{k}</span>
                <span className="text-white/70 font-mono">{String(v)}</span>
              </div>
            ))}
          </motion.div>
        )}

        {migError && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="rounded-xl p-4"
            style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)" }}>
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={14} className="text-red-400" />
              <span className="text-[11px] font-black text-red-400">Erro</span>
            </div>
            <p className="text-[10px] text-red-300/60 font-mono break-all">{migError}</p>
          </motion.div>
        )}

        <button onClick={runMigration} disabled={migrating || !!migResult}
          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-[12px] font-black text-white uppercase tracking-widest disabled:opacity-40 transition-all"
          style={{
            background: migResult
              ? "rgba(74,222,128,0.2)"
              : "linear-gradient(135deg,#1E1A2E,#7C5CBF)",
            border: migResult ? "1px solid rgba(74,222,128,0.3)" : "none",
          }}>
          {migrating ? (
            <>
              <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }}>
                <RefreshCw size={14} />
              </motion.div>
              Migrando...
            </>
          ) : migResult ? (
            <><CheckCircle2 size={14} className="text-emerald-400" /> Migração concluída</>
          ) : (
            <><Database size={14} /> Executar migração da Tessy</>
          )}
        </button>

        {migResult && (
          <p className="text-[9px] text-white/20 text-center">
            Dados originais mantidos. Pode rodar novamente com segurança.
          </p>
        )}
      </div>

      {/* Setup inicial */}
      <SetupInicial />

      {/* Seed Tessy */}
      <SeedTessy />

      {/* Criar serviços */}
      <CreateServices />

      {/* Promover usuário a superadmin */}
      <PromoteUser />

      {/* Outras configs futuras */}
      <div className="rounded-2xl p-5 space-y-3"
        style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background:"rgba(255,255,255,0.06)" }}>
            <Shield size={15} className="text-white/30" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-white/60">Mais configurações</p>
            <p className="text-[9px] text-white/20 mt-0.5">Feature flags, preços dos planos, modo manutenção</p>
          </div>
        </div>
        <div className="text-center py-4">
          <p className="text-[11px] text-white/20">🚧 Em construção</p>
        </div>
      </div>
    </div>
  );
}
