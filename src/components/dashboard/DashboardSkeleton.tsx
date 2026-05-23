/**
 * Skeleton loading para o dashboard
 * Mostra estrutura enquanto carrega dados
 */

import { motion } from 'framer-motion';

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-brand-soft/20 ${className}`} />;
}

function PulseBox({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-brand-soft/20 ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-brand-background"
    >
      {/* Header */}
      <div className="bg-white border-b border-brand-soft p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div className="space-y-2">
            <Pulse className="w-48 h-8" />
            <Pulse className="w-64 h-4 mt-2" />
          </div>
          <PulseBox className="w-32 h-12" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-brand-soft"
            >
              <Pulse className="w-32 h-3 mb-4" />
              <PulseBox className="h-16 w-full mb-3" />
              <Pulse className="w-24 h-2" />
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <motion.div
              key={`chart-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-brand-soft"
            >
              <Pulse className="w-40 h-4 mb-4" />
              <PulseBox className="h-64 w-full" />
            </motion.div>
          ))}
        </div>

        {/* Appointments & Services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <motion.div
              key={`list-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-brand-soft"
            >
              <Pulse className="w-32 h-4 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="p-4 bg-brand-background rounded-xl space-y-2">
                    <Pulse className="w-full h-3" />
                    <Pulse className="w-2/3 h-2" />
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </motion.div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="p-4 bg-white rounded-lg border border-brand-soft space-y-2"
        >
          <div className="h-4 w-2/3 rounded-full bg-brand-soft/20 animate-pulse" />
          <div className="h-3 w-1/2 rounded-full bg-brand-soft/20 animate-pulse" />
        </motion.div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="flex gap-3"
        >
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="flex-1 h-3 rounded-full bg-brand-soft/20 animate-pulse" />
          ))}
        </motion.div>
      ))}
    </div>
  );
}
