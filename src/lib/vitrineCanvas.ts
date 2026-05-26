/**
 * Gera a imagem da Vitrine do Dia usando Canvas API puro.
 * Não usa html2canvas — mais confiável em mobile.
 */

export interface VitrineSlot {
  time: string;
  occupied: boolean;
  selected: boolean;
}

export type VitrineTemplate = "dark" | "lavanda" | "minimal";

interface ThemeConfig {
  bg: string; header: string; subheader: string;
  pillBg: string; pillText: string; pillBorder: string;
  pillOcupBg: string; pillOcupText: string;
  periodLabel: string; accent: string;
  footerText: string; footerLine: string;
  captionBg: string; captionText: string;
}

const THEMES: Record<VitrineTemplate, ThemeConfig> = {
  dark: {
    bg: "#0A0A0A", header: "#FFFFFF", subheader: "#888888",
    pillBg: "#1C1C1C", pillText: "#E8D5B0", pillBorder: "#E8D5B030",
    pillOcupBg: "#111111", pillOcupText: "#2A2A2A",
    periodLabel: "#555555", accent: "#E8D5B0",
    footerText: "#E8D5B0", footerLine: "#FFFFFF15",
    captionBg: "#1C1C1C", captionText: "#888888",
  },
  lavanda: {
    bg: "#1E1A2E", header: "#FFFFFF", subheader: "#9B8FC0",
    pillBg: "#2A2044", pillText: "#C4B0E8", pillBorder: "#9D7FD430",
    pillOcupBg: "#1C1828", pillOcupText: "#3D3560",
    periodLabel: "#6B6080", accent: "#9D7FD4",
    footerText: "#9D7FD4", footerLine: "#9D7FD420",
    captionBg: "#2A2044", captionText: "#9B8FC0",
  },
  minimal: {
    bg: "#FAFAFA", header: "#1E1A2E", subheader: "#9B8FC0",
    pillBg: "#FFFFFF", pillText: "#7C5CBF", pillBorder: "#7C5CBF30",
    pillOcupBg: "#F0EBFF", pillOcupText: "#C4B0E8",
    periodLabel: "#BBBBBB", accent: "#7C5CBF",
    footerText: "#7C5CBF", footerLine: "#7C5CBF20",
    captionBg: "#F0EBFF", captionText: "#9B8FC0",
  },
};

const W = 1080; // largura Instagram Stories

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${size}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✦", x, y);
  ctx.restore();
}

