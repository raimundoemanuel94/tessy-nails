"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Database, CheckCircle2, AlertCircle,
  RefreshCw, Shield,
} from "lucide-react";

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
