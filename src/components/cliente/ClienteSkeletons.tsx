"use client";

import { motion } from "framer-motion";

function Pulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-brand-soft/30 ${className}`} />;
}

/**
 * Skeleton da home do cliente
 */
export function ClienteHomeSkeleton() {
  return (
    <div className="min-h-screen bg-brand-background pb-32">
      {/* Hero */}
      <section className="bg-brand-primary px-6 pt-14 pb-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <Pulse className="h-3 w-20 bg-white/20" />
              <Pulse className="h-7 w-36 bg-white/30" />
              <Pulse className="h-2 w-28 bg-white/10" />
            </div>
            <Pulse className="h-12 w-12 rounded-2xl bg-white/10" />
          </div>
          <Pulse className="h-14 w-full rounded-2xl bg-white/10" />
        </div>
      </section>

      <div className="px-5 mt-6 space-y-8 max-w-2xl mx-auto">
        {/* Próximo agendamento */}
        <section className="space-y-3">
          <Pulse className="h-4 w-32" />
          <div className="rounded-2xl bg-white border border-brand-soft p-5 space-y-4 animate-pulse">
            <div className="flex justify-between">
              <div className="space-y-1.5">
                <Pulse className="h-2 w-16" />
                <Pulse className="h-5 w-40" />
              </div>
              <Pulse className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex gap-3">
              <Pulse className="h-10 flex-1 rounded-xl" />
              <Pulse className="h-10 flex-1 rounded-xl" />
            </div>
          </div>
        </section>

        {/* Atalhos */}
        <section className="space-y-3">
          <Pulse className="h-4 w-28" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-brand-soft p-4 flex items-center gap-3 animate-pulse">
                <Pulse className="h-10 w-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Pulse className="h-3 w-16" />
                  <Pulse className="h-2 w-12" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Serviços */}
        <section className="space-y-3">
          <Pulse className="h-4 w-20" />
          <div className="flex gap-3 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="shrink-0 w-[148px] rounded-2xl bg-white border border-brand-soft overflow-hidden animate-pulse">
                <Pulse className="h-20 w-full rounded-none" />
                <div className="p-3 space-y-1.5">
                  <Pulse className="h-3 w-full" />
                  <Pulse className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/**
 * Skeleton da página de agendamentos
 */
export function AgendamentosSkeleton() {
  return (
    <div className="min-h-screen bg-brand-background pb-28">
      {/* Header */}
      <div className="bg-brand-primary px-5 pt-14 pb-8">
        <Pulse className="h-6 w-40 bg-white/30 mb-1" />
        <Pulse className="h-3 w-32 bg-white/20" />
      </div>
      <main className="px-5 py-6 max-w-2xl mx-auto space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {["Próximos", "Histórico", "Todos"].map((t) => (
            <div key={t} className="h-10 w-24 rounded-full bg-white border border-brand-soft animate-pulse" />
          ))}
        </div>
        {/* Cards */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[24px] border border-brand-soft bg-white animate-pulse">
            <div className="h-1 w-full bg-brand-soft" />
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Pulse className="h-2.5 w-16" />
                  <Pulse className="h-4 w-48" />
                </div>
                <Pulse className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex gap-2">
                <Pulse className="flex-1 h-9 rounded-xl" />
                <Pulse className="flex-1 h-9 rounded-xl" />
              </div>
              <Pulse className="h-12 rounded-2xl w-full" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

/**
 * Skeleton da página de serviços
 */
export function ServicosSkeleton() {
  return (
    <div className="min-h-screen bg-brand-background pb-28">
      <div className="bg-brand-primary px-5 pt-14 pb-8">
        <Pulse className="h-6 w-32 bg-white/30 mb-1" />
        <Pulse className="h-3 w-48 bg-white/20" />
      </div>
      <main className="px-5 py-6 max-w-2xl mx-auto space-y-4">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl bg-white border border-brand-soft p-5 flex items-center gap-4 animate-pulse"
          >
            <Pulse className="h-16 w-16 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Pulse className="h-4 w-32" />
              <Pulse className="h-3 w-full" />
              <div className="flex gap-3 mt-1">
                <Pulse className="h-3 w-12" />
                <Pulse className="h-3 w-12" />
              </div>
            </div>
            <Pulse className="h-10 w-20 rounded-2xl shrink-0" />
          </motion.div>
        ))}
      </main>
    </div>
  );
}
