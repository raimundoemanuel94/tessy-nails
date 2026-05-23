/**
 * Tessy Nails — Design Tokens
 * Lavender Bloom Edition — mais claro, mais vida
 */
export const TN = {
  // ── Superfícies ────────────────────────────────────────────
  noir:       "#1E1A2E",  // roxo profundo — header, CTA
  noirMid:    "#2A2440",  // surface escura secundária
  noirSoft:   "#3D3560",  // bordas em contexto escuro
  linen:      "#FAF8FF",  // background principal — lavanda levíssimo
  linenDark:  "#EDE5FF",  // fundo de cards secundários
  white:      "#FFFFFF",  // cards brancos

  // ── Accent ─────────────────────────────────────────────────
  accent:      "#9D7FD4",  // lavanda vibrante — botões, ícones
  accentLight: "#EDE5FF",  // lavanda soft — backgrounds de pills
  accentDeep:  "#7C5CBF",  // lavanda escura — texto sobre fundo claro

  // ── Tipografia ─────────────────────────────────────────────
  inkPrimary: "#1E1A2E",  // texto principal
  inkSecond:  "#6B6480",  // texto secundário
  inkMuted:   "#9B8FC0",  // labels / suporte
  inkFaint:   "#DDD5F5",  // bordas / dividers

  // ── Status ─────────────────────────────────────────────────
  statusConfirmed: { dot:"#34D399", text:"#065F46", bg:"#ECFDF5", border:"#A7F3D0" },
  statusPending:   { dot:"#FBBF24", text:"#92400E", bg:"#FFFBEB", border:"#FDE68A" },
  statusCompleted: { dot:"#9B8FC0", text:"#6B6480", bg:"#F0EBFF", border:"#DDD5F5" },
  statusCancelled: { dot:"#F87171", text:"#991B1B", bg:"#FEF2F2", border:"#FECACA" },
  statusNoShow:    { dot:"#9CA3AF", text:"#4B5563", bg:"#F9FAFB", border:"#E5E7EB" },
} as const;
