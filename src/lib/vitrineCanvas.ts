/**
 * Vitrine do Dia — Canvas Generator v2
 * Tamanho: 1080×1920 (Stories Instagram/WhatsApp)
 */

export interface VitrineSlot { time: string; occupied: boolean; selected: boolean; }
export type VitrineTemplate = "dark" | "lavanda" | "minimal";

interface Theme {
  bg: string; bg2: string;
  title: string; date: string;
  pillBg: string; pillBorder: string; pillText: string;
  pillOcupBg: string; pillOcupText: string;
  period: string; accent: string; star: string;
  footerLine: string; footerBrand: string; footerSub: string;
}

const THEMES: Record<VitrineTemplate, Theme> = {
  dark: {
    bg: "#0D0D0D", bg2: "#0D0D0D",
    title: "#FFFFFF", date: "#666666",
    pillBg: "#1A1A1A", pillBorder: "#2E2E2E", pillText: "#F0E6D3",
    pillOcupBg: "#111111", pillOcupText: "#2A2A2A",
    period: "#444444", accent: "#D4A853", star: "#D4A853",
    footerLine: "#1E1E1E", footerBrand: "#D4A853", footerSub: "#444444",
  },
  lavanda: {
    bg: "#12101E", bg2: "#1A1630",
    title: "#FFFFFF", date: "#7B70A8",
    pillBg: "#221D38", pillBorder: "#3A3060", pillText: "#C8B8F0",
    pillOcupBg: "#161324", pillOcupText: "#2E2850",
    period: "#5A5280", accent: "#9D7FD4", star: "#9D7FD4",
    footerLine: "#1E1A30", footerBrand: "#9D7FD4", footerSub: "#5A5280",
  },
  minimal: {
    bg: "#F7F5FF", bg2: "#EDE8FF",
    title: "#0F0C1E", date: "#9B8FC0",
    pillBg: "#FFFFFF", pillBorder: "#DDD5F5", pillText: "#5A3F9A",
    pillOcupBg: "#EDE5FF", pillOcupText: "#C4B0E8",
    period: "#C4B0E8", accent: "#7C5CBF", star: "#9D7FD4",
    footerLine: "#E2D8F8", footerBrand: "#7C5CBF", footerSub: "#B0A0D8",
  },
};

// ── helpers ─────────────────────────────────────────────────────────────────

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function text(ctx: CanvasRenderingContext2D, str: string, x: number, y: number,
  font: string, color: string, align: CanvasTextAlign = "left", alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(str, x, y);
  ctx.restore();
}

// ── principal ────────────────────────────────────────────────────────────────

