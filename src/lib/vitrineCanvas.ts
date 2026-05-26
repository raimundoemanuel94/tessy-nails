/**
 * Vitrine do Dia — Canvas v3
 * 1080×1920 (Stories) — layout adaptativo sem espaço vazio
 */

export interface VitrineSlot { time: string; occupied: boolean; selected: boolean; }
export type VitrineTemplate = "dark" | "lavanda" | "minimal";

interface Theme {
  bg: string; glowColor: string;
  title: string; dateColor: string;
  pillBg: string; pillBorder: string; pillText: string;
  pillOcupBg: string; pillOcupText: string;
  periodColor: string; accentColor: string; starColor: string;
  divider: string; brandColor: string; subColor: string;
  captionBg: string; captionText: string;
}

const THEMES: Record<VitrineTemplate, Theme> = {
  dark: {
    bg: "#0D0D0D", glowColor: "#D4A85315",
    title: "#FFFFFF", dateColor: "#606060",
    pillBg: "#1C1C1C", pillBorder: "#303030", pillText: "#F0E6D3",
    pillOcupBg: "#111111", pillOcupText: "#252525",
    periodColor: "#484848", accentColor: "#D4A853", starColor: "#D4A853",
    divider: "#1E1E1E", brandColor: "#D4A853", subColor: "#484848",
    captionBg: "#161616", captionText: "#686868",
  },
  lavanda: {
    bg: "#13102A", glowColor: "#9D7FD420",
    title: "#FFFFFF", dateColor: "#7265A8",
    pillBg: "#1F1A3A", pillBorder: "#352C58", pillText: "#C8B8F0",
    pillOcupBg: "#161228", pillOcupText: "#2C2448",
    periodColor: "#4E4578", accentColor: "#9D7FD4", starColor: "#9D7FD4",
    divider: "#1A162E", brandColor: "#9D7FD4", subColor: "#4E4578",
    captionBg: "#1A1630", captionText: "#5E558A",
  },
  minimal: {
    bg: "#F8F5FF", glowColor: "#7C5CBF0A",
    title: "#120E28", dateColor: "#9B8FC0",
    pillBg: "#FFFFFF", pillBorder: "#DDD5F5", pillText: "#5A3F9A",
    pillOcupBg: "#EDE5FF", pillOcupText: "#C4B0E8",
    periodColor: "#BDB0D8", accentColor: "#7C5CBF", starColor: "#9D7FD4",
    divider: "#E2D8F8", brandColor: "#7C5CBF", subColor: "#9B8FC0",
    captionBg: "#EDE5FF", captionText: "#7C68A8",
  },
};

// ── helpers ─────────────────────────────────────────────────────────────────
function pillPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

function drawFlower(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, alpha = 0.7) {
  const petals = 5;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(angle) * r * 1.4;
    const py = cy + Math.sin(angle) * r * 1.4;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Centro
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = color === "#C4A8E8" ? "#EDE5FF" : "#FFFFFF";
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha = 0.6) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${size}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✦", x, y);
  ctx.restore();
}

