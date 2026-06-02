"use client";

export default function AdminConfigPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[24px] font-bold text-white"
          style={{ fontFamily:"Georgia,serif", fontStyle:"italic" }}>Configurações ⚙️</h1>
        <p className="text-[11px] text-white/25 mt-0.5">Configurações globais da plataforma</p>
      </div>
      <div className="rounded-2xl p-6 text-center"
        style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)" }}>
        <p className="text-4xl mb-3">🚧</p>
        <p className="text-[13px] font-bold text-white/60">Em construção</p>
        <p className="text-[10px] text-white/25 mt-1">Feature flags, preços dos planos, modo manutenção</p>
      </div>
    </div>
  );
}