export function generateVitrineCanvas(
  slots: VitrineSlot[],
  template: VitrineTemplate,
  dateLabel: string,
  caption: string,
): HTMLCanvasElement {
  const th     = THEMES[template];
  const free   = slots.filter(s => s.selected && !s.occupied);
  const manha  = free.filter(s => parseInt(s.time.split(":")[0]) < 12);
  const tarde  = free.filter(s => parseInt(s.time.split(":")[0]) >= 12);
  const colsPerRow = 4;
  const pillW  = 200, pillH = 72, pillGap = 20;
  const rowsM  = Math.ceil(manha.length / colsPerRow);
  const rowsT  = Math.ceil(tarde.length  / colsPerRow);
  const sectionH = (rows: number) => rows * (pillH + pillGap);
  const periodLabelH = 50;
  const captionH = caption ? 100 : 0;

  // Calcular altura total
  const paddingV = 100;
  const headerH  = 260;
  const footerH  = 80;
  const H = paddingV +
    headerH +
    (manha.length ? periodLabelH + sectionH(rowsM) + 30 : 0) +
    (tarde.length  ? periodLabelH + sectionH(rowsT)  + 30 : 0) +
    captionH + footerH + paddingV;

  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = Math.max(H, 1200);
  const ctx = canvas.getContext("2d")!;

  // ── Fundo ────────────────────────────────────────────────────────────────
  if (template === "minimal") {
    ctx.fillStyle = th.bg;
    ctx.fillRect(0, 0, W, canvas.height);
    // Gradiente sutil no topo
    const grad = ctx.createLinearGradient(0, 0, 0, 400);
    grad.addColorStop(0, "rgba(157,127,212,0.06)");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 400);
  } else {
    ctx.fillStyle = th.bg;
    ctx.fillRect(0, 0, W, canvas.height);
    // Glow sutil no canto
    const glow = ctx.createRadialGradient(W * 0.85, 100, 0, W * 0.85, 100, 500);
    glow.addColorStop(0, template === "lavanda" ? "rgba(157,127,212,0.12)" : "rgba(232,213,176,0.08)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, canvas.height);
  }

  // ── Estrelinhas decorativas ───────────────────────────────────────────────
  const stars = [[W-120,80,36],[W-60,160,20],[80,500,24],[40,350,16],[W-80,450,18]];
  stars.forEach(([x,y,size]) => drawStar(ctx, x, y, size, th.accent, 0.6));

  let y = paddingV;

  // ── Data ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = th.subheader;
  ctx.font = "600 32px -apple-system, Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(dateLabel.toUpperCase(), 80, y + 40);
  y += 60;

  // ── Título ───────────────────────────────────────────────────────────────
  ctx.fillStyle = th.header;
  ctx.font = "900 110px -apple-system, Inter, sans-serif";
  ctx.fillText("Horários", 80, y + 100);
  y += 120;
  ctx.fillText("disponíveis", 80, y + 100);
  y += 130;

  // Emoji
  ctx.font = "80px serif";
  ctx.fillText("💅", 80, y + 30);
  y += 60;

  // ── Função desenhar grupo de slots ────────────────────────────────────────
  const drawGroup = (label: string, group: VitrineSlot[], startY: number) => {
    ctx.fillStyle = th.periodLabel;
    ctx.font = "700 28px -apple-system, Inter, sans-serif";
    ctx.letterSpacing = "0.2em";
    ctx.fillText(label.toUpperCase(), 80, startY + 30);
    ctx.letterSpacing = "0";

    let cy = startY + periodLabelH;
    for (let i = 0; i < group.length; i += colsPerRow) {
      const row = group.slice(i, i + colsPerRow);
      const totalW = row.length * pillW + (row.length - 1) * pillGap;
      let cx = 80;
      row.forEach(slot => {
        const isOcup = slot.occupied;
        // Pill background
        ctx.fillStyle = isOcup ? th.pillOcupBg : th.pillBg;
        roundRect(ctx, cx, cy, pillW, pillH, pillH / 2);
        ctx.fill();
        // Pill border
        if (!isOcup) {
          ctx.strokeStyle = th.pillBorder;
          ctx.lineWidth = 2;
          roundRect(ctx, cx, cy, pillW, pillH, pillH / 2);
          ctx.stroke();
        }
        // Pill text
        ctx.fillStyle = isOcup ? th.pillOcupText : th.pillText;
        ctx.font = `700 ${isOcup ? 32 : 38}px -apple-system, Inter, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isOcup ? "❤️" : slot.time, cx + pillW / 2, cy + pillH / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        cx += pillW + pillGap;
      });
      cy += pillH + pillGap;
    }
    return cy + 20;
  };

  // ── Desenhar grupos ───────────────────────────────────────────────────────
  if (manha.length) y = drawGroup("Manhã 🌅", manha, y + 20);
  if (tarde.length)  y = drawGroup("Tarde ☀️",  tarde,  y + 10);

  // ── Caption ───────────────────────────────────────────────────────────────
  if (caption) {
    y += 20;
    const capH = 90;
    ctx.fillStyle = th.captionBg;
    roundRect(ctx, 80, y, W - 160, capH, 20);
    ctx.fill();
    ctx.fillStyle = th.captionText;
    ctx.font = "500 30px -apple-system, Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(caption, 120, y + capH / 2);
    ctx.textBaseline = "alphabetic";
    y += capH + 30;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  y = canvas.height - paddingV - footerH;
  ctx.strokeStyle = th.footerLine;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(W - 80, y); ctx.stroke();
  y += 30;

  ctx.fillStyle = th.footerText;
  ctx.font = "900 36px -apple-system, Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.letterSpacing = "0.1em";
  ctx.fillText("TESSY NAILS", 80, y + 30);
  ctx.letterSpacing = "0";

  ctx.fillStyle = th.subheader;
  ctx.font = "600 24px -apple-system, Inter, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Atualizado ✦", W - 80, y + 30);

  return canvas;
}