// ── Gerador principal ─────────────────────────────────────────────────────────
export function generateVitrineCanvas(
  slots: VitrineSlot[],
  template: VitrineTemplate,
  dateLabel: string,
  caption: string,
): HTMLCanvasElement {
  const W = 1080, H = 1920;
  const th = THEMES[template];
  const PAD = 88;

  const free  = slots.filter(s => s.selected && !s.occupied);
  const manha = free.filter(s => +s.time.split(":")[0] < 12);
  const tarde = free.filter(s => +s.time.split(":")[0] >= 12);

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Fundo ────────────────────────────────────────────────────────────────
  ctx.fillStyle = th.bg;
  ctx.fillRect(0, 0, W, H);

  // Gradiente de fundo
  if (template === "lavanda") {
    const gr = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, W);
    gr.addColorStop(0, "#1F1840");
    gr.addColorStop(0.4, "#13102A");
    gr.addColorStop(1, "#0C0A1A");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  } else if (template === "minimal") {
    const gr = ctx.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0, "#F8F5FF");
    gr.addColorStop(1, "#EDE8FF");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
    // Barras decorativas
    ctx.fillStyle = "#7C5CBF";
    ctx.fillRect(0, 0, W, 10);
    ctx.fillRect(0, H - 10, W, 10);
    // Círculo decorativo canto
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#7C5CBF";
    ctx.beginPath();
    ctx.arc(W, 0, 500, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Dark: glow canto
    const gr = ctx.createRadialGradient(W * 0.9, H * 0.05, 0, W * 0.9, H * 0.05, 700);
    gr.addColorStop(0, "#D4A85310");
    gr.addColorStop(1, "transparent");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Flores decorativas ───────────────────────────────────────────────────
  const flowerColor = template === "dark" ? "#D4A853" : "#C4A8E8";
  drawFlower(ctx, PAD - 20, 140, 14, flowerColor, 0.4);
  drawFlower(ctx, W - PAD + 20, 140, 14, flowerColor, 0.4);
  drawFlower(ctx, PAD - 30, H - 200, 11, flowerColor, 0.25);
  drawFlower(ctx, W - PAD + 30, H - 200, 11, flowerColor, 0.25);

  // ── Estrelinhas ──────────────────────────────────────────────────────────
  drawStar(ctx, W - 160, 220, 52, th.starColor, 0.65);
  drawStar(ctx, W - 240, 340, 28, th.starColor, 0.35);
  drawStar(ctx, 100, 600, 32, th.starColor, 0.30);
  drawStar(ctx, W - 120, H * 0.5, 36, th.starColor, 0.25);
  drawStar(ctx, 140, H * 0.72, 24, th.starColor, 0.20);

  // ── Linha topo decorativa (minimal) ─────────────────────────────────────
  if (template !== "minimal") {
    // Linha brilhante no topo
    const lr = ctx.createLinearGradient(0, 0, W, 0);
    lr.addColorStop(0, "transparent");
    lr.addColorStop(0.3, th.accentColor + "40");
    lr.addColorStop(0.7, th.accentColor + "40");
    lr.addColorStop(1, "transparent");
    ctx.fillStyle = lr;
    ctx.fillRect(0, 0, W, 3);
  }

  // ── Corpo do conteúdo — começa em Y = 200 ───────────────────────────────
  let y = 200;

  // Data
  ctx.fillStyle = th.dateColor;
  ctx.font = "600 36px -apple-system, Helvetica, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(dateLabel.toUpperCase(), PAD, y);
  y += 22;

  // Título grande
  ctx.fillStyle = th.title;
  ctx.font = "900 160px -apple-system, Helvetica, sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("Horários", PAD, y);
  y += 176;
  ctx.fillText("disponíveis", PAD, y);
  y += 190;

  // Emoji
  ctx.font = "110px serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("💅", PAD, y + 50);
  y += 130;

  // Divisor
  const divGrad = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  divGrad.addColorStop(0, "transparent");
  divGrad.addColorStop(0.2, th.divider);
  divGrad.addColorStop(0.8, th.divider);
  divGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(W - PAD, y); ctx.stroke();
  y += 70;

  // ── Slots ─────────────────────────────────────────────────────────────────
  const COLS = 4;
  const PILL_W = 208, PILL_H = 96, GAP_X = 22, GAP_Y = 22;
  const totalW = COLS * PILL_W + (COLS - 1) * GAP_X;
  const startX = (W - totalW) / 2;

  function drawGroup(label: string, group: VitrineSlot[], sy: number): number {
    // Label período
    ctx.fillStyle = th.periodColor;
    ctx.font = "700 32px -apple-system, Helvetica, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(label, PAD, sy);
    sy += 55;

    for (let i = 0; i < group.length; i += COLS) {
      const row = group.slice(i, i + COLS);
      const rowW = row.length * PILL_W + (row.length - 1) * GAP_X;
      const rx = row.length === COLS ? startX : (W - rowW) / 2;

      row.forEach((slot, idx) => {
        const px = rx + idx * (PILL_W + GAP_X);
        const py = sy;

        // Shadow para pill não ocupada
        if (!slot.occupied) {
          ctx.save();
          if (template === "minimal") {
            ctx.shadowColor = "#7C5CBF22";
            ctx.shadowBlur = 24;
            ctx.shadowOffsetY = 6;
          } else {
            ctx.shadowColor = th.accentColor + "18";
            ctx.shadowBlur = 16;
            ctx.shadowOffsetY = 4;
          }
        }

        // Pill bg
        ctx.fillStyle = slot.occupied ? th.pillOcupBg : th.pillBg;
        pillPath(ctx, px, py, PILL_W, PILL_H, PILL_H / 2);
        ctx.fill();
        if (!slot.occupied) ctx.restore();

        // Border
        ctx.strokeStyle = slot.occupied ? "transparent" : th.pillBorder;
        ctx.lineWidth = 2.5;
        pillPath(ctx, px, py, PILL_W, PILL_H, PILL_H / 2);
        ctx.stroke();

        // Texto
        ctx.fillStyle = slot.occupied ? th.pillOcupText : th.pillText;
        ctx.font = `${slot.occupied ? "500" : "800"} 42px -apple-system, Helvetica, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(slot.occupied ? "❤️" : slot.time, px + PILL_W / 2, py + PILL_H / 2);
      });

      sy += PILL_H + GAP_Y;
    }
    return sy + 30;
  }

  if (manha.length) y = drawGroup("MANHÃ", manha, y);
  if (tarde.length)  y = drawGroup("TARDE", tarde, y + (manha.length ? 20 : 0));

  // ── Footer — posição fixa no rodapé ─────────────────────────────────────
  const FOOTER_Y = H - 280;

  // Caption (se houver)
  if (caption) {
    const capH = 100;
    const capY = FOOTER_Y - capH - 40;
    ctx.fillStyle = th.captionBg;
    pillPath(ctx, PAD, capY, W - PAD * 2, capH, 20);
    ctx.fill();
    ctx.fillStyle = th.captionText;
    ctx.font = "500 34px -apple-system, Helvetica, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(caption, PAD + 36, capY + capH / 2);
  }

  // Linha divisória footer
  const fl = ctx.createLinearGradient(PAD, 0, W - PAD, 0);
  fl.addColorStop(0, "transparent");
  fl.addColorStop(0.15, th.divider);
  fl.addColorStop(0.85, th.divider);
  fl.addColorStop(1, "transparent");
  ctx.strokeStyle = fl;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD, FOOTER_Y); ctx.lineTo(W - PAD, FOOTER_Y); ctx.stroke();

  // Brand name cursiva
  ctx.fillStyle = th.brandColor;
  ctx.font = "italic 900 56px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Tessy Nails", PAD, FOOTER_Y + 80);

  // Monograma TN pequeno ao lado
  ctx.fillStyle = th.accentColor;
  ctx.font = "italic 400 42px Georgia, serif";
  ctx.textAlign = "left";
  ctx.fillText("✦", PAD + 360, FOOTER_Y + 72);

  // Subtitle
  ctx.fillStyle = th.subColor;
  ctx.font = "500 26px -apple-system, Helvetica, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = "0.12em";
  ctx.fillText("MANICURE & PEDICURE", PAD, FOOTER_Y + 124);
  ctx.letterSpacing = "0";

  // Atualizado (direita)
  ctx.fillStyle = th.subColor;
  ctx.font = "600 28px -apple-system, Helvetica, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Atualizado ✦", W - PAD, FOOTER_Y + 80);

  // Florinhas decorativas no footer
  drawFlower(ctx, W - PAD - 60, FOOTER_Y + 90, 9, template === "dark" ? "#D4A853" : "#C4A8E8", 0.35);

  return canvas;
}
