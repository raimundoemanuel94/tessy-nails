/**
 * Tessy Nails — Design Tokens
 * Noir Nubuck Edition
 *
 * Ponto único de verdade para cores do lado cliente.
 * Alterar aqui propaga para todos os componentes.
 */

export const TN = {
  // ── Superfícies ────────────────────────────────────────────
  noir:        "#111110",  // header, CTA, backgrounds escuros
  noirMid:     "#1C1C1A",  // cards escuros secundários
  noirSoft:    "#2A2A28",  // bordas em contexto escuro
  linen:       "#F7F5F1",  // background principal
  linenDark:   "#EDEAE4",  // fundo de cards secundários
  white:       "#FFFFFF",  // cards principais

  // ── Accent ─────────────────────────────────────────────────
  champagne:       "#C9A96E",  // accent principal (botões, ícones, destaques)
  champagneLight:  "#E8D5B0",  // accent suave (backgrounds de pills)
  champagneMuted:  "#A88B55",  // accent escuro (texto sobre fundo claro)

  // ── Tipografia ─────────────────────────────────────────────
  inkPrimary:  "#1A1917",  // texto principal
  inkSecond:   "#5C5852",  // texto secundário
  inkMuted:    "#9A958E",  // texto de suporte / labels
  inkFaint:    "#D9D5CE",  // bordas / dividers

  // ── Status ─────────────────────────────────────────────────
  statusConfirmed: { dot: "#34D399", text: "#065F46", bg: "#ECFDF5", border: "#A7F3D0" },
  statusPending:   { dot: "#C9A96E", text: "#7C5C2A", bg: "#FBF4E8", border: "#E8D5B0" },
  statusCompleted: { dot: "#9A958E", text: "#5C5852", bg: "#F7F5F1", border: "#EDEAE4" },
  statusCancelled: { dot: "#F87171", text: "#991B1B", bg: "#FEF2F2", border: "#FECACA" },
  statusNoShow:    { dot: "#9CA3AF", text: "#4B5563", bg: "#F9FAFB", border: "#E5E7EB" },
} as const;

/** Classes Tailwind reutilizáveis para botões e pills */
export const TNClass = {
  btnPrimary: "bg-[#111110] text-white font-black rounded-2xl active:scale-[0.98] transition-all duration-200 shadow-lg shadow-black/20",
  btnGhost:   "border border-[#D9D5CE] text-[#5C5852] font-bold rounded-2xl active:scale-[0.98] transition-all hover:bg-[#F0EEE9]",
  btnDanger:  "border border-red-100 text-red-500 font-bold rounded-2xl active:scale-[0.98] transition-all hover:bg-red-50",
  card:       "bg-white rounded-3xl border border-[#EDEAE4] shadow-sm overflow-hidden",
  label:      "text-[9px] font-black uppercase tracking-[0.25em] text-[#9A958E]",
  accent:     "text-[#C9A96E]",
} as const;
