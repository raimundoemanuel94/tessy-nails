"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getDocs, collection, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2, Users, DollarSign, TrendingUp,
  Activity, ChevronRight, Sparkles, Clock,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  totalStudios:   number;
  activeStudios:  number;
  trialStudios:   number;
  totalUsers:     number;
  mrr:            number;
  newThisWeek:    number;
  planBreakdown:  Record<string, number>;
  recentStudios:  Array<{ id:string; name:string; plan:string; createdAt:Date; isActive:boolean }>;
}

function StatCard({ icon: Icon, label, value, sub, color, href }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; color: string; href?: string;
}) {
  const inner = (
    <div className="rounded-2xl p-5 h-full"
      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/30">{label}</p>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center"
          style={{ background:`${color}20` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <p className="text-[28px] font-black text-white leading-none mb-1"
        style={{ fontFamily:"Georgia,serif" }}>{value}</p>
      {sub && <p className="text-[9px] text-white/25">{sub}</p>}
      {href && <div className="flex items-center gap-1 mt-2 text-[9px] font-bold"
        style={{ color }}><span>Ver detalhes</span><ChevronRight size={9} /></div>}
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Buscar studios
        const studiosSnap = await getDocs(collection(db!, "studios"));
        const studios = studiosSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Record<string,unknown>),
          createdAt: d.data().createdAt instanceof Timestamp
            ? d.data().createdAt.toDate() : new Date(),
          trialEndsAt: d.data().trialEndsAt instanceof Timestamp
            ? d.data().trialEndsAt.toDate() : null,
        })) as Array<{ id:string; name:string; plan:string; createdAt:Date; trialEndsAt:Date|null; isActive:boolean }>;

        const now = new Date();
        const weekAgo = subDays(now, 7);

        const active  = studios.filter(s => s.isActive);
        const inTrial = studios.filter(s => s.trialEndsAt && s.trialEndsAt > now);
        const newWk   = studios.filter(s => s.createdAt > weekAgo);

        // MRR estimado
        const prices: Record<string,number> = { free:0, starter:19, pro:29, studio:59 };
        const mrr = active.reduce((sum, s) => sum + (prices[s.plan] ?? 0), 0);

        // Breakdown por plano
        const breakdown: Record<string,number> = {};
        studios.forEach(s => { breakdown[s.plan] = (breakdown[s.plan]||0) + 1; });

        // Buscar usuários
        const usersSnap = await getDocs(collection(db!, "users"));

        setStats({
          totalStudios:  studios.length,
          activeStudios: active.length,
          trialStudios:  inTrial.length,
          totalUsers:    usersSnap.size,
          mrr,
          newThisWeek:   newWk.length,
          planBreakdown: breakdown,
          recentStudios: studios
            .sort((a,b) => b.createdAt.getTime()-a.createdAt.getTime())
            .slice(0, 8)
            .map(s => ({ id:s.id, name:s.name, plan:s.plan, createdAt:s.createdAt, isActive:s.isActive })),
        });
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    void load();
  }, []);

  const PLAN_COLORS: Record<string, string> = {
    free:"#5A5280", starter:"#9D7FD4", pro:"#7C5CBF", studio:"#F59E0B",
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <motion.div key={i} className="w-2 h-2 rounded-full bg-[#9D7FD4]"
            animate={{ y:[0,-8,0] }}
            transition={{ duration:0.6, delay:i*0.12, repeat:Infinity }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/25 mb-1">
          {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale:ptBR })}
        </p>
        <h1 className="text-[28px] font-bold text-white"
          style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>
          Visão geral 👑
        </h1>
        <p className="text-[11px] text-white/30 mt-1">Plataforma Nailit — dados em tempo real</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Building2}   label="Studios ativos"   value={stats?.activeStudios ?? 0}  sub={`${stats?.trialStudios ?? 0} em trial`} color="#9D7FD4" href="/admin/studios" />
        <StatCard icon={DollarSign}  label="MRR estimado"     value={`R$${stats?.mrr ?? 0}`}     sub="receita mensal" color="#4ADE80" href="/admin/financeiro" />
        <StatCard icon={Users}       label="Usuários"         value={stats?.totalUsers ?? 0}      sub="na plataforma"  color="#60A5FA" href="/admin/usuarios" />
        <StatCard icon={TrendingUp}  label="Novos (7d)"       value={stats?.newThisWeek ?? 0}     sub="studios criados" color="#F59E0B" />
      </div>

      {/* Breakdown planos + Studios recentes */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Planos */}
        <div className="rounded-2xl p-5"
          style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-4">
            Distribuição de planos
          </h2>
          <div className="space-y-3">
            {Object.entries(stats?.planBreakdown ?? {}).map(([plan, count]) => {
              const total = stats?.totalStudios || 1;
              const pct   = Math.round((count / total) * 100);
              return (
                <div key={plan}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ background: PLAN_COLORS[plan] || "#555" }} />
                      <span className="text-[11px] font-bold text-white capitalize">{plan}</span>
                    </div>
                    <span className="text-[10px] font-black text-white/50 tabular-nums">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width:0 }}
                      animate={{ width:`${pct}%` }}
                      transition={{ duration:0.8, ease:"easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: PLAN_COLORS[plan] || "#555" }}
                    />
                  </div>
                </div>
              );
            })}
            {!Object.keys(stats?.planBreakdown ?? {}).length && (
              <p className="text-[11px] text-white/20">Nenhum studio cadastrado ainda.</p>
            )}
          </div>
        </div>

        {/* Studios recentes */}
        <div className="rounded-2xl p-5"
          style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">
              Studios recentes
            </h2>
            <Link href="/admin/studios"
              className="text-[9px] font-bold text-[#9D7FD4] flex items-center gap-0.5">
              Ver todos <ChevronRight size={9} />
            </Link>
          </div>
          <div className="space-y-2">
            {(stats?.recentStudios ?? []).length === 0 && (
              <p className="text-[11px] text-white/20">Nenhum studio ainda.</p>
            )}
            {(stats?.recentStudios ?? []).map(s => (
              <Link key={s.id} href={`/admin/studios/${s.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center text-[11px] font-black text-white shrink-0"
                  style={{ background:`${PLAN_COLORS[s.plan]}30`, border:`1px solid ${PLAN_COLORS[s.plan]}40` }}>
                  {s.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-white truncate">{s.name}</p>
                  <p className="text-[9px] text-white/25">{format(s.createdAt, "dd/MM/yyyy")}</p>
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0"
                  style={{ background:`${PLAN_COLORS[s.plan]}20`, color: PLAN_COLORS[s.plan] }}>
                  {s.plan}
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href:"/admin/studios",     icon:"🏢", label:"Gerenciar studios"  },
          { href:"/admin/usuarios",    icon:"👥", label:"Ver usuários"       },
          { href:"/admin/comunicados", icon:"📢", label:"Enviar comunicado"  },
          { href:"/admin/config",      icon:"⚙️", label:"Configurações"      },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className="flex items-center gap-3 p-4 rounded-2xl hover:bg-white/8 transition-all group"
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
            <span className="text-xl">{a.icon}</span>
            <span className="text-[11px] font-bold text-white/60 group-hover:text-white/90 transition-colors">{a.label}</span>
          </Link>
        ))}
      </div>

    </div>
  );
}