export function generateVitrineCanvas(
  slots: VitrineSlot[],
  template: VitrineTemplate,
  dateLabel: string,
  caption: string,
): HTMLCanvasElement {
  const W = 1080, H = 1920;
  const th = THEMES[template];

  const free = slots.filter(s => s.selected && !s.occupied);
  const manha = free.filter(s => +s.time.split(":")[0] < 12);
  const tarde = free.filter(s => +s.time.split(":")[0] >= 12);

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Fundo ────────────────────────────────────────────────────────────────
  if (template === "minimal") {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#F7F5FF");
    grad.addColorStop(1, "#EDE8FF");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else if (template === "lavanda") {
    const grad = ctx.createRadialGradient(W * 0.8, H * 0.2, 0, W * 0.8, H * 0.2, W * 1.2);
    grad.addColorStop(0, "#1F1840");
    grad.addColorStop(0.5, "#12101E");
    grad.addColorStop(1, "#0C0A18");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = th.bg;
    ctx.fillRect(0, 0, W, H);
  }

  // Barras decorativas no topo/fundo (minimal)
  if (template === "minimal") {
    ctx.fillStyle = "#7C5CBF";
    ctx.fillRect(0, 0, W, 8);
    ctx.fillRect(0, H - 8, W, 8);
  }

  // Glow accent canto superior direito
  const glow = ctx.createRadialGradient(W * 0.9, H * 0.08, 0, W * 0.9, H * 0.08, 600);
  glow.addColorStop(0, th.accent + "22");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Estrelinhas ──────────────────────────────────────────────────────────
  const stars: [number, number, number, number][] = [
    [W - 120, 180, 48, 0.7], [W - 200, 280, 28, 0.4],
    [80, 520, 32, 0.5], [60, 700, 20, 0.3],
    [W - 100, H * 0.55, 36, 0.4], [140, H * 0.7, 24, 0.3],
  ];
  stars.forEach(([sx, sy, sz, sa]) => {
    ctx.save(); ctx.globalAlpha = sa;
    ctx.fillStyle = th.star;
    ctx.font = `${sz}px serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("✦", sx, sy);
    ctx.restore();
  });

  // ── Data ─────────────────────────────────────────────────────────────────
  const PAD = 96;
  let y = 220;
  text(ctx, dateLabel.toUpperCase(), PAD, y,
    "600 38px -apple-system, Helvetica, sans-serif", th.date);
  y += 16;

  // ── Título ───────────────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = th.title;
  ctx.font = `900 148px -apple-system, Helvetica, sans-serif`;
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText("Horários", PAD, y + 20);
  ctx.fillText("disponíveis", PAD, y + 185);
  ctx.restore();
  y += 370;

  // Emoji nail
  ctx.font = "100px serif";
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText("💅", PAD, y + 40);
  y += 100;

  // ── Separador ────────────────────────────────────────────────────────────
  ctx.strokeStyle = th.period + "40";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  y += 60;

  // ── Função grupo de slots ─────────────────────────────────────────────────
  const PILL_W = 210, PILL_H = 90, PILL_GAP_X = 24, PILL_GAP_Y = 24, COLS = 4;
  const totalRowW = COLS * PILL_W + (COLS - 1) * PILL_GAP_X;
  const startX = (W - totalRowW) / 2;

  function drawGroup(label: string, group: VitrineSlot[], startY: number): number {
    // Label do período
    ctx.save();
    ctx.fillStyle = th.period;
    ctx.font = "700 34px -apple-system, Helvetica, sans-serif";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.letterSpacing = "0.15em";
    ctx.fillText(label, PAD, startY);
    ctx.restore();
    let cy = startY + 20;

    for (let i = 0; i < group.length; i += COLS) {
      const row = group.slice(i, i + COLS);
      cy += PILL_H + PILL_GAP_Y;
      const rowW = row.length * PILL_W + (row.length - 1) * PILL_GAP_X;
      // Centralizar linha parcial
      const rowStartX = row.length === COLS ? startX : (W - rowW) / 2;

      row.forEach((slot, idx) => {
        const px = rowStartX + idx * (PILL_W + PILL_GAP_X);
        const py = cy - PILL_H;

        // Sombra suave na pill
        if (!slot.occupied && template !== "dark") {
          ctx.save();
          ctx.shadowColor = th.accent + "33";
          ctx.shadowBlur = 20;
          ctx.shadowOffsetY = 4;
        }

        // Pill bg
        ctx.fillStyle = slot.occupied ? th.pillOcupBg : th.pillBg;
        pill(ctx, px, py, PILL_W, PILL_H, PILL_H / 2);
        ctx.fill();
        if (!slot.occupied) { ctx.restore(); }

        // Pill border
        ctx.strokeStyle = slot.occupied ? "transparent" : th.pillBorder;
        ctx.lineWidth = 2.5;
        pill(ctx, px, py, PILL_W, PILL_H, PILL_H / 2);
        ctx.stroke();

        // Texto
        ctx.fillStyle = slot.occupied ? th.pillOcupText : th.pillText;
        ctx.font = `${slot.occupied ? "600" : "800"} 40px -apple-system, Helvetica, monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(slot.occupied ? "❤️" : slot.time, px + PILL_W / 2, py + PILL_H / 2);
      });
    }
    return cy + 50;
  }

  if (manha.length) y = drawGroup("MANHÃ", manha, y);
  if (tarde.length) {
    y += 20;
    y = drawGroup("TARDE", tarde, y);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = H - 200;

  // Linha separadora
  ctx.strokeStyle = th.footerLine;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD, footerY); ctx.lineTo(W - PAD, footerY); ctx.stroke();

  // Brand
  ctx.fillStyle = th.footerBrand;
  ctx.font = "900 52px -apple-system, Helvetica, sans-serif";
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = "0.06em";
  ctx.fillText("TESSY NAILS", PAD, footerY + 70);
  ctx.letterSpacing = "0";

  // Caption
  if (caption) {
    ctx.fillStyle = th.footerSub;
    ctx.font = "500 32px -apple-system, Helvetica, sans-serif";
    ctx.fillText(caption, PAD, footerY + 118);
  }

  // Atualizado
  ctx.fillStyle = th.footerSub;
  ctx.font = "600 30px -apple-system, Helvetica, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Atualizado ✦", W - PAD, footerY + 70);

  return canvas;
}
