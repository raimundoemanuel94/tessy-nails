"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Bell } from "lucide-react";
import { toast } from "sonner";

export default function AdminComunicadosPage() {
  const [title, setTitle]     = useState("");
  const [body, setBody]       = useState("");
  const [target, setTarget]   = useState<"all"|"professionals"|"clients">("all");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim() || !body.trim()) return toast.error("Preencha título e mensagem");
    setSending(true);
    try {
      const res = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, target }),
      });
      if (res.ok) {
        toast.success("Comunicado enviado! ✅");
        setTitle(""); setBody("");
      } else toast.error("Erro ao enviar");
    } catch { toast.error("Erro de rede"); }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-bold text-white"
          style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>Comunicados 📢</h1>
        <p className="text-[11px] text-white/25 mt-0.5">Envie push para usuários da plataforma</p>
      </div>

      <div className="max-w-lg rounded-2xl p-6 space-y-4"
        style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>

        {/* Target */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-2">Enviar para</p>
          <div className="flex gap-2">
            {(["all","professionals","clients"] as const).map(t => (
              <button key={t} onClick={() => setTarget(t)}
                className="flex-1 h-9 rounded-xl text-[10px] font-bold transition-all"
                style={target === t
                  ? { background:"rgba(157,127,212,0.2)", color:"#C4A8E8", border:"1px solid rgba(157,127,212,0.3)" }
                  : { background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.3)", border:"1px solid rgba(255,255,255,0.06)" }}>
                {t === "all" ? "Todos" : t === "professionals" ? "Manicures" : "Clientes"}
              </button>
            ))}
          </div>
        </div>

        {/* Título */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-2">Título</p>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Nova funcionalidade disponível!"
            className="w-full h-11 px-4 rounded-xl text-[13px] text-white placeholder-white/20 outline-none"
            style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }} />
        </div>

        {/* Mensagem */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-2">Mensagem</p>
          <textarea value={body} onChange={e => setBody(e.target.value)}
            placeholder="Descrição do comunicado..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl text-[13px] text-white placeholder-white/20 outline-none resize-none"
            style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }} />
        </div>

        {/* Enviar */}
        <button onClick={send} disabled={sending}
          className="w-full h-12 rounded-xl flex items-center justify-center gap-2 text-[12px] font-black text-white uppercase tracking-widest disabled:opacity-50 transition-all"
          style={{ background:"linear-gradient(135deg,#1E1A2E,#7C5CBF)" }}>
          {sending ? (
            <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }}>
              <Bell size={15} />
            </motion.div>
          ) : <Send size={15} />}
          {sending ? "Enviando..." : "Enviar comunicado"}
        </button>
      </div>
    </div>
  );
}
