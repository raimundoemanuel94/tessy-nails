/**
 * Componentes para cards KPI do dashboard
 * Reutilizáveis e consistentes
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: ReactNode;
  color?: 'primary' | 'emerald' | 'amber' | 'slate';
  variant?: 'default' | 'highlight';
  loading?: boolean;
}

const colorConfig = {
  primary: {
    bg: 'bg-brand-primary',
    border: 'border-brand-primary',
    text: 'text-brand-primary',
    bgLight: 'bg-brand-soft/40',
  },
  emerald: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-500',
    text: 'text-emerald-600',
    bgLight: 'bg-emerald-50',
  },
  amber: {
    bg: 'bg-amber-500',
    border: 'border-amber-500',
    text: 'text-amber-600',
    bgLight: 'bg-amber-50',
  },
  slate: {
    bg: 'bg-slate-500',
    border: 'border-slate-500',
    text: 'text-slate-600',
    bgLight: 'bg-slate-50',
  },
};

/**
 * Card KPI padrão (fundo branco, borda)
 */
export function KPICard({
  label,
  value,
  subtext,
  icon,
  color = 'primary',
  loading = false,
}: KPICardProps) {
  const config = colorConfig[color];

  if (loading) {
    return (
      <div className="rounded-2xl border border-brand-accent/10 bg-white p-5 shadow-sm animate-pulse">
        <div className="h-4 w-24 rounded-full bg-brand-soft/20 mb-3" />
        <div className="h-8 w-16 rounded-full bg-brand-soft/20 mb-2" />
        <div className="h-3 w-32 rounded-full bg-brand-soft/20" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-brand-accent/10 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-text-sub">
          {label}
        </p>
        {icon && <div className={`text-base ${config.text}`}>{icon}</div>}
      </div>

      <p className="text-3xl font-black tracking-tight text-brand-text-main">
        {value}
      </p>

      {subtext && (
        <p className="text-[10px] font-bold text-brand-text-sub opacity-50 mt-2">
          {subtext}
        </p>
      )}
    </motion.div>
  );
}

/**
 * Card KPI destaque (fundo colorido, premium)
 */
export function KPICardHighlight({
  label,
  value,
  subtext,
  icon,
  color = 'primary',
  children,
  loading = false,
}: KPICardProps & { children?: ReactNode }) {
  const config = colorConfig[color];

  if (loading) {
    return (
      <div className={`rounded-2xl ${config.bg} p-5 text-white shadow-xl col-span-2 lg:col-span-1 animate-pulse`}>
        <div className="h-4 w-24 rounded-full bg-white/20 mb-3" />
        <div className="h-10 w-32 rounded-full bg-white/20 mb-4" />
        <div className="h-2 w-full rounded-full bg-white/20" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl ${config.bg} p-5 text-white shadow-xl col-span-2 lg:col-span-1`}
    >
      {/* Decorative blobs */}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/8" />
      <div className="absolute right-2 bottom-2 h-12 w-12 rounded-full bg-white/5" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
            {label}
          </p>
          {icon && <div className="text-xl text-white/40">{icon}</div>}
        </div>

        <p className="text-3xl font-black tracking-tight">
          <span className="text-base font-semibold mr-0.5">R$</span>
          {value}
        </p>

        {children}

        {subtext && (
          <p className="text-[10px] font-bold text-white/50 mt-2">
            {subtext}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Barra de progresso para cards
 */
export function ProgressBar({
  current,
  goal,
  label,
}: {
  current: number;
  goal: number;
  label: string;
}) {
  const percentage = Math.min(Math.round((current / goal) * 100), 100);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[9px] font-bold text-white/50">
        <span>Meta R$ {goal.toLocaleString('pt-BR')}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-1.5 w-full bg-white/15 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: percentage + '%' }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="h-full bg-white/80 rounded-full"
        />
      </div>
      <p className="text-[9px] text-white/40 mt-1">{label}</p>
    </div>
  );
}

/**
 * Compact KPI (para sidebars, etc)
 */
export function KPICompact({
  label,
  value,
  color = 'primary',
}: Omit<KPICardProps, 'subtext' | 'icon' | 'variant'>) {
  const config = colorConfig[color];

  return (
    <div className="text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-sub mb-1">
        {label}
      </p>
      <p className={`text-2xl font-black ${config.text}`}>{value}</p>
    </div>
  );
}
