"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft, Building2, Calendar, Users,
  DollarSign, Clock, CheckCircle2, XCircle,
  Edit3, Save, X,
} from "lucide-react";
import { toast } from "sonner";

const PLAN_COLORS: Record<string,string> = {
  free:"#5A5280", starter:"#9D7FD4", pro:"#7C5CBF", studio:"#F59E0B",
};
const PLAN_PRICES: Record<string,number> = { free:0, starter:19, pro:29, studio:59 };

export default function StudioDetailPage() {
  const { id } = useParams<{ id:string }>();
  const router  = useRouter();

  const [studio,       setStudio]      = useState<Record<string,unknown> | null>(null);
  const [user,         setUser]        = useState<Record<string,unknown> | null>(null);
  const [apptCount,    setApptCount]   = useState(0);
  const [svcCount,     setSvcCount]    = useState(0);
  const [loading,      setLoading]     = useState(true);
  const [editing,      setEditing]     = useState(false);
  const [editName,     setEditName]    = useState("");
  const [editPlan,     setEditPlan]    = useState("");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        // Studio
        const sDoc = await getDoc(doc(db!, "studios", id));
        if (!sDoc.exists()) { router.push("/admin/studios"); return; }
        const raw = sDoc.data() as Record<string, unknown>;
        const s: Record<string, unknown> = { id: sDoc.id, ...raw };
        setStudio(s);
        setEditName(String(s.name || ""));
        setEditPlan(String(s.plan || "free"));

        // Owner
        const ownerId = String(s.ownerId || "");
        if (ownerId) {
          const uDoc = await getDoc(doc(db!, "users", ownerId));
          if (uDoc.exists()) setUser({ uid: uDoc.id, ...uDoc.data() });
        }

        // Agendamentos e serviços na subcoleção
        const [appts, svcs] = await Promise.allSettled([
          getDocs(collection(db!, "studios", id, "appointments")),
          getDocs(collection(db!, "studios", id, "services")),
        ]);
        if (appts.status === "fulfilled") setApptCount(appts.value.size);
        if (svcs.status === "fulfilled")  setSvcCount(svcs.value.size);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    void load();
  }, [id]);

  const saveEdit = async () => {
    if (!id) return;
    try {
      await updateDoc(doc(db!, "studios", id), {
        name: editName.trim(),
        plan: editPlan,
        updatedAt: Timestamp.now(),
      });
      setStudio(p => p ? { ...p, name: editName.trim(), plan: editPlan } : p);
      toast.success("Studio atualizado!");
      setEditing(false);
    } catch { toast.error("Erro ao salvar"); }
  };

  const toggleActive = async () => {
    if (!id || !studio) return;
    const next = !studio.isActive;
    try {
      await updateDoc(doc(db!, "studios", id), { isActive: next });
      setStudio(p => p ? { ...p, isActive: next } : p);
      toast.success(next ? "Studio ativado" : "Studio desativado");
    } catch { toast.error("Erro"); }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <motion.div key={i} className="w-2 h-2 rounded-full bg-[#9D7FD4]"
            animate={{ y:[0,-8,0] }} transition={{ duration:0.6, delay:i*0.12, repeat:Infinity }} />
        ))}
      </div>
    </div>
  );

  if (!studio) return null;

  const planColor = PLAN_COLORS[String(studio.plan)] || "#5A5280";
  const trialDate = studio.trialEndsAt instanceof Timestamp
    ? studio.trialEndsAt.toDate()
    : studio.trialEndsAt ? new Date(studio.trialEndsAt as string) : null;
  const inTrial   = trialDate && trialDate > new Date();
  const trialDays = inTrial
    ? Math.ceil((trialDate!.getTime() - Date.now()) / 86400000)
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin/studios")}
          className="h-9 w-9 rounded-xl flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/8 transition-all"
          style={{ border:"1px solid rgba(255,255,255,0.07)" }}>
          <ArrowLeft size={15} />
        </button>
        <div className="flex-1">
          {editing ? (
            <input value={editName} onChange={e => setEditName(e.target.value)}
              className="text-[22px] font-bold text-white bg-transparent border-b border-[#9D7FD4] outline-none w-full"
              style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }} />
          ) : (
            <h1 className="text-[22px] font-bold text-white leading-none"
              style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>
              {String(studio.name)}
            </h1>
          )}
          <p className="text-[10px] text-white/25 mt-0.5">ID: {id}</p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={saveEdit}
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[11px] font-black text-white"
              style={{ background:"rgba(74,222,153,0.2)", border:"1px solid rgba(74,222,153,0.3)" }}>
              <Save size={13} /> Salvar
            </button>
            <button onClick={() => setEditing(false)}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white/30 hover:bg-white/8 transition-all"
              style={{ border:"1px solid rgba(255,255,255,0.07)" }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-[11px] font-bold text-white/50 hover:text-white/80 hover:bg-white/8 transition-all"
            style={{ border:"1px solid rgba(255,255,255,0.07)" }}>
            <Edit3 size={13} /> Editar
          </button>
        )}
      </div>

      {/* Status + plano */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-4 col-span-1"
          style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25 mb-2">Status</p>
          <div className={`flex items-center gap-2`}>
            {studio.isActive
              ? <CheckCircle2 size={16} className="text-emerald-400" />
              : <XCircle size={16} className="text-red-400" />
            }
            <span className="text-[12px] font-bold text-white">
              {studio.isActive ? "Ativo" : "Inativo"}
            </span>
          </div>
          <button onClick={toggleActive}
            className="mt-3 w-full h-7 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
            style={studio.isActive
              ? { background:"rgba(248,113,113,0.1)", color:"#F87171", border:"1px solid rgba(248,113,113,0.2)" }
              : { background:"rgba(74,222,153,0.1)", color:"#4ADE80", border:"1px solid rgba(74,222,153,0.2)" }}>
            {studio.isActive ? "Desativar" : "Ativar"}
          </button>
        </div>

        <div className="rounded-2xl p-4 col-span-2"
          style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25 mb-2">Plano</p>
          {editing ? (
            <select value={editPlan} onChange={e => setEditPlan(e.target.value)}
              className="w-full h-9 px-3 rounded-xl text-[13px] font-bold text-white outline-none cursor-pointer"
              style={{ background:`${PLAN_COLORS[editPlan]}20`, border:`1.5px solid ${PLAN_COLORS[editPlan]}50`, color: PLAN_COLORS[editPlan] }}>
              {["free","starter","pro","studio"].map(p => (
                <option key={p} value={p} style={{ background:"#1A1A2E", color:"white" }}>
                  {p.charAt(0).toUpperCase()+p.slice(1)} — R${PLAN_PRICES[p]}/mês
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-black capitalize" style={{ color: planColor }}>
                {String(studio.plan)}
              </span>
              <span className="text-[13px] font-bold text-white/30">
                R${PLAN_PRICES[String(studio.plan)]}/mês
              </span>
            </div>
          )}
          {inTrial && (
            <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold"
              style={{ color:"#FBBF24" }}>
              <Clock size={10} /> Trial: {trialDays} dia{trialDays !== 1 ? "s" : ""} restante{trialDays !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon:Calendar,   label:"Agendamentos", value:apptCount, color:"#60A5FA" },
          { icon:Building2,        label:"Serviços",     value:svcCount,  color:"#9D7FD4" },
          { icon:DollarSign, label:"MRR",          value:(`R$${String(PLAN_PRICES[String(studio.plan)] ?? 0)}`), color:"#4ADE80" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4"
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center mb-2"
              style={{ background:`${s.color}18` }}>
              <s.icon size={13} style={{ color: s.color }} />
            </div>
            <p className="text-[20px] font-black text-white" style={{ fontFamily:"Georgia,serif" }}>{s.value}</p>
            <p className="text-[8px] text-white/25 uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Info do profissional */}
      {user && (
        <div className="rounded-2xl p-5"
          style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/25 mb-3">Profissional</p>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-[14px] font-black text-white shrink-0"
              style={{ background:"linear-gradient(135deg,#2A1A4E,#5A3F9A)" }}>
              {String(user.name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white">{String(user.name || "—")}</p>
              <p className="text-[10px] text-white/30">{String(user.email || "—")}</p>
              {user.phone ? <p className="text-[10px] text-white/20">{String(user.phone)}</p> : null}
            </div>
            <div className="text-right">
              <p className="text-[8px] text-white/20">UID</p>
              <p className="text-[9px] font-mono text-white/40">{String(user.uid || "").slice(0,10)}...</p>
            </div>
          </div>
        </div>
      )}

      {/* Datas */}
      <div className="rounded-2xl p-5 grid grid-cols-2 gap-4"
        style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
        {[
          {
            label: "Criado em",
            value: studio.createdAt instanceof Timestamp
              ? format(studio.createdAt.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale:ptBR })
              : "—"
          },
          {
            label: "Trial até",
            value: trialDate
              ? format(trialDate, "dd/MM/yyyy", { locale:ptBR })
              : "Sem trial"
          },
        ].map(d => (
          <div key={d.label}>
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25 mb-1">{d.label}</p>
            <p className="text-[12px] font-bold text-white">{d.value}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

const SparklesIcon = ({ size, style }: { size:number; style?:React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z" />
  </svg>
);
