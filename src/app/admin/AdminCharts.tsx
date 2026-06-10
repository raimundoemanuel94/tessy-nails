// @ts-nocheck
"use client";
import { TrendingUp, DollarSign } from "lucide-react";

function formatCurrency(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function LineChart({ data, valueKey, color, formatValue }: any) {
  const W = 280, H = 110, P = 8;
  const values = data.map((d: any) => d[valueKey]);
  const max = Math.max(...values, 1);
  const min = 0;
  const range = max - min || 1;
  const stepX = (W - P*2) / (data.length - 1 || 1);

  const points = data.map((d: any, i: number) => {
    const x = P + i * stepX;
    const y = H - P - ((d[valueKey] - min) / range) * (H - P*2);
    return { x, y, v: d[valueKey], label: d.label };
  });

  const path = points.map((p: any, i: number) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${points[points.length-1].x} ${H-P} L ${points[0].x} ${H-P} Z`;
  const gid = `grad-${valueKey}`;

  return (
    <svg viewBox={`0 0 ${W} ${H+18}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {points.map((p: any, i: number) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="var(--surface)" stroke={color} strokeWidth="2"/>
          <text x={p.x} y={H + 12} textAnchor="middle" fontSize="9" fill="var(--muted)" fontWeight="600">{p.label}</text>
        </g>
      ))}
      {/* Last value label */}
      <text x={points[points.length-1].x} y={points[points.length-1].y - 8} textAnchor="end" fontSize="10" fontWeight="800" fill={color}>
        {formatValue ? formatValue(points[points.length-1].v) : points[points.length-1].v}
      </text>
    </svg>
  );
}

export function AdminCharts({ months }: { months: { label: string; studios: number; mrr: number }[] }) {
  const mrrGrowth = months.length >= 2 ? months[months.length-1].mrr - months[0].mrr : 0;
  const studioGrowth = months.length >= 2 ? months[months.length-1].studios - months[0].studios : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      {/* MRR Chart */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(34,212,123,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={15} color="var(--green)"/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Receita Mensal (MRR)</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>últimos 6 meses</div>
            </div>
          </div>
          {mrrGrowth !== 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: mrrGrowth > 0 ? "var(--green)" : "var(--red)", display: "flex", alignItems: "center", gap: 3 }}>
              <TrendingUp size={13}/> {mrrGrowth > 0 ? "+" : ""}{formatCurrency(mrrGrowth)}
            </span>
          )}
        </div>
        <LineChart data={months} valueKey="mrr" color="var(--green)" formatValue={formatCurrency}/>
      </div>

      {/* Studios growth Chart */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(124,92,191,.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={15} color="var(--brand-light)"/>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Crescimento de Salões</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>total acumulado</div>
            </div>
          </div>
          {studioGrowth !== 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-light)", display: "flex", alignItems: "center", gap: 3 }}>
              <TrendingUp size={13}/> +{studioGrowth}
            </span>
          )}
        </div>
        <LineChart data={months} valueKey="studios" color="var(--brand-light)"/>
      </div>
    </div>
  );
}
