"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc, setDoc, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  ArrowLeft, User, Mail, Phone, MapPin,
  Lock, Sparkles, CheckCircle2, Copy, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";

/* ── helpers ──────────────────────────────────────────────────── */
function genSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 28);
}

function genPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#";
  return Array.from({ length: 12 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

type Field = {
  id: string; label: string; placeholder: string;
  icon: React.ElementType; type?: string; required?: boolean;
};

const FIELDS: Field[] = [
  { id:"name",    label:"Nome completo",    placeholder:"Ex: Ana Paula Silva",  icon:User,   required:true },
  { id:"email",   label:"E-mail",           placeholder:"ana@email.com",        icon:Mail,   type:"email", required:true },
  { id:"phone",   label:"WhatsApp",         placeholder:"(11) 99999-9999",      icon:Phone  },
  { id:"address", label:"Cidade / Bairro",  placeholder:"Ex: São Paulo, Moema", icon:MapPin },
];

/* ── componente ───────────────────────────────────────────────── */
export default function NovaManicrePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name:"", email:"", phone:"", address:"",
    plan:"free" as "free"|"starter"|"pro"|"studio",
    sendEmail: true,
  });
  const [customPass, setCustomPass]   = useState(false);
  const [password, setPassword]       = useState(genPassword());
  const [showPass, setShowPass]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState<null|{ uid:string; studioId:string; slug:string }>(null);

  const set = (k: string, v: string | boolean) =>
    setForm(p => ({ ...p, [k]: v }));

  /* ── submit ─────────────────────────────────────────────────── */
  const submit = async () => {
    if (!form.name.trim())  return toast.error("Nome obrigatório");
    if (!form.email.trim()) return toast.error("E-mail obrigatório");
    if (password.length < 6) return toast.error("Senha muito curta");

    setLoading(true);
    try {
      /* 1. Criar conta Firebase Auth */
      const cred = await createUserWithEmailAndPassword(
        auth!, form.email.trim(), password
      );
      const uid = cred.user.uid;

      /* 2. Trial de 3 dias */
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3);

      const slug = genSlug(form.name) + "-" + uid.slice(0,5);

      /* 3. Criar /studios/{uid} */
      const studioRef = doc(db!, "studios", uid);
      await setDoc(studioRef, {
        name:        form.name.trim(),
        ownerId:     uid,
        slug,
        plan:        form.plan,
        trialEndsAt: Timestamp.fromDate(trialEndsAt),
        isActive:    true,
        phone:       form.phone.trim() || null,
        address:     form.address.trim() || null,
        createdAt:   serverTimestamp(),
        createdBy:   "superadmin",
      });

      /* 4. Criar /users/{uid} */
      await setDoc(doc(db!, "users", uid), {
        uid,
        name:      form.name.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim() || null,
        role:      "professional",
        studioId:  uid,
        isActive:  true,
        createdAt: serverTimestamp(),
      });

      /* 5. Enviar e-mail de redefinição de senha (opcional) */
      if (form.sendEmail) {
        await sendPasswordResetEmail(auth!, form.email.trim()).catch(() => {});
      }

      setDone({ uid, studioId: uid, slug });
      toast.success("Manicure cadastrada com sucesso! ✅");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      if (msg.includes("email-already-in-use"))
        toast.error("Este e-mail já está cadastrado.");
      else
        toast.error("Erro: " + msg);
    }
    setLoading(false);
  };

  /* ── tela de sucesso ────────────────────────────────────────── */
  if (done) return (
    <div className="max-w-md mx-auto space-y-5">
      <motion.div
        initial={{ opacity:0, scale:0.9 }}
        animate={{ opacity:1, scale:1 }}
        className="rounded-3xl p-8 text-center"
        style={{ background:"rgba(74,222,153,0.06)", border:"1.5px solid rgba(74,222,153,0.2)" }}>
        <motion.div
          initial={{ scale:0 }} animate={{ scale:1 }}
          transition={{ type:"spring", stiffness:300, delay:0.1 }}
          className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background:"rgba(74,222,153,0.15)" }}>
          <CheckCircle2 size={32} className="text-emerald-400" />
        </motion.div>
        <h2 className="text-[20px] font-bold text-white mb-1"
          style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>
          Manicure cadastrada!
        </h2>
        <p className="text-[11px] text-white/30 mb-6">
          Conta criada e studio configurado com 3 dias de trial Pro.
        </p>

        {/* Credenciais */}
        <div className="space-y-3 text-left">
          {[
            { label:"E-mail",   value: form.email },
            { label:"Senha",    value: password },
            { label:"Slug",     value: done.slug },
            { label:"UID",      value: done.uid.slice(0,16)+"..." },
          ].map(row => (
            <div key={row.label}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl"
              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-white/30">{row.label}</p>
                <p className="text-[12px] font-bold text-white font-mono">{row.value}</p>
              </div>
              <button onClick={() => {
                navigator.clipboard.writeText(row.value);
                toast.success(`${row.label} copiado!`);
              }}
                className="text-white/20 hover:text-white/60 transition-colors">
                <Copy size={13} />
              </button>
            </div>
          ))}
        </div>

        <p className="text-[9px] text-white/20 mt-4">
          {form.sendEmail
            ? "✉️ E-mail de redefinição de senha enviado para a manicure."
            : "Envie as credenciais manualmente para a manicure."}
        </p>
      </motion.div>

      <div className="flex gap-3">
        <button onClick={() => router.push(`/admin/studios/${done.studioId}`)}
          className="flex-1 h-11 rounded-2xl text-[12px] font-black text-white"
          style={{ background:"rgba(157,127,212,0.2)", border:"1px solid rgba(157,127,212,0.3)" }}>
          Ver studio
        </button>
        <button onClick={() => {
          setDone(null);
          setForm({ name:"", email:"", phone:"", address:"", plan:"free", sendEmail:true });
          setPassword(genPassword());
        }}
          className="flex-1 h-11 rounded-2xl text-[12px] font-black text-white"
          style={{ background:"linear-gradient(135deg,#1E1A2E,#7C5CBF)" }}>
          Cadastrar outra
        </button>
      </div>
    </div>
  );

  /* ── formulário ─────────────────────────────────────────────── */
  return (
    <div className="max-w-lg mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin/studios")}
          className="h-9 w-9 rounded-xl flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/8 transition-all"
          style={{ border:"1px solid rgba(255,255,255,0.07)" }}>
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className="text-[22px] font-bold text-white leading-none"
            style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>
            Nova manicure 💅
          </h1>
          <p className="text-[10px] text-white/25 mt-0.5">Preencha os dados e confirme</p>
        </div>
      </div>

      {/* Campos principais */}
      <div className="rounded-2xl p-5 space-y-4"
        style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/25">Dados pessoais</p>

        {FIELDS.map(f => (
          <div key={f.id}>
            <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-white/30 mb-1.5">
              {f.label} {f.required && <span className="text-[#9D7FD4]">*</span>}
            </label>
            <div className="relative">
              <f.icon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                type={f.type || "text"}
                value={String((form as unknown as Record<string, unknown>)[f.id] ?? '')}
                onChange={e => set(f.id, e.target.value)}
                placeholder={f.placeholder}
                className="w-full h-11 pl-9 pr-4 rounded-xl text-[13px] text-white placeholder-white/15 outline-none transition-all"
                style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)" }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Plano */}
      <div className="rounded-2xl p-5 space-y-3"
        style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/25">Plano inicial</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { id:"free",    label:"Free",    sub:"30 agend/mês",   price:"R$0",  color:"#5A5280" },
            { id:"starter", label:"Starter", sub:"Ilimitado",      price:"R$19", color:"#9D7FD4" },
            { id:"pro",     label:"Pro",     sub:"Tudo incluído",  price:"R$29", color:"#7C5CBF" },
            { id:"studio",  label:"Studio",  sub:"3 profissionais",price:"R$59", color:"#F59E0B" },
          ] as const).map(p => (
            <button key={p.id} onClick={() => set("plan", p.id)}
              className="relative text-left p-3.5 rounded-xl transition-all"
              style={form.plan === p.id
                ? { background:`${p.color}20`, border:`1.5px solid ${p.color}60` }
                : { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
              {form.plan === p.id && (
                <div className="absolute top-2 right-2 h-2 w-2 rounded-full"
                  style={{ background: p.color }} />
              )}
              <p className="text-[12px] font-black text-white">{p.label}</p>
              <p className="text-[9px] font-bold mt-0.5" style={{ color: p.color }}>{p.price}/mês</p>
              <p className="text-[8px] text-white/25 mt-0.5">{p.sub}</p>
            </button>
          ))}
        </div>
        <p className="text-[8px] text-white/20">
          ✦ Independente do plano, ela terá <strong className="text-[#9D7FD4]">3 dias de trial Pro</strong> completo.
        </p>
      </div>

      {/* Senha */}
      <div className="rounded-2xl p-5 space-y-3"
        style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/25">Senha de acesso</p>
          <button onClick={() => setCustomPass(p => !p)}
            className="text-[9px] font-bold text-[#9D7FD4]">
            {customPass ? "Usar senha gerada" : "Personalizar"}
          </button>
        </div>

        <div className="relative">
          <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            readOnly={!customPass}
            className="w-full h-11 pl-9 pr-10 rounded-xl text-[13px] font-mono text-white placeholder-white/15 outline-none"
            style={{
              background:"rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.08)",
              cursor: customPass ? "text" : "default",
            }}
          />
          <button onClick={() => setShowPass(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60">
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {!customPass && (
          <button onClick={() => setPassword(genPassword())}
            className="text-[9px] font-bold text-white/25 hover:text-white/50 transition-colors">
            ↺ Gerar nova senha
          </button>
        )}

        {/* Toggle enviar email */}
        <button onClick={() => set("sendEmail", !form.sendEmail)}
          className="flex items-center gap-2.5 w-full text-left">
          <div className="h-5 w-9 rounded-full flex items-center transition-all relative shrink-0"
            style={{ background: form.sendEmail ? "rgba(157,127,212,0.4)" : "rgba(255,255,255,0.1)" }}>
            <motion.div
              animate={{ x: form.sendEmail ? 17 : 2 }}
              transition={{ type:"spring", stiffness:400, damping:25 }}
              className="absolute h-3.5 w-3.5 rounded-full bg-white"
            />
          </div>
          <span className="text-[10px] font-semibold text-white/40">
            Enviar e-mail de redefinição de senha para a manicure
          </span>
        </button>
      </div>

      {/* CTA */}
      <motion.button
        whileTap={{ scale:0.98 }}
        onClick={submit}
        disabled={loading || !form.name || !form.email}
        className="w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 text-white text-[13px] font-black uppercase tracking-widest disabled:opacity-40 transition-all shadow-2xl"
        style={{ background:"linear-gradient(135deg,#1E1A2E 0%,#5A3F9A 50%,#9D7FD4 100%)" }}>
        {loading ? (
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-white"
                animate={{ y:[0,-5,0] }}
                transition={{ duration:0.5, delay:i*0.1, repeat:Infinity }} />
            ))}
          </div>
        ) : (
          <>
            <Sparkles size={16} />
            Cadastrar manicure
          </>
        )}
      </motion.button>

      <p className="text-center text-[9px] text-white/15 pb-4">
        Uma conta Firebase Auth será criada automaticamente.
      </p>
    </div>
  );
}
