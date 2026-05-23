/**
 * Skeleton loading para o dashboard
 * Mostra estrutura enquanto carrega dados
 */

import { motion } from 'framer-motion';

function SkeletonCard({ height = 'h-32' }: { height?: string }) {
  return (
    <div className={`${height} rounded-2xl bg-gradient-to-r from-brand-soft/20 to-brand-soft/10 animate-pulse`} />
  );
}

function SkeletonText({ width = 'w-3/4', height = 'h-4' }: { width?: string; height?: string }) {
  return <div className={`${width} ${height} rounded-full bg-brand-soft/20 animate-pulse`} />;
}

function SkeletonLine({ width = 'w-full', height = 'h-2' }: { width?: string; height?: string }) {
  return <div className={`${width} ${height} rounded-full bg-brand-soft/20 animate-pulse`} />;
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
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <SkeletonText width="w-48" height="h-8" />
              <SkeletonText width="w-64" height="h-4" className="mt-2" />
            </div>
            <SkeletonCard height="h-12" className="w-32" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-brand-soft"
            >
              <SkeletonText width="w-32" height="h-3" />
              <SkeletonCard height="h-16" className="mt-4" />
              <SkeletonText width="w-24" height="h-2" className="mt-3" />
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[...Array(2)].map((_, i) => (
            <motion.div
              key={`chart-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="bg-white rounded-2xl p-6 border border-brand-soft"
            >
              <SkeletonText width="w-40" height="h-4" />
              <SkeletonCard height="h-64" className="mt-4" />
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
              <SkeletonText width="w-32" height="h-4" />
              <div className="space-y-3 mt-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="p-4 bg-brand-background rounded-xl">
                    <SkeletonLine height="h-3" />
                    <SkeletonLine width="w-2/3" height="h-2" className="mt-2" />
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

/**
 * Versão compacta do skeleton (para cards individuais)
 */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="p-4 bg-white rounded-lg border border-brand-soft"
        >
          <SkeletonLine height="h-4" width="w-2/3" />
          <SkeletonLine height="h-3" width="w-1/2" className="mt-2" />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Skeleton para tabelas
 */
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
            <div key={j} className="flex-1">
              <SkeletonLine />
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}
